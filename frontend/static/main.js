import {queries} from './queries.js';
import {cyStyle, cyLayout} from './cyOptions.js';
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

async function newDExView(focusNodeId, focusNodeLabel) {
  const relRelObjsData = await fetchRelRelObjs(focusNodeId);
  const nodes = [{data: {id: focusNodeId, label: focusNodeLabel, level: 5}}];
  const edges = [];

  const relObjs = new Map();
  const relRelObjs = new Map();
  
  relRelObjsData.forEach(ro => {
    relObjs.set(ro.relObj, ro.label);
    relRelObjs.set(ro.relObj2, ro.label2);
    edges.push({data: {id: `${focusNodeId}-${ro.relObj}`, source: focusNodeId, target: ro.relObj}});
    edges.push({data: {id: `${ro.relObj}-${ro.relObj2}`, source: ro.relObj, target: ro.relObj2}});
  });

  relObjs.forEach((label, id) => {
    nodes.push({data: {id, label, level: 3}});
  });

  relRelObjs.forEach((label, id) => {
    if(!nodes.find(n => n.data.id === id)) {
      nodes.push({data: {id, label, level: 1}});
    };
  });

  nodes.push({data: {id: 'ghostLevel2', label: '', level: 2}});
  nodes.push({data: {id: 'ghostLevel4', label: '', level: 4}});
  
  if(!cy) {
    cy = cytoscape({
      container: document.getElementById('cyto'),
      style: cyStyle,
      userZoomingEnabled: false,
      userPanningEnabled: false,
      elements: [...nodes, ...edges]
    });

    cy.on('tap', 'node', function (evt) {
      let clickedNode = evt.target;
      document.getElementById('obj-display').src = clickedNode.data('id');
      if (clickedNode.data('level') !== 5) {
        newDExView(clickedNode.data('id'), clickedNode.data('label'));
      }
    });

    cy.on('mouseover', 'node', (e) => {
      const hoveredNode = e.target;
      const currentFontSize = parseFloat(hoveredNode.style('font-size'));
      hoveredNode.style({
        'font-size': currentFontSize * 1.5,
        'border-style': 'solid',
        'border-width': 2,
        'border-color': 'lightcyan'
      });
    });

    cy.on('mouseover', 'edge', (e) => {
      e.target.style({
        'label': "click to see\nrelated tags",
        'line-color': 'lightcyan',
        'target-arrow-color': 'lightcyan',
        'arrow-scale': 1,
        'width': 2,
        'color': 'lightcyan',
        'font-size': 10,
        'text-rotation': 'autorotate',
        'text-wrap': 'wrap'
      });
    });

    cy.on('mouseout', 'node', (e) => {
      e.target.removeStyle();
    });

    cy.on('mouseout', 'edge', (e) => {
      e.target.removeStyle();
    });
        
    cy.layout(cyLayout).run();
  } else {
    let clickedNode = cy.getElementById(focusNodeId);
    cy.elements().not(clickedNode).remove();
    clickedNode.data({level: 5});

    clickedNode.animate({
      position: {x: cy.width()/2, y: cy.height()/2},
      duration: 500,
      complete: () => {
        const newNodes = cy.add([...nodes.filter(n => n.data.id !== focusNodeId), ...edges]);
        newNodes.style('opacity', 0);
        newNodes.animate({
          style: {opacity: 1},
          duration: 500
        });
        
        cy.layout(cyLayout).run();
      } 
    });
  }
}

async function init() {
  const hubObjData = await fetchHubObj();
  newDExView(hubObjData[0].hubObj, hubObjData[0].label);
}

init();
