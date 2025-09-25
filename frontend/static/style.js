export const cyStyle = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'color': 'white',
        'text-outline-color': 'firebrick',
        'text-valign': 'center',
        'text-halign': 'center',
        'border-color': 'firebrick',
        'border-style': 'dashed',
        'border-width': '1'
      }
    }, {
      selector: 'edge',
      style: {
        'target-arrow-shape': 'diamond',
        'curve-style': 'straight',
        'target-arrow-color': 'white',
        'arrow-scale': 0.5,
        'line-color': 'white',
        'width': 1
      }
    }, {
      selector: 'node[level = 5]',
      style: {
        'shape': 'star',
        'background-color': 'gold',
        'background-opacity': 0.95,
        'width': 100,
        'height': 100,
        'text-outline-width': 2,
        'font-size': 20
      }
    }, {
      selector: 'node[level = 2]',
      style: {
        'background-color': 'tomato',
        'background-opacity': 0.95,
        'width': 75,
        'height': 75,
        'text-outline-width': 1.5,
        'font-size': 15
      }
    }, {
      selector: 'node[level = 1]',
      style: {
        'shape': 'octagon',
        'background-color': 'peru',
        'background-opacity': 0.95,
        'width': 50,
        'height': 50,
        'text-outline-width': 1,
        'font-size': 10
      }
    }
]
