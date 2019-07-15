import React, {useState, useEffect} from "react";
import {Client as Styletron} from 'styletron-engine-atomic';
import {Provider as StyletronProvider} from 'styletron-react';
import {LightTheme, BaseProvider} from 'baseui';
import {Spinner} from 'baseui/spinner';
import citySettings from "./city-settings.json";
import Controls from "./controls";
import Map from "./map";
import loadData from './load-data';

const engine = new Styletron();

const initialState = {
  graph: {},
  city: "san-francisco",
  ...citySettings["san-francisco"],
  hour: 0,
  mapType: 1,
  loaded: false
};

function App() {
  const [data, setData] = useState(initialState);
  const loadCity = async city => {
    try {
      const graph = await loadData(city);
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
        <div style={{display: 'flex', height: '100vh'}}>
        <div style={{width: '280px', height: '100vh'}}><Controls
          city={data.city}
          mapType={data.mapType}
          setMapType={setMapType}
          hour={data.hour}
          setHour={setHour}
          setCity={setCity}
        /></div>
        <div style={{width: 'calc(100vw - 280px)', height: '100vh'}}>
        {data.loaded ? (
          <Map
            viewState={data.viewState}
            graph={data.graph}
            hour={data.hour}
            sourceIndex={data.sourceIndex}
            setSourceIndex={setSourceIndex}
            setViewState={setViewState}
            mode={data.mapType}
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
