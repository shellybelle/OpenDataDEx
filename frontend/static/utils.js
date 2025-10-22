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
SELECT ?prop ?propLabel ?val ?valLabel
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
