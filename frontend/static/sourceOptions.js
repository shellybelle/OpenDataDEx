export const sourceEndpoints = {
  wikidata: "https://query.wikidata.org/sparql",
  custom: "<custom endpoint>"
};

export const sourceQueries = {

  construct:
`PREFIX odd: <https://theknowledgecommons.org/ns/odd/>
CONSTRUCT {
    ?object ?property ?value .
    ?object odd:objLabel ?objectLabel .
    ?property odd:propLabel ?propertyLabel .
    ?value odd:valLabel ?valueLabel .`
  ,

  limit:
`LIMIT 20000`
  ,

  // TODO: TEMP - DELETE
  wiki_soc:
`}
WHERE {
    ?item wdt:P919 ?x ;
            ?property ?value . 

    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY

    BIND(STRAFTER(STR(?property), STR(wdt:)) AS ?pid)
    BIND(IRI(CONCAT(STR(wd:), ?pid)) AS ?p)
 
    BIND(IRI(REPLACE(STR(?item), "^http:", "https:")) AS ?object)

    # MANUAL BINDING REQUIRED DUE TO CUSTOM LABELING
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # CUSTOM
                             ?p rdfs:label ?propertyLabel . # CUSTOM
                             ?value rdfs:label ?valueLabel .
                           }
}
`
  ,
  wiki_onet:
`}
WHERE {
    ?item wdt:P8734 ?x ;
            ?property ?value . 

    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY

    BIND(STRAFTER(STR(?property), STR(wdt:)) AS ?pid)
    BIND(IRI(CONCAT(STR(wd:), ?pid)) AS ?p)
 
    BIND(IRI(REPLACE(STR(?item), "^http:", "https:")) AS ?object)

    # MANUAL BINDING REQUIRED DUE TO CUSTOM LABELING
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # CUSTOM
                             ?p rdfs:label ?propertyLabel . # CUSTOM
                             ?value rdfs:label ?valueLabel .
                           }
}
`
  ,
  wiki_naics:
`}
WHERE {
    ?item wdt:P3224 ?x ;
            ?property ?value .

    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY

    BIND(STRAFTER(STR(?property), STR(wdt:)) AS ?pid)
    BIND(IRI(CONCAT(STR(wd:), ?pid)) AS ?p)
  
    BIND(IRI(REPLACE(STR(?item), "^http:", "https:")) AS ?object)

    # MANUAL BINDING REQUIRED DUE TO CUSTOM LABELING
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # CUSTOM
                             ?p rdfs:label ?propertyLabel . # CUSTOM
                             ?value rdfs:label ?valueLabel .
                           }
}
`
  ,

  wiki_space:
`    ?object schema:about ?item .
}
WHERE {
    ?item wdt:P4466 ?uat ; # HAS UAT ID
          ?property ?value .
    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .

    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY

    BIND(STRAFTER(STR(?property), STR(wdt:)) AS ?pid)
    BIND(IRI(CONCAT(STR(wd:), ?pid)) AS ?p)

    MINUS {?p wikibase:propertyType wikibase:ExternalId .} # IGNORE ID TRIPLES

    # MANUAL BINDING REQUIRED DUE TO CUSTOM LABELING
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # CUSTOM
                             ?p rdfs:label ?propertyLabel . # CUSTOM
                             ?value rdfs:label ?valueLabel .
                           }
}`
  ,
  wiki_dogs:
`    ?object schema:about ?item .
}
WHERE {
    ?item wdt:P31/wdt:P279* wd:Q144; # INSTANCE OF DOG
          ?property ?value .
    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .

    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY

    BIND(STRAFTER(STR(?property), STR(wdt:)) AS ?pid)
    BIND(IRI(CONCAT(STR(wd:), ?pid)) AS ?p)

    MINUS {?p wikibase:propertyType wikibase:ExternalId .} # IGNORE ID TRIPLES

    # MANUAL BINDING REQUIRED DUE TO CUSTOM LABELING
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # CUSTOM
                             ?p rdfs:label ?propertyLabel . # CUSTOM
                             ?value rdfs:label ?valueLabel .
                           }
}`
  ,
  wiki_laws:
`    ?object schema:about ?item .
}
WHERE {
    ?item wdt:P31 wd:Q19692072; # INSTANCE OF US SUPREME COURT DECISION
          ?property ?value .
    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .

    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY

    BIND(STRAFTER(STR(?property), STR(wdt:)) AS ?pid)
    BIND(IRI(CONCAT(STR(wd:), ?pid)) AS ?p)

    MINUS {?p wikibase:propertyType wikibase:ExternalId .} # IGNORE ID TRIPLES

    # MANUAL BINDING REQUIRED DUE TO CUSTOM LABELING
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # CUSTOM
                             ?p rdfs:label ?propertyLabel . # CUSTOM
                             ?value rdfs:label ?valueLabel .
                           }
}`
  ,
  wiki_mariners:
`    ?object schema:about ?item .
} 
WHERE {
    ?item wdt:P54 wd:Q466586 ; # MEMBER OF SEATTLE MARINERS
          wdt:P106 wd:Q10871364 ; # OCCUPATION BASEBALL PLAYER
          ?property ?value .  
    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .
 
    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY

    BIND(STRAFTER(STR(?property), STR(wdt:)) AS ?pid)
    BIND(IRI(CONCAT(STR(wd:), ?pid)) AS ?p)

    MINUS {?p wikibase:propertyType wikibase:ExternalId .} # IGNORE ID TRIPLES

    # MANUAL BINDING REQUIRED DUE TO CUSTOM LABELING
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # CUSTOM
                             ?p rdfs:label ?propertyLabel . # CUSTOM
                             ?value rdfs:label ?valueLabel .
                           }
}`
  ,
  wiki_public:
`    ?object schema:about ?item .
} 
WHERE {
    ?item wdt:P3893 ?pdd ; # HAS A PUBLIC DOMAIN DATE 
          ?property ?value .
    FILTER(?pdd < NOW())

    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .
 
    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY

    BIND(STRAFTER(STR(?property), STR(wdt:)) AS ?pid)
    BIND(IRI(CONCAT(STR(wd:), ?pid)) AS ?p)

    MINUS {?p wikibase:propertyType wikibase:ExternalId .} # IGNORE ID TRIPLES

    # MANUAL BINDING REQUIRED DUE TO CUSTOM LABELING
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # CUSTOM
                             ?p rdfs:label ?propertyLabel . # CUSTOM
                             ?value rdfs:label ?valueLabel .
                           }
}`
  ,

  custom: "<custom query>"
};
