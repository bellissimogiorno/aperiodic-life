'use strict';

const assert = require('assert');
const {
  PHI,
  buildPenrosePatch,
} = require('./core.js');

const KEY_SCALE = 1_000;
const SIDE_TOLERANCE = 4e-5;
const AREA_TOLERANCE = 8e-5;
const THIN_AREA = Math.sin(Math.PI / 5);
const THICK_AREA = Math.sin((2 * Math.PI) / 5);

function pointKey(point) {
  return `${Math.round(point[0] * KEY_SCALE)},${Math.round(point[1] * KEY_SCALE)}`;
}

function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function pairKey(a, b) {
  return a < b ? `${a},${b}` : `${b},${a}`;
}

function canonicalPolygonKey(type, points) {
  const keys = points.map(pointKey);
  const candidates = [];
  for (const sequence of [keys, [...keys].reverse()]) {
    for (let shift = 0; shift < sequence.length; shift++) {
      candidates.push(sequence.slice(shift).concat(sequence.slice(0, shift)).join('|'));
    }
  }
  candidates.sort();
  return `${type}:${candidates[0]}`;
}

function independentTriangles(depth, mirrored) {
  const radius = PHI ** depth;
  let triangles = [];
  for (let i = 0; i < 10; i++) {
    const t1 = ((2 * i - 1) * Math.PI) / 10;
    const t2 = ((2 * i + 1) * Math.PI) / 10;
    let B = [Math.cos(t1) * radius, Math.sin(t1) * radius];
    let C = [Math.cos(t2) * radius, Math.sin(t2) * radius];
    if ((i + (mirrored ? 1 : 0)) % 2 === 0) [B, C] = [C, B];
    triangles.push([0, [0, 0], B, C]);
  }

  const interpolateInversePhi = (a, b) => [
    a[0] + (b[0] - a[0]) / PHI,
    a[1] + (b[1] - a[1]) / PHI,
  ];

  for (let generation = 0; generation < depth; generation++) {
    const next = [];
    for (const [kind, A, B, C] of triangles) {
      if (kind === 0) {
        const P = interpolateInversePhi(A, B);
        next.push([0, C, P, B], [1, P, C, A]);
      } else {
        const Q = interpolateInversePhi(B, A);
        const R = interpolateInversePhi(B, C);
        next.push([1, R, C, A], [1, Q, R, B], [0, R, Q, A]);
      }
    }
    triangles = next;
  }
  return triangles;
}

