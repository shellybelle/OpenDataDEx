from SPARQLWrapper import SPARQLWrapper
from rdflib import Graph

def getTriples() -> Graph:
    endpoint = "https://query.wikidata.org/sparql"
    query = """
        PREFIX wd:     <http://www.wikidata.org/entity/>
        PREFIX wdt:    <http://www.wikidata.org/prop/direct/>
        PREFIX schema: <http://schema.org/>

        CONSTRUCT {
            ?wikip ?prop ?val .
        }
        WHERE {
            ?wikip schema:isPartOf <https://en.wikipedia.org/> . # The article must be a wikipedia page
            ?wikip schema:about ?item .                         # There must be an article about the instance
            ?item wdt:P31 wd:Q146 .                             # All instances of housecats
            ?item ?prop ?val .                                  # Get all properties and values of the instance
        
            FILTER(STRSTARTS(STR(?prop), STR(wdt:)))            # Property must be from truthy namespace
        }
        LIMIT 10000
    """

    sparqlCall = SPARQLWrapper(endpoint)
    sparqlCall.setQuery(query)
    sparqlCall.addCustomHttpHeader("User-Agent", "tagology/1.0 (michelle.lee.tom@gmail.com)")

    try:
        return sparqlCall.queryAndConvert()
    except Exception as e:
        print(e)
