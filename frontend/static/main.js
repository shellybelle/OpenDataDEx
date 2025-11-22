import {sourceEndpoints, sourceQueries} from './sourceOptions.js';
import {cyStyles, cyLayout} from './cyOptions.js';
import {queryTagGraph, tagGraphQueries} from './utils.js';
import {displayWelcome} from './welcome.js';
import {displayTags} from './tags.js';

const DEFAULT_RELATED_COUNT = 6;
const DEFAULT_ENDPOINT = 'wikidata';
const DEFAULT_QUERY = 'wiki_space';
const ENDPOINT_NOTES = 
  "Endpoint Editor Notes:\n\n" +
  "Only single sparql endpoints queriable at this time.\n\n" +
  "Upcoming features:\n" +
  "- Federate from multiple sparql endpoints\n" +
  "- Upload and query rdf files";
const QUERY_NOTES =
  "Query Editor Notes:\n\n" +
  "The primary data to query (as required by the CONSTRUCT) are triples [?object ?property ?value]," +
  " where the the ?object is the main navigational and clickable URI.\n\n" +
  "Additionally, a single odd:objLabel, odd:propLabel, or odd:valLabel triple is expected for every URI." +
  " Use bindings when necessary. If no label is provided, the URI will be displayed in the DEx.\n\n" +
  "CONSTRUCT is left open so custom ?object triples can be added if desired. Don't forget to close.\n\n" +
  "The full query is submitted AS IS to the endpoint, which is expected to handle errors and timeouts." +
  " Please use caution and test queries directly before using to generate a DEx."
 
let cy;
let hubObj; // {id: (object's uri), label: (object's odd:label)}
let prevObj; // {id: (object's uri), label: (object's odd:label)}}
let relatedMap; // focus node's 12 related objs and each of their 12 related objs

function getFocusObj() {
  if(!cy) {
    return null;
  }

  let focusNode;
  try {
    focusNode = cy.nodes().filter(n => n.data('level') === 5).first();
  } catch(e) {
    console.error(`Failed to get the focus node:\n${e}`);
    return null;
  }
  return {id: focusNode.id(), label: focusNode.data('label')};
}

function initCyto(elements) {
  if(!elements || elements.length === 0) {
    throw new Error("No elements to initialize cytoscape graph");
  }

  if(cy) {
    cy.destroy();
    cy = null;
  }

  cy = cytoscape({
    container: document.getElementById('cyto'),
    style: cyStyles.graph,
    userZoomingEnabled: false,
    userPanningEnabled: false,
    elements
  });

  cy.on('tap', 'node', async function(evt) {
    let clickedNode = evt.target;
    
    try {
      const frame = document.getElementById('obj-display');
      frame.onload = null;
      frame.src = clickedNode.id();
    } catch(e) {
      console.warn(`Failed to load URI ${clickedNode.id()} into object display.\n${e}`);
      displayWelcome();
    }

    if(clickedNode.data('level') !== 5) {
      const oldFocusObj = getFocusObj();
      try {
        await updateCyto({id: clickedNode.id(), label: clickedNode.data('label')})
      } catch(e) {
        alert("Error occurred.");
        console.error(`Failed to recenter cytoscape graph around ${clickedNode.id()}:\n${e}`);
        return;
      }
      prevObj = oldFocusObj;
    }
  });

  cy.on('tap', 'edge', function(evt) {
    displayTags(evt.target)
  });

  cy.on('mouseover', 'node', (e) => {
    const currentFontSize = parseFloat(e.target.style('font-size'));
    e.target.style({
      ...cyStyles.nodeHover,
      'font-size': currentFontSize
    });
  });

  cy.on('mouseover', 'edge', (e) => {
    e.target.style(cyStyles.edgeHover);
  });

  cy.on('mouseout', 'node', (e) => {e.target.removeStyle();});
  cy.on('mouseout', 'edge', (e) => {e.target.removeStyle();});
}

