import requests

queryA = """
    SELECT (COUNT(DISTINCT ?obj) as ?totalObjects)
    WHERE {
        ?obj ?p ?v .
    }
"""

queryB = """
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT (COUNT(?prop) as ?totalTags)
    WHERE {
        ?obj ?prop ?val .
        FILTER(!STRSTARTS(STR(?prop), STR(skos:)))
    }
"""

queryC = """
    # 
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT DISTINCT ?relObj
    WHERE {
        ?relObj schema:about ?item.
        FILTER NOT EXISTS {?any skos:related ?relObj .}
    }
"""

endpoint = "http://127.0.0.1:5000/tagology_graph"

print("Running query:")
response = requests.post(endpoint, json={"query": queryB})
print(response.json())
print()
