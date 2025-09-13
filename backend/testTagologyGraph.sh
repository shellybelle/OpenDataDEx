curl -X POST http://127.0.0.1:5000/tagology_graph \
     -H "Content-Type: application/json" \
     -d @- <<'EOF'
{
  "query": "SELECT (COUNT(DISTINCT ?obj) as ?totalObjects)\n
            WHERE {\n
               ?obj ?prop ?val. }"
}
EOF

curl -X POST http://127.0.0.1:5000/tagology_graph \
     -H "Content-Type: application/json" \
     -d @- <<'EOF'
{
  "query": "SELECT ?obj (COUNT(?relObj) AS ?relObjCount)\n
            WHERE {\n
                ?obj skos:related ?relObj . }\n
            GROUP BY ?obj"
}
EOF

