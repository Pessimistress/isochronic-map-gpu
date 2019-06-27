import { ScatterplotLayer } from 'deck.gl';

export default function renderLayers(props) {
  const { data, settings } = props;
  return [
      new ScatterplotLayer({
        id: 'scatterplot',
        getPosition: d => [d.longitiude, d.latitude],
        getColor: d => [114, 19, 108],
        getRadius: d => 5,
        opacity: 0.5,
        pickable: true,
        radiusMinPixels: 0.25,
        radiusMaxPixels: 30,
        data,
        ...settings
      })
  ];
}
