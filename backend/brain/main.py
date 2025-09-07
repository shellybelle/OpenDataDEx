from sparql import *
from conceptLattice import *

def main():
    triples = getTriples()
    
    ### TEST ###
    print(triples.serialize())

    lattice = createConceptLattice(triples)

    ### TODO: send triples and lattice to front end ###

if __name__ == "__main__":
    main()
