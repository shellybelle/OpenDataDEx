from rdflib import Graph
from concepts import Context, lattices
from pandas import DataFrame

def get_obj_context(obj_graph: Graph) -> Context:
    """
    Returns a concepts Formal Concept from which a concept lattice can be constructed
    """

    props = sorted(obj_graph.predicates(unique=True))
    objs = sorted(obj_graph.subjects(unique=True))

    rows = []
    for obj in objs:
        row = [(obj, prop, None) in obj_graph for prop in props]
        rows.append(row)

    context_data = DataFrame(rows, index=(str(s) for s in objs), columns=(str(p) for p in props))
    
    # Ensure all DataFrame values are True or False
    if not (context_data.dtypes == bool).all():
        raise ValueError("Non-boolean data detected")

    # Drop sparse, dense, and trivial properties
    sparse_props = context_data.columns[(context_data == True).sum(axis=0) == 1].tolist()
    dense_props = context_data.columns[(context_data == False).sum(axis=0) ==1].tolist()
    trivial_props = context_data.columns[context_data.nunique() == 1].tolist()
    context_data.drop(sparse_props, axis=1, inplace=True)
    context_data.drop(dense_props, axis=1, inplace=True)
    context_data.drop(trivial_props, axis=1, inplace=True)
  
    ### DEBUG ###
    print("DataFrame shape:", context_data.shape)

    return Context(context_data.index.tolist(), context_data.columns.tolist(), context_data.values.tolist())

def add_concept_relationships(obj_graph: Graph, obj_context: Context) -> Graph:
    """
    adds concepts relationships to the object graph
    """
    
    obj_lattice = obj_context.lattice
    
    # index the concepts
    concept_index_map = {
        hash(concept.intent): i for i, concept in enumerate(obj_lattice)
    }

    for obj in obj_graph.subjects(unique=True):
        e, intent = obj_context[str(obj),]
        obj_concept_index = concept_index_map[hash(intent)]
        print(obj,':', obj_concept_index)

        ### TODO: create tagology namespace and add concept relationships

    return obj_graph

