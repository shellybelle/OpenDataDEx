from rdflib import Graph, URIRef, Literal, BNode
from rdflib.namespace import XSD
from concepts import Context
from pandas import DataFrame
from brain.namespaces import TAG

def get_object_context(obj_graph: Graph) -> Context:
    
    objs = list(obj_graph.subjects(predicate=TAG.objLabel, unique=True))
    props = list(obj_graph.subjects(predicate=TAG.propLabel, unique=True))

    if len(objs) == 0:
        print("[ERROR] Object Graph contains zero valid objects. Returning empty context.")
        return Context([],[],[])
    if len(props) == 0:
        print("[ERROR] Object Graph contains zero valid properties. Returning empty context.")
        return Context([],[],[])

    rows = []
    for obj in objs:
        row = [(obj, p, None) in obj_graph for p in props]
        rows.append(row)

    try:
        context_data = DataFrame(rows,
                                 index=[str(s) for s in objs],
                                 columns=[str(p) for p in props],
                                 dtype=bool)
    except Exception as e:
        print(f"[ERROR] Failed to create DataFrame. Returning empty context.\n{e}")
        return Context([],[],[])

    # TODO: BENCHMARK WITH AND WITHOUT DROPPING COLUMNS
    '''onePercent = len(objs)*0.01
    sparse_props = context_data.columns[(context_data == True).sum(axis=0) < onePercent].tolist()
    dense_props = context_data.columns[(context_data == False).sum(axis=0) < onePercent].tolist()
    print(f"dropping {len(sparse_props)} sparse and {len(dense_props)} dense of {len(props)} total properties")
    context_data.drop(sparse_props, axis=1, inplace=True)
    context_data.drop(dense_props, axis=1, inplace=True)'''

    return Context(context_data.index.tolist(),
                   context_data.columns.tolist(),
                   context_data.values.tolist())

# TODO: BENCHMARK OBJECT FIRST VS CONCEPT FIRST ITERATION
def add_related_objects(obj: URIRef,
                        obj_graph: Graph,
                        obj_context: Context,
                        incomplete_objs: list,
                        threshold: int):
    
    obj_extent, obj_intent = obj_context[str(obj),]
    if not obj_extent or len(obj_extent) == 0:
        print(f"Failed to get smallest concept for {obj}. No related triples added.")
        return

    related_objs_str = set()
    upper_concepts = obj_context.neighbors(obj_extent)
    while len(related_objs_str) <= threshold: # ASSUMES OBJ ITSELF IN RELATED_OBJS_STR
        if not upper_concepts:
            print(f"[WARNING] Related cluster for {obj} reached supremum concept.")

            # REMOVES OBJ ITSELF
            related_objs = [URIRef(o) for o in related_objs_str if URIRef(o) != obj]
            
            incomplete_objs.append((obj, related_objs))
            return
        else:
            upper_upper_concepts = set()
            for extent, i in upper_concepts:
                related_objs_str.update(extent)
                for n in obj_context.neighbors(extent):
                    upper_upper_concepts.add(n)
            upper_concepts = upper_upper_concepts

    # REMOVES OBJ ITSELF
    related_objs = [URIRef(o) for o in related_objs_str if URIRef(o) != obj]

    _add_related_triples(obj, obj_graph, related_objs, threshold)

def _add_related_triples(obj: URIRef, obj_graph: Graph, related_objs: list, threshold: int):
    if len(related_objs) == 0:
        print(f"[ERROR] Empty related cluster for {obj}. No related triples added.")
        return
    if len(related_objs) < threshold:
        print(f"[WARNING] Related cluster for {obj} smaller than {threshold}")

    obj_propvals = _get_propvals(obj, obj_graph)
    if len(obj_propvals) == 0:
        print(f"[WARNING] Empty set of properties and values for {obj}. No related triples added.")
        return

    try:
        scored_related_objs = _score_threshold_related(obj, obj_propvals, obj_graph, related_objs, threshold)
    except Exception as e:
        print(f"[ERROR] Failed to score related objects for {obj}. No related triples added.\n{e}")
        return

    if len(scored_related_objs) == 0:
        print(f"[ERROR] Empty scored related objects for {obj}. No related triples added.")
        return

    for simScore, ro in scored_related_objs:
        try:
            obj_graph.add((obj, TAG.related, ro))
            edge = BNode()
            obj_graph.add((obj, TAG.relatedEdge, edge))
            obj_graph.add((edge, TAG.target, ro))
            obj_graph.add((edge, TAG.score, Literal(simScore, datatype=XSD.float)))
        except Exception as e:
            print(f"[ERROR] Failed to add triples for {obj} related to {ro}\n{e}")
            continue

def complete_incomplete_objs(obj_graph: Graph, incomplete_objs: list, threshold: int):

    q = f"""PREFIX tag: <http://example.org/tagology/>
SELECT ?hubObj
WHERE {{
    ?o tag:related ?hubObj .
}}
GROUP BY ?hubObj
ORDER BY DESC(COUNT(?o))
LIMIT {threshold}"""
    hub_objs = [h.hubObj for h in obj_graph.query(q)]

    for (obj, related_objs) in incomplete_objs:
        to_add = threshold - len(related_objs)
    
        for ho in hub_objs:
            if to_add == 0 :
                break
            if ho != obj and ho not in related_objs:
                related_objs.append(ho)
                to_add -= 1

        _add_related_triples(obj, obj_graph, related_objs, threshold)
    
    incomplete_objs.clear()

def _get_propvals(obj: URIRef, obj_graph: Graph):
    try:
        return {(prop, val)
                for prop, val in obj_graph.predicate_objects(obj)
                if (prop, TAG.propLabel, None) in obj_graph}
    except Exception as e:
        print(f"[ERROR] Failed to get set of properties and values for {obj}\n{e}")
        return set()

def _score_threshold_related(obj: URIRef,
                             obj_propvals: set,
                             obj_graph: Graph,
                             related_objs: list,
                             threshold: int) -> list[tuple[float, URIRef]]:

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

    scored = []
    for ro in related_objs:
        try:
            ro_propvals = _get_propvals(ro, obj_graph)
            union = obj_propvals | ro_propvals
            simScore = len(obj_propvals & ro_propvals) / len(union) if union else 0.0
            scored.append((simScore, ro))
        except Exception as e:
            print(f"[ERROR] Failed to score {obj} relatedness to {ro}\n{e}")
            continue

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:threshold]
