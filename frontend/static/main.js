import {sourceEndpoints, sourceQueries, tagGraphQueries} from './queries.js';
import {cyStyle, cyLayout} from './cyOptions.js';

let cy;

async function queryTagGraph(query) {
  const result = await fetch("/tagology_graph", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({query})
  });
  return result.json();
}

async function displayTags(clickedEdge) {
  const sourceTagsData = await queryTagGraph(tagGraphQueries.getTags(clickedEdge.data('source')));
  const targetTagsData = await queryTagGraph(tagGraphQueries.getTags(clickedEdge.data('target')));
  
  const sourceTagsMap = new Map(sourceTagsData.map(t => [t.prop, t.val]));
  const targetTagsMap = new Map(targetTagsData.map(t => [t.prop, t.val]));

  const matches = [];
  const diffs = [];
  const sourceOnly = [];
  const targetOnly = [];

  sourceTagsMap.forEach((sVal, sProp) => {
    if (targetTagsMap.has(sProp)) {
      const tVal = targetTagsMap.get(sProp);
      if (tVal === sVal) {
        matches.push({prop: sProp, val: sVal});
      } else {
        diffs.push({prop: sProp, srcVal: sVal, tgtVal: tVal});
      }
    } else {
      sourceOnly.push({prop: sProp, val: sVal});
    }
  });

  targetTagsMap.forEach((tVal, tProp) => {
    if (!sourceTagsMap.has(tProp)) {
      targetOnly.push({prop: tProp, val: tVal});
    }
  });

  diffs.sort((a, b) => a.prop.localeCompare(b.prop));

  const tagsView = document.getElementById('obj-display');
  tagsView.src = "/tags";
  tagsView.onload = () => {
    const tagsHtml = tagsView.contentWindow.document;

    const sourceLabel = clickedEdge.source().data('label');
    const targetLabel = clickedEdge.target().data('label');

    tagsHtml.getElementById('shared-title').textContent = `tags shared by ${sourceLabel} and ${targetLabel}`;
    tagsHtml.getElementById('similar-src-title').textContent = sourceLabel;
    tagsHtml.getElementById('similar-tgt-title').textContent = targetLabel;
    tagsHtml.getElementById('unique-src-title').textContent = sourceLabel;
    tagsHtml.getElementById('unique-tgt-title').textContent = targetLabel;

    const sharedDiv = tagsHtml.getElementById('shared');
    matches.forEach(({prop, val}) => {
      const p = tagsHtml.createElement('p');
      p.textContent = `[${prop}: ${val}]`;
      sharedDiv.appendChild(p);
    });

    const similarSrcDiv = tagsHtml.getElementById('similar-src');
    const similarTgtDiv = tagsHtml.getElementById('similar-tgt');
    diffs.forEach(({prop, srcVal, tgtVal}) => {
      const pSrc = tagsHtml.createElement('p');
      const pTgt = tagsHtml.createElement('p');
      pSrc.textContent = `[${prop}: ${srcVal}]`;
      pTgt.textContent = `[${prop}: ${tgtVal}]`;
      similarSrcDiv.appendChild(pSrc);
      similarTgtDiv.appendChild(pTgt);
    });

    const uniqueSrcDiv = tagsHtml.getElementById('unique-src');
    sourceOnly.forEach(({prop, val}) => {
      const p = tagsHtml.createElement('p');
      p.textContent = `[${prop}: ${val}]`;
      uniqueSrcDiv.appendChild(p);
    });

    const uniqueTgtDiv = tagsHtml.getElementById('unique-tgt');
    targetOnly.forEach(({prop, val}) => {
      const p = tagsHtml.createElement('p');
      p.textContent = `[${prop}: ${val}]`;
      uniqueTgtDiv.appendChild(p);
    });
  };
}

async function newDExView(focusNodeId, focusNodeLabel) {
  const relRelObjsData = await queryTagGraph(tagGraphQueries.getRelRelObjs(focusNodeId));
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
      const frame = document.getElementById('obj-display');
      frame.onload = null;
      frame.src = clickedNode.data('id');
      if (clickedNode.data('level') !== 5) {
        newDExView(clickedNode.data('id'), clickedNode.data('label'));
      }
    });

    cy.on('tap', 'edge', async function (evt) {
      displayTags(evt.target);
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
        'label': "click to\nsee tags",
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

    clickedNode.animate({
      position: {x: cy.width()/2, y: cy.height()/2},
      duration: 500,
      complete: () => {
        clickedNode.data({level: 5});
        const newElements = cy.add([...nodes.filter(n => n.data.id !== focusNodeId), ...edges]);
        newElements.style('opacity', 0);
        newElements.animate({
          style: {opacity: 1},
          duration: 500
        });
        
        cy.layout(cyLayout).run();
      } 
    });
  }
}

