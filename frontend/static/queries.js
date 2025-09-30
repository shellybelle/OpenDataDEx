export const sourceEndpoints = {
  "wikidata": "https://query.wikidata.org/sparql",
  "custom": "Custom Endpoint"
};

export const sourceQueries = {
  "wiki-space":
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
CONSTRUCT {
    ?wikip ?prop ?val .
    ?wikip schema:about ?item .
    ?wikip skos:prefLabel ?itemLabel .
}
WHERE {
    ?wikip schema:isPartOf <https://en.wikipedia.org/> ;
           schema:about ?item .
    ?item wdt:P4466 ?uat ;
          ?prop ?val .
    FILTER(STRSTARTS(STR(?prop), STR(wdt:))) #TRUTHY
    SERVICE wikibase:label {bd:serviceParam wikibase:language "en" .}
}
LIMIT 50000`
  ,
  "wiki-dogs":
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
CONSTRUCT {
    ?wikip ?prop ?val .
    ?wikip schema:about ?item .
    ?wikip skos:prefLabel ?itemLabel .
}
WHERE {
    ?wikip schema:isPartOf <https://en.wikipedia.org/>;
           schema:about ?item .
    ?item wdt:P31 wd:Q144; # INSTANCE OF DOG
          ?prop ?val .
    FILTER(STRSTARTS(STR(?prop), STR(wdt:))) # TRUTHY NAMESPACE
    SERVICE wikibase:label {bd:serviceParam wikibase:language "en".}
}
LIMIT 50000`
  ,
  "wiki-cats":
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
CONSTRUCT {
    ?wikip ?prop ?val .
    ?wikip schema:about ?item .
    ?wikip skos:prefLabel ?itemLabel .
}
WHERE {
    ?wikip schema:isPartOf <https://en.wikipedia.org/>;
           schema:about ?item .
    ?item wdt:P31 wd:Q146; # INSTANCE OF CAT
          ?prop ?val .
    FILTER(STRSTARTS(STR(?prop), STR(wdt:))) # TRUTHY NAMESPACE
    SERVICE wikibase:label {bd:serviceParam wikibase:language "en".}
}
LIMIT 50000`
  ,
  "custom": "Custom Query"
};

export const tagGraphQueries = {
  getHubObj: () => `
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT ?hubObj ?label
    WHERE {
      ?o skos:related ?hubObj .
      ?hubObj skos:prefLabel ?label .
    }
    GROUP BY ?hubObj ?label
    ORDER BY DESC(COUNT(?o))
    LIMIT 1
  `,
  getRelRelObjs: (focusObj) => `
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT ?relObj ?label ?relObj2 ?label2
    WHERE {
      <${focusObj}> skos:related ?relObj .
      ?relObj skos:prefLabel ?label .
      ?relObj skos:related ?relObj2 .
      ?relObj2 skos:prefLabel ?label2 .
    }
  `,
  getTags: (obj) => `
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT ?prop ?val
    WHERE {
      <${obj}> ?prop ?val
      FILTER(?prop NOT IN (skos:prefLabel, skos:related))
    }
  `
};
