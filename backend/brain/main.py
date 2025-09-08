from sparql import *
from conceptLattice import *

def main():
    all_triples = get_all_triples()
    lattice = create_concept_lattice(all_triples)

    ### TODO: send triples and lattice to front end ###

if __name__ == "__main__":
    main()
