from brain.tagology_graph import create_tagology_graph

TEST_QUERY  = """
        PREFIX wd:     <http://www.wikidata.org/entity/>
        PREFIX wdt:    <http://www.wikidata.org/prop/direct/>
        PREFIX schema: <http://schema.org/>

        CONSTRUCT {
            ?wikip ?prop ?val .
            ?wikip schema:about ?item .
        }
        WHERE {
            ?wikip schema:isPartOf <https://en.wikipedia.org/>;
                schema:about ?item .
            
            ?item
                wdt:P31 wd:Q144;        # DOGS
                #wdt:P31 wd:Q146;        # CATS
                #wdt:P31 wd:Q11424;      # MOVIES
                #wdt:P5008 ?list;        # ON A LIST
                ?prop ?val .

            FILTER(STRSTARTS(STR(?prop), STR(wdt:)))    # Property must be from truthy namespace
        }
        LIMIT 100000
    """

def main():
    tagology_graph = create_tagology_graph(TEST_QUERY)

    ### DEBUG ###
    print(f"tagology graph contained {len(tagology_graph)} triples")

if __name__ == "__main__":
    main()
