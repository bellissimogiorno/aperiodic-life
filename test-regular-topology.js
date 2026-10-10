'use strict';

const assert = require('assert');
const {
  SQRT3,
  SQUARE_OUTLINE,
  HEX_OUTLINE,
  buildSquarePatch,
  buildHexPatch,
} = require('./core.js');

function pairKey(a, b, count) {
  return Math.min(a, b) * count + Math.max(a, b);
}

function graphPairs(graph, count) {
  const pairs = new Set();
  for (let cell = 0; cell < count; cell++) {
    for (let cursor = graph.offsets[cell]; cursor < graph.offsets[cell + 1]; cursor++) {
      const neighbor = graph.neighbors[cursor];
      if (cell < neighbor) pairs.add(pairKey(cell, neighbor, count));
    }
  }
  return pairs;
}

function independentDistances(boundary, pairs, count) {
  const adjacency = Array.from({ length: count }, () => []);
  for (const key of pairs) {
    const a = Math.floor(key / count);
    const b = key % count;
    adjacency[a].push(b);
    adjacency[b].push(a);
  }
  const distances = new Uint16Array(count);
  distances.fill(0xffff);
  const queue = new Uint32Array(count);
  let head = 0;
  let tail = 0;
  for (let cell = 0; cell < count; cell++) {
    if (boundary[cell]) {
      distances[cell] = 0;
      queue[tail++] = cell;
    }
  }
  while (head < tail) {
    const cell = queue[head++];
    const nextDistance = distances[cell] + 1;
    for (const neighbor of adjacency[cell]) {
      if (distances[neighbor] === 0xffff) {
        distances[neighbor] = nextDistance;
        queue[tail++] = neighbor;
      }
    }
  }
  return distances;
}

function compareTyped(actual, expected, message) {
  assert.equal(actual.length, expected.length, `${message}: length`);
  for (let i = 0; i < actual.length; i++) assert.equal(actual[i], expected[i], `${message}: index ${i}`);
}

const squareResults = [];
for (const size of [3, 8, 25, 51, 101]) {
  const patch = buildSquarePatch(size);
  const byCoordinate = new Map();
  for (let cell = 0; cell < patch.tileCount; cell++) {
    const x = patch.coordinates[cell * 2];
    const y = patch.coordinates[cell * 2 + 1];
    assert(!byCoordinate.has(`${x},${y}`), `square ${size}: duplicate coordinate`);
    byCoordinate.set(`${x},${y}`, cell);
    const centerOffset = Math.floor(size / 2) - size / 2 + 0.5;
    assert(Math.abs(patch.centers[cell * 2] - (x + centerOffset)) < 1e-6, `square ${size}: centre x`);
    assert(Math.abs(patch.centers[cell * 2 + 1] - (y + centerOffset)) < 1e-6, `square ${size}: centre y`);
  }

  const edgePairs = new Set();
  const touchPairs = new Set();
  const edgeDirections = [[1, 0], [0, 1]];
  const diagonalDirections = [[1, 1], [1, -1]];
  for (const [coordinate, cell] of byCoordinate) {
    const [x, y] = coordinate.split(',').map(Number);
    for (const [dx, dy] of edgeDirections) {
      const neighbor = byCoordinate.get(`${x + dx},${y + dy}`);
      if (neighbor !== undefined) {
        edgePairs.add(pairKey(cell, neighbor, patch.tileCount));
        touchPairs.add(pairKey(cell, neighbor, patch.tileCount));
      }
    }
    for (const [dx, dy] of diagonalDirections) {
      const neighbor = byCoordinate.get(`${x + dx},${y + dy}`);
      if (neighbor !== undefined) touchPairs.add(pairKey(cell, neighbor, patch.tileCount));
    }
  }

  assert.deepEqual(graphPairs(patch.edgeGraph, patch.tileCount), edgePairs, `square ${size}: edge pairs`);
  assert.deepEqual(graphPairs(patch.touchGraph, patch.tileCount), touchPairs, `square ${size}: touch pairs`);
  assert.equal(edgePairs.size, 2 * size * (size - 1));
  assert.equal(touchPairs.size, 4 * size * size - 6 * size + 2);
  assert.equal(patch.edgeBoundaryCount, 4 * size - 4);
  assert.equal(patch.touchBoundaryCount, 4 * size - 4);
  compareTyped(
    patch.edgeBoundaryDistance,
    independentDistances(patch.edgeBoundary, edgePairs, patch.tileCount),
    `square ${size}: edge distances`,
  );
  compareTyped(
    patch.touchBoundaryDistance,
    independentDistances(patch.touchBoundary, touchPairs, patch.tileCount),
    `square ${size}: touch distances`,
  );
  squareResults.push({ size, cells: patch.tileCount, edgePairs: edgePairs.size, touchPairs: touchPairs.size });
}

