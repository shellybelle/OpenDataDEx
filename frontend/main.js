var cy = cytoscape({
  container: document.getElementById('DEx'),
  layout: {name: 'concentric'},
  style: [],
  elements: [
    {data: {id: 'a'}},
    {data: {id: 'b'}},
    {data: {id: 'ab', source: 'a', target: 'b'}}]
});
