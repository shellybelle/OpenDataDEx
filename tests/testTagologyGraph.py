import requests

# UNATTACHED OBJECTS
queryA = """
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?relObj ?label
WHERE {
    FILTER NOT EXISTS {?obj skos:related ?relObj}
    ?relObj skos:prefLabel ?label
}
"""

query = """
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
CONSTRUCT {
    ?object ?property ?value .
    ?object skos:prefLabel ?label .
    ?object schema:about ?item .
}
WHERE {
    ?object schema:isPartOf <https://en.wikipedia.org/>;
           schema:about ?item .
    ?item wdt:P31 wd:Q146; # INSTANCE OF CAT
          ?property ?value ;
          rdfs:label ?label .
    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY NAMESPACE
    FILTER(langMatches(lang(?label), "en") || lang(?label) = "")
}
LIMIT 10000
"""

queryC = """
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
