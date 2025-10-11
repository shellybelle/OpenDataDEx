from rdflib import Graph, URIRef, Literal, BNode
from rdflib.namespace import XSD
from concepts import Context
from pandas import DataFrame
from brain.namespaces import TAG

def get_object_context(obj_graph: Graph) -> Context:
    
    props = list(obj_graph.subjects(predicate=TAG.propLabel, unique=True))
    objs = list(obj_graph.subjects(predicate=TAG.objLabel, unique=True))

    rows = []
    for obj in objs:
        row = [any(obj_graph.objects(obj, p)) for p in props]
        rows.append(row)

    context_data = DataFrame(
            rows,
            index=[str(s) for s in objs],
            columns=[str(p) for p in props],
            dtype=bool)

    # TODO: BENCHMARK WITH AND WITHOUT DROPPING COLUMNS
    '''onePercent = len(objs)*0.01
    sparse_props = context_data.columns[(context_data == True).sum(axis=0) < onePercent].tolist()
    dense_props = context_data.columns[(context_data == False).sum(axis=0) < onePercent].tolist()
    print(f"dropping {len(sparse_props)} sparse and {len(dense_props)} dense of {len(props)} total properties")
    context_data.drop(sparse_props, axis=1, inplace=True)
    context_data.drop(dense_props, axis=1, inplace=True)'''

    return Context(context_data.index.tolist(), context_data.columns.tolist(), context_data.values.tolist())

# TODO: BENCHMARK OBJECT FIRST VS CONCEPT FIRST ITERATION
def add_related_objects(obj: URIRef, obj_graph: Graph, obj_context: Context, threshold: int):
    obj_extent, obj_intent = obj_context[str(obj),]
    related_objs_str = set()

    upper_concepts = obj_context.neighbors(obj_extent)
    while len(related_objs_str) <= threshold: # ASSUMES RELATED_OBJS_STR CONTAINS THE OBJ
        if not upper_concepts:
            related_objs_str.update(obj_context.objects)
            break
        else:
            upper_upper_concepts = []
            for extent, i in upper_concepts:
                related_objs_str.update(extent)
                upper_upper_concepts.extend(obj_context.neighbors(extent))
            upper_concepts = upper_upper_concepts

    related_objs_str.discard(str(obj))
    scored_related_objs = _score_threshold_related(obj, related_objs_str, obj_graph, threshold)

    for simScore, ro in scored_related_objs:
        obj_graph.add((obj, TAG.related, ro))

        edge = BNode()
        obj_graph.add((obj, TAG.relatedEdge, edge))
        obj_graph.add((edge, TAG.target, ro))
        obj_graph.add((edge, TAG.score, Literal(simScore, datatype=XSD.float)))

def _score_threshold_related(
    obj: URIRef,
    related_objs_str: set,
    obj_graph: Graph,
    threshold: int
) -> list[tuple[float, URIRef]]:

    # TODO: BENCHMARK QUERY VS FOR+IF VERSION
    '''def get_propvals(o):
    q = f"""
    PREFIX tag: <{TAG}>
    SELECT ?p ?v WHERE {{
      <{o}> ?p ?v .
      ?p tag:propLabel ?pl .
    }}
    """
    return {(row.p, row.v) for row in obj_graph.query(q)}
    '''

    def get_propvals(o: URIRef):
        return {
            (p, v)
            for p, v in obj_graph.predicate_objects(o)
            if (p, TAG.propLabel, None) in obj_graph
        }

    obj_propvals = get_propvals(obj)

    scored = []
    for ro in related_objs_str:
        ro_uri = URIRef(ro)
        ro_propvals = get_propvals(ro_uri)
        union = obj_propvals | ro_propvals
        simScore = len(obj_propvals & ro_propvals) / len(union) if union else 0.0
        scored.append((simScore, ro_uri))

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:threshold]