function independentRhombMultiset(depth, mirrored) {
  const triangles = independentTriangles(depth, mirrored);
  const seams = new Map();
  const result = new Map();
  let unmatched = 0;

  for (const triangle of triangles) {
    const [kind, A, B, C] = triangle;
    const key = edgeKey(pointKey(B), pointKey(C));
    const previous = seams.get(key);
    if (!previous) {
      seams.set(key, triangle);
      continue;
    }
    assert.notEqual(previous, false, `independent depth ${depth}: seam has more than two owners`);
    assert.equal(previous[0], kind, `independent depth ${depth}: seam kind mismatch`);
    seams.set(key, false);
    let polygon = [previous[1], previous[2], A, previous[3]];
    const area2 = polygon.reduce((sum, point, index) => {
      const next = polygon[(index + 1) % polygon.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0);
    if (area2 < 0) polygon = [previous[1], previous[3], A, previous[2]];
    const polygonKey = canonicalPolygonKey(kind, polygon);
    result.set(polygonKey, (result.get(polygonKey) || 0) + 1);
  }

  for (const owner of seams.values()) if (owner !== false) unmatched++;
  return { triangles: triangles.length, unmatched, rhombs: result };
}

function productionRhombMultiset(patch) {
  const result = new Map();
  for (let tile = 0; tile < patch.tileCount; tile++) {
    const points = [];
    for (let vertex = 0; vertex < 4; vertex++) {
      const offset = (tile * 4 + vertex) * 2;
      points.push([patch.vertices[offset], patch.vertices[offset + 1]]);
    }
    const key = canonicalPolygonKey(patch.tileTypes[tile], points);
    result.set(key, (result.get(key) || 0) + 1);
  }
  return result;
}

function assertMapEqual(actual, expected, label) {
  assert.equal(actual.size, expected.size, `${label}: key count`);
  for (const [key, expectedCount] of expected) {
    const actualCount = actual.get(key);
    assert.equal(actualCount, expectedCount, `${label}: first differing polygon ${key}`);
  }
}

function graphPairSet(graph, count) {
  const result = new Set();
  for (let cell = 0; cell < count; cell++) {
    for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) {
      const neighbor = graph.neighbors[k];
      if (cell < neighbor) result.add(pairKey(cell, neighbor));
    }
  }
  return result;
}

function independentDistances(boundary, adjacency) {
  const distance = new Uint16Array(boundary.length);
  distance.fill(0xffff);
  const queue = new Uint32Array(boundary.length);
  let head = 0;
  let tail = 0;
  for (let cell = 0; cell < boundary.length; cell++) {
    if (boundary[cell]) {
      distance[cell] = 0;
      queue[tail++] = cell;
    }
  }
  while (head < tail) {
    const cell = queue[head++];
    for (const neighbor of adjacency[cell]) {
      if (distance[neighbor] === 0xffff) {
        distance[neighbor] = distance[cell] + 1;
        queue[tail++] = neighbor;
      }
    }
  }
  return distance;
}

function reconstructTopology(patch) {
  const pointIds = new Map();
  const pointKeys = [];
  const pointCoordinates = [];
  const tilePoints = new Uint32Array(patch.tileCount * 4);
  const incident = [];

  for (let tile = 0; tile < patch.tileCount; tile++) {
    const seen = new Set();
    for (let vertex = 0; vertex < 4; vertex++) {
      const offset = (tile * 4 + vertex) * 2;
      const point = [patch.vertices[offset], patch.vertices[offset + 1]];
      const key = pointKey(point);
      let id = pointIds.get(key);
      if (id === undefined) {
        id = pointKeys.length;
        pointIds.set(key, id);
        pointKeys.push(key);
        pointCoordinates.push(point);
        incident.push([]);
      }
      assert(!seen.has(id), `depth ${patch.depth}: repeated polygon point`);
      seen.add(id);
      tilePoints[tile * 4 + vertex] = id;
      incident[id].push(tile);
    }
  }

  const edgeOwners = new Map();
  const edgePairs = new Set();
  for (let tile = 0; tile < patch.tileCount; tile++) {
    for (let vertex = 0; vertex < 4; vertex++) {
      const a = tilePoints[tile * 4 + vertex];
      const b = tilePoints[tile * 4 + ((vertex + 1) % 4)];
      const key = edgeKey(a, b);
      const owners = edgeOwners.get(key) || [];
      owners.push(tile);
      assert(owners.length <= 2, `depth ${patch.depth}: edge has more than two owners`);
      edgeOwners.set(key, owners);
      if (owners.length === 2) edgePairs.add(pairKey(owners[0], owners[1]));
    }
  }

  const edgeBoundary = new Uint8Array(patch.tileCount);
  const touchBoundary = new Uint8Array(patch.tileCount);
  const boundaryPoints = new Uint8Array(pointKeys.length);
  const boundaryAdjacency = Array.from({ length: pointKeys.length }, () => new Set());
  for (const [key, owners] of edgeOwners) {
    if (owners.length !== 1) continue;
    edgeBoundary[owners[0]] = 1;
    const [aText, bText] = key.split('|');
    const a = Number(aText);
    const b = Number(bText);
    boundaryPoints[a] = 1;
    boundaryPoints[b] = 1;
    boundaryAdjacency[a].add(b);
    boundaryAdjacency[b].add(a);
  }

  const touchPairs = new Set(edgePairs);
  for (let point = 0; point < incident.length; point++) {
    const owners = incident[point];
    if (boundaryPoints[point]) for (const tile of owners) touchBoundary[tile] = 1;
    for (let i = 0; i < owners.length; i++) {
      for (let j = i + 1; j < owners.length; j++) {
        touchPairs.add(pairKey(owners[i], owners[j]));
      }
    }
  }

  const adjacencyFromPairs = (pairs) => {
    const adjacency = Array.from({ length: patch.tileCount }, () => []);
    for (const key of pairs) {
      const [a, b] = key.split(',').map(Number);
      adjacency[a].push(b);
      adjacency[b].push(a);
    }
    return adjacency;
  };
  const edgeAdjacency = adjacencyFromPairs(edgePairs);
  const touchAdjacency = adjacencyFromPairs(touchPairs);

  const boundaryVertices = [];
  for (let point = 0; point < boundaryAdjacency.length; point++) {
    if (!boundaryPoints[point]) continue;
    boundaryVertices.push(point);
    assert.equal(boundaryAdjacency[point].size, 2, `depth ${patch.depth}: boundary vertex degree`);
  }
  const seenBoundary = new Set(boundaryVertices.length ? [boundaryVertices[0]] : []);
  const stack = boundaryVertices.length ? [boundaryVertices[0]] : [];
  while (stack.length) {
    const point = stack.pop();
    for (const next of boundaryAdjacency[point]) {
      if (!seenBoundary.has(next)) {
        seenBoundary.add(next);
        stack.push(next);
      }
    }
  }
  assert.equal(seenBoundary.size, boundaryVertices.length, `depth ${patch.depth}: boundary is not one cycle`);

  const boundaryCycle = [];
  if (boundaryVertices.length) {
    const start = boundaryVertices[0];
    let previous = -1;
    let current = start;
    do {
      boundaryCycle.push(current);
      const candidates = [...boundaryAdjacency[current]];
      const next = candidates[0] === previous ? candidates[1] : candidates[0];
      previous = current;
      current = next;
      assert(boundaryCycle.length <= boundaryVertices.length, `depth ${patch.depth}: boundary traversal repeated early`);
    } while (current !== start);
  }
  assert.equal(boundaryCycle.length, boundaryVertices.length, `depth ${patch.depth}: incomplete boundary traversal`);

  let boundaryArea2 = 0;
  for (let index = 0; index < boundaryCycle.length; index++) {
    const a = pointCoordinates[boundaryCycle[index]];
    const b = pointCoordinates[boundaryCycle[(index + 1) % boundaryCycle.length]];
    boundaryArea2 += a[0] * b[1] - b[0] * a[1];
  }
  const boundaryArea = Math.abs(boundaryArea2) / 2;

  const angleSum = new Float64Array(pointKeys.length);
  let tileArea2 = 0;
  for (let tile = 0; tile < patch.tileCount; tile++) {
    for (let vertex = 0; vertex < 4; vertex++) {
      const previousVertex = (vertex + 3) % 4;
      const nextVertex = (vertex + 1) % 4;
      const currentOffset = (tile * 4 + vertex) * 2;
      const previousOffset = (tile * 4 + previousVertex) * 2;
      const nextOffset = (tile * 4 + nextVertex) * 2;
      const cx = patch.vertices[currentOffset];
      const cy = patch.vertices[currentOffset + 1];
      const ax = patch.vertices[previousOffset] - cx;
      const ay = patch.vertices[previousOffset + 1] - cy;
      const bx = patch.vertices[nextOffset] - cx;
      const by = patch.vertices[nextOffset + 1] - cy;
      const cosine = Math.max(-1, Math.min(1, (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by))));
      angleSum[tilePoints[tile * 4 + vertex]] += Math.acos(cosine);
      tileArea2 += cx * patch.vertices[nextOffset + 1] - patch.vertices[nextOffset] * cy;
    }
  }
  const tileArea = tileArea2 / 2;
  const coverageDifference = Math.abs(tileArea - boundaryArea);
  assert(
    coverageDifference < Math.max(2e-4, patch.tileCount * 2e-6),
    `depth ${patch.depth}: tile area ${tileArea} differs from boundary area ${boundaryArea}`,
  );

  let maxInteriorAngleError = 0;
  for (let point = 0; point < pointKeys.length; point++) {
    if (boundaryPoints[point]) {
      assert(angleSum[point] > 0 && angleSum[point] < 2 * Math.PI + 2e-5, `depth ${patch.depth}: invalid boundary angle sum`);
    } else {
      const error = Math.abs(angleSum[point] - 2 * Math.PI);
      if (error > maxInteriorAngleError) maxInteriorAngleError = error;
      assert(error < 2e-5, `depth ${patch.depth}: interior angle gap/overlap ${error}`);
    }
  }

  return {
    pointCount: pointKeys.length,
    edgeCount: edgeOwners.size,
    edgePairs,
    touchPairs,
    edgeBoundary,
    touchBoundary,
    edgeDistance: independentDistances(edgeBoundary, edgeAdjacency),
    touchDistance: independentDistances(touchBoundary, touchAdjacency),
    euler: pointKeys.length - edgeOwners.size + patch.tileCount,
    boundaryVertices: boundaryVertices.length,
    tileArea,
    boundaryArea,
    coverageDifference,
    maxInteriorAngleError,
  };
}

