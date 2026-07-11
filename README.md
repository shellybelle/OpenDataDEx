# OpenDataDEx

> **Navigate Linked Data through semantic similarity instead of search.**

**Website:** https://www.opendatadex.com

OpenDataDEx is a semantic navigation platform for RDF and Linked Data.

A SPARQL `CONSTRUCT` query defines a navigable perspective over an RDF dataset, which OpenDataDEx transforms into an interactive semantic graph. Instead of searching for information, users navigate between related concepts through shared semantic descriptions.

Selecting any object recenters the graph around it, allowing knowledge to be explored one relationship at a time. The same application can generate entirely different knowledge spaces—from astronomy and law to biology and public domain works—simply by changing the underlying SPARQL query.

---

## Design

OpenDataDEx treats RDF as a medium for navigation rather than simply a format for storing data.

Objects are described by semantic tags (property–value pairs). Formal Concept Analysis is used to discover candidate semantic neighborhoods, which are then ranked using a custom semantic similarity heuristic. The resulting graph can be explored interactively without requiring manually curated relationships.

```text
SPARQL Endpoint
        │
        ▼
 RDF CONSTRUCT Query
        │
        ▼
      RDF Graph
        │
        ▼
Formal Concept Analysis
        │
        ▼
Semantic Similarity Heuristic
        │
        ▼
Interactive Knowledge Explorer
```

Every node is both a destination and a new starting point, allowing users to continuously explore a knowledge space from different perspectives.

---

## Features

- Generate semantic navigation graphs directly from SPARQL endpoints
- Discover related objects using Formal Concept Analysis and a custom semantic similarity heuristic
- Navigate RDF datasets through semantic similarity rather than keyword search
- Compare shared, similar, and unique semantic tags between related objects
- Browse linked resources directly within the application
- Generate new navigable perspectives using custom SPARQL `CONSTRUCT` queries
- Reuse the same application across multiple knowledge domains

---

## Technologies

- Python
- Flask
- RDFLib
- SPARQL
- Formal Concept Analysis
- Cytoscape.js
- HTML / CSS / JavaScript

---

## About

OpenDataDEx is a project of **The Knowledge Commons**, an initiative focused on helping communities publish, connect, and navigate knowledge using open semantic web technologies.

The project explores an alternative interaction model for Linked Data—one where semantic relationships become the primary means of navigation instead of search.
