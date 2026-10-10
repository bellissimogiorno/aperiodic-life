'use strict';

// Memory-conscious independent reconstruction of finite-patch boundary cells.
// Unlike core.js, this encodes elementary segments directly from emitted
// polygon coordinates rather than reusing production point IDs or edge maps.

const assert = require('assert');
const Core = require('./core.js');

const POINT_BIAS = 1 << 15;
const POINT_BASE = 1 << 16;
const DIRECTIONS = new Map([
  ['0,2', 0],
  ['1,-1', 1],
  ['1,1', 2],
  ['2,0', 3],
  ['3,-1', 4],
  ['3,1', 5],
]);
const DIRECTION_VECTORS = [[0, 2], [1, -1], [1, 1], [2, 0], [3, -1], [3, 1]];

function latticePoint(x, y) {
  return {
    qx: Math.round(x * 4),
    qy: Math.round((y / Core.HALF_SQRT3) * 2),
  };
}

function pointKey(qx, qy) {
  assert(qx >= -POINT_BIAS && qx < POINT_BIAS, `qx out of range: ${qx}`);
  assert(qy >= -POINT_BIAS && qy < POINT_BIAS, `qy out of range: ${qy}`);
  return (qx + POINT_BIAS) * POINT_BASE + (qy + POINT_BIAS);
}

function segmentKey(a, b) {
  let start = a;
  let end = b;
  if (end.qx < start.qx || (end.qx === start.qx && end.qy < start.qy)) {
    start = b;
    end = a;
  }
  const dx = end.qx - start.qx;
  const dy = end.qy - start.qy;
  const direction = DIRECTIONS.get(`${dx},${dy}`);
  assert.notEqual(direction, undefined, `unexpected elementary direction ${dx},${dy}`);
  return pointKey(start.qx, start.qy) * 8 + direction;
}

function segmentEndpoints(key) {
  const direction = key % 8;
  const packed = Math.floor(key / 8);
  const qx = Math.floor(packed / POINT_BASE) - POINT_BIAS;
  const qy = packed % POINT_BASE - POINT_BIAS;
  const vector = DIRECTION_VECTORS[direction];
  assert(vector, `invalid direction code ${direction}`);
  return [pointKey(qx, qy), pointKey(qx + vector[0], qy + vector[1])];
}

function elementaryPoints(patch, tile, edge) {
  const m = patch.verticesPerTile;
  const aOffset = (tile * m + edge) * 2;
  const bOffset = (tile * m + ((edge + 1) % m)) * 2;
  const a = latticePoint(patch.vertices[aOffset], patch.vertices[aOffset + 1]);
  const b = latticePoint(patch.vertices[bOffset], patch.vertices[bOffset + 1]);
  const dx = (b.qx - a.qx) / 4;
  const dy = (b.qy - a.qy) * Core.HALF_SQRT3 / 2;
  if (dx * dx + dy * dy > 0.9) {
    assert.equal((a.qx + b.qx) % 2, 0, 'non-lattice long-edge midpoint x');
    assert.equal((a.qy + b.qy) % 2, 0, 'non-lattice long-edge midpoint y');
    return [a, { qx: (a.qx + b.qx) / 2, qy: (a.qy + b.qy) / 2 }, b];
  }
  return [a, b];
}

function bfs(boundary, graph) {
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
    const next = distance[cell] + 1;
    for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) {
      const neighbor = graph.neighbors[k];
      if (distance[neighbor] === 0xffff) {
        distance[neighbor] = next;
        queue[tail++] = neighbor;
      }
    }
  }
  assert.equal(tail, boundary.length, 'boundary BFS did not cover patch');
  return distance;
}

function main() {
  const patch = Core.buildEinsteinPatch(6);
  const segmentOwners = new Map();
  const m = patch.verticesPerTile;

  for (let tile = 0; tile < patch.tileCount; tile++) {
    for (let edge = 0; edge < m; edge++) {
      const points = elementaryPoints(patch, tile, edge);
      for (let part = 0; part + 1 < points.length; part++) {
        const key = segmentKey(points[part], points[part + 1]);
        const owner = segmentOwners.get(key);
        if (owner === undefined) segmentOwners.set(key, tile);
        else if (owner !== tile) segmentOwners.set(key, -1);
      }
    }
  }

  const edgeBoundary = new Uint8Array(patch.tileCount);
  const boundaryPoints = new Set();
  let boundarySegments = 0;
  for (const [key, owner] of segmentOwners) {
    if (owner >= 0) {
      edgeBoundary[owner] = 1;
      boundarySegments++;
      const [a, b] = segmentEndpoints(key);
      boundaryPoints.add(a);
      boundaryPoints.add(b);
    }
  }

  const touchBoundary = new Uint8Array(patch.tileCount);
  for (let tile = 0; tile < patch.tileCount; tile++) {
    let touches = false;
    for (let edge = 0; edge < m && !touches; edge++) {
      for (const point of elementaryPoints(patch, tile, edge)) {
        if (boundaryPoints.has(pointKey(point.qx, point.qy))) {
          touches = true;
          break;
        }
      }
    }
    if (touches) touchBoundary[tile] = 1;
  }

  let edgeCount = 0;
  let touchCount = 0;
  const pointOnly = [];
  for (let cell = 0; cell < patch.tileCount; cell++) {
    edgeCount += edgeBoundary[cell];
    touchCount += touchBoundary[cell];
    assert.equal(edgeBoundary[cell], patch.edgeBoundary[cell], `edge boundary mismatch ${cell}`);
    assert.equal(touchBoundary[cell], patch.touchBoundary[cell], `touch boundary mismatch ${cell}`);
    if (touchBoundary[cell] && !edgeBoundary[cell]) pointOnly.push(cell);
  }

  const edgeDistance = bfs(edgeBoundary, patch.edgeGraph);
  const touchDistance = bfs(touchBoundary, patch.touchGraph);
  for (let cell = 0; cell < patch.tileCount; cell++) {
    assert.equal(edgeDistance[cell], patch.edgeBoundaryDistance[cell], `edge distance mismatch ${cell}`);
    assert.equal(touchDistance[cell], patch.touchBoundaryDistance[cell], `touch distance mismatch ${cell}`);
  }

  console.log(JSON.stringify({
    cells: patch.tileCount,
    elementarySegments: segmentOwners.size,
    boundarySegments,
    boundaryPoints: boundaryPoints.size,
    edgeBoundaryCells: edgeCount,
    touchBoundaryCells: touchCount,
    pointOnlyTouchBoundaryCells: pointOnly,
  }));
}

main();
