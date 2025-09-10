from rdflib import Graph, term
from concepts import Context, lattices
from pandas import DataFrame

def get_object_context(obj_graph: Graph) -> Context:
    
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

    # Do we want to drop sparse, dense, and trivial properties??
    #sparse_props = context_data.columns[(context_data == True).sum(axis=0) == 1].tolist()
    #dense_props = context_data.columns[(context_data == False).sum(axis=0) ==1].tolist()
    #trivial_props = context_data.columns[context_data.nunique() == 1].tolist()
    #context_data.drop(sparse_props, axis=1, inplace=True)
    #context_data.drop(dense_props, axis=1, inplace=True)
    #context_data.drop(trivial_props, axis=1, inplace=True)
  
    return Context(context_data.index.tolist(), context_data.columns.tolist(), context_data.values.tolist())

def add_related_objects(obj_graph: Graph, obj_context: Context) -> Graph:
    obj_lattice = obj_context.lattice
    
    for obj in obj_graph.subjects(unique=True):

        obj_extent, obj_intent = obj_context[str(obj),]
        obj_concept = obj_lattice[obj_intent]
        related_objs = set(obj_concept.extent)
        
        for n in obj_concept.upper_neighbors:
            related_objs.update(n.extent)
        
        related_objs.discard(str(obj))
        
        ### DEBUG ###
        print(obj)
        for ro in related_objs:
            print("   -",ro)

        if(len(related_objs) > 12):
            _prune_objects(related_objs)

        _add_triples(obj, related_objs, obj_graph)

    return obj_graph

def _prune_objects(related_objs: set):
    return

def _add_triples(obj: term.URIRef, related_objs: set, obj_graph: Graph):
    return
