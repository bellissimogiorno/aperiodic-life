'use strict';

const assert = require('assert');
const {
  buildPenrosePatch,
  Automaton,
} = require('./core.js');

function connectedCount(graph, count) {
  const seen = new Uint8Array(count);
  const queue = new Uint32Array(count);
  let head = 0;
  let tail = count ? 1 : 0;
  if (count) seen[0] = 1;
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

function runDepth11(seed) {
  const patch = buildPenrosePatch(11, { seed });
  assert.equal(patch.tileCount, 143010);
  assert.equal(patch.triangleCount, 286570);
  assert.equal(patch.unmatchedHalfTriangles, 550);
  assert.deepEqual(patch.typeCounts, { thin: 54655, thick: 88355 });
  assert.equal(patch.exactPointCount, 143806);
  assert.equal(patch.edgeGraph.edgeCount, 285225);
  assert.equal(patch.touchGraph.edgeCount, 673770);
  assert.equal(patch.edgeBoundaryCount, 1195);
  assert.equal(patch.touchBoundaryCount, 1825);
  assert.equal(patch.edgeGraph.maxDegree, 4);
  assert.equal(patch.touchGraph.maxDegree, 11);
  assert.equal(connectedCount(patch.edgeGraph, patch.tileCount), patch.tileCount);
  assert.equal(connectedCount(patch.touchGraph, patch.tileCount), patch.tileCount);

  for (let cell = 0; cell < patch.tileCount; cell++) {
    assert.notEqual(patch.edgeBoundaryDistance[cell], 0xffff);
    assert.notEqual(patch.touchBoundaryDistance[cell], 0xffff);
    assert.equal(patch.edgeBoundaryDistance[cell] === 0, patch.edgeBoundary[cell] === 1);
    assert.equal(patch.touchBoundaryDistance[cell] === 0, patch.touchBoundary[cell] === 1);
  }

  // The display coordinates are Float32, but their independently quantised
  // vertex set must still have one member for every canonical exact point.
  const visiblePoints = new Set();
  for (let offset = 0; offset < patch.vertices.length; offset += 2) {
    visiblePoints.add(
      `${Math.round(patch.vertices[offset] * 1000)},${Math.round(patch.vertices[offset + 1] * 1000)}`,
    );
  }
  assert.equal(visiblePoints.size, patch.exactPointCount);

  for (let tile = 0; tile < patch.tileCount; tile += 997) {
    for (let vertex = 0; vertex < 4; vertex++) {
      const current = (tile * 4 + vertex) * 2;
      const next = (tile * 4 + ((vertex + 1) % 4)) * 2;
      const length = Math.hypot(
        patch.vertices[next] - patch.vertices[current],
        patch.vertices[next + 1] - patch.vertices[current + 1],
      );
      assert(Math.abs(length - 1) < 5e-5, `non-unit side at tile ${tile}`);
    }
  }

  const automaton = new Automaton(patch, patch.touchGraph, {
    rule: 'B[10]/S[9,10]',
    generations: 5,
    borderRings: 2,
  });
  automaton.randomize(0.23, `penrose-depth-11-smoke-${seed}`);
  for (let step = 0; step < 20; step++) automaton.step();
  assert.equal(automaton.generation, 20);
  for (const value of automaton.state) assert(value < 5);

  return {
    cells: patch.tileCount,
    triangles: patch.triangleCount,
    exactPoints: patch.exactPointCount,
    edgeEntries: patch.edgeGraph.neighbors.length,
    touchEntries: patch.touchGraph.neighbors.length,
    edgeBoundaryCells: patch.edgeBoundaryCount,
    touchBoundaryCells: patch.touchBoundaryCount,
    aliveAfter20: automaton.aliveCount(),
    seed,
    buildMilliseconds: patch.buildMilliseconds,
  };
}

for (const seed of ['sun', 'sun-mirror']) {
  console.log(JSON.stringify(runDepth11(seed)));
}

console.log('Penrose depth-11 smoke tests passed for both seeds');
