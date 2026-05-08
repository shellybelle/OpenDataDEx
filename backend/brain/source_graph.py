from SPARQLWrapper import SPARQLWrapper
from rdflib import Graph, Literal
from brain.namespaces import ODD

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
    sparqlCall.setTimeout(600)
    sparqlCall.setQuery(source_query)
    sparqlCall.addCustomHttpHeader("User-Agent", "opendatadex/1.0 (info@theknowledgecommons.org)")

    try:
        # ALWAYS A CONSTRUCT QUERY SO ALWAYS RETURNS AN RDFLIB GRAPH
        initialGraph = sparqlCall.queryAndConvert()
    except Exception as e:
        print(f"[ERROR] SPARQL endpoint query failed.\n{e}")
        return Graph()

    # ENSURE EVERY OBJECT HAS A SINGLE odd:objLabel
    for subj in initialGraph.subjects(unique=True):
        if ((subj, ODD.propLabel, None) not in initialGraph and
            (subj, ODD.valLabel, None) not in initialGraph):
            # ASSUME AN OBJECT
            objLabels = list(initialGraph.objects(subject=subj, predicate=ODD.objLabel))
            if len(objLabels) == 0:
                initialGraph.add((subj, ODD.objLabel, Literal(subj)))
            elif len(objLabels) > 1:
                for lbl in objLabels[1:]:
                    initialGraph.remove((subj, ODD.objLabel, lbl))

    # ENSURE EVERY PROPERTY HAS A SINGLE odd:propLabel
    for pred in initialGraph.predicates(unique=True):
        if pred not in (ODD.objLabel, ODD.propLabel, ODD.valLabel):
            # ASSUME AN OBJECT'S PROPERTY
            propLabels = list(initialGraph.objects(subject=pred, predicate=ODD.propLabel))
            if len(propLabels) == 0:
                initialGraph.add((pred, ODD.propLabel, Literal(pred)))
            elif len(propLabels) > 1:
                for lbl in propLabels[1:]:
                    initialGraph.remove((pred, ODD.propLabel, lbl))

    # ENSURE EVERY URI VALUE HAS A SINGLE odd:valLabel
    for o in initialGraph.objects(unique=True):
        if (not isinstance(o, Literal) and
            (None, ODD.propLabel, o) not in initialGraph and
            (None, ODD.valLabel, o) not in initialGraph):
            # ASSUME AN OBJECT'S VALUE
            valLabels = list(initialGraph.objects(subject=o, predicate=ODD.valLabel))
            if len(valLabels) == 0:
                initialGraph.add((o, ODD.valLabel, Literal(o)))
            elif len(valLabels) > 1:
                for lbl in valLabels[1:]:
                    initialGraph.remove((o, ODD.valLabel, lbl))

    return initialGraph
