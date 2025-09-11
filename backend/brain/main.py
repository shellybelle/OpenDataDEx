from brain.tagology_graph import get_tagology_graph

def main():
    tagology_graph = get_tagology_graph()

    ### DEBUG ###
    print(f"tagology graph created that contained {len(tagology_graph)} triples")

if __name__ == "__main__":
    main()
