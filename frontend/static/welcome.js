import {queryTagGraph, tagGraphQueries} from './utils.js';

export async function displayWelcome() {
  try {
    const welcomeView = document.getElementById('obj-display');
    
    welcomeView.onload = null;
    welcomeView.onload = async () => {
      try {
        const welcomeHtml = welcomeView.contentWindow.document;
        welcomeHtml.getElementById('total-objs').textContent = 'loading...';
        welcomeHtml.getElementById('total-tags').textContent = 'loading...';
    
        const [objsData, tagsData] = await Promise.all([
          queryTagGraph(tagGraphQueries.getTotalObjects()),
          queryTagGraph(tagGraphQueries.getTotalTags())
        ]);
        
        welcomeHtml.getElementById('total-objs').textContent =
          objsData ? objsData[0].totalObjs : "UNAVAILABLE";

        welcomeHtml.getElementById('total-tags').textContent =
          tagsData ? tagsData[0].totalTags : "UNAVAILABLE";
      } catch(e) {
        console.error(`Failed to update welcome page on load\n${e}`);
      }
    }

    welcomeView.src = "/welcome";
  } catch(e) {
    console.warn(`Failed to load welcome page:\n${e}`);
  }
}
