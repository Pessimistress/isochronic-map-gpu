import BinaryHeap from "./binary-heap";

const R = 6371e3; // metres
const k = 0.44704 * 30;

export function computeGraph({hour, startNode, edges, nodes}) {
  const nodeHash = nodes.reduce((prev, curr, idx) => {
    const {id, lat, lon} = curr;
    prev[id] = {
      idx,
      lat: Number(lat),
      lon: Number(lon),
      timeToReach: Infinity,
      neighbors: []
    };
    return prev;
  }, {});

  const segmentLookup = Object.values(edges).reduce((prev, curr) => {
    const {start_junction_id, end_junction_id, hours} = curr;
    if (hours[hour]) {
      if (!prev[start_junction_id]) {
        addAngle(start_junction_id, nodeHash, startNode);
        prev[start_junction_id] = {};
      }
      addAngle(end_junction_id, nodeHash, startNode);
      nodeHash[start_junction_id].neighbors.push(end_junction_id);
      prev[start_junction_id][end_junction_id] = {...hours[hour]};
    }
    return prev;
  }, {});

  const Queue = new BinaryHeap(node => nodeHash[node].timeToReach);
  
  nodes.forEach(n => {
    nodeHash[n.id].timeToReach = n.id === startNode ? 0 : Infinity;
    Queue.push(n.id);
  });

  while (Queue.size()) {
    const current = Queue.pop();
    const timeCurrent = nodeHash[current].timeToReach;
    if (timeCurrent !== Infinity) {
      nodeHash[current].neighbors.forEach(neighbor => {
        const segment = segmentLookup[current][neighbor];
        const timeSegment = segment.time;
        const tentativeTimeToReach = timeCurrent + timeSegment;
        if (tentativeTimeToReach < nodeHash[neighbor].timeToReach) {
          Queue.remove(neighbor);
          nodeHash[neighbor].timeToReach = tentativeTimeToReach;
          Queue.push(neighbor);
        }
      });
    }
  }

  nodes.forEach(n => {
    const node = nodeHash[n.id];
    if (node.timeToReach < Infinity) {
      node.position = destination(
        nodeHash[startNode],
        node.bearing,
        k * node.timeToReach
      )
    }
  });
  return {nodes, segmentLookup};
}

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}
function toDegrees(rad) {
  return (rad * 180) / Math.PI;
}
function addAngle(nodeId, hash, startNode) {
  const bearing = getBearing(hash[startNode], hash[nodeId]);
  hash[nodeId].bearing = bearing;
}

function getBearing(a, b) {
  const λ1 = toRadians(a.lon);
  const λ2 = toRadians(b.lon);
  const φ1 = toRadians(a.lat);
  const φ2 = toRadians(b.lat);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return Math.atan2(y, x);
}

function destination(source, bearing, distance) {
  const lat = toRadians(source.lat);
  const lon = toRadians(source.lon);

  const destLat = Math.asin(
    Math.sin(lat) * Math.cos(distance / R) +
      Math.cos(lat) * Math.sin(distance / R) * Math.cos(bearing)
  );
  const destLon =
    lon +
    Math.atan2(
      Math.sin(bearing) * Math.sin(distance / R) * Math.cos(lat),
      Math.cos(distance / R) - Math.sin(lat) * Math.sin(destLat)
    );
  return {lat: toDegrees(destLat), lon: toDegrees(destLon)};
}