// focusObj MUST BE OBJECT {id: (object's uri), label: (object's odd:label)}
// IF NO PASSED FOCUS OBJECT OR ALREADY THE FOCUS OBJECT, GRAPH WILL ONLY UPDATE RELATED COUNT
// IF PASSED FOCUS OBJECT IN CURRENT GRAPH, WILL ANIMATE TO CENTER
async function updateCyto(focusObj = null) {
  let newFocusObj;
  const currFocusObj = getFocusObj(); // COULD BE NULL

  if(focusObj) {
    if(!focusObj.id) {
      console.warn(`Invalid focus object ${focusObj}. Updating related count view only...`);
      focusObj = null;
      newFocusObj = currFocusObj;
    } else if(focusObj.id === currFocusObj?.id) {
      console.warn(`${focusObj.id} already the focus. Updating related count view only...`);
      focusObj = null;
      newFocusObj = currFocusObj;
    } else {
      // NEW SET OF RELATED OBJECTS
      const relRelObjsData = await queryTagGraph(tagGraphQueries.getRelRelObjs(focusObj.id));
      if(!relRelObjsData) {
        throw new Error("tagology graph query did not return valid related objects data");
      }

      relatedMap = new Map();
      for(const row of relRelObjsData) {
        let relObj = relatedMap.get(row.relObj);
        if(!relObj) {
          relObj = {
            id: row.relObj,
            label: row.label,
            score: parseFloat(row.score),
            relRelObjs: []
          }
          relatedMap.set(row.relObj, relObj);
        }
        relObj.relRelObjs.push({
          id: row.relObj2,
          label: row.label2,
          score: parseFloat(row.score2)
        });
      }

      newFocusObj = focusObj;
    }
  } else {
    newFocusObj = currFocusObj;
  }

  if(!relatedMap) {
    throw new Error("No related objects map for cytoscape view update");
  }
  if(!newFocusObj) {
    throw new Error("No focus object for cytoscape view update");
  }

  // GET NEW SUBSET OF RELATED OBJECTS
  const relatedCount = parseInt(document.getElementById('related-count').textContent);
  const nodes = [{data: {id: newFocusObj.id, label: newFocusObj.label, level: 5}}];
  const edges = [];

  const subsetRelObjs = [...relatedMap.values()]
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

  for(const relObj of subsetRelObjs) {
    nodes.push({data: {id: relObj.id, label: relObj.label, level: 3}});
    edges.push({
      data: {
        id: `${newFocusObj.id}->${relObj.id}`,
        source: newFocusObj.id,
        target: relObj.id,
        weight: relObj.score
      }
    });
  }

  // SEPARATE LOOP NEEDED IN CASE A 2ND DEGREE RELATED OBJECT IS A RELATED OBJECT
  for(const relObj of subsetRelObjs) {
    for(const relRelObj of relObj.relRelObjs) {
      if(!nodes.find(n => n.data.id === relRelObj.id)) {
        nodes.push({data: {id: relRelObj.id, label: relRelObj.label, level: 1}});
      }
      edges.push({
        data: {
          id: `${relObj.id}->${relRelObj.id}`,
          source: relObj.id,
          target: relRelObj.id,
          weight: relRelObj.score
        }
      });
    }
  }

  // NEEDED FOR CONCENTRIC LAYOUT SPACING
  nodes.push({data: {id: 'ghost2', label: '', level: 2}});
  nodes.push({data: {id: 'ghost4', label: '', level: 4}});

  if(focusObj) {
    if(!cy) {
      await initCyto([...nodes, ...edges]);
      cy.layout(cyLayout).run();
    } else {
      const focusNode = cy.getElementById(focusObj.id);
      
      if(focusNode.empty()) {
        // NODE NOT IN CURRENT GRAPH. WILL NEED TO REINITIALIZE.
        await initCyto([...nodes, ...edges]);
        cy.layout(cyLayout).run();
      } else {
        // FOCUS NODE MOVES TO CENTER. NEW ELEMENTS APPEAR AROUND IT.
        cy.elements().not(focusNode).remove();
        focusNode.animate({
          position: {x: cy.width()/2, y: cy.height()/2},
          duration: 500,
          complete: () => {
            try {
              focusNode.data({level: 5});
              const newElements = cy.add([
                ...nodes.filter(n => n.data.id !== focusObj.id),
                ...edges
              ]);
              newElements.style('opacity', 0);
              newElements.animate({
                style: {opacity: 1},
                duration: 500
              });
              cy.layout(cyLayout).run();
            } catch(e) {
              console.error(`Failed to display elements around animated node ${focusNode.id()}:\n${e}`);
              return;
            }
          }
        });
      }
    }
  } else {
    // UPDATE RELATED COUNT ONLY
    if(!cy) {
      throw new Error("cytoscape graph should but does not exist");
    }

    cy.elements().not(`[level = 5]`).remove();
    cy.add([...nodes, ...edges]);
    cy.layout(cyLayout).run();
  }
}

