import {queryTagGraph} from './utils.js';
import {tagGraphQueries} from './queries.js';

function createTagElement(doc, prop, propLbl, val, valLbl) {
  const p = doc.createElement('p');

  const propSpan = doc.createElement('span');
  const propLink = doc.createElement('a');
  propLink.href = prop;
  propLink.target = '_blank';
  propLink.textContent = propLbl;
  propSpan.appendChild(propLink);

  const isValUri = /^https?:\/\//.test(val);
  const valSpan = doc.createElement('span');
  if (isValUri) {
    const valLink = doc.createElement('a');
    valLink.href = val;
    valLink.target = '_blank';
    valLink.textContent = valLbl;
    valSpan.appendChild(valLink);
  } else {
    valSpan.textContent = valLbl;
  }

  p.append(`[ `);
  p.appendChild(propSpan);
  p.append(` : `);
  p.appendChild(valSpan);
  p.append(` ]`);
  return p;
}

export async function displayTags(clickedEdge) {
  const [sourceTagsData, targetTagsData] = await Promise.all([
    queryTagGraph(tagGraphQueries.getTags(clickedEdge.data('source'))),
    queryTagGraph(tagGraphQueries.getTags(clickedEdge.data('target')))
  ]);
  
  const matches = [];
  const sourceDiffs = [];
  const targetDiffs = [];
  const sourceOnly = [];
  const targetOnly = [];

  sourceTagsData.forEach(({prop: sProp, propLabel: sPropLbl, val: sVal, valLabel: sValLbl}) => {
    if (sValLbl == "None") {sValLbl = sVal;}
    if (targetTagsData.some(t => t.prop === sProp && t.val === sVal)) {
      matches.push({
        prop: sProp,
        propLbl: sPropLbl,
        val: sVal,
        valLbl: sValLbl
      })
    } else if (targetTagsData.some(t => t.prop === sProp)) {
      sourceDiffs.push({
        prop: sProp,
        propLbl: sPropLbl,
        val: sVal,
        valLbl: sValLbl,
      });
    } else {
      sourceOnly.push({
        prop: sProp,
        propLbl: sPropLbl,
        val: sVal,
        valLbl: sValLbl
      });
    }
  });

  targetTagsData.forEach(({prop: tProp, propLabel: tPropLbl, val: tVal, valLabel: tValLbl}) => {
    if (tValLbl == "None") {tValLbl = tVal;}
    if (sourceTagsData.some(s => s.prop === tProp && s.val === tVal)) {
      // ALREADY ADDED TO MATCHES
    } else if (sourceTagsData.some(s => s.prop === tProp)) {
      targetDiffs.push({
        prop: tProp,
        propLbl: tPropLbl,
        val: tVal,
        valLbl: tValLbl
      });
    } else {
      targetOnly.push({
        prop: tProp,
        propLbl: tPropLbl,
        val: tVal,
        valLbl: tValLbl
      });
    }
  });

  sourceDiffs.sort((a, b) => a.propLbl.localeCompare(b.propLbl));
  targetDiffs.sort((a, b) => a.propLbl.localeCompare(b.propLbl));

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
    matches.forEach(({prop, propLbl, val, valLbl}) => {
      sharedDiv.appendChild(createTagElement(tagsHtml, prop, propLbl, val, valLbl));
    });

    // TODO: PUT DIFFS IN A TABLE TO GROUP BY PROPERTY
    const similarSrcDiv = tagsHtml.getElementById('similar-src');
    sourceDiffs.forEach(({prop, propLbl, val, valLbl}) => {
      similarSrcDiv.appendChild(createTagElement(tagsHtml, prop, propLbl, val, valLbl));
    });
    const similarTgtDiv = tagsHtml.getElementById('similar-tgt');
    targetDiffs.forEach(({prop, propLbl, val, valLbl}) => {
      similarTgtDiv.appendChild(createTagElement(tagsHtml, prop, propLbl, val, valLbl));
    });

    const uniqueSrcDiv = tagsHtml.getElementById('unique-src');
    sourceOnly.forEach(({prop, propLbl, val, valLbl}) => {
      uniqueSrcDiv.appendChild(createTagElement(tagsHtml, prop, propLbl, val, valLbl));
    });

    const uniqueTgtDiv = tagsHtml.getElementById('unique-tgt');
    targetOnly.forEach(({prop, propLbl, val, valLbl}) => {
      uniqueTgtDiv.appendChild(createTagElement(tagsHtml, prop, propLbl, val, valLbl));
    });
  };
}
