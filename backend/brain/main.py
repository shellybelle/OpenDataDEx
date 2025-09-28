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
            ?wikip schema:isPartOf <https://en.wikipedia.org/>;
                schema:about ?item .
            
            ?item
                #wdt:P31 wd:Q144;        # DOGS
                wdt:P31 wd:Q146;        # CATS
                #wdt:P31 wd:Q11424;      # MOVIES
                #wdt:P5008 ?list;        # ON A LIST
                ?prop ?val .
            FILTER(STRSTARTS(STR(?prop), STR(wdt:)))    # Property must be from truthy namespace
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 100000
    """

def main():
    tagology_graph = create_tagology_graph(DEFAULT_ENDPOINT, DEFAULT_QUERY)

    ### DEBUG ###
    print(f"tagology graph contained {len(tagology_graph)} triples")

if __name__ == "__main__":
    main()
