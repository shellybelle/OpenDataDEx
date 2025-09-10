from sparql import get_object_graph
from conceptLattice import get_object_context, add_related_objects

def main():
    
    ### TODO: pass get_object_graph() a sparql query
    obj_graph = get_object_graph()

    obj_context = get_object_context(obj_graph)
    
    add_related_objects(obj_graph, obj_context)

if __name__ == "__main__":
    main()
