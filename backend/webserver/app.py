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

DEFAULT_ENDPOINT = "https://query.wikidata.org/sparql"
DEFAULT_QUERY = """
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    CONSTRUCT {
        ?wikip ?prop ?val .
        ?wikip schema:about ?item .
        ?wikip skos:prefLabel ?itemLabel .
    }
    WHERE {
        ?wikip schema:isPartOf <https://en.wikipedia.org/> ;
               schema:about ?item .
        ?item wdt:P4466 ?uat ;
              ?prop ?val .
        FILTER(STRSTARTS(STR(?prop), STR(wdt:))) #TRUTHY
        SERVICE wikibase:label {bd:serviceParam wikibase:language "en" .}
    }
    LIMIT 50000
"""

if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    GLOBAL_TAG_GRAPH = create_tagology_graph(DEFAULT_ENDPOINT, DEFAULT_QUERY)
    
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
    source_endpoint = request.json.get("endpoint", DEFAULT_ENDPOINT)
    source_query = request.json.get("query", DEFAULT_QUERY)
    user_tag_graphs[user_id] = create_tagology_graph(source_endpoint, source_query)
    
    return jsonify({"message": "New tagology graph created"})

@app.route("/tagology_graph", methods=["POST"])
def query_tag_graph():
    user_id = session["user_id"]
    tag_graph = user_tag_graphs.get(user_id, GLOBAL_TAG_GRAPH)
    query = request.json.get("query")

    results = tag_graph.query(query)
    json_results = [
        {str(l): str(row[l]) for l in row.labels}
        for row in results]
    return jsonify(json_results)

@app.route("/tags")
def tags_page():
    return render_template("tags.html")

@app.route("/welcome")
def welcome_page():
    return render_template("welcome.html")

if __name__ == "__main__":
    app.run(debug=True)
