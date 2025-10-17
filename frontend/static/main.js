import {sourceEndpoints, sourceQueries, tagGraphQueries} from './queries.js';
import {cyStyle, cyLayout} from './cyOptions.js';
import {queryTagGraph} from './utils.js';
import {displayWelcome} from './welcome.js';
import {displayTags} from './tags.js';

const DEFAULT_RELATED_COUNT = 6;
const customEndpointNotes = `Endpoint Editor Notes:
- Only single sparql endpoints handled at this time.
- Multiple endpoint handling planned for future releases.`;
const customQueryNotes = `Query Editor Notes:
- ?object is the main navigatable node in the DEx.
- Each ?object must be a clickable URI (loaded in an iframe).
- One tag:objLabel triple is expected for each ?object.
- One tag:propLabel triple is expected for each ?property.
- One tag:valLabel triple is expected IF ?value is a URI.
- The static portion of the CONSTRUCT clause is left open so
    triples can be added if needed. It must be closed ('}').
- Full query is submitted to the endpoint AS IS. Use caution.
- Please test your query BEFORE using it in tagology.`;

let cy; // cytoscape object
let hubObj; // [uri, prefLabel]
let focusObj; // [uri, prefLabel]
let prevObj; // [uri, prefLabel]
let currentRelMap; // contains 12 related objs and each of their 12 related objs

