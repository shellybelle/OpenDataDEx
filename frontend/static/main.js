import {sourceEndpoints, sourceQueries, tagGraphQueries} from './queries.js';
import {cyStyle, cyLayout} from './cyOptions.js';

const DEFAULT_RELATED_COUNT = 6;
let cy;
let currentRelMap;
let currentFocusNode;

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
  
  const matches = [];
  const diffs = [];
  const sourceOnly = [];
  const targetOnly = [];

  sourceTagsData.forEach(({prop: sProp, val: sVal}) => {
    const propertyTargetTags = targetTagsData.filter(t => t.prop === sProp);
    if (propertyTargetTags.length > 0) {
      propertyTargetTags.forEach(t => {
        if (t.val === sVal) {
          matches.push({prop: sProp, val: sVal});
        } else {
          diffs.push({prop: sProp, srcVal: sVal, tgtVal: t.val});
        }
      });
    } else {
      sourceOnly.push({prop: sProp, val: sVal});
    }
  });

  targetTagsData.forEach(({prop: tProp, val: tVal}) => {
    if (!sourceTagsData.some(s => s.prop === tProp && s.val === tVal)) {
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

function initCy(elements) {
  cy = cytoscape({
    container: document.getElementById('cyto'),
    style: cyStyle,
    userZoomingEnabled: false,
    userPanningEnabled: false,
    elements 
  });

  cy.on('tap', 'node', function (evt) {
    let clickedNode = evt.target;
    const frame = document.getElementById('obj-display');
    frame.onload = null;
    frame.src = clickedNode.data('id');
    if (clickedNode.data('level') !== 5) {
      const relatedCount = parseInt(document.getElementById('related-count').textContent)
      newDExView(relatedCount, clickedNode.data('id'), clickedNode.data('label'));
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
}

async function newDExView(relatedCount, focusNodeId = null, focusNodeLabel = null) {
  
  if (focusNodeId && focusNodeLabel) {
    // UPDATE CURRENT VIEW GLOBAL VARIABLES

    const relRelObjsData = await queryTagGraph(tagGraphQueries.getRelRelObjs(focusNodeId));
    currentFocusNode = [focusNodeId, focusNodeLabel]
  
    currentRelMap = new Map();
    for (const row of relRelObjsData) {
      let relObj = currentRelMap.get(row.relObj);
      if (!relObj) {
        relObj = {
          id: row.relObj,
          label: row.label,
          score: parseFloat(row.score),
          relRelObjs: []
        };
        currentRelMap.set(row.relObj, relObj);
      }
      relObj.relRelObjs.push({
        id: row.relObj2,
        label: row.label2,
        score: parseFloat(row.score2)
      });
    }
  }

  // ADD NODES AND EDGES DEPENDING ON relatedCount

  const nodes = [{data: {id: currentFocusNode[0], label: currentFocusNode[1], level: 5}}];
  const edges = [];

  const subsetRelObjs = [...currentRelMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, relatedCount)
    .map(relObj => ({
      id: relObj.id,
      label: relObj.label,
      score: relObj.score,
      relRelObjs: [...relObj.relRelObjs]
        .sort((a, b) => b.score - a.score)
        .slice(0, relatedCount)
    }));

  for (const relObj of subsetRelObjs) {
    nodes.push({data: {id: relObj.id, label: relObj.label, level: 3}});
    edges.push({
      data: {
        id: `${currentFocusNode[0]}-${relObj.id}`,
        source: currentFocusNode[0],
        target: relObj.id,
        weight: relObj.score
      }
    });
  }

  for (const relObj of subsetRelObjs) {
    for (const relRelObj of relObj.relRelObjs) {
      if (!nodes.find(n => n.data.id === relRelObj.id)) {
        nodes.push({data: {id: relRelObj.id, label: relRelObj.label, level: 1}});
      }
      edges.push({
        data: {
          id: `${relObj.id}-${relRelObj.id}`,
          source: relObj.id,
          target: relRelObj.id,
          weight: relRelObj.score
        }
      });
    }
  }

  // NEEDED FOR CONCENTRIC SPACING
  nodes.push({data: {id: 'ghostLevel2', label: '', level: 2}});
  nodes.push({data: {id: 'ghostLevel4', label: '', level: 4}});
  
  if(!cy) {
    // BUILD BRAND NEW DEx
    initCy([...nodes, ...edges]); 
  } else if (focusNodeId && focusNodeLabel) {
    // UPDATE DEx AROUND NEW FOCUS NODE
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
  } else {
    // UPDATE DEx RELATED COUNT ONLY
    cy.elements().remove();
    cy.add([...nodes, ...edges]);
    cy.layout(cyLayout).run();
  }
}

async function generateNewTagGraph() {
  
  const genButton = document.getElementById('generate-btn');
  genButton.disabled = true;
  genButton.textContent = "Generating..."

  // USE QUERY BOX DATA

  const endpointSelect = document.getElementById('endpoint-select');
  const endpointEditor = document.getElementById('endpoint-editor');
  const querySelect = document.getElementById('query-select');
  const queryEditor = document.getElementById('query-editor');

  let endpoint;
  if (endpointSelect.value === "custom") {
    endpoint = endpointEditor.value.trim();
  } else if (endpointSelect.value === "wikidata") {
    endpoint = sourceEndpoints[endpointSelect.value];
  }

  let query;
  if (querySelect.value === "custom") {
    query = queryEditor.value.trim();
  } else {
    query = sourceQueries[querySelect.value];
  }

  await fetch("/new_tag_graph", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({endpoint, query})
  });

  // REFRESH DEx

  if (cy) {
    cy.destroy();
    cy = null;
  }
  
  const hubObjData = await queryTagGraph(tagGraphQueries.getHubObj());
  newDExView(DEFAULT_RELATED_COUNT, hubObjData[0].hubObj, hubObjData[0].label);

  document.getElementById('related-count').textContent = DEFAULT_RELATED_COUNT;

  genButton.disabled = true;
  genButton.textContent = "Generate new DEx";

  console.log("Setting sessionStorage", endpointSelect.value, querySelect.value);
  sessionStorage.setItem("currentEndpoint", endpointSelect.value);
  sessionStorage.setItem("currentQuery", querySelect.value);
  if (endpointSelect.value === "custom") {
    sessionStorage.setItem("customEndpoint", endpoint);
  } else {
    sessionStorage.setItem("customEndpoint", '');
  }
  if (querySelect.value === "custom") {
    sessionStorage.setItem("customQuery", query);
  } else {
    sessionStorage.setItem("customQuery", '');
  }
  
  const welcomeView = document.getElementById('obj-display');
  welcomeView.src = "/welcome";
}

function editorUnlocked() {
  // TODO: MOVE THIS CHECK TO THE BACKEND
  const key = prompt(`Enter editor key:`);
  return key === "ariadne";
}

async function init() {
  
  // INITIALIZE CYTOSCAPE VIEW
  
  const hubObjData = await queryTagGraph(tagGraphQueries.getHubObj());
  newDExView(DEFAULT_RELATED_COUNT, hubObjData[0].hubObj, hubObjData[0].label);

  // INITIALIZE QUERY BOX

  const genButton = document.getElementById('generate-btn');
  genButton.disabled = true;
  genButton.addEventListener('click', generateNewTagGraph);

  if (!sessionStorage.getItem("currentEndpoint")) {
    sessionStorage.setItem("currentEndpoint", "wikidata");
  }
  if (!sessionStorage.getItem("currentQuery")) {
    sessionStorage.setItem("currentQuery", "wiki-space");
  }

  const endpointSelect = document.getElementById('endpoint-select');
  const endpointEditor = document.getElementById('endpoint-editor');
  const querySelect = document.getElementById('query-select');
  const queryEditor = document.getElementById('query-editor');
  
  endpointSelect.value = sessionStorage.getItem("currentEndpoint");
  if (endpointSelect.value === "custom") {
    endpointEditor.value = sessionStorage.getItem("customEndpoint");
  } else {
    endpointEditor.value = sourceEndpoints[endpointSelect.value];
  }
  endpointEditor.setAttribute("readonly", true);
  
  querySelect.value = sessionStorage.getItem("currentQuery");
  if (querySelect.value === "custom") {
    queryEditor.value = sessionStorage.getItem("customQuery");
  } else {
    queryEditor.value = sourceQueries[querySelect.value];
  }
  queryEditor.setAttribute("readonly", true);

  endpointSelect.addEventListener('change', () => {
    if (endpointSelect.value === "custom") {
      if (editorUnlocked()) {
        endpointEditor.removeAttribute("readonly");
      } else {
        alert("Invalid key");
        endpointSelect.value = sessionStorage.getItem("currentEndpoint");
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
        querySelect.value = sessionStorage.getItem("currentQuery");
      }
    } else {
      queryEditor.setAttribute("readonly", true);
      queryEditor.value = sourceQueries[querySelect.value];
    }
    genButton.disabled = false;
  });

  // INITIALIZE RELATED COUNT CONTROLS

  const countDisplay = document.getElementById('related-count');
  countDisplay.textContent = DEFAULT_RELATED_COUNT;

  document.getElementById('decrease-related').addEventListener('click', () => {
    let relatedCount = parseInt(countDisplay.textContent)
    if (relatedCount > 1) {
      relatedCount--;
      countDisplay.textContent = relatedCount;
      newDExView(relatedCount);
    }
  });
  
  document.getElementById('increase-related').addEventListener('click', () => {
    let relatedCount = parseInt(countDisplay.textContent)
    if (relatedCount < 12) {
      relatedCount++;
      countDisplay.textContent = relatedCount;
      newDExView(relatedCount);
    }
  });
}

init();
