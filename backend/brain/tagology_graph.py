from brain.source_graph import get_object_graph
from brain.formal_context import get_object_context, add_related_objects
from rdflib import Graph

def create_tagology_graph(source_query: str, source_endpoint: str) -> Graph:
    
    ### TODO: ###
    # pass get_object_graph() a sparql query
    # thorough data validation and error handling
    # benchmarking & optimization

    obj_graph = get_object_graph(source_query, source_endpoint)
    obj_context = get_object_context(obj_graph)
    
    for obj in obj_graph.subjects(unique=True):
        add_related_objects(obj, obj_graph, obj_context)
    
    return obj_graph
