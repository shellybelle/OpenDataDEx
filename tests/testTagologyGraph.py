import requests

# UNATTACHED OBJECTS
queryA = """
PREFIX tag: <http://example.org/tagology/>
SELECT ?relObj ?label
WHERE {
    FILTER NOT EXISTS {?obj tag:related ?relObj}
    ?relObj tag:objLabel ?label
}
"""

queryB = """
"""

# HUB OBJECT
query = """
PREFIX tag: <http://example.org/tagology/>
SELECT ?hubObj ?label
WHERE {
  ?o tag:related ?hubObj .
  ?hubObj tag:objLabel ?label .
}
GROUP BY ?hubObj ?label
ORDER BY ASC(COUNT(?o))
LIMIT 1
"""

endpoint = "http://127.0.0.1:5000/tagology_graph"

print("Running query:")
response = requests.post(endpoint, json={"query": query})
print("Status Code:", response.status_code)
print("Response Text:", response.text)
