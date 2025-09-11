from flask import Flask, request, jsonify
import os
from rdflib import Graph
from brain.tagology_graph import get_tagology_graph

app = Flask(__name__)

if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    tag_graph = get_tagology_graph()
else:
    tag_graph = None

@app.route("/tagology_graph", methods=["POST"])
def sparql_query():

    post_query = request.json.get("query")
    if not post_query:
        return jsonify({"error": "Missing SPARQL query"}), 400

    try:
        results = tag_graph.query(post_query)
    
        json_results = []
        for row in results:
            json_results.append({str(l): str(row[l]) for l in row.labels})

        return jsonify(json_results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
