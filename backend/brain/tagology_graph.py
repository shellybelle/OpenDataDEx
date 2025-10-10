from brain.source_graph import get_object_graph
from brain.formal_context import get_object_context, add_related_objects
from brain.namespaces import TAG
from rdflib import Graph

RELATED_OBJ_THRESHOLD = 12

def create_tagology_graph(source_endpoint: str, source_query: str) -> Graph:
    
    print(f"[STATUS] Sending query to {source_endpoint}:\n{source_query}")
    try:
        obj_graph = get_object_graph(source_query, source_endpoint)
    except Exception as e:
        print(f"[ERROR] Could not create rdflib Graph from source. Returning empty Graph.\n{e}")
        return Graph()

    if len(obj_graph) == 0:
        print("[ERROR] Graph from source is empty.")
        return Graph()

    print(f"[STATUS] Graph initialized with {len(obj_graph)} triples. Creating context.")    
    try:
        obj_context = get_object_context(obj_graph)
    except Exception as e:
        print(f"[ERROR] Could not create concepts Context from obj_graph\n{e}")
        return Graph()
    
    print("[STATUS] Context created. Adding related object triples.")
    obj_graph.bind("tag", TAG)
    for obj in obj_graph.subjects(predicate=TAG.objLabel):
        try:
            add_related_objects(obj, obj_graph, obj_context, RELATED_OBJ_THRESHOLD)
        except Exception as e:
            print(f"[ERROR] failed to add related objects for {obj}\n{e}")
            continue
    
    print(f"[STATUS] tagology graph created with {len(obj_graph)} total triples")
    return obj_graph
