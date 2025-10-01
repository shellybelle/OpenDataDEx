import {tagGraphQueries} from './queries.js';

async function queryTagGraph(query) {
  const result = await fetch("/tagology_graph", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({query})
  });
  return result.json();
}

async function loadStats() {
  const objsData = await queryTagGraph(tagGraphQueries.getTotalObjects());
  const tagsData = await queryTagGraph(tagGraphQueries.getTotalTags());

  document.getElementById('total-objs').textContent = objsData[0].totalObjs;
  document.getElementById('total-tags').textContent = tagsData[0].totalTags;
}

document.addEventListener("DOMContentLoaded", () => {
  loadStats();
});
