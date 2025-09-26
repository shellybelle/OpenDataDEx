from rdflib import Graph, URIRef, SKOS
from concepts import Context
from pandas import DataFrame

RELATED_OBJ_THRESHOLD = 6

def get_object_context(obj_graph: Graph) -> Context:
    
    props = list(obj_graph.predicates(unique=True))
    objs = list(obj_graph.subjects(unique=True))

    rows = []
    for obj in objs:
        row = [(obj, prop, None) in obj_graph for prop in props]
        rows.append(row)

    context_data = DataFrame(rows, index=(str(s) for s in objs), columns=(str(p) for p in props))

    ### TODO: Should sparse and dense properties be dropped?
    #sparse_props = context_data.columns[(context_data == True).sum(axis=0) <= 1].tolist()
    #dense_props = context_data.columns[(context_data == False).sum(axis=0) <= 1].tolist()
    #context_data.drop(sparse_props, axis=1, inplace=True)
    #context_data.drop(dense_props, axis=1, inplace=True)

    return Context(context_data.index.tolist(), context_data.columns.tolist(), context_data.values.tolist())

def add_related_objects(obj: URIRef, obj_graph: Graph, obj_context: Context):

    obj_extent, obj_intent = obj_context[str(obj),]
    related_objs = set()

    ### TODO: should I ONLY look at 1st neighbor concepts? (<THRESHOLD related)
    upper_concepts = obj_context.neighbors(obj_extent)
    while(len(related_objs) < RELATED_OBJ_THRESHOLD):
        if not upper_concepts:
            related_objs.update(obj_context.objects)
            break
        else:
            upper_upper_concepts = []
            for extent, i in upper_concepts:
                related_objs.update(extent)
                upper_upper_concepts.extend(obj_context.neighbors(extent))
            related_objs.discard(str(obj))
            upper_concepts = upper_upper_concepts
    
    if(len(related_objs) > RELATED_OBJ_THRESHOLD):
        print("calling prune_related_objs")
        related_objs = _prune_related_objs(obj, related_objs, obj_graph)

    for ro in related_objs:
        obj_graph.add((obj, SKOS.related, URIRef(ro)))

def _prune_related_objs(obj: URIRef, related_objs: set, obj_graph: Graph) -> set:
    
    related_obj_list = " ".join(f"<{ro}>" for ro in related_objs)
    q = f"""
        SELECT ?related_obj
        WHERE {{
            VALUES ?related_obj {{ {related_obj_list} }}
            <{obj}> ?p ?v .
            FILTER(?p NOT IN (skos:prefLabel, skos:related))
            ?related_obj ?p ?v .
        }}
        GROUP BY ?related_obj
        ORDER BY DESC(COUNT(DISTINCT ?p))
        LIMIT {RELATED_OBJ_THRESHOLD}
    """

    return {str(row["related_obj"]) for row in obj_graph.query(q)}

