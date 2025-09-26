export const cyStyle = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'color': 'white',
        'text-outline-color': 'maroon',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-outline-width': 1.5,
        'border-style': 'dashed',
        'border-width': '1'
      }
    }, {
      selector: 'edge',
      style: {
        'curve-style': 'straight',
        'target-arrow-shape': 'diamond',
        'target-arrow-color': 'white',
        'arrow-scale': 0.5,
        'line-color': 'white',
        'width': 1
      }
    }, {
      selector: 'node[level = 5]',
      style: {
        'shape': 'star',
        'background-color': 'yellow',
        'background-opacity': 0.95,
        'border-color': 'gold',
        'width': 75,
        'height': 75,
        'text-max-width' : 100,
        'font-size': 18
      }
    }, {
      selector: 'node[level = 3]',
      style: {
        'background-color': 'tomato',
        'background-opacity': 0.95,
        'border-color': 'maroon',
        'width': 50,
        'height': 50,
        'text-max-width' : 65,
        'font-size': 12
      }
    }, {
      selector: 'node[level = 1]',
      style: {
        'shape': 'octagon',
        'background-color': 'orange',
        'background-opacity': 0.95,
        'border-color': 'darkorange',
        'width': 35,
        'height': 35,
        'text-max-width' : 50,
        'font-size': 10
      }
    }, {
      selector: '#ghostLevel2, #ghostLevel4',
      style: {'display': 'none'}
    }
]

export const cyLayout = {
  name: 'concentric',
  concentric: n => n.data('level'),
  levelWidth: () => 1,
  nodeDimensionsIncludeLabels: true,
  spacingFactor: 0.5,
  minNodeSpacing: 25
}