async function generateNewTagGraph() {
  const endpointSelect = document.getElementById('endpoint-select');
  const endpointEditor = document.getElementById('endpoint-editor');
  const querySelect = document.getElementById('query-select');
  const queryEditor = document.getElementById('query-editor');

  let endpoint;
  if (endpointSelect.value === "custom") {
    endpoint = endpointEditor.value.trim();
    localStorage.setItem("customEndpoint", endpoint);
  } else if (endpointSelect.value === "wikidata") {
    endpoint = sourceEndpoints[endpointSelect.value];
  }

  let query;
  if (querySelect.value === "custom") {
    query = queryEditor.value.trim();
    localStorage.setItem("customQuery", query);
  } else {
    query = sourceQueries[querySelect.value];
  }

  const genButton = document.getElementById('generate-btn');
  genButton.disabled = true;
  genButton.textContent = "Generating..."

  await fetch("/new_tag_graph", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({endpoint, query})
  });

  if (cy) {
    cy.destroy();
    cy = null;
  }

  const hubObjData = await queryTagGraph(tagGraphQueries.getHubObj());
  newDExView(hubObjData[0].hubObj, hubObjData[0].label);

  const welcomeView = document.getElementById('obj-display');
  welcomeView.src = "/welcome";

  genButton.disabled = true;
  genButton.textContent = "Generate new DEx";

  localStorage.setItem("currentEndpoint", endpointSelect.value);
  localStorage.setItem("currentQuery", querySelect.value);
}

function editorUnlocked() {
  const key = prompt(`Enter editor key:`);
  return key === "ariadne";
}

async function init() {
  const hubObjData = await queryTagGraph(tagGraphQueries.getHubObj());
  newDExView(hubObjData[0].hubObj, hubObjData[0].label);

  const genButton = document.getElementById('generate-btn');
  genButton.addEventListener('click', generateNewTagGraph);

  if (!localStorage.getItem("currentEndpoint")) {
    localStorage.setItem("currentEndpoint", "wikidata");
  }
  if (!localStorage.getItem("currentQuery")) {
    localStorage.setItem("currentQuery", "wiki-space");
  }

  const endpointSelect = document.getElementById('endpoint-select');
  const endpointEditor = document.getElementById('endpoint-editor');
  const querySelect = document.getElementById('query-select');
  const queryEditor = document.getElementById('query-editor');
  
  endpointSelect.value = localStorage.getItem("currentEndpoint");
  if (endpointSelect.value === "custom") {
    endpointEditor.value = localStorage.getItem("customEndpoint");
    endpointEditor.removeAttribute("readonly");
  } else {
    endpointEditor.value = sourceEndpoints[endpointSelect.value];
  }
  querySelect.value = localStorage.getItem("currentQuery");
  if (querySelect.value === "custom") {
    queryEditor.value = localStorage.getItem("customQuery");
    queryEditor.removeAttribute("readonly");
  } else {
    queryEditor.value = sourceQueries[querySelect.value];
  }

  endpointSelect.addEventListener('change', () => {
    if (endpointSelect.value === "custom") {
      if (editorUnlocked()) {
        endpointEditor.removeAttribute("readonly");
      } else {
        alert("Invalid key");
        endpointSelect.value = localStorage.getItem("currentEndpoint");
      }
    } else {
      endpointEditor.setAttribute("readonly", true);
      endpointEditor.value = sourceEndpoints[endpointSelect.value];
    }
    genButton.disabled = false;
  });

  querySelect.addEventListener('change', () => {
    if (querySelect.value === "custom") {
      if (editorUnlocked()) {
        queryEditor.removeAttribute("readonly");
      } else {
        alert("Invalid key");
        querySelect.value = localStorage.getItem("currentQuery");
      }
    } else {
      queryEditor.setAttribute("readonly", true);
      queryEditor.value = sourceQueries[querySelect.value];
    }
    genButton.disabled = false;
  });
}

init();