function initCy(elements) {
  try {
    cy = cytoscape({
      container: document.getElementById('cyto'),
      style: cyStyle,
      userZoomingEnabled: false,
      userPanningEnabled: false,
      elements 
    });
  } catch (e) {
    console.error(`Failed to create cytoscape object. Empty DEx!!\n${e}`);
    return false;
  }

  cy.on('tap', 'node', function (evt) {
    let clickedNode = evt.target;

    try {
      const frame = document.getElementById('obj-display');
      frame.onload = null;
      frame.src = clickedNode.data('id');
    } catch (e) {
      console.error(`Failed to load clicked object URI. Reverting to welcome page.\n${e}`);
      displayWelcome();
    }

    if (clickedNode.data('level') !== 5) {
      prevObj = [...focusObj];
      const relatedCount = parseInt(document.getElementById('related-count').textContent);
      if (!updateDExView(relatedCount, clickedNode.data('id'), clickedNode.data('label'))) {
        console.error(`Failed to recenter view around ${clickedNode.data('id')}`)    
      }
    }
  });

  cy.on('tap', 'edge', async function (evt) {
    if (!displayTags(evt.target)) {
      console.error("Failed to display tags page. Reverting to welcome page.");
      displayWelcome();
    }
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
  
  try {
    cy.layout(cyLayout).run();
  } catch (e) {
    console.error(`Failed to create new cytoscape view. Blank DEx!!\n${e}`);
    return false;
  }

  return true;
}

async function updateDExView(relatedCount, focusNodeId = null, focusNodeLabel = null) {
  
  if (focusNodeId && focusNodeLabel) {
    // UPDATE CURRENT VIEW GLOBAL VARIABLES

    const relRelObjsData = await queryTagGraph(tagGraphQueries.getRelRelObjs(focusNodeId));
    if (!relRelObjsData) {
      console.error(`Failed to get related objects for ${focusNodeId}. View not updated.`)
      return false;
    }
  
    focusObj = [focusNodeId, focusNodeLabel];
    
    currentRelMap = new Map();
    for (const row of relRelObjsData) {
      try {
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
      } catch (e) {
        console.warn(`Could not add ${row} to relations map.`);
        continue;
      }
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
    if (!initCy([...nodes, ...edges])) {
      console.error("Failed to create DEx from scratch");
      return false;
    }
  } else if (focusNodeId && focusNodeLabel) {
    // UPDATE DEx AROUND NEW FOCUS NODE
    try {
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
    } catch (e) {
      console.error(`Failed to rerun cytoscape layout around ${focusNodeId}\n${e}`);
      return false;
    }
  } else {
    // UPDATE DEx RELATED COUNT ONLY
    try {
      cy.elements().remove();
      cy.add([...nodes, ...edges]);
      cy.layout(cyLayout).run();
    } catch (e) {
      console.error(`Failed to rerun cytoscape layout around ${focusObj[0]}\n${e}`);
      return false;
    }
  }

  return true;
}

function setNewDExState() {
  displayWelcome();

  document.getElementById('related-count').textContent = DEFAULT_RELATED_COUNT;
  
  const genButton = document.getElementById('generate-btn');
  genButton.textContent = "Generate new DEx";
  genButton.disabled = true;
  
  const endpointSelect = document.getElementById('endpoint-select');
  endpointSelect.value = sessionStorage.getItem("currentEndpoint");
  
  const endpointEditor = document.getElementById('endpoint-editor');
  if (endpointSelect.value === "custom") {
    endpointEditor.value = sessionStorage.getItem("customEndpoint");
    endpointEditor.setAttribute("readonly", false);
  } else {
    endpointEditor.value = sourceEndpoints[endpointSelect.value];
    endpointEditor.setAttribute("readonly", true);
  }
  
  const querySelect = document.getElementById('query-select');
  querySelect.value = sessionStorage.getItem("currentQuery");
  
  const queryConstruct = document.getElementById('query-construct');
  queryConstruct.value = sourceQueries["construct"];
  
  const queryEditor = document.getElementById('query-editor');
  if (querySelect.value === "custom") {
    queryEditor.value = sessionStorage.getItem("customQuery");
    queryEditor.setAttribute("readonly", false);
  } else {
    queryEditor.value = sourceQueries[querySelect.value];
    queryEditor.setAttribute("readonly", true);
  }
  
  const queryLimit = document.getElementById('query-limit');
  queryLimit.value = sourceQueries["limit"];
}

async function generateNewTagGraph() {
  
  // DISABLE BUTTON
  const genButton = document.getElementById('generate-btn');
  genButton.disabled = true;
  genButton.textContent = "Generating..."

  // BUILD QUERY USING QUERY BOX DATA
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

  const resp;
  try {
    resp = await fetch("/new_tag_graph", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({endpoint, query})
    });
  } catch (e) {
    console.error(`Failed to request new user tag graph from webserver\n${e}. Aborting.`);
    return false;
  }

  if (!resp.ok) {
    console.error("Failed to create new tag graph for user. Aborting.");
    return false;
  }

  const hubObjData = await queryTagGraph(tagGraphQueries.getHubObj());
  if (!hubObjData) {
    console.error("Failed to get hub object data. Deleting the newly created graph.");
    await fetch("/delete_user_graph", { method: "DELETE" });
    return false;
  }

  // RECREATE THE DEx

  hubObj = [hubObjData[0].hubObj, hubObjData[0].label];
  prevObj = null;
  
  if (cy) {
    cy.destroy();
    cy = null;
  }

  if (!updateDExView(DEFAULT_RELATED_COUNT, hubObj[0], hubObj[1])) {
    console.error("Failed to create new DEx view. Deleting the newly created graph.")
    await fetch("/delete_user_graph", { method: "DELETE" });
    return false;
  }

  return true;
}

async function searchLabels(searchText) {
  try {
    const matchObjData = await queryTagGraph(tagGraphQueries.getMatchObj(searchText.trim()));
    if (!matchObjData) {
      console.error(`Failed to get match object data using search text "${searchText}"`);
      return false;
    }

    if (matchObjData.length !== 0) {
      // MATCH FOUND - UPDATE DEX VIEW

      prevObj = [...focusObj];
      if (cy) {
        cy.destroy();
        cy = null;
      }
      
      const relatedCount = parseInt(document.getElementById('related-count').textContent);
      updateDExView(relatedCount, matchObjData[0].matchObj, matchObjData[0].label); 
      
      try {
        const frame = document.getElementById('obj-display');
        frame.onload = null;
        frame.src = matchObjData[0].matchObj;
      } catch (e) {
        console.error(`Failed to load found object URI. Reverting to welcome page.\n${e}`);
        displayWelcome();
      }
    }
  } catch (e) {
    console.error(`Failed to search object labels\n${e}`);
    return false;
  }
  return true;
}

async function editorUnlocked() {
  const key = prompt(`Enter editor key:`);
  const boolResult = await fetch("/verify_editor_key", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(key)
  });
  return await boolResult.json();
}

async function init() {
  
  // FULL RESET IF NEW SESSION
  if (performance.getEntriesByType("navigation")[0]?.type !== "reload") {
    cy = null;
    hubObj = null;
    focusObj = null;
    prevObj = null;
    currentRelMap = null;
    sessionStorage.clear();

    // RETURNS 400 CODE IF NO GRAPH TO DELETE, BUT NOT AN ERROR
    await fetch("/delete_user_graph", { method: "DELETE" });
    
    sessionStorage.setItem("currentEndpoint", "wikidata");
    sessionStorage.setItem("currentQuery", "wiki-space");
  }

  // USES sessionStorage DATA IN CASE PAGE WAS REFRESHED
  setNewDExState();
  
  // INITIALIZE CYTOSCAPE VIEW
  
  const hubObjData = await queryTagGraph(tagGraphQueries.getHubObj());
  if (!hubObjData) {
    console.error("Failed to get hub object. Empty DEx!!");
    return;
  }

  hubObj = [hubObjData[0].hubObj, hubObjData[0].label];
  if (!updateDExView(DEFAULT_RELATED_COUNT, hubObj[0], hubObj[1])) {
    console.error(`Failed to run view. Empty DEx!!`);
    return;
  }

  // ADD EVENT LISTENERS
  const relatedCount = document.getElementById('related-count');

  document.getElementById('hub-btn').addEventListener('click', () => {
    if (focusObj?.[0] !== hubObj?.[0]) {
      prevObj = [...focusObj];
      if (cy) {
        cy.destroy();
        cy = null;
      }      
      if(await updateDExView(parseInt(relatedCount.textContent), hubObj[0], hubObj[1])) {
        displayWelcome();
      }
    };
  });

  document.getElementById('decrease-related').addEventListener('click', () => {
    let relatedCountVal = parseInt(relatedCount.textContent);
    if (relatedCountVal > 1) {
      relatedCountVal--;
      relatedCount.textContent = relatedCountVal;
      updateDExView(relatedCountVal);
    }
  });
  
  document.getElementById('increase-related').addEventListener('click', () => {
    let relatedCountVal = parseInt(relatedCount.textContent);
    if (relatedCountVal < 12) {
      relatedCountVal++;
      relatedCount.textContent = relatedCountVal;
      updateDExView(relatedCountVal);
    }
  });
  
  document.getElementById('back-btn').addEventListener('click', () => {
    if (prevObj?.[0] && prevObj?.[1]) {
      if (cy) {
        cy.destroy();
        cy = null;
      }
      
      updateDExView(parseInt(relatedCount.textContent), prevObj[0], prevObj[1]);
    
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
      if (searchText && /^[^\\"\r\n]*$/.test(searchText)) {
        searchLabels(searchText);
      }
      searchInput.value = "";
      searchInput.placeholder = "Search objects...";
    }
  });

  const endpointSelect = document.getElementById('endpoint-select');
  const endpointEditor = document.getElementById('endpoint-editor');
  endpointSelect.addEventListener('change', async () => {
    if (endpointSelect.value === "custom") {
      if (await editorUnlocked()) {
        alert(customEndpointNotes);
        endpointEditor.removeAttribute("readonly");
      } else {
        alert("Correct key required to edit endpoint.");
        endpointSelect.value = sessionStorage.getItem("currentEndpoint");
      }
    } else {
      endpointEditor.setAttribute("readonly", true);
      endpointEditor.value = sourceEndpoints[endpointSelect.value];
      genButton.disabled = false;
    }
  });
  
  endpointEditor.addEventListener('input', () => {
    genButton.disabled = false;
  });

  const querySelect = document.getElementById('query-select');
  const queryEditor = document.getElementById('query-editor');
  querySelect.addEventListener('change', async () => {
    if (querySelect.value === "custom") {
      if (await editorUnlocked()) {
        alert(customQueryNotes);
        queryEditor.removeAttribute("readonly");
      } else {
        alert("Correct key required to edit query.");
        querySelect.value = sessionStorage.getItem("currentQuery");
      }
    } else {
      queryEditor.setAttribute("readonly", true);
      queryEditor.value = sourceQueries[querySelect.value];
      genButton.disabled = false;
    }
  });
  
  queryEditor.addEventListener('input', () => {
    genButton.disabled = false;
  });

  const genButton = document.getElementById('generate-btn');
  genButton.addEventListener('click', async () => {
    if (!await generateNewTagGraph()) {
      alert("Could not create new tagology graph. Please verify the endpoint and query.");  
    } else {
      sessionStorage.setItem("currentEndpoint", endpointSelect.value);
      sessionStorage.setItem("currentQuery", querySelect.value);
      if (endpointSelect.value == "custom") {
        sessionStorage.setItem("customEndpoint", endpointEditor.value);
      }
      if (querySelect.value == "custom") {
        sessionStorage.setItem("customQuery", queryEditor.value);
      }
    }
    setNewDExState();
  });
}

init();
