import sys
from brain.tagology_graph import create_tagology_graph

DEFAULT_ENDPOINT = "https://query.wikidata.org/sparql"
DEFAULT_QUERY = """PREFIX odd: <https://theknowledgecommons.org/ns/odd/>
CONSTRUCT {
    ?object ?property ?value .
    ?object odd:objLabel ?objectLabel .
    ?property odd:propLabel ?propertyLabel .
    ?value odd:valLabel ?valueLabel .
    ?object schema:about ?item .
}
WHERE {
    ?item wdt:P4466 ?uat ; # HAS UAT ID
          ?property ?value .
    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .

    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY

    BIND(STRAFTER(STR(?property), STR(wdt:)) AS ?pid)
    BIND(IRI(CONCAT(STR(wd:), ?pid)) AS ?p)

    MINUS {?p wikibase:propertyType wikibase:ExternalId .} # IGNORE ID TRIPLES

    # MANUAL BINDING REQUIRED DUE TO CUSTOM LABELING
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # CUSTOM
                             ?p rdfs:label ?propertyLabel . # CUSTOM
                             ?value rdfs:label ?valueLabel .
                           }
}
LIMIT 20000"""

def main():
    try:
        tagology_graph = create_tagology_graph(DEFAULT_ENDPOINT, DEFAULT_QUERY)
    except Exception as e:
        print(f"[ERROR] tagology graph creation failed.\n{e}")
        sys.exit(1)

    if len(tagology_graph) == 0:
        print(f"[ERROR] Empty tagology graph")

if __name__ == "__main__":
    main()
