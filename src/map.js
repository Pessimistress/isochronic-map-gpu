import React from "react";
import DeckGL from "deck.gl";
import GraphLayer from './graph-layer/graph-layer.js';

const Map = ({viewState, graph, mode, setSourceIndex, setViewState, hour, sourceIndex}) => (
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
          getNodeIndex: (d, {index}) => index,
          getEdgeSource: d => d.start,
          getEdgeTarget: d => d.end,
          getEdgeValue: d => [
            d.times_by_hour[hour] || 1e6,
            d.distance,
            1
          ],

          mode,

          transition: true,

          updateTriggers: {
            getEdgeValue: hour
          }
        })
      ]}
    />
  </div>
);

export default Map;
