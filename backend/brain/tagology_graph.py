from brain.source_graph import get_object_graph
from brain.formal_context import get_object_context, add_related_objects
from rdflib import Graph

def create_tagology_graph(source_query: str) -> Graph:
    
    ### TODO: ###
    # pass get_object_graph() a sparql query
    # thorough data validation and error handling
    # benchmarking & optimization

    obj_graph = get_object_graph(source_query)
    obj_context = get_object_context(obj_graph)
    
    for obj in obj_graph.subjects(unique=True):
        add_related_objects(obj, obj_graph, obj_context)
    
    ### DEBUG ###
    '''q = f"""
        SELECT ?o ?v
        WHERE {{
            ?o skos:related ?v
        }}"""
    results = obj_graph.query(q)
    for o, v in results:
        print(f"{o} skos:related {v}")'''
    
    return obj_graph
