var cy = cytoscape({
  container: document.getElementById('DEx'),
  layout: {name: 'concentric'},
  style: [],
  elements: [
    {data: {id: 'a'}},
    {data: {id: 'b'}},
    {data: {id: 'ab', source: 'a', target: 'b'}}]
});

async function fetchHubAndRelatedObjs() {
  const query = `# get hub and related objects
    SELECT ?hubObj ?relObj
    WHERE {
      {
        # the tagology graph's hub object
        SELECT ?hubObj (COUNT(?o) AS ?count)
        WHERE {
          ?o skos:related ?hubObj .
        }
        GROUP BY ?hubObj
        ORDER BY DESC(?count)
        LIMIT 1
      }
      ?hubObj skos:related ?relObj .
    }`;

  const result = await fetch("/tagology_graph", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });

  //return await result.json();

  const data = await result.json();
  console.log("SPARQL query results:", data);
  return data;
}

fetchHubAndRelatedObjs()
