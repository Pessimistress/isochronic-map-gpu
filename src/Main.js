import React, {useState, useEffect} from "react";
import citySettings from "./city-settings.json";
import Controls from "./controls";
import Map from "./map";

const AWS_PREFIX =
  "https://uber-common-public.s3-us-west-2.amazonaws.com/svc-vis-prototype/vis-hackathon-isochronic-map";

const initialState = {
  graph: {},
  city: "san-francisco",
  ...citySettings["san-francisco"],
  transition: false,
  hour: 0,
  mapType: 0,
  loaded: false
};

function App() {
  const [data, setData] = useState(initialState);
  const loadCity = async city => {
    try {
      const resEdges = await fetch(`${AWS_PREFIX}/${city}/edges.json`);
      const edges = await resEdges.json();
      const resNodes = await fetch(`${AWS_PREFIX}/${city}/nodes.csv`);

      const nodesText = await resNodes.text();
      const nodes = nodesText
        .split("\n")
        .slice(1)
        .map(row => {
          const [id, lat, lon] = row.split(",");
          return {id, lat: Number(lat), lon: Number(lon)};
        });

      const nodesById = nodes.reduce((prev, curr, idx) => {
        if (curr.id || curr.id === 0) {
          prev[curr.id] = {
            index: idx,
            lat: curr.lat,
            lon: curr.lon
          };
        }
        return prev;
      }, {});

      const graph = {
        nodes,
        edges: Object.values(edges),
        nodesById
      };

      setData(state => ({...state, graph, loaded: true}));
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    if (!data.loaded) {
      loadCity(data.city);
    }
  });
  const setCity = city => {
    setData(state => ({
      ...state,
      city,
      ...citySettings[city],
      loaded: false
    }));
    loadCity(city);
  };
  const setTransition = transition => {
    setData(state => ({...state, transition}));
  };
  const setHour = hour => {
    setData(state => ({...state, hour}));
  };
  const setMapType = mapType => {
    setData(state => ({...state, mapType}));
  };
  const setSourceIndex = sourceIndex => {
    setData(state => ({...state, sourceIndex}));
  };
  const setViewState = viewState => {
    setData(state => ({...state, viewState}));
  };

  return (
    <div>
      <Controls
        city={data.city}
        transition={data.transition}
        setTransition={setTransition}
        mapType={data.mapType}
        setMapType={setMapType}
        hour={data.hour}
        setHour={setHour}
        setCity={setCity}
      />
      {data.loaded ? (
        <Map
          viewState={data.viewState}
          graph={data.graph}
          sourceIndex={data.sourceIndex}
          setSourceIndex={setSourceIndex}
          setViewState={setViewState}
          mode={data.mapType}
          transition={data.transition}
        />
      ) : (
        <div>Loading city...</div>
      )}
    </div>
  );
}

export default App;
