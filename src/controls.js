import React from "react";
import {Select} from 'baseui/select';
import {Block} from 'baseui/block';
import {FormControl} from 'baseui/form-control';
import {Slider} from 'baseui/slider';
import {Checkbox} from 'baseui/checkbox';

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
  const handleChangeHour = e => {setHour(Number(e.target.value))}
  const handleChangeMapType = e => {setMapType(Number(e.target.value))}
  const handleChangeTransition = e => {setTransition(e.target.checked)}

  return <Block className='controls' style={{
    position: 'fixed',
    top: 20,
    left: 20,
    padding: 20,
    width: '200px',
    backgroundColor: 'white',
    border: `1px solid #eee`,
  }}>
    <FormControl label="City">
    <Select value={[cities.find(d => d.value === city)]}
      clearable={false}
      options={cities}
      labelKey="label"
      valueKey="value"
      onChange={({value}) => {
        setCity(value[0].value);
      }}
    />
     </FormControl>
     <FormControl label="Map Type">
    <Select value={[mapTypes.find(d => d.value === mapType)]}
      clearable={false}
      options={mapTypes}
      labelKey="label"
      valueKey="value"
      onChange={({value}) => {
        setMapType(value[0].value);
      }}
    />
    </FormControl>
    
    <FormControl label="Hour">
      <Slider
        min={0}
        max={23}
        step={1}
        value={[hour]}
        onChange={({value}) => setHour(Number(value))}
      />
    </FormControl>
    <Checkbox checked={transition} onChange={() => setTransition(!transition)}>
      transition
    </Checkbox>
    </Block>;
};

export default Controls;
