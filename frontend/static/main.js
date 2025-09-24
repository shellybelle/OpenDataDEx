import {queries} from './queries.js';
let cy;

async function fetchHubObj() {
  const result = await fetch("/tagology_graph", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({query: queries.getHubObj()})
  });
  return await result.json();
}

async function fetchRelRelObjs(focusObj) {
  const result = await fetch("/tagology_graph", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({query: queries.getRelRelObjs(focusObj)})
  });
  return await result.json();
}

async function init() {
  const hubObjData = await fetchHubObj();
  const focusNode = {id: hubObjData[0].hubObj, label: hubObjData[0].label, level: 3};
  const relRelObjsData = await fetchRelRelObjs(focusNode.id);

  const nodes = [{data: focusNode}];
  const edges = [];

  const relObjs = new Map();
  const relRelObjs = new Map();
  
  relRelObjsData.forEach(ro => {
    relObjs.set(ro.relObj, ro.label);
    relRelObjs.set(ro.relObj2, ro.label2);
    edges.push({data: {id: `${focusNode.id}-${ro.relObj}`, source: focusNode.id, target: ro.relObj}});
    edges.push({data: {id: `${ro.relObj}-${ro.relObj2}`, source: ro.relObj, target: ro.relObj2}});
  });

  relObjs.forEach((label, id) => {
    nodes.push({data: {id, label, level: 2}});
  });

  relRelObjs.forEach((label, id) => {
    if(!nodes.find(n => n.data.id === id)) {
      nodes.push({data: {id, label, level: 1}});
    };
  });

  cy = cytoscape({
    container: document.getElementById('cyto'),
    style: [
      {
        selector: 'node',
        style: {'label': 'data(label)', 'font-size': 8, 'text-valign': 'center', 'text-halign': 'center'}
      }, {
        selector: 'edge',
        style: {'target-arrow-shape': 'vee', 'curve-style': 'bezier'}
      }
    ],
    elements: [...nodes, ...edges]
  });

  cy.on('tap', 'node', function (evt) {
    const clickedNode = evt.target;
    document.getElementById('obj-frame').src = clickedNode.data('id');
  });

  cy.layout({
    name: 'concentric',
    concentric: n => n.data('level'),
    levelWidth: () => 1
  }).run();
}

init();
