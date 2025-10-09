from brain.tagology_graph import create_tagology_graph

DEFAULT_ENDPOINT = "https://query.wikidata.org/sparql"
DEFAULT_QUERY = """PREFIX tag: <http://example.org/tagology/>
CONSTRUCT {
    ?object ?property ?value .
    ?object tag:objLabel ?objectLabel .
    ?property tag:propLabel ?propertyLabel .
    ?value tag:valLabel ?valueLabel .
    ?object schema:about ?item .
}
WHERE {
    ?item wdt:P4466 ?uat ; # HAS UAT ID
          ?property ?value .
    ?p wikibase:directClaim ?property .
    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel .
                             ?p rdfs:label ?propertyLabel .
                             ?value rdfs:label ?valueLabel .
                           }
}
LIMIT 50000"""

def main():
    tagology_graph = create_tagology_graph(DEFAULT_ENDPOINT, DEFAULT_QUERY)

if __name__ == "__main__":
    main()
