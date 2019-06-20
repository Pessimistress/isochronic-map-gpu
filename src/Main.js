import React, {useState, useEffect} from "react";
import {Client as Styletron} from 'styletron-engine-atomic';
import {Provider as StyletronProvider} from 'styletron-react';
import {LightTheme, BaseProvider, styled} from 'baseui';
import {Spinner} from 'baseui/spinner';
import citySettings from "./city-settings.json";
import Controls from "./controls";
import Map from "./map";

const engine = new Styletron();

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
        let nodesById = {};
       for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.index = i;
        node.lon = +node.lon;
        node.lat = +node.lat;
        nodesById[node.id] = node;
        }
      const graph = {
        nodes,
        edges: Object.values(edges),
        nodesById
      };
      console.log(graph);
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
    <StyletronProvider value={engine}>
      <BaseProvider theme={LightTheme}>
        <div style={{display: 'flex', height: '100vh', flexDirection: 'row'}}>
        <div style={{width: '200px', height: '100vh'}}><Controls
          city={data.city}
          transition={data.transition}
          setTransition={setTransition}
          mapType={data.mapType}
          setMapType={setMapType}
          hour={data.hour}
          setHour={setHour}
          setCity={setCity}
        /></div>
        <div style={{width: 'calc(100vw - 200px)', height: '100vh'}}>
        {data.loaded ? (
          <Map
            viewState={data.viewState}
            graph={data.graph}
            hour={data.hour}
            sourceIndex={data.sourceIndex}
            setSourceIndex={setSourceIndex}
            setViewState={setViewState}
            mode={data.mapType}
            transition={data.transition}
          />
        ) : (
          <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Spinner /></div>
        )}</div>
        </div>
      </BaseProvider>
    </StyletronProvider>
  );
}

export default App;
