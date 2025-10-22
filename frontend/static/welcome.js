import {queryTagGraph, tagGraphQueries} from './utils.js';

export async function displayWelcome() {
  try {
    const [objsData, tagsData] = await Promise.all([
      queryTagGraph(tagGraphQueries.getTotalObjects()),
      queryTagGraph(tagGraphQueries.getTotalTags())
    ]);

    let totalObjs, totalTags;
    if(!objsData) {
      console.error("Could not get total objects");
      totalObjs = "UNAVAILABLE";
    } else {
      totalObjs = objsData[0].totalObjs;
    }
    if(!tagsData) {
      console.error("Could not get total tags");
      totalTags = "UNAVAILABLE";
    } else {
      totalTags = tagsData[0].totalTags;
    }

    const welcomeView = document.getElementById('obj-display');
    
    welcomeView.onload = null;
    welcomeView.onload = () => {
      try {
        const welcomeHtml = welcomeView.contentWindow.document;
        welcomeHtml.getElementById('total-objs').textContent = totalObjs;
        welcomeHtml.getElementById('total-tags').textContent = totalTags;
      } catch(e) {
        console.error(`Failed to update welcome page on load\n${e}`);
      }
    }

    welcomeView.src = "/welcome";
  } catch(e) {
    console.warn(`Failed to load welcome page:\n${e}`);
  }
}
