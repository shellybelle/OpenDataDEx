let cy;
let hubObj = null;
const OBJECT_TYPE = "wikipedia_url";

async function fetchHubObj() {
  const query = `
    SELECT ?hubObj ?label
    WHERE {
      ?o skos:related ?hubObj .
      ?hubObj skos:prefLabel ?label .
    }
    GROUP BY ?hubObj ?label
    ORDER BY DESC(COUNT(?o))
    LIMIT 1
  `;
  const result = await fetch("/tagology_graph", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({query})}
  );
  return await result.json();
}

async function fetchRelObjs(focusObj) {
  const query = `
    SELECT ?relObj ?label
    WHERE {
      <${focusObj}> skos:related ?relObj .
      ?relObj skos:prefLabel ?label .
    }
  `;
  const result = await fetch("/tagology_graph", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({query})
  });
  return await result.json();
}

async function init() {
  const hubObjData = await fetchHubObj();
  hubObj = {id: hubObjData[0].hubObj, label: hubObjData[0].label};

  // MAKE NEW CYTOSCAPE GRAPH
  const focusObj = hubObj
  const relObjsData = await fetchRelObjs(focusObj.id);
  const relObjs = relObjsData.map(row => ({id: row.relObj, label: row.label}));

  const nodes = [{data: {id: focusObj.id, label: focusObj.label}}];
  const edges = [];
  relObjs.forEach(ro => {
    nodes.push({data: {id: ro.id, label: ro.label}});
    edges.push({data: {id: focusObj.id + "-" + ro.id, source: focusObj.id, target: ro.id}});
  });

  cy = cytoscape({
    container: document.getElementById('cyto'),
    style: [{
      selector: 'node',
      style: {'label': 'data(label)', 'font-size': 8, 'text-valign': 'center', 'text-halign': 'center'}
    }],
    elements: nodes.concat(edges)
  });

  cy.on('tap', 'node', function (evt) {
    const clickedNode = evt.target;
    document.getElementById('obj-frame').src = clickedNode.data('id');
  });

  window.addEventListener('resize', () => {
    cy.resize();
    cy.fit();
  });

  cy.layout({name: 'concentric'}).run();
}

init();
