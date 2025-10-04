import requests

queryA = """
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT (COUNT(?obj) AS ?totalObjs)
    WHERE {
        ?obj skos:prefLabel ?label .
    }
"""

queryB = """
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX tag: <http://example.org/tagology/>
    SELECT (COUNT(*) as ?totalTags)
    WHERE {
        ?obj skos:prefLabel ?label ;
             ?prop ?val .
        FILTER(
          !STRSTARTS(STR(?prop), STR(skos:))  &&
          !STRSTARTS(STR(?prop), STR(tag:))
        )
    }
"""

query = """
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT ?hubObj ?label
    WHERE {
      ?o skos:related ?hubObj .
      ?hubObj skos:prefLabel ?label .
    }
    GROUP BY ?hubObj ?label
    ORDER BY DESC(COUNT(?o))
    LIMIT 1
"""

endpoint = "http://127.0.0.1:5000/tagology_graph"

print("Running query:")
response = requests.post(endpoint, json={"query": query})
print("Status Code:", response.status_code)
print("Response Text:", response.text)
