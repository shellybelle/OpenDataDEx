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
    ?object schema:isPartOf <https://en.wikipedia.org/> ;
            schema:about ?item .
    ?item wdt:P4466 ?uat ; # HAS UAT ID
          ?property ?value .
    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".
                             ?item rdfs:label ?objectLabel .
                             ?property rdfs:label ?propertyLabel .
                             ?value rdfs:label ?valueLabel .
                           }
}
LIMIT 10000"""

def main():
    tagology_graph = create_tagology_graph(DEFAULT_ENDPOINT, DEFAULT_QUERY)

if __name__ == "__main__":
    main()
