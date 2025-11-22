from rdflib import Graph, URIRef, Literal, BNode
from rdflib.namespace import XSD
from concepts import Context
from pandas import DataFrame
from brain.namespaces import ODD 

def get_object_context(obj_graph: Graph, objs: list, props: list) -> Context:

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
        # TODO: PASS LISTS INTEAD OF DATAFRAME
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
    print(f"drop {len(sparse_props)} sparse & {len(dense_props)} dense of {len(props)} properties")
    context_data.drop(sparse_props, axis=1, inplace=True)
    context_data.drop(dense_props, axis=1, inplace=True)'''

    return Context(context_data.index.tolist(),
                   context_data.columns.tolist(),
                   context_data.values.tolist())

def add_related_objects(obj: URIRef,
                        obj_graph: Graph,
                        obj_context: Context,
                        incomplete_objs: list,
                        tags: dict,
                        prop_freq: dict,
                        threshold: int):

    related_objs_str = set()
    obj_str = str(obj)
    obj_extent, i = obj_context[obj_str,]
    add_extents = [obj_extent]

    # TODO: CACHE VISITED CONCEPTS
    while add_extents: # ASSUMES OBJ ITSELF IN RELATED_OBJS_STR
        for extent in add_extents:
            related_objs_str.update(extent)
        if len(related_objs_str) > threshold: # ACCOUNTS FOR OBJECT ITSELF
            break
        else:
            upper_extents = set()
            for extent in add_extents:
                for u_extent, u_i in obj_context.neighbors(extent):
                    upper_extents.add(u_extent)
            add_extents = upper_extents

    # REMOVES OBJ ITSELF
    related_objs = [URIRef(o) for o in related_objs_str if o != obj_str]

    if len(related_objs) < threshold:
        print(f"[STATUS] {obj} reached supremum before getting complete candidate pool")
        incomplete_objs.append((obj, related_objs))

    _add_related_triples(obj, obj_graph, related_objs, tags, prop_freq, threshold)

def _add_related_triples(obj: URIRef,
                         obj_graph: Graph,
                         related_objs: list,
                         tags: dict,
                         prop_freq: dict,
                         threshold: int):
    if len(related_objs) == 0:
        print(f"[ERROR] Empty related cluster for {obj}. No related triples added.")
        return
    if len(related_objs) < threshold:
        print(f"[WARNING] Related cluster for {obj} smaller than {threshold}")

    try:
        scored_related_objs = _score_threshold_related(obj,
                                                       obj_graph,
                                                       related_objs,
                                                       tags,
                                                       prop_freq,
                                                       threshold)
    except Exception as e:
        print(f"[ERROR] Failed to score related objects for {obj}. No related triples added.\n{e}")
        return

    if len(scored_related_objs) == 0:
        print(f"[ERROR] Empty scored related objects for {obj}. No related triples added.")
        return

    for simScore, ro in scored_related_objs:
        try:
            obj_graph.add((obj, ODD.related, ro))
            edge = BNode()
            obj_graph.add((obj, ODD.relatedEdge, edge))
            obj_graph.add((edge, ODD.target, ro))
            obj_graph.add((edge, ODD.score, Literal(simScore, datatype=XSD.float)))
        except Exception as e:
            print(f"[ERROR] Failed to add triples for {obj} related to {ro}\n{e}")
            continue

def complete_incomplete_objs(obj_graph: Graph,
                             incomplete_objs: list,
                             tags: dict,
                             prop_freq: dict,
                             threshold: int):

    q = f"""PREFIX odd: <https://theknowledgecommons.org/ns/odd/>
SELECT ?hubObj
WHERE {{
    ?o odd:related ?hubObj .
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

        _add_related_triples(obj, obj_graph, related_objs, tags, prop_freq, threshold)

    incomplete_objs.clear()

def get_tags(obj: URIRef, obj_graph: Graph):
    try:
        return {(prop, val)
                for prop, val in obj_graph.predicate_objects(obj)
                if (prop, ODD.propLabel, None) in obj_graph}
    except Exception as e:
        print(f"[ERROR] Failed to get set of properties and values for {obj}\n{e}")
        return set()

def _score_threshold_related(obj: URIRef,
                             obj_graph: Graph,
                             related_objs: list,
                             tags: dict,
                             prop_freq: dict,
                             threshold: int) -> list[tuple[float, URIRef]]:
    scored = []

    if obj not in tags:
        print(f"[ERROR] {obj} not in property:value cache! Returning empty scored array.")
        return scored

    for ro in related_objs:
        try:
            if ro not in tags:
                raise KeyError(f"{ro} not in the property:value cache")

            tag_matches = tags[obj] & tags[ro]
            simScore = sum(1.0 / prop_freq.get(p, 1.0) for p, _ in tag_matches)

            # TODO: TWEAK SIMSCORE LOGIC FOR BEST CONNECTEDNESS

            scored.append((simScore, ro))
        except Exception as e:
            print(f"[ERROR] Failed to score {obj} relatedness to {ro}\n{e}")
            continue

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:threshold]
