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

def get_object_graph(source_query, source_endpoint) -> Graph:
    sparqlCall = SPARQLWrapper(source_endpoint)
    sparqlCall.setQuery(source_query)
    sparqlCall.addCustomHttpHeader("User-Agent", "tagology/1.0 (michelle.lee.tom@gmail.com)")
    return sparqlCall.queryAndConvert()
