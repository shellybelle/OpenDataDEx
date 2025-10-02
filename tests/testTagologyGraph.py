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

queryC = q = """
PREFIX tag: <http://example.org/tagology/>
SELECT ?relObj ?score
WHERE {
  ?obj tag:relatedEdge ?edge .
  ?edge tag:target ?relObj .
  ?edge tag:score ?score .
}
LIMIT 10
"""

endpoint = "http://127.0.0.1:5000/tagology_graph"

print("Running query:")
response = requests.post(endpoint, json={"query": queryB})
print(response.json())
print()
