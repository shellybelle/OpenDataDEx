import {queryTagGraph} from './utils.js';
import {tagGraphQueries} from './queries.js';

export async function displayTags(clickedEdge) {
  const [sourceTagsData, targetTagsData] = await Promise.all([
    queryTagGraph(tagGraphQueries.getTags(clickedEdge.data('source'))),
    queryTagGraph(tagGraphQueries.getTags(clickedEdge.data('target')))
  ]);
  
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
