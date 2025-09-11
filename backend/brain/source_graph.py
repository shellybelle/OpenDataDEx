from SPARQLWrapper import SPARQLWrapper
from rdflib import Graph

# wikidata has some BC dates which python can't handle
from rdflib.term import _toPythonMapping
from rdflib.namespace import XSD
original_converter = _toPythonMapping[XSD.dateTime]
def safe_datetime_converter(lexical):
    try:
        return original_converter(lexical)
    except ValueError:
        print(f"[WARNING] Could not parse xsd:dateTime literal {lexical}")
        return lexical
_toPythonMapping[XSD.dateTime] = safe_datetime_converter

def get_object_graph() -> Graph:
    endpoint = "https://query.wikidata.org/sparql"
    q = """
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

    sparqlCall = SPARQLWrapper(endpoint)
    sparqlCall.setQuery(q)
    sparqlCall.addCustomHttpHeader("User-Agent", "tagology/1.0 (michelle.lee.tom@gmail.com)")

    return sparqlCall.queryAndConvert()
