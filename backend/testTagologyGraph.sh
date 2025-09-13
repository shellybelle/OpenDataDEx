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
  "query": "# get hub and related objects\n
            SELECT ?hubObj ?relObj\n
            WHERE {{# the tagology graph's hub object\n
                SELECT ?hubObj (COUNT(?o) AS ?count)\n
                WHERE {?o skos:related ?hubObj .}\n
                GROUP BY ?hubObj\n
                ORDER BY DESC(?count)\n
                LIMIT 1}\n
                ?hubObj skos:related ?relObj .}"
}
EOF

