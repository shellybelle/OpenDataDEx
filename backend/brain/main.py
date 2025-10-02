from brain.tagology_graph import create_tagology_graph

DEFAULT_ENDPOINT = "https://query.wikidata.org/sparql"
DEFAULT_QUERY = """
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    CONSTRUCT {
        ?wikip ?prop ?val .
        ?wikip schema:about ?item .
        ?wikip skos:prefLabel ?itemLabel .
    }
    WHERE {
        ?wikip schema:isPartOf <https://en.wikipedia.org/> ;
               schema:about ?item .
        ?item wdt:P4466 ?uat ;
              ?prop ?val .
        FILTER(STRSTARTS(STR(?prop), STR(wdt:))) #TRUTHY
        SERVICE wikibase:label {bd:serviceParam wikibase:language "en" .}
    }
    LIMIT 1000
"""

def main():
    tagology_graph = create_tagology_graph(DEFAULT_ENDPOINT, DEFAULT_QUERY)

if __name__ == "__main__":
    main()
