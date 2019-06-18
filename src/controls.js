import React from "react";

const cities = [
  {value: 'cincinnati', label: 'Cincinnati'},
  {value: 'london', label: 'London'},
  {value: 'nairobi', label: 'Nairobi'},
  {value: 'new-york', label: 'New York'},
  {value: 'san-francisco', label: 'San Francisco'},
  {value: 'seattle', label: 'Seattle'}
];

const mapTypes = [
  {value: 0, label: 'Base Map'},
  {value: 1, label: 'Node Distance'},
  {value: 2, label: 'Traffic'},
  {value: 3, label: 'Isochronic Map'}
]

const Controls = ({
  city,
  transition,
  setTransition,
  mapType,
  setMapType,
  hour,
  setHour,
  setCity
}) => {
  const handleChangeCity = e => {setCity(e.target.value)}
  const handleChangeHour = e => {setHour(e.target.value)}
  const handleChangeMapType = e => {setMapType(Number(e.target.value))}
  const handleChangeTransition = e => {setTransition(e.target.checked)}

  return <div className='controls' style={{
    position: 'fixed',
    top: 20,
    left: 20,
    padding: 20,
    zIndex: 10,
    border: `1px solid #eee`,
  }}>
    <select value={city} onChange={handleChangeCity}>
      {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
    </select>
    <div>
      <input id="hour" type="range" min="0" max="23" step="1" value={hour}
      onChange={handleChangeHour}
      />
      <span id="hour-value">{hour}</span>
    </div>
    <select value={mapType} onChange={handleChangeMapType}>
    {mapTypes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
    </select>
     <div>
      <input id="transition" type="checkbox" checked={transition} onChange={handleChangeTransition} />
      <label htmlFor="transition">Transition</label>
    </div>
  </div>;
};

export default Controls;
