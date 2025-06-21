from SPARQLWrapper import SPARQLWrapper, JSON
import json

sparqlWiki = SPARQLWrapper("https://query.wikidata.org/sparql")

sparqlWiki.setQuery("""
    CONSTRUCT {
        ?obj ?prop ?value . 
    }
    WHERE {
        ?obj wdt:P31 wd:Q146 .  # Instances of housecats
        ?obj ?prop ?value .
    }
    LIMIT 100000
""")

try:
    resGraph = sparqlWiki.query().convert()
    print(resGraph.serialize(format="json-ld"))
except Exception as e:
    print(e)
