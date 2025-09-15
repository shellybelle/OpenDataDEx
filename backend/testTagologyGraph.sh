curl -X POST http://127.0.0.1:5000/tagology_graph \
     -H "Content-Type: application/json" \
     -d @- <<'EOF'
{
  "query": "SELECT (COUNT(DISTINCT ?obj) as ?totalObjects)\n
            WHERE {\n
               ?obj ?prop ?val .}"
}
EOF

curl -X POST http://127.0.0.1:5000/tagology_graph \
     -H "Content-Type: application/json" \
     -d @- <<'EOF'
{ "query": "\n
    SELECT ?hubObj (COUNT(?obj) AS ?count)\n
    WHERE {\n
        ?obj skos:related ?hubObj .}\n
    GROUP BY ?hubObj\n
    ORDER BY DESC(?count)"
}
EOF

curl -X POST http://127.0.0.1:5000/tagology_graph \
     -H "Content-Type: application/json" \
     -d @- <<'EOF'
{
  "query": "\n
    SELECT ?obj ?relObj\n
        WHERE {\n
            ?obj skos:related ?relObj .\n
            FILTER NOT EXISTS {?relObj skos:related ?obj .}\n
        }"
}
EOF
