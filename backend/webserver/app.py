from flask import Flask, request, jsonify, session, render_template
from rdflib import Graph
from brain.tagology_graph import create_tagology_graph
from threading import Lock
import os, uuid

GLOBAL_TAG_GRAPH = Graph()
GRAPH_LOCK = Lock()
EDITOR_KEY = "ariadne"

# key: user session id (str)
# value: a tagology_graph (rdflib.Graph)
USER_TAG_GRAPHS = {}

# MUST BE THE EXACT DEFAULT ENDPOINT & QUERY IN THE FRONTEND
DEFAULT_ENDPOINT = "https://query.wikidata.org/sparql"
DEFAULT_QUERY = """PREFIX tag: <http://example.org/tagology/>
CONSTRUCT {
    ?object ?property ?value .
    ?object tag:objLabel ?objectLabel .
    ?property tag:propLabel ?propertyLabel .
    ?value tag:valLabel ?valueLabel .
    ?object schema:about ?item .
}
WHERE {
    ?item wdt:P4466 ?uat ; # HAS UAT ID
          ?property ?value .
    ?p wikibase:directClaim ?property .
    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel .
                             ?p rdfs:label ?propertyLabel .
                             ?value rdfs:label ?valueLabel .
                           }
}
LIMIT 5000"""

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, '../../frontend/template'),
    static_folder=os.path.join(BASE_DIR, '../../frontend/static')
)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", os.urandom(24)) 

if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    try:
        GLOBAL_TAG_GRAPH = create_tagology_graph(DEFAULT_ENDPOINT, DEFAULT_QUERY)
    except Exception as e:
        print(f"[ERROR] Global tagology graph creation failed. Default is empty!\n{e}")
    
@app.route("/")
def index():
    return render_template("index.html")

@app.before_request
def ensure_user_id():
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())

@app.route("/new_tag_graph", methods=["POST"])
def create_user_tag_graph():
    try:
        source_endpoint = request.json.get("endpoint")
        source_query = request.json.get("query")
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    if not source_endpoint or not source_query:
        return jsonify({"error": "Missing required 'endpoint' and/or 'query'"}), 400

    try:
        new_graph = create_tagology_graph(source_endpoint, source_query)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    user_id = session["user_id"]
    if len(new_graph) == 0:
        return jsonify({"error": "CONSTRUCT returned an empty graph. Reverting to default."}), 400
    else:
        USER_TAG_GRAPHS[user_id] = new_graph

    return jsonify({"status": "User tagology graph created."}), 200

@app.route("/tagology_graph", methods=["POST"])
def query_tag_graph():
    try:
        query = request.json.get("query")
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    if not query:
        return jsonify({"error": "Missing required 'query'"}), 400

    user_id = session["user_id"]
    tag_graph = USER_TAG_GRAPHS.get(user_id, GLOBAL_TAG_GRAPH)
    
    if len(tag_graph) == 0:
        return jsonify({"error": "Empty tagology graph. Nothing to query."}), 500
    
    print(f"[STATUS] Query being run for {user_id}'s tag graph:\n{query}")
    try:
        with GRAPH_LOCK:
            results = tag_graph.query(query)
        json_results = [
            {str(l): str(row[l]) for l in row.labels}
            for row in results
        ]
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    return jsonify(json_results), 200

@app.route("/tags")
def tags_page():
    return render_template("tags.html")

@app.route("/welcome")
def welcome_page():
    return render_template("welcome.html")

@app.route("/delete_user_graph", methods=["DELETE"])
def delete_user_graph():
    user_id = session.get("user_id")
    if user_id not in USER_TAG_GRAPHS:
        return jsonify({"warning": "No tagology graph to delete."}), 400
    with GRAPH_LOCK:
        del USER_TAG_GRAPHS[user_id]
        
    return jsonify({"status": f"tagology graph for user {user_id} deleted."}), 200

@app.route("/verify_editor_key", methods=["POST"])
def verify_editor_key():
    try:
        key = request.get_json()
    except Exception as e:
        return jsonify(False)
    
    return jsonify(key == EDITOR_KEY)

if __name__ == "__main__":
    app.run(debug=True)
