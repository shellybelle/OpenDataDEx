from rdflib import Graph
from brain.namespaces import ODD
from brain.source_graph import get_object_graph
from brain.formal_context import (get_object_context,
                                  add_related_objects,
                                  get_tags,
                                  complete_incomplete_objs)

RELATED_OBJ_THRESHOLD = 12

def create_tagology_graph(source_endpoint: str, source_query: str) -> Graph:

    print(f"[STATUS] Sending query to {source_endpoint}:\n{source_query}")
    try:
        obj_graph = get_object_graph(source_query, source_endpoint)
    except Exception as e:
        print(f"[ERROR] Failed to create rdflib Graph from source. Returning empty Graph.\n{e}")
        return Graph()

    if len(obj_graph) == 0:
        print("[ERROR] Empty source graph. Aborting and returning an empty Graph.")
        return Graph()

    objs = list(obj_graph.subjects(predicate=ODD.objLabel, unique=True))
    props = list(obj_graph.subjects(predicate=ODD.propLabel, unique=True))

    print(f"[STATUS] Graph initialized with {len(obj_graph)} triples. Creating context.")
    try:
        obj_context = get_object_context(obj_graph, objs, props)
    except Exception as e:
        print(f"[ERROR] Failed to create concepts Context from obj_graph\n{e}")
        return Graph()

    print("[STATUS] Context created. Adding related object triples.")

    tags = {}
    for obj in objs:
        tags[obj] = get_tags(obj, obj_graph)
    
    prop_freq = {}
    for propvals in tags.values():
        for p, _ in propvals:
            prop_freq[p] = prop_freq.get(p, 0) + 1

    incomplete_objs = []

    for obj in objs:
        try:
            add_related_objects(obj,
                                obj_graph,
                                obj_context,
                                incomplete_objs,
                                tags,
                                prop_freq,
                                RELATED_OBJ_THRESHOLD)
        except Exception as e:
            print(f"[WARNING] Failed to add related objects for {obj}\n{e}")
            continue

    try:
        complete_incomplete_objs(obj_graph, incomplete_objs, tags, prop_freq, RELATED_OBJ_THRESHOLD)
    except Exception as e:
        print(f"[WARNING] Failed to fill in and score incomplete objects\n{e}")

    # TODO: FINAL SANITY CHECKS ON THE TAGOLOGY GRAPH
    # TODO: FIGURE OUT WHAT TO DO ABOUT DETACHED OBJECTS
    '''PREFIX odd: <https://theknowledgecommons.org/ns/odd/>
    SELECT ?relObj ?label
    WHERE {
        FILTER NOT EXISTS {?obj odd:related ?relObj}
        ?relObj odd:objLabel ?label
    }'''

    print(f"[STATUS] tagology graph created with {len(obj_graph)} total triples")
    obj_graph.bind("odd", ODD)
    return obj_graph
