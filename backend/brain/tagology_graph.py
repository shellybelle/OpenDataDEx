from brain.source_graph import get_object_graph
from brain.formal_context import get_object_context, add_related_objects
from brain.namespaces import TAG
from rdflib import Graph

RELATED_OBJ_THRESHOLD = 12

def create_tagology_graph(source_endpoint: str, source_query: str) -> Graph:
    
    # TODO: thorough data validation and error handling
    # TODO: benchmarking & optimization

    print("[STATUS] sending query")

    obj_graph = get_object_graph(source_query, source_endpoint)
    obj_graph.bind("tag", TAG)

    print("[STATUS] graph initialized, creating context")
    
    obj_context = get_object_context(obj_graph)
    
    for obj in obj_graph.subjects(predicate=TAG.objLabel):
        print(f"[STATUS] adding related objects for {str(obj)}")
        add_related_objects(obj, obj_graph, obj_context, RELATED_OBJ_THRESHOLD)
    
    print(f"[STATUS] graph created with {len(obj_graph)} total triples")
    
    return obj_graph