async function setNewDExState() { 
  const hubObjData = await queryTagGraph(tagGraphQueries.getHubObj());
  if(!hubObjData[0]?.hubObj || !hubObjData[0]?.label) {
    throw new Error("tagology graph query did not return valid hub object data");
  }
  hubObj = {id: hubObjData[0].hubObj, label: hubObjData[0].label};
  prevObj = null;

  document.getElementById('related-count').textContent = DEFAULT_RELATED_COUNT;

  const genButton = document.getElementById('generate-btn');
  genButton.textContent = "Generate new DEx";
  genButton.disabled = true;

  const endpointSelect = document.getElementById('endpoint-select');
  endpointSelect.value = sessionStorage.getItem('currentEndpoint');

  const endpointEditor = document.getElementById('endpoint-editor');
  if(endpointSelect.value === 'custom') {
    endpointEditor.value = sessionStorage.getItem('customEndpoint');
    // CAN ASSUME EDITOR WAS PREVIOUSLY UNLOCKED
    endpointEditor.setAttribute('readonly', false);
  } else {
    endpointEditor.value = sourceEndpoints[endpointSelect.value];
    endpointEditor.setAttribute('readonly', true);
  }

  const querySelect = document.getElementById('query-select');
  querySelect.value = sessionStorage.getItem("currentQuery");

  const queryEditor = document.getElementById('query-editor');
  if(querySelect.value === 'custom') {
    queryEditor.value = sessionStorage.getItem('customQuery');
    // CAN ASSUME EDITOR WAS PREVIOUSLY UNLOCKED
    queryEditor.setAttribute('readonly', false);
  } else {
    queryEditor.value = sourceQueries[querySelect.value];
    queryEditor.setAttribute('readonly', true);
  }

  // STATIC TEXT AREAS (READONLY SET IN HTML)
  const queryConstruct = document.getElementById('query-construct');
  const queryLimit = document.getElementById('query-limit');
  queryConstruct.value = sourceQueries['construct'];
  queryLimit.value = sourceQueries['limit'];
}

async function useDefaultGraph() {
  // 400 RETURNED IF NO DELETABLE GRAPH EXISTS - NOT AN ERROR
  await fetch("/delete_user_graph", {method: 'DELETE'});
  sessionStorage.setItem('currentEndpoint', DEFAULT_ENDPOINT);
  sessionStorage.setItem('currentQuery', DEFAULT_QUERY);
  sessionStorage.removeItem('customEndpoint'); // IF EXISTS
  sessionStorage.removeItem('customQuery'); // IF EXISTS
}

async function generateNewTagGraph() {
  // DISABLE BUTTON
  const genButton = document.getElementById('generate-btn');
  genButton.disabled = true;
  genButton.textContent = "Generating...";

  let endpoint;
  const endpointSelect = document.getElementById('endpoint-select');
  const endpointEditor = document.getElementById('endpoint-editor');
  if(endpointSelect.value === 'custom') {
    endpoint = endpointEditor.value.trim()
  } else {
    endpoint = sourceEndpoints[endpointSelect.value];
  }

  let queryBody;
  const querySelect = document.getElementById('query-select');
  const queryEditor = document.getElementById('query-editor');
  if(querySelect.value === 'custom') {
    queryBody = queryEditor.value.trim();
  } else {
    queryBody = sourceQueries[querySelect.value];
  }

  const query = 
    sourceQueries['construct'] + "\n" +
    queryBody + "\n" +
    sourceQueries['limit'];

  const resp = await fetch("/new_tag_graph", {
    method: 'POST',
    headers: {'Content-Type': "application/json"},
    body: JSON.stringify({endpoint, query})
  });
  
  if(!resp?.ok) {
    throw new Error(`Failed to create tagology graph using query ${query} at endpoint ${endpoint}`);
  }

  // SUCCESS - SAVE SESSION VARIABLES
  sessionStorage.setItem('currentEndpoint', endpointSelect.value);
  sessionStorage.setItem('currentQuery', querySelect.value);
  if(endpointSelect.value === 'custom') {
    sessionStorage.setItem('customEndpoint', endpointEditor.value);
  } else {
    sessionStorage.removeItem('customEndpoint'); // IF EXISTS
  }
  if(querySelect.value === 'custom') {
    sessionStorage.setItem('customQuery', queryEditor.value);
  } else {
    sessionStorage.removeItem('customQuery'); // IF EXISTS
  }
}

