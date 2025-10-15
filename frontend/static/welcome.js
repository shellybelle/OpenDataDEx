import {tagGraphQueries} from './queries.js';
import {queryTagGraph} from './utils.js';

export async function displayWelcome() {
  const [objsData, tagsData] = await Promise.all([
    queryTagGraph(tagGraphQueries.getTotalObjects()),
    queryTagGraph(tagGraphQueries.getTotalTags())
  ]);

  try {
    const welcomeView = document.getElementById('obj-display');
    welcomeView.onload = () => {
      const welcomeHtml = welcomeView.contentWindow.document;

      if (objsData && objsData.ok) {
        welcomeHtml.getElementById('total-objs').textContent = objsData[0].totalObjs;
      }
      
      if (tagsData && tagsData.ok) {
        welcomeHtml.getElementById('total-tags').textContent = tagsData[0].totalTags;
      }
    }
    welcomeView.src = "/welcome";
  } catch (e) {
    console.error("Failed to display welcome page!");
    return false;
  }

  return true;
}
