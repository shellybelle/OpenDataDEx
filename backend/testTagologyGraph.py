import requests

queryA = """
    SELECT (COUNT(DISTINCT ?obj) as ?totalObjects)
    WHERE {
        ?obj ?prop ?val .
    }
"""

queryB = """
    SELECT ?hubObj (COUNT(?obj) AS ?count)
    WHERE {
        ?obj skos:related ?hubObj .
    }
    GROUP BY ?hubObj
    ORDER BY DESC(?count)
"""

query = """
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT DISTINCT ?relObj
    WHERE {
        ?relObj ?p ?v .
        FILTER(isIRI(?relObj))
        FILTER NOT EXISTS {?any skos:related ?relObj .}
    }
"""

endpoint = "http://127.0.0.1:5000/tagology_graph"

print("Running query:")
response = requests.post(endpoint, json={"query": query})
print(response.json())
print()
