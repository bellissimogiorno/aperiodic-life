'use strict';
const assert = require('assert');
const { buildEinsteinPatch } = require('./core.js');

function connectedCount(graph, count) {
  const seen = new Uint8Array(count);
  const queue = new Uint32Array(count);
  let head = 0;
  let tail = 1;
  queue[0] = 0;
  seen[0] = 1;
  while (head < tail) {
    const cell = queue[head++];
    for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) {
      const neighbor = graph.neighbors[k];
      if (!seen[neighbor]) {
        seen[neighbor] = 1;
        queue[tail++] = neighbor;
      }
    }
  }
  return tail;
}

const patch = buildEinsteinPatch(6);
assert.equal(patch.tileCount, 372100);
assert.equal(connectedCount(patch.edgeGraph, patch.tileCount), patch.tileCount);
assert.equal(connectedCount(patch.touchGraph, patch.tileCount), patch.tileCount);
assert.equal(patch.edgeGraph.maxDegree, 6);
assert.equal(patch.touchGraph.maxDegree, 7);
for (let cell = 0; cell < patch.tileCount; cell++) {
  assert.notEqual(patch.edgeBoundaryDistance[cell], 0xffff);
  assert.notEqual(patch.touchBoundaryDistance[cell], 0xffff);
  assert.equal(patch.edgeBoundaryDistance[cell] === 0, patch.edgeBoundary[cell] === 1);
  assert.equal(patch.touchBoundaryDistance[cell] === 0, patch.touchBoundary[cell] === 1);
}
console.log(JSON.stringify({
  cells: patch.tileCount,
  buildMilliseconds: patch.buildMilliseconds,
  edgeEntries: patch.edgeGraph.neighbors.length,
  touchEntries: patch.touchGraph.neighbors.length,
  edgeBoundaryCells: patch.edgeBoundaryCount,
  touchBoundaryCells: patch.touchBoundaryCount,
}));
