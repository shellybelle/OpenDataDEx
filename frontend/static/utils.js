export async function queryTagGraph(query) {
  let result;
  
  try {
    result = await fetch("/tagology_graph", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({query})
    });
  } catch(e) {
    console.error(`Failed to query tagology graph from webserver. sparql query:\n${query}\n${e}`)
    return null;
  }
  
  if(!result.ok) {
    const message = await result.json();
    console.error(`Failed to query tagology graph from webserver. ${result.status}:\n${message}`);
    return null;
  }

  return result.json();
}

export const tagGraphQueries = {
  getHubObj: () =>
`PREFIX odd: <https://theknowledgecommons.org/ns/odd/>
SELECT ?hubObj ?label
WHERE {
  ?o odd:related ?hubObj .
  ?hubObj odd:objLabel ?label .
}
GROUP BY ?hubObj ?label
ORDER BY DESC(COUNT(?o))
LIMIT 1`
  ,
  getRelRelObjs: (focusObj) =>
`PREFIX odd: <https://theknowledgecommons.org/ns/odd/>
SELECT ?score ?relObj ?label ?score2 ?relObj2 ?label2
WHERE {
    <${focusObj}> odd:related ?relObj .
    ?relObj odd:objLabel ?label .
    <${focusObj}> odd:relatedEdge ?edge .
    ?edge odd:target ?relObj .
    ?edge odd:score ?score .

    ?relObj odd:related ?relObj2 .
    ?relObj2 odd:objLabel ?label2 .
    ?relObj odd:relatedEdge ?edge2 .
    ?edge2 odd:target ?relObj2 .
    ?edge2 odd:score ?score2 .
}`
  ,
  getTags: (obj) =>
`PREFIX odd: <https://theknowledgecommons.org/ns/odd/>
SELECT ?prop ?propLabel ?val ?valLabel
WHERE {
    <${obj}> ?prop ?val .
    ?prop odd:propLabel ?propLabel .
    OPTIONAL {?val odd:valLabel ?valLabel .}
}`
  ,
  getTotalObjects: () =>
`PREFIX odd: <https://theknowledgecommons.org/ns/odd/>
SELECT (COUNT(DISTINCT ?obj) AS ?totalObjs)
WHERE {
    ?obj odd:objLabel ?label .
}`
  ,
  getTotalTags: () =>
`PREFIX odd: <https://theknowledgecommons.org/ns/odd/>
SELECT (COUNT(DISTINCT CONCAT(STR(?prop), STR(?val))) as ?totalTags)
WHERE {
    ?prop odd:propLabel ?pl .
    ?o ?prop ?val .
}`
  ,
  getMatchObj: (text) =>
`PREFIX odd: <https://theknowledgecommons.org/ns/odd/>
SELECT ?matchObj ?label
WHERE {
    ?matchObj odd:objLabel ?label .

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
