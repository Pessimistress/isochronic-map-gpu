/* global window */
import {Deck, COORDINATE_SYSTEM} from '@deck.gl/core';
import * as d3 from 'd3-fetch';

import GraphLayer from './graph-layer.js';
import GRAPH from './graph.json';

let graph = null;
let sourceIndex = 311;
let hour = 0;
let input = null;

const deck = new Deck({
  initialViewState: {
    longitude: -122.4192016,
    latitude: 37.7751543,
    zoom: 13,
    pitch: 0,
    bearing: 0
  },
  pickingRadius: 5,
  controller: true,
  style: {
    position: 'fixed',
    top: 0,
    left: 0
  },
  layers: []
});

function redraw() {
  hour = input.querySelector('input').value * 1;
  input.querySelector('span').innerText = hour;

  deck.setProps({layers: [
    new GraphLayer({
      data: graph,
      sourceIndex,
      onClick: ({index}) => {
        sourceIndex = index;
        redraw();
      },
      getNodePosition: d => [d.lon, d.lat],
      getEdgeSource: d => graph.nodesById[d.start_junction_id].index,
      getEdgeTarget: d => graph.nodesById[d.end_junction_id].index,
      getEdgeValue: d => d.hours[hour] ? d.hours[hour].time : 1e6,

      // transition: 1000,

      updateTriggers: {
        getEdgeValue: hour
      }
    })
  ]});
}

Promise.all([
  d3.csv('./data/nodes.csv'),
  d3.json('./data/edges.json')
]).then(([nodes, edges]) => {
  const nodesById = {};
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node.index = i;
    node.lon = +node.lon;
    node.lat = +node.lat;
    nodesById[node.id] = node;
  }

  const walk = (startNode, maxDepth = 10, depth = 0) => {
    if (startNode.visited || depth > maxDepth) {
      return;
    }
    startNode.visited = true;
    for (const edgeId in edges) {
      const edge = edges[edgeId];
      if (edge.hours[0] && edge.start_junction_id === startNode.id) {
        walk(nodesById[edge.end_junction_id], maxDepth, depth + 1);
      }
    }
  };

  graph = {nodes, edges: Object.values(edges), nodesById};
  console.info(`loaded graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

  input = document.createElement('div');
  input.style.position = 'fixed';
  input.margin = '20px';

  const slider = document.createElement('input');
  slider.setAttribute('type', 'range');
  slider.setAttribute('min', 0);
  slider.setAttribute('max', 23);
  slider.setAttribute('step', 1);
  slider.setAttribute('value', hour);
  slider.oninput = redraw;

  const sliderValue = document.createElement('span');
  sliderValue.innerText = hour;

  input.append(slider);
  input.append(sliderValue);
  document.body.append(input);

  // Uncomment to debug
  // walk(nodes[311], 10);

  redraw();
});
