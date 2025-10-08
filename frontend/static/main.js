import {sourceEndpoints, sourceQueries, tagGraphQueries} from './queries.js';
import {cyStyle, cyLayout} from './cyOptions.js';
import {queryTagGraph} from './utils.js';
import {displayTags} from './tags.js';

const DEFAULT_RELATED_COUNT = 6;
let cy; // cytoscape object
let hubObj; // [uri, prefLabel]
let focusObj; // [uri, prefLabel]
let prevObj; // [uri, prefLabel]
let currentRelMap; // contains 12 related objs and each of their 12 related objs

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
      prevObj = [...focusObj];
      const relatedCount = parseInt(document.getElementById('related-count').textContent);
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
      'border-width': 2,
      'border-style': 'solid',
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
    focusObj = [focusNodeId, focusNodeLabel]
  
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

  const nodes = [{data: {id: focusObj[0], label: focusObj[1], level: 5}}];
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
        id: `${focusObj[0]}-${relObj.id}`,
        source: focusObj[0],
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
    query =
      sourceQueries["construct"] + "\n" +
      queryEditor.value.trim() + "\n" +
      sourceQueries["limit"];
  } else {
    query =
      sourceQueries["construct"] + "\n" +
      sourceQueries[querySelect.value] + "\n" +
      sourceQueries["limit"];
  }

  await fetch("/new_tag_graph", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({endpoint, query})
  });

  // REFRESH DEx

  prevObj = null;
  if (cy) {
    cy.destroy();
    cy = null;
  }
  
  const hubObjData = await queryTagGraph(tagGraphQueries.getHubObj());
  hubObj = [hubObjData[0].hubObj, hubObjData[0].label];
  newDExView(DEFAULT_RELATED_COUNT, hubObj[0], hubObj[1]);

  document.getElementById('related-count').textContent = DEFAULT_RELATED_COUNT;

  genButton.disabled = true;
  genButton.textContent = "Generate new DEx";

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
  welcomeView.onload = null;
  welcomeView.src = "/welcome";
}

async function searchLabels(searchText) {
  const matchObjData = await queryTagGraph(tagGraphQueries.getMatchObj(searchText.trim()));
  if (matchObjData.length !== 0) {
      prevObj = [...focusObj];
      if (cy) {
        cy.destroy();
        cy = null;
      }
      
      const relatedCount = parseInt(document.getElementById('related-count').textContent);
      newDExView(relatedCount, matchObjData[0].matchObj, matchObjData[0].label);
    
      const frame = document.getElementById('obj-display');
      frame.onload = null;
      frame.src = matchObjData[0].matchObj;
  }
}

function editorUnlocked() {
  // TODO: MOVE THIS CHECK TO THE BACKEND
  const key = prompt(`Enter editor key:`);
  return key === "ariadne";
}

async function init() {

  // DELETE USER'S GRAPH IF NEW TAB
  if (performance.getEntriesByType("navigation")[0].type === "navigate") {
    await fetch("/delete_user_graph", { method: "POST" });
  }
  
  // INITIALIZE CYTOSCAPE VIEW
  
  const hubObjData = await queryTagGraph(tagGraphQueries.getHubObj());
  hubObj = [hubObjData[0].hubObj, hubObjData[0].label];
  newDExView(DEFAULT_RELATED_COUNT, hubObj[0], hubObj[1]);

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
  const queryConstruct = document.getElementById('query-construct');
  const queryEditor = document.getElementById('query-editor');
  const queryLimit = document.getElementById('query-limit');
  
  endpointSelect.value = sessionStorage.getItem("currentEndpoint");
  if (endpointSelect.value === "custom") {
    endpointEditor.value = sessionStorage.getItem("customEndpoint");
  } else {
    endpointEditor.value = sourceEndpoints[endpointSelect.value];
  }
  endpointEditor.setAttribute("readonly", true);
  
  querySelect.value = sessionStorage.getItem("currentQuery");
  queryConstruct.value = sourceQueries["construct"];
  if (querySelect.value === "custom") {
    queryEditor.value = sessionStorage.getItem("customQuery");
  } else {
    queryEditor.value = sourceQueries[querySelect.value];
  }
  queryEditor.setAttribute("readonly", true);
  queryLimit.value = sourceQueries["limit"];

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

  // INITIALIZE NAV BUTTONS & SEARCH

  document.getElementById('hub-btn').addEventListener('click', () => {
    if (focusObj?.[0] !== hubObj?.[0]) {
      prevObj = [...focusObj];
      if (cy) {
        cy.destroy();
        cy = null;
      }
      
      const relatedCount = parseInt(document.getElementById('related-count').textContent);
      newDExView(relatedCount, hubObj[0], hubObj[1]);
      
      const welcomeView = document.getElementById('obj-display');
      welcomeView.onload = null;
      welcomeView.src = "/welcome";
    };
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    if (prevObj?.[0] && prevObj?.[1]) {
      if (cy) {
        cy.destroy();
        cy = null;
      }
      
      const relatedCount = parseInt(document.getElementById('related-count').textContent);
      newDExView(relatedCount, prevObj[0], prevObj[1]);
    
      const frame = document.getElementById('obj-display');
      frame.onload = null;
      frame.src = prevObj[0];
      
      prevObj = null;
    }
  });

  const searchInput = document.getElementById('label-search');
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const searchText = searchInput.value.trim();
      if (searchText) {
        searchLabels(searchText);
        searchInput.value = "";
        searchInput.placeholder = "Search objects...";
      }
    }
  });

  // INITIALIZE RELATED COUNT CONTROLS

  const countDisplay = document.getElementById('related-count');
  countDisplay.textContent = DEFAULT_RELATED_COUNT;

  document.getElementById('decrease-related').addEventListener('click', () => {
    let relatedCount = parseInt(countDisplay.textContent);
    if (relatedCount > 1) {
      relatedCount--;
      countDisplay.textContent = relatedCount;
      newDExView(relatedCount);
    }
  });
  
  document.getElementById('increase-related').addEventListener('click', () => {
    let relatedCount = parseInt(countDisplay.textContent);
    if (relatedCount < 12) {
      relatedCount++;
      countDisplay.textContent = relatedCount;
      newDExView(relatedCount);
    }
  });
}

init();