const expectedSquareArea = 1;
let squareArea = 0;
for (let i = 0, j = SQUARE_OUTLINE.length - 1; i < SQUARE_OUTLINE.length; j = i++) {
  squareArea += SQUARE_OUTLINE[j].x * SQUARE_OUTLINE[i].y - SQUARE_OUTLINE[i].x * SQUARE_OUTLINE[j].y;
}
assert.equal(Math.abs(squareArea / 2), expectedSquareArea);

const hexResults = [];
const directions = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
for (const radius of [1, 2, 8, 16, 32, 64]) {
  const patch = buildHexPatch(radius);
  const byCoordinate = new Map();
  for (let cell = 0; cell < patch.tileCount; cell++) {
    const q = patch.coordinates[cell * 2];
    const r = patch.coordinates[cell * 2 + 1];
    assert(Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)) <= radius, `hex ${radius}: outside board`);
    assert(!byCoordinate.has(`${q},${r}`), `hex ${radius}: duplicate coordinate`);
    byCoordinate.set(`${q},${r}`, cell);
    assert(Math.abs(patch.centers[cell * 2] - SQRT3 * (q + r / 2)) < 1e-4, `hex ${radius}: centre x`);
    assert(Math.abs(patch.centers[cell * 2 + 1] - 1.5 * r) < 1e-4, `hex ${radius}: centre y`);
  }

  const pairs = new Set();
  for (const [coordinate, cell] of byCoordinate) {
    const [q, r] = coordinate.split(',').map(Number);
    for (const [dq, dr] of directions) {
      const neighbor = byCoordinate.get(`${q + dq},${r + dr}`);
      if (neighbor !== undefined && cell < neighbor) pairs.add(pairKey(cell, neighbor, patch.tileCount));
    }
  }
  const expectedCells = 1 + 3 * radius * (radius + 1);
  const expectedPairs = 3 * radius * (3 * radius + 1);
  assert.equal(patch.tileCount, expectedCells);
  assert.equal(pairs.size, expectedPairs);
  assert.deepEqual(graphPairs(patch.edgeGraph, patch.tileCount), pairs, `hex ${radius}: edge pairs`);
  assert.deepEqual(graphPairs(patch.touchGraph, patch.tileCount), pairs, `hex ${radius}: touch pairs`);
  assert.equal(patch.edgeBoundaryCount, 6 * radius);
  assert.equal(patch.touchBoundaryCount, 6 * radius);
  compareTyped(
    patch.edgeBoundaryDistance,
    independentDistances(patch.edgeBoundary, pairs, patch.tileCount),
    `hex ${radius}: edge distances`,
  );
  compareTyped(
    patch.touchBoundaryDistance,
    independentDistances(patch.touchBoundary, pairs, patch.tileCount),
    `hex ${radius}: touch distances`,
  );
  hexResults.push({ radius, cells: patch.tileCount, pairs: pairs.size });
}

let hexArea = 0;
for (let i = 0, j = HEX_OUTLINE.length - 1; i < HEX_OUTLINE.length; j = i++) {
  const dx = HEX_OUTLINE[i].x - HEX_OUTLINE[j].x;
  const dy = HEX_OUTLINE[i].y - HEX_OUTLINE[j].y;
  assert(Math.abs(Math.hypot(dx, dy) - 1) < 1e-12, `hex outline side ${i}`);
  hexArea += HEX_OUTLINE[j].x * HEX_OUTLINE[i].y - HEX_OUTLINE[i].x * HEX_OUTLINE[j].y;
}
assert(Math.abs(Math.abs(hexArea / 2) - 3 * SQRT3 / 2) < 1e-12);

console.log(JSON.stringify({ square: squareResults, hex: hexResults }, null, 2));
console.log('independent regular-grid topology reconstruction passed');
