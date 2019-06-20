import React from "react";
import DeckGL from "deck.gl";
import GraphLayer from './graph-layer.js';

const Map = ({viewState, graph, mode, setSourceIndex, setViewState, transition, hour, sourceIndex}) => (
  <div>
    <DeckGL
      viewState={viewState}
      pickingRadius={5}
      controller={true}
      onViewStateChange={({viewState}) => {
        setViewState(viewState)
      }}
      style={{
        left: '280px',
        width: 'calc(100vw - 280px)'
      }}
      layers={[
        new GraphLayer({
          data: graph,
          sourceIndex,
          onClick: ({index}) => {
             setSourceIndex(index);
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

          transition: transition && 2000,

          updateTriggers: {
            getEdgeValue: hour
          }
        })
      ]}
    />
  </div>
);

export default Map;
