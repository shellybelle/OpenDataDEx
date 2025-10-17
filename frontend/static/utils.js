export async function queryTagGraph(query) {
  let result;
  
  try {
    result = await fetch("/tagology_graph", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({query})
    });

    if (!result.ok) {
      const message = await result.json();
      console.error(`Failed to query tagology graph from webserver. ${result.status}:\n${message}`);
      return null;
    }
  } catch (e) {
    console.error(`Failed to query tagology graph from webserver. sparql query:\n${query}\n${e}`)
    return null;
  }

  return result.json();
}