function checkGeometry(patch) {
  let thin = 0;
  let thick = 0;
  for (let tile = 0; tile < patch.tileCount; tile++) {
    const points = [];
    for (let vertex = 0; vertex < 4; vertex++) {
      const offset = (tile * 4 + vertex) * 2;
      points.push([patch.vertices[offset], patch.vertices[offset + 1]]);
    }
    let area2 = 0;
    for (let vertex = 0; vertex < 4; vertex++) {
      const next = (vertex + 1) % 4;
      const side = Math.hypot(
        points[next][0] - points[vertex][0],
        points[next][1] - points[vertex][1],
      );
      assert(Math.abs(side - 1) < SIDE_TOLERANCE, `depth ${patch.depth}: side length ${side}`);
      area2 += points[vertex][0] * points[next][1] - points[next][0] * points[vertex][1];
    }
    assert(area2 > 0, `depth ${patch.depth}: clockwise or degenerate rhomb`);
    const area = area2 / 2;
    if (patch.tileTypes[tile] === 0) {
      thin++;
      assert(Math.abs(area - THIN_AREA) < AREA_TOLERANCE, `depth ${patch.depth}: thin area ${area}`);
    } else {
      thick++;
      assert(Math.abs(area - THICK_AREA) < AREA_TOLERANCE, `depth ${patch.depth}: thick area ${area}`);
    }
    assert(
      Math.hypot(
        points[0][0] + points[2][0] - points[1][0] - points[3][0],
        points[0][1] + points[2][1] - points[1][1] - points[3][1],
      ) < SIDE_TOLERANCE,
      `depth ${patch.depth}: not a parallelogram`,
    );
  }
  assert.deepEqual({ thin, thick }, patch.typeCounts);
}

