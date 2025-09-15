let cy;
let hubObj = null;
const OBJECT_TYPE = "wikipedia_url";

async function fetchHubObj() {
  const query = `
    SELECT ?hubObj
    WHERE {
      ?o skos:related ?hubObj .
    }
    GROUP BY ?hubObj
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
    SELECT ?relObj
    WHERE {
      <${focusObj}> skos:related ?relObj .
    }
  `;
  const result = await fetch("/tagology_graph", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({query})
  });
  return await result.json();
}

async function fetchWikiItemLabels(allObjs) {
  const endpoint = "https://query.wikidata.org/sparql";
  const valuesList = allObjs.map(obj => `<${obj}>`).join(" ");
  const query = `
    PREFIX schema: <http://schema.org/>
    SELECT ?obj ?itemLabel
    WHERE {
      VALUES ?obj {${valuesList}}
      ?obj schema:about ?item .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;
  const url = endpoint + "?query=" + encodeURIComponent(query);
  const result = await fetch(url, {
    headers: {
      "Accept": "application/sparql-results+json",
      "User-Agent": "tagology/1.0 (michelle.lee.tom@gmail.com)"
    }
  });
  return await result.json();
}

async function getLabels(focusObj, relObjs) {
  const labels = {};
  const allObjs = [focusObj, ...relObjs];
  if(OBJECT_TYPE == "wikipedia_url") {
    const itemLabelsData = await fetchWikiItemLabels(allObjs);

    // DEBUG
    console.log(itemLabelsData);

    itemLabelsData.results.bindings.forEach(row => {
      labels[row.obj.value] = row.itemLabel?.value || row.obj.value;
    });
  } else {
    allObjs.forEach(o => {
      labels[o] = o;
    })
  }
  return labels;
}

async function init() {
  const hubObjData = await fetchHubObj();
  hubObj = hubObjData[0].hubObj;

  // MAKE NEW CYTOSCAPE GRAPH
  const focusObj = hubObj
  const relObjsData = await fetchRelObjs(focusObj);
  const relObjs = relObjsData.map(row => row.relObj);
  const labels = await getLabels(focusObj, relObjs);

  const nodes = [{data: {id: focusObj, label: labels[focusObj]}}];
  const edges = [];
  relObjs.forEach(ro => {
    nodes.push({data: {id: ro, label: labels[ro]}});
    edges.push({data: {id: focusObj + "-" + ro, source: focusObj, target: ro}});
  });

  cy = cytoscape({
    container: document.getElementById('DEx'),
    style: [{
      selector: 'node',
      style: {'label': 'data(label)', 'font-size': 8, 'text-valign': 'center', 'text-halign': 'center'}
    }],
    elements: nodes.concat(edges)
  });

  cy.layout({name: 'concentric'}).run();
}

init();
