curl -X POST http://127.0.0.1:5000/tagology_graph \
     -H "Content-Type: application/json" \
     -d @- <<'EOF'
{
  "query": "SELECT ?relObj (COUNT(?obj) AS ?relCount)\n
            WHERE {\n
                ?obj skos:related ?relObj . }\n
            GROUP BY ?relObj\n
            ORDER BY ASC(?relCount)\n
            LIMIT 10"
}
EOF

curl -X POST http://127.0.0.1:5000/tagology_graph \
     -H "Content-Type: application/json" \
     -d @- <<'EOF'
{
  "query": "SELECT ?obj
            WHERE {\n
               ?obj skos:related <https://en.wikipedia.org/wiki/Butler_Blue> . }\n"
}
EOF
