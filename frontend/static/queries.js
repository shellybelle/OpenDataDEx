export const sourceEndpoints = {
  "wikidata": "https://query.wikidata.org/sparql",
  "custom": "<custom endpoint>"
};

export const sourceQueries = {
  "construct":
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
CONSTRUCT {
    ?object ?property ?value .
    ?object skos:prefLabel ?label .`
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
          ?property ?value ;
          rdfs:label ?label .
    FILTER(STRSTARTS(STR(?property), STR(wdt:))) #TRUTHY
    FILTER(lang(?label) = "en")
}`
  ,
  
  "wiki-dogs":
`    ?object schema:about ?item .
}
WHERE {
    ?object schema:isPartOf <https://en.wikipedia.org/>;
           schema:about ?item .
    ?item wdt:P31 wd:Q144; # INSTANCE OF DOG
          ?property ?value ;
          rdfs:label ?label .
    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY
    FILTER(lang(?label) = "en")
}`
  ,
  
  "wiki-cats":
`    ?object schema:about ?item .
}
WHERE {
    ?object schema:isPartOf <https://en.wikipedia.org/>;
           schema:about ?item .
    ?item wdt:P31 wd:Q146; # INSTANCE OF CAT
          ?property ?value ;
          rdfs:label ?label .
    FILTER(STRSTARTS(STR(?property), STR(wdt:))) # TRUTHY NAMESPACE
    FILTER(lang(?label) = "en")
}`
  ,
  
  "custom": "<custom query>"
};

export const tagGraphQueries = {
  getHubObj: () =>
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?hubObj ?label
WHERE {
  ?o skos:related ?hubObj .
  ?hubObj skos:prefLabel ?label .
}
GROUP BY ?hubObj ?label
ORDER BY DESC(COUNT(?o))
LIMIT 1`
  ,
  getRelRelObjs: (focusObj) =>
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX tag: <http://example.org/tagology/>
SELECT ?score ?relObj ?label ?score2 ?relObj2 ?label2
WHERE {
    <${focusObj}> skos:related ?relObj .
    ?relObj skos:prefLabel ?label .
    <${focusObj}> tag:relatedEdge ?edge .
    ?edge tag:target ?relObj .
    ?edge tag:score ?score .

    ?relObj skos:related ?relObj2 .
    ?relObj2 skos:prefLabel ?label2 .
    ?relObj tag:relatedEdge ?edge2 .
    ?edge2 tag:target ?relObj2 .
    ?edge2 tag:score ?score2 .
}`
  ,
  getTags: (obj) =>
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX tag: <http://example.org/tagology/>
SELECT ?prop ?val
WHERE {
    <${obj}> ?prop ?val
    FILTER(?prop NOT IN (skos:prefLabel, skos:related, tag:relatedEdge))
}`
  ,
  getTotalObjects: () =>
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT (COUNT(DISTINCT ?obj) AS ?totalObjs)
WHERE {
    ?obj skos:prefLabel ?label .
}`
  ,
  getTotalTags: () =>
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX tag: <http://example.org/tagology/>
SELECT (COUNT(DISTINCT CONCAT(STR(?prop), STR(?val))) as ?totalTags)
WHERE {
    ?obj skos:prefLabel ?label ;
         ?prop ?val .
    FILTER(
      !STRSTARTS(STR(?prop), STR(skos:))  &&
      !STRSTARTS(STR(?prop), STR(tag:))
    )
}`
  ,
  getMatchObj: (text) =>
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?matchObj ?label
WHERE {
  ?matchObj skos:prefLabel ?label .
  FILTER(CONTAINS(LCASE(STR(?label)), LCASE("${text}")))
}
LIMIT 1`
};
