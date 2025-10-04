export async function queryTagGraph(query) {
  const result = await fetch("/tagology_graph", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({query})
  });
  return result.json();
}
