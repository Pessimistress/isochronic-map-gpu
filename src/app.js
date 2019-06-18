/* global window */
import {Deck, COORDINATE_SYSTEM} from '@deck.gl/core';
import * as d3 from 'd3-fetch';

import GraphLayer from './graph-layer.js';

let graph = null;
let sourceIndex = 311;
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
  layers: []
});

function redraw() {
  const hour = document.querySelector('input#hour').value * 1;
  document.querySelector('span#hour-value').innerText = hour;

  const useTransition = document.querySelector('input#transition').checked;
  const mode = +document.querySelector('select#mode').value;

  deck.setProps({layers: [
    new GraphLayer({
      data: graph,
      sourceIndex,
      onClick: ({index}) => {
        sourceIndex = index;
        redraw();
      },
      getNodePosition: d => [d.lon, d.lat],
      getNodeIndex: d => d.index,
      getEdgeSource: d => graph.nodesById[d.start_junction_id].index,
      getEdgeTarget: d => graph.nodesById[d.end_junction_id].index,
      getEdgeValue: d => [
        d.hours[hour] ? d.hours[hour].time : 1e6,
        d.distance,
        1
      ],

      mode,

      transition: useTransition && 2000,

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

  graph = {nodes, edges: Object.values(edges), nodesById};
  console.info(`loaded graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

  input = document.createElement('div');
  input.style.position = 'fixed';
  input.margin = '20px';

  document.querySelector('input#hour').oninput = redraw;
  document.querySelector('input#transition').oninput = redraw;
  document.querySelector('select#mode').onchange = redraw;
  redraw();
});
