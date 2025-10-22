export const sourceEndpoints = {
  wikidata: "https://query.wikidata.org/sparql",
  custom: "<custom endpoint>"
};

export const sourceQueries = {
  construct:
`PREFIX tag: <http://example.org/tagology/>
CONSTRUCT {
    ?object ?property ?value .
    ?object tag:objLabel ?objectLabel .
    ?property tag:propLabel ?propertyLabel .
    ?value tag:valLabel ?valueLabel .`
  ,

  limit:
`LIMIT 50000`
  ,

  wiki_space:
`    ?object schema:about ?item .
}
WHERE {
    ?item wdt:P4466 ?uat ; # HAS UAT ID
          ?property ?value .
    ?p wikibase:directClaim ?property . # TRUTHY PROPERTIES ONLY
    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # MANUAL MODE DUE TO THIS BINDING
                             ?p rdfs:label ?propertyLabel . # AND THIS BINDING
                             ?value rdfs:label ?valueLabel .
                           }
}`
  ,
  
  wiki_dogs:
`    ?object schema:about ?item .
}
WHERE {
    ?item wdt:P31 wd:Q144; # INSTANCE OF DOG
          ?property ?value .
    ?p wikibase:directClaim ?property . # TRUTHY PROPERTIES ONLY
    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # MANUAL MODE DUE TO THIS BINDING
                             ?p rdfs:label ?propertyLabel . # AND THIS BINDING
                             ?value rdfs:label ?valueLabel .
                           }
}`
  ,
  
  wiki_cats:
`    ?object schema:about ?item .
}
WHERE {
    ?item wdt:P31 wd:Q146; # INSTANCE OF CAT
          ?property ?value .
    ?p wikibase:directClaim ?property .
    ?object schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
                             ?item rdfs:label ?objectLabel . # MANUAL MODE DUE TO THIS BINDING
                             ?p rdfs:label ?propertyLabel . # AND THIS BINDING
                             ?value rdfs:label ?valueLabel .
                           }
}`
  ,
  
  custom: "<custom query>"
};