const depths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
for (const seed of ['sun', 'sun-mirror']) {
  for (const depth of depths) {
    const patch = buildPenrosePatch(depth, { seed });
    checkGeometry(patch);

    const independent = independentRhombMultiset(depth, seed === 'sun-mirror');
    assert.equal(independent.triangles, patch.triangleCount, `${seed} depth ${depth}: triangle count`);
    assert.equal(independent.unmatched, patch.unmatchedHalfTriangles, `${seed} depth ${depth}: unmatched halves`);
    assertMapEqual(productionRhombMultiset(patch), independent.rhombs, `${seed} depth ${depth}: rhomb geometry`);

    const topology = reconstructTopology(patch);
    assert.equal(topology.euler, 1, `${seed} depth ${depth}: Euler characteristic`);
    assert.deepEqual(graphPairSet(patch.edgeGraph, patch.tileCount), topology.edgePairs);
    assert.deepEqual(graphPairSet(patch.touchGraph, patch.tileCount), topology.touchPairs);
    assert.deepEqual(patch.edgeBoundary, topology.edgeBoundary);
    assert.deepEqual(patch.touchBoundary, topology.touchBoundary);
    assert.deepEqual(patch.edgeBoundaryDistance, topology.edgeDistance);
    assert.deepEqual(patch.touchBoundaryDistance, topology.touchDistance);
    assert.equal(patch.edgeGraph.maxDegree, 4);
    assert(patch.touchGraph.maxDegree <= 11);

    console.log(JSON.stringify({
      seed,
      depth,
      tiles: patch.tileCount,
      thin: patch.typeCounts.thin,
      thick: patch.typeCounts.thick,
      points: topology.pointCount,
      edges: topology.edgeCount,
      edgePairs: topology.edgePairs.size,
      touchPairs: topology.touchPairs.size,
      edgeBoundary: patch.edgeBoundaryCount,
      touchBoundary: patch.touchBoundaryCount,
      boundaryVertices: topology.boundaryVertices,
      euler: topology.euler,
      coverageDifference: topology.coverageDifference,
      maxInteriorAngleError: topology.maxInteriorAngleError,
      buildMs: Number(patch.buildMilliseconds.toFixed(1)),
    }));
  }
}

console.log('independent Penrose geometry and topology reconstruction passed');
