from flask import Flask, request, jsonify, session, render_template
from rdflib import Graph
from brain.tagology_graph import create_tagology_graph
import os, uuid

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, '../../frontend/template'),
    static_folder=os.path.join(BASE_DIR, '../../frontend/static')
)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", os.urandom(24)) 

DEFAULT_QUERY = """
        PREFIX wd:     <http://www.wikidata.org/entity/>
        PREFIX wdt:    <http://www.wikidata.org/prop/direct/>
        PREFIX schema: <http://schema.org/>

        CONSTRUCT {
            ?wikip ?prop ?val .
            ?wikip schema:about ?item .
        }
        WHERE {
            ?wikip schema:isPartOf <https://en.wikipedia.org/>;
                schema:about ?item .
            
            ?item
                wdt:P31 wd:Q144;        # DOGS
                #wdt:P31 wd:Q146;        # CATS
                #wdt:P31 wd:Q11424;      # MOVIES
                #wdt:P5008 ?list;        # ON A LIST
                ?prop ?val .

            FILTER(STRSTARTS(STR(?prop), STR(wdt:)))    # Property must be from truthy namespace
        }
        LIMIT 100000
    """

if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    GLOBAL_TAG_GRAPH = create_tagology_graph(DEFAULT_QUERY)
else:
    GLOBAL_TAG_GRAPH = None

# key: user session id (str)
# Value: a tagology_graph (rdflib.Graph)
user_tag_graphs = {}

@app.route("/")
def index():
    return render_template("index.html")

@app.before_request
def ensure_user_id():
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())

@app.route("/new_tag_graph", methods=["POST"])
def create_user_tag_graph():
    user_id = session["user_id"]
    source_query = request.json.get("query", DEFAULT_QUERY)
    user_tag_graphs[user_id] = create_tagology_graph(source_query)
    return jsonify({"message": "New graph created"})

@app.route("/tagology_graph", methods=["POST"])
def query_tag_graph():
    user_id = session["user_id"]
    tag_graph = user_tag_graphs.get(user_id, GLOBAL_TAG_GRAPH)
    query = request.json.get("query")

    if tag_graph is None:
        return jsonify({"error": "Missing tagology graph"}), 500
    if query is None:
        return jsonify({"error": "Missing SPARQL query"}), 400

    try:
        results = tag_graph.query(query)
        json_results = [
            {str(l): str(row[l]) for l in row.labels}
            for row in results]
        return jsonify(json_results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
