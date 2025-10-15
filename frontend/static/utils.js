export async function queryTagGraph(query) {
  try {
    const result = await fetch("/tagology_graph", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({query})
    });
  } catch (e) {
    console.error(`Failed to query tagology graph. sparql query:\n${query}\n${e}`)
    return null;
  }
  return result.json();
}
