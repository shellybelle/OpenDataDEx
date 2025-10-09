from flask import Flask, request, jsonify, session, render_template
from rdflib import Graph
from brain.tagology_graph import create_tagology_graph
from threading import Lock
import os, uuid

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GLOBAL_TAG_GRAPH = None

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
    ?object schema:isPartOf <https://en.wikipedia.org/> ;
            schema:about ?item .
    ?item wdt:P4466 ?uat ; # HAS UAT ID
          ?property ?value .
    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".
                             ?item rdfs:label ?objectLabel .
                             ?property rdfs:label ?propertyLabel .
                             ?value rdfs:label ?valueLabel .
                           }
}
LIMIT 10000"""

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, '../../frontend/template'),
    static_folder=os.path.join(BASE_DIR, '../../frontend/static')
)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", os.urandom(24)) 

if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    GLOBAL_TAG_GRAPH = create_tagology_graph(DEFAULT_ENDPOINT, DEFAULT_QUERY)
    
# key: user session id (str)
# value: a tagology_graph (rdflib.Graph)
user_tag_graphs = {}

query_lock = Lock()

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
    source_endpoint = request.json.get("endpoint", DEFAULT_ENDPOINT)
    source_query = request.json.get("query", DEFAULT_QUERY)
    user_tag_graphs[user_id] = create_tagology_graph(source_endpoint, source_query)
    
    return jsonify({"message": "New tagology graph created"})

@app.route("/tagology_graph", methods=["POST"])
def query_tag_graph():
    user_id = session["user_id"]
    tag_graph = user_tag_graphs.get(user_id, GLOBAL_TAG_GRAPH)
    query = request.json.get("query")
    with query_lock:
        results = tag_graph.query(query)
    json_results = [
        {str(l): str(row[l]) for l in row.labels}
        for row in results
    ]
    return jsonify(json_results)

@app.route("/tags")
def tags_page():
    return render_template("tags.html")

@app.route("/welcome")
def welcome_page():
    return render_template("welcome.html")

@app.route("/delete_user_graph", methods=["POST"])
def delete_user_graph():
    user_id = session.get("user_id")
    if user_id in user_tag_graphs:
        del user_tag_graphs[user_id]
        return jsonify({"message": f"Graph for user {user_id} deleted."}), 200
    return jsonify({"message": "No graph to delete."}), 200

if __name__ == "__main__":
    app.run(debug=True)
