import {tagGraphQueries} from './queries.js';
import {queryTagGraph} from './utils.js';

async function loadStats() {
  const [objsData, tagsData] = await Promise.all([
    queryTagGraph(tagGraphQueries.getTotalObjects()),
    queryTagGraph(tagGraphQueries.getTotalTags())
  ]);

  document.getElementById('total-objs').textContent = objsData[0].totalObjs;
  document.getElementById('total-tags').textContent = tagsData[0].totalTags;
}

document.addEventListener("DOMContentLoaded", () => {
  loadStats();
});
