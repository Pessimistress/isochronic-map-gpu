const AWS_PREFIX =
  "https://uber-common-public.s3-us-west-2.amazonaws.com/svc-vis-prototype/vis-hackathon-isochronic-map";

export default async function loadData(city) {
  const edgesText = await fetch(`${AWS_PREFIX}/${city}/edges-sm.csv`).then(res => res.text());
  const nodesText = await fetch(`${AWS_PREFIX}/${city}/nodes-sm.csv`).then(res => res.text());

  const nodes = parseCSV(nodesText);
  const edges = parseCSV(edgesText);

  console.log(`Loaded ${city}. ${nodes.length} nodes, ${edges.length} edges`);
  return {nodes, edges};
}

function parseCSV(text) {
  const lines = text.split('\n').filter(Boolean);
  const headers = lines.shift().split(',');
  return lines.map(line => {
    const values = line.split(',');
    const row = {};
    for (let i = 0; i < headers.length; i++) {
      const name = headers[i];
      row[name] = name === 'times_by_hour' ? values[i].split('\t').map(Number) : Number(values[i]);
    }
    return row;
  });
}
