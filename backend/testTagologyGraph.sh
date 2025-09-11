curl \
    -X POST http://127.0.0.1:5000/tagology_graph \
    -H "Content-Type: application/json" \
    -d '{"query": "SELECT ?object ?relatedObject WHERE { ?object skos:related ?relatedObject }"}' > testOutput.txt