async function editorUnlocked() {
  const key = prompt("Enter editor key:");
  if(!key) {
    return false;
  }

  const boolResult = await fetch("/verify_editor_key", {
    method: 'POST',
    headers: {'Content-Type': "application/json"},
    body: JSON.stringify({key})
  });
  return await boolResult.json();
}

async function searchLabels(searchInput) {
  const searchText = searchInput.trim();
  if(!searchText || !/^[^\\"\r\n]*$/.test(searchText)) {
    return null;
  }

  const matchObjData = await queryTagGraph(tagGraphQueries.getMatchObj(searchText));
  if(!matchObjData[0]?.matchObj) {
    return null;
  }

  return {id: matchObjData[0].matchObj, label: matchObjData[0].label}
}

function setEventListeners() {
  
  window.addEventListener('resize', () => {
    if (!cy) return;

    cy.resize();
    cy.layout(cyLayout).run();
  });

  // RETURN TO HUB OBJECT AS FOCUS NODE
  document.getElementById('hub-btn').addEventListener('click', async () => {
    if(!hubObj?.id) {
      alert("Error occurred.");
      console.error("Failed to return to hub view: Missing hub object");
      return;
    }

    const oldFocusObj = getFocusObj();
    if(hubObj.id !== oldFocusObj?.id) {
      try {
        await updateCyto(hubObj);
      } catch(e) {
        alert("Error occurred.");
        console.error(`Failed to recreate cytoscape graph around ${hubObj}:\n${e}`);
        return;
      } 
      prevObj = {id: oldFocusObj?.id, label: oldFocusObj?.label};
    }
    displayWelcome();
  });

  // ABLE TO DECREASE RELATED COUNT VIEW TO MIN: 1
  document.getElementById('decrease-related').addEventListener('click', async () => {
    const relatedCount = document.getElementById('related-count');
    let relatedCountVal = parseInt(relatedCount.textContent);
    if(relatedCountVal > 1) {
      relatedCountVal--;
      relatedCount.textContent = relatedCountVal;
      try {
        await updateCyto();
      } catch(e) {
        alert("Error occurred.");
        console.error(`Failed to update cytoscape graph's number of related objects:\n${e}`);
        return;
      }
    }
  });

  // ABLE TO INCREASE RELATED COUNT VIEW TO MAX: BACKEND_THRESHOLD
  document.getElementById('increase-related').addEventListener('click', async () => {
    const relatedCount = document.getElementById('related-count');
    let relatedCountVal = parseInt(relatedCount.textContent);
    if(relatedCountVal < 12) {
      relatedCountVal++;
      relatedCount.textContent = relatedCountVal;
      try {
        await updateCyto();
      } catch(e) {
        alert("Error occurred.");
        console.error(`Failed to update cytoscape graph's number of related objects:\n${e}`);
        return;
      }
    }
  });

  document.getElementById('back-btn').addEventListener('click', async () => {
    if(!prevObj?.id) {
      console.warn("No previous object saved for 'back' navigation.");
      return;
    }
    
    try {
      await updateCyto(prevObj);
    } catch(e) {
      alert("Error occurred.");
      console.error(`Failed to update cytoscape graph around previous object ${prevObj.id}:\n${e}`);
      return;
    }

    try {
      const frame = document.getElementById('obj-display');
      frame.onload = null;
      frame.src = prevObj.id;
    } catch(e) {
      console.warn(`Could not load URI ${prevObj.id} into object display:\n${e}`);
      displayWelcome();
    }

    prevObj = null;
  });

  const searchInput = document.getElementById('label-search');
  searchInput.addEventListener('keydown', async (e) => {
    if(e.key === 'Enter') {
      const matchObj = await searchLabels(searchInput.value);

      if(!matchObj?.id) {
        alert("No matching object found.");
        searchInput.value = '';
        searchInput.placeholder = "Search objects..."
        return;
      }

      const oldFocusObj = getFocusObj();

      try {
        await updateCyto(matchObj);
      } catch(e) {
        alert("Error occurred.");
        console.error(`Failed to update cytoscape graph around ${matchObj.id}:\n${e}`);
        searchInput.value = '';
        searchInput.placeholder = "Search objects..."
        return;
      }

      prevObj = {id: oldFocusObj.id, label: oldFocusObj.label};
      
      try {
        const frame = document.getElementById('obj-display');
        frame.onload = null;
        frame.src = matchObj.id;
      } catch(e) {
        console.warn(`Could not load URI ${matchObj.id} into object display:\n${e}`);
        displayWelcome();
      }

      searchInput.value = '';
      searchInput.placeholder = "Search objects...";
    }
  });

  const endpointSelect = document.getElementById('endpoint-select');
  const endpointEditor = document.getElementById('endpoint-editor');
  endpointSelect.addEventListener('change', async () => {
    if(endpointSelect.value === 'custom') {
      if(await editorUnlocked()) {
        alert(ENDPOINT_NOTES);
        endpointEditor.removeAttribute('readonly');
      } else {
        alert("Valid key required to edit enpoint");
        endpointSelect.value = sessionStorage.getItem('currentEndpoint');
      }
    } else {
      endpointEditor.setAttribute('readonly', true);
      endpointEditor.value = sourceEndpoints[endpointSelect.value];
      genButton.disabled = false;
    }
  });

  const querySelect = document.getElementById('query-select');
  const queryEditor = document.getElementById('query-editor');
  querySelect.addEventListener('change', async () => {
    if(querySelect.value === 'custom') {
      if(await editorUnlocked()) {
        alert(QUERY_NOTES);
        queryEditor.removeAttribute("readonly");
      } else {
        alert("Valid key required to edit query");
        querySelect.value = sessionStorage.getItem('currentQuery');
      }
    } else {
      queryEditor.setAttribute('readonly', true);
      queryEditor.value = sourceQueries[querySelect.value];
      genButton.disabled = false;
    }
  });

  // ONLY POSSIBLE WHEN EDITORS UNLOCKED
  endpointEditor.addEventListener('input', () => {genButton.disabled = false;});
  queryEditor.addEventListener('input', () => {genButton.disabled = false;});

  // ONLY POSSIBLE WHEN ENABLED
  const genButton = document.getElementById('generate-btn');
  genButton.addEventListener('click', async () => {
    try {
      await generateNewTagGraph();
    } catch(e) {
      alert("Error occurred.");
      console.error(`Failed to generate a new tagology graph:\n${e}`);
      return;
    }

    try {
      await setNewDExState();
      await updateCyto(hubObj);
    } catch(e) {
      alert("Error occurred. Attempting default DEx...");
      console.error(`Failed to set and view new DEx.\n${e}`);
      try {
        await useDefaultGraph();
        await setNewDExState();
        await updateCyto(hubObj);
      } catch(e) {
        alert("Fatal error occurred.");
        console.error(`Failed to set and view default DEx:\n${e}`);
      }
    }

    displayWelcome();
  });
}

async function init() {

  if(sessionStorage.length == 0) {
    // RESET IN CASE OF LINGERING STATE
    await useDefaultGraph();
  }

  try {
    await setNewDExState();
    await updateCyto(hubObj);
  } catch(e) {
    alert("Error occurred. Attempting default DEx...");
    console.error(`Failed to set and view initial DEx.\n${e}`);
    try {
      await useDefaultGraph();
      await setNewDExState();
      await updateCyto(hubObj);
    } catch(e) {
      alert("Fatal error occurred.");
      console.error(`Failed to set and view default DEx:\n${e}`);
    }
  }

  displayWelcome();
  setEventListeners();
}

init();
