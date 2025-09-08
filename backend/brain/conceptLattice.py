from rdflib import Graph
import concepts
import pandas

def create_concept_lattice(all_triples: Graph) -> Graph:
    g = Graph()

    c = create_formal_context(all_triples)
    l = c.lattice

    ### DEBUG ###
    print("Number of concepts:", len(c.lattice))

    return g

def create_formal_context(all_triples: Graph) -> concepts.Context:
    props = sorted(all_triples.predicates(unique=True))
    subjs = sorted(all_triples.subjects(unique=True))

    rows = []
    for subj in subjs:
        row = [(subj, prop, None) in all_triples for prop in props]
        rows.append(row)

    context_data = pandas.DataFrame(rows, index=(str(s) for s in subjs), columns=(str(p) for p in props))
    
    assert all(dtype == 'bool' for dtype in context_data.dtypes)

    ### DEBUG ###
    print(context_data.shape)

    sparse_props = context_data.columns[(context_data == True).sum(axis=0) == 1].tolist()
    dense_props = context_data.columns[(context_data == False).sum(axis=0) ==1].tolist()
    trivial_props = context_data.columns[context_data.nunique() == 1].tolist()

    context_data.drop(sparse_props, axis=1, inplace=True)
    context_data.drop(dense_props, axis=1, inplace=True)
    context_data.drop(trivial_props, axis=1, inplace=True)
  
    ### DEBUG ###
    print(context_data.shape)

    return concepts.Context(context_data.index.tolist(), context_data.columns.tolist(), context_data.values.tolist())
