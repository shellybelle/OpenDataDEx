export const queries = {
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
