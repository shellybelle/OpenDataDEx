from sparql import get_obj_graph
from conceptLattice import get_obj_context, add_concept_relationships

def main():
    obj_graph = get_obj_graph()
    obj_context = get_obj_context(obj_graph)
    obj_graph = add_concept_relationships(obj_graph, obj_context)

if __name__ == "__main__":
    main()
