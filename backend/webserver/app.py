from flask import Flask, request, jsonify, session, render_template
from rdflib import Graph
from brain.tagology_graph import create_tagology_graph
from threading import Lock, Thread
from datetime import datetime, timedelta, UTC
import os, uuid, time
import logging

EDITOR_KEY = 'ariadne'
GRAPH_EXP_MIN = 30
GRAPH_LOCK = Lock()
GLOBAL_TAG_GRAPH = Graph()

# key: session[graph_id] (uuid)
# value: {graph (rdflib.Graph), last_used (time)}
USER_TAG_GRAPHS = {}

# MUST BE THE EXACT DEFAULT ENDPOINT & QUERY IN THE FRONTEND
DEFAULT_ENDPOINT = "https://query.wikidata.org/sparql"
DEFAULT_QUERY = """PREFIX odd: <https://theknowledgecommons.org/ns/odd/>
CONSTRUCT {
    ?object ?property ?value .
    ?object odd:objLabel ?objectLabel .
    ?property odd:propLabel ?propertyLabel .
    ?value odd:valLabel ?valueLabel .
    ?object schema:about ?item .
}
WHERE {
    ?item wdt:P4466 ?uat ; # HAS UAT ID
          ?property ?value .
    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .

    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY

    BIND(STRAFTER(STR(?property), STR(wdt:)) AS ?pid)
    BIND(IRI(CONCAT(STR(wd:), ?pid)) AS ?p)

    MINUS {?p wikibase:propertyType wikibase:ExternalId .} # IGNORE ID TRIPLES

    # MANUAL BINDING REQUIRED DUE TO CUSTOM LABELING
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # CUSTOM
                             ?p rdfs:label ?propertyLabel . # CUSTOM
                             ?value rdfs:label ?valueLabel .
                           }
}
LIMIT 20000"""

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def init_app(create_default_graph = True):
    app = Flask(__name__,
                template_folder=os.path.join(BASE_DIR, '../../frontend/template'),
                static_folder=os.path.join(BASE_DIR, '../../frontend/static'))
    app.secret_key = os.environ.get('FLASK_SECRET_KEY', os.urandom(24))

    if 'gunicorn' in os.environ.get('SERVER_SOFTWARE', ''):
        gunicorn_logger = logging.getLogger("gunicorn.error")
        app.logger.handlers = gunicorn_logger.handlers
        app.logger.setLevel(gunicorn_logger.level)
    else:
        logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    if create_default_graph:
        try:
            global GLOBAL_TAG_GRAPH
            GLOBAL_TAG_GRAPH = create_tagology_graph(DEFAULT_ENDPOINT, DEFAULT_QUERY)
        except Exception as e:
            app.logger.error(f"Global tagology graph creation failed. Default is empty!\n{e}")

    Thread(target=graph_cleanup_worker, args=(app,), daemon=True).start()

    register_routes(app)
    return app

def graph_cleanup_worker(app):
    while True:
        try:
            now = datetime.now(UTC) 
            expired = [graph_id
                       for graph_id, data in USER_TAG_GRAPHS.items()
                       if (now - data['last_used']) > timedelta(minutes=GRAPH_EXP_MIN)]
            for graph_id in expired:
                app.logger.info(f"Graph {graph_id} expired. Deleting...")
                with GRAPH_LOCK:
                    del USER_TAG_GRAPHS[graph_id]
        except Exception as e:
            app.logger.error(f"Graph cleanup worker failed:\n{e}")
        finally:
            time.sleep(GRAPH_EXP_MIN * 60)
     
def register_routes(app):
    @app.after_request
    def add_no_cache_headers(response):
        if response.content_type.startswith("application/json"):
            response.headers['Cache-Control'] = "no-store, no-cache, must-revalidate, private"
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        return response

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/new_tag_graph", methods=['POST'])
    def create_user_tag_graph():
        try:
            source_endpoint = request.json.get('endpoint')
            source_query = request.json.get('query')
        except Exception as e:
            return jsonify({'error': str(e)}), 400

        if not source_endpoint or not source_query:
            return jsonify({'error': "Missing required 'endpoint' and/or 'query'"}), 400

        try:
            new_graph = create_tagology_graph(source_endpoint, source_query)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

        if len(new_graph) == 0:
            return jsonify({'error': "CONSTRUCT returned an empty graph. Reverting to default."}), 400
        else:
            if 'graph_id' not in session:
                session['graph_id'] = str(uuid.uuid4())
            USER_TAG_GRAPHS[session['graph_id']] = {'graph': new_graph,
                                                    'last_used': datetime.now(UTC)}

        return jsonify({'status': "User tagology graph created."}), 200

    @app.route("/tagology_graph", methods=['POST'])
    def query_tag_graph():
        try:
            query = request.json.get('query')
        except Exception as e:
            return jsonify({'error': str(e)}), 400

        if not query:
            return jsonify({'error': "Missing required 'query'"}), 400

        graph_id = session.get('graph_id')
        if graph_id in USER_TAG_GRAPHS:
            tag_graph = USER_TAG_GRAPHS[graph_id]['graph']
            USER_TAG_GRAPHS[graph_id]['last_used'] = datetime.now(UTC) 
        else:
            tag_graph = GLOBAL_TAG_GRAPH

        if len(tag_graph) == 0:
            return jsonify({'warning': "Empty tagology graph. Nothing to query."}), 400

        app.logger.info(f"Query being run for tag graph {graph_id}:\n{query}")
        try:
            with GRAPH_LOCK:
                results = tag_graph.query(query)
            json_results = [
                {str(l): str(row[l]) for l in row.labels}
                for row in results
            ]
        except Exception as e:
            return jsonify({'error': str(e)}), 500

        return jsonify(json_results), 200

    @app.route("/tags")
    def tags_page():
        return render_template("tags.html")

    @app.route("/welcome")
    def welcome_page():
        return render_template("welcome.html")

    @app.route("/delete_user_graph", methods=['DELETE'])
    def delete_user_graph():
        graph_id = session.get('graph_id')
        if graph_id not in USER_TAG_GRAPHS:
            return jsonify({'warning': "No tagology graph to delete."}), 400
        with GRAPH_LOCK:
            del USER_TAG_GRAPHS[graph_id]

        return jsonify({'status': f"tagology graph {graph_id} deleted."}), 200

    @app.route("/verify_editor_key", methods=['POST'])
    def verify_editor_key():
        try:
            key = request.get_json().get('key')
        except Exception as e:
            return jsonify(False), 400

        return jsonify(key == EDITOR_KEY), 200

if __name__ == '__main__':
    app = init_app(os.environ.get('WERKZEUG_RUN_MAIN') == 'true')
    app.run(debug=True)
