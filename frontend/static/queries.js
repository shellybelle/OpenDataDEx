export const sourceEndpoints = {
  "wikidata": "https://query.wikidata.org/sparql",
  "custom": "<custom endpoint>"
};

export const sourceQueries = {
  "construct":
`PREFIX tag: <http://example.org/tagology/>
CONSTRUCT {
    ?object ?property ?value .
    ?object tag:objLabel ?objectLabel .
    ?property tag:propLabel ?propertyLabel .
    ?value tag:valLabel ?valueLabel .`
  ,

  "limit":
`LIMIT 10000`
  ,

  "wiki-space":
`    ?object schema:about ?item .
}
WHERE {
    ?object schema:isPartOf <https://en.wikipedia.org/> ;
            schema:about ?item .
    ?item wdt:P4466 ?uat ; # HAS UAT ID
          ?property ?value .
    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".
                             ?item rdfs:label ?objectLabel . # MANUAL MODE DUE TO THIS BINDING
                             ?property rdfs:label ?propertyLabel .
                             ?value rdfs:label ?valueLabel .
                           }
}`
  ,
  
  "wiki-dogs":
`    ?object schema:about ?item .
}
WHERE {
    ?object schema:isPartOf <https://en.wikipedia.org/>;
            schema:about ?item .
    ?item wdt:P31 wd:Q144; # INSTANCE OF DOG
          ?property ?value .
    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".
                             ?item rdfs:label ?objectLabel . # MANUAL MODE DUE TO THIS BINDING
                             ?property rdfs:label ?propertyLabel .
                             ?value rdfs:label ?valueLabel .
                           }
}`
  ,
  
  "wiki-cats":
`    ?object schema:about ?item .
}
WHERE {
    ?object schema:isPartOf <https://en.wikipedia.org/>;
            schema:about ?item .
    ?item wdt:P31 wd:Q146; # INSTANCE OF CAT
          ?property ?value .
    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY PROPERTIES ONLY
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".
                             ?item rdfs:label ?objectLabel . # MANUAL MODE DUE TO THIS BINDING
                             ?property rdfs:label ?propertyLabel .
                             ?value rdfs:label ?valueLabel .
                           }
}`
  ,
  
  "custom": "<custom query>"
};

export const tagGraphQueries = {
  getHubObj: () =>
`PREFIX tag: <http://example.org/tagology/>
SELECT ?hubObj ?label
WHERE {
  ?o tag:related ?hubObj .
  ?hubObj tag:objLabel ?label .
}
GROUP BY ?hubObj ?label
ORDER BY DESC(COUNT(?o))
LIMIT 1`
  ,
  getRelRelObjs: (focusObj) =>
`PREFIX tag: <http://example.org/tagology/>
SELECT ?score ?relObj ?label ?score2 ?relObj2 ?label2
WHERE {
    <${focusObj}> tag:related ?relObj .
    ?relObj tag:objLabel ?label .
    <${focusObj}> tag:relatedEdge ?edge .
    ?edge tag:target ?relObj .
    ?edge tag:score ?score .

    ?relObj tag:related ?relObj2 .
    ?relObj2 tag:objLabel ?label2 .
    ?relObj tag:relatedEdge ?edge2 .
    ?edge2 tag:target ?relObj2 .
    ?edge2 tag:score ?score2 .
}`
  ,
  getTags: (obj) =>
`PREFIX tag: <http://example.org/tagology/>
SELECT ?prop ?val
WHERE {
    <${obj}> ?prop ?val .
    ?prop tag:propLabel ?propLabel .
    OPTIONAL {?val tag:valLabel ?valLabel .}
}`
  ,
  getTotalObjects: () =>
`PREFIX tag: <http://example.org/tagology/>
SELECT (COUNT(DISTINCT ?obj) AS ?totalObjs)
WHERE {
    ?obj tag:objLabel ?label .
}`
  ,
  getTotalTags: () =>
`PREFIX tag: <http://example.org/tagology/>
SELECT (COUNT(DISTINCT CONCAT(STR(?prop), STR(?val))) as ?totalTags)
WHERE {
    ?prop tag:propLabel ?pl .
    ?o ?prop ?val .
}`
  ,
  getMatchObj: (text) =>
`PREFIX tag: <http://example.org/tagology/>
SELECT ?matchObj ?label
WHERE {
    ?matchObj tag:objLabel ?label .

    BIND(LCASE(STR(?label)) AS ?lowLabel)
    BIND(LCASE("${text}") AS ?lowText)
    BIND(
        IF(?lowLabel = ?lowText, 1,
        IF(STRSTARTS(?lowLabel, ?lowText), 2,
        IF(CONTAINS(?lowLabel, ?lowText), 3,
        4))
    ) AS ?rank)
    
    FILTER(?rank < 4)
}
ORDER BY ?rank
LIMIT 1`
};
