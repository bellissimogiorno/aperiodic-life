'use strict';

const assert = require('assert');
const {
  HAT_OUTLINE,
  SQUARE_OUTLINE,
  HEX_OUTLINE,
  PENROSE_OUTLINE,
  PATCH_OPTIONS,
  buildPatch,
  buildSquarePatch,
  buildHexPatch,
  buildEinsteinPatch,
  buildPenrosePatch,
  parseRule,
  formatRule,
  hashSeed,
  mulberry32,
  Automaton,
  PickingIndex,
  pointInTile,
} = require('./core.js');

for (const outline of [HAT_OUTLINE, SQUARE_OUTLINE, HEX_OUTLINE, PENROSE_OUTLINE]) {
  assert(Object.isFrozen(outline), 'exported outlines must be frozen');
  for (const point of outline) assert(Object.isFrozen(point), 'exported outline points must be frozen');
}

assert.equal(HAT_OUTLINE.length, 13, 'hat outline vertex count');
const hatLongEdges = [];
for (let edge = 0; edge < HAT_OUTLINE.length; edge++) {
  const a = HAT_OUTLINE[edge];
  const b = HAT_OUTLINE[(edge + 1) % HAT_OUTLINE.length];
  const squaredLength = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (Math.abs(squaredLength - 4) < 1e-12) hatLongEdges.push(edge);
  else assert(
    Math.abs(squaredLength - 1) < 1e-12 || Math.abs(squaredLength - 3) < 1e-12,
    `hat outline edge ${edge} has an unexpected squared length`,
  );
}
assert.deepEqual(hatLongEdges, [2], 'hat outline must have exactly one double-length side');

function pairSet(graph, count) {
  const pairs = new Set();
  for (let cell = 0; cell < count; cell++) {
    for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) {
      const neighbor = graph.neighbors[k];
      if (cell < neighbor) pairs.add(cell * count + neighbor);
    }
  }
  return pairs;
}

function validateGraph(graph, count, name) {
  assert.equal(graph.offsets.length, count + 1, `${name}: offsets length`);
  assert.equal(graph.offsets[0], 0, `${name}: first offset`);
  assert.equal(graph.offsets[count], graph.neighbors.length, `${name}: terminal offset`);
  assert.equal(graph.degree.length, count, `${name}: degree length`);
  assert.equal(graph.neighbors.length, graph.edgeCount * 2, `${name}: undirected entry count`);
  assert.equal(graph.boundary.length, count, `${name}: boundary length`);
  assert.equal(graph.boundaryDistance.length, count, `${name}: boundary-distance length`);

  let degreeSum = 0;
  let histogramCount = 0;
  let histogramDegreeSum = 0;
  for (let degree = 0; degree < graph.histogram.length; degree++) {
    histogramCount += graph.histogram[degree];
    histogramDegreeSum += degree * graph.histogram[degree];
  }
  assert.equal(histogramCount, count, `${name}: histogram population`);

  for (let cell = 0; cell < count; cell++) {
    const start = graph.offsets[cell];
    const end = graph.offsets[cell + 1];
    assert(end >= start, `${name}: monotone offsets`);
    assert.equal(end - start, graph.degree[cell], `${name}: degree at ${cell}`);
    degreeSum += graph.degree[cell];
    const seen = new Set();
    for (let k = start; k < end; k++) {
      const neighbor = graph.neighbors[k];
      assert(neighbor < count, `${name}: neighbour range`);
      assert.notEqual(neighbor, cell, `${name}: self loop`);
      assert(!seen.has(neighbor), `${name}: duplicate neighbour ${cell}->${neighbor}`);
      seen.add(neighbor);
      let symmetric = false;
      for (let q = graph.offsets[neighbor]; q < graph.offsets[neighbor + 1]; q++) {
        if (graph.neighbors[q] === cell) {
          symmetric = true;
          break;
        }
      }
      assert(symmetric, `${name}: asymmetric edge ${cell}<->${neighbor}`);
    }
  }
  assert.equal(degreeSum, graph.neighbors.length, `${name}: degree sum`);
  assert.equal(histogramDegreeSum, degreeSum, `${name}: histogram degree sum`);
  assert.equal(graph.maxDegree, Math.max(...graph.degree), `${name}: max degree`);
  assert(Math.abs(graph.averageDegree - degreeSum / count) < 1e-12, `${name}: average degree`);

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
  assert.equal(tail, count, `${name}: graph connected`);
}

function validateBoundaryDistance(patch, graph, name) {
  for (let cell = 0; cell < patch.tileCount; cell++) {
    const distance = graph.boundaryDistance[cell];
    assert.notEqual(distance, 0xffff, `${name}: unreachable boundary distance`);
    assert.equal(distance === 0, graph.boundary[cell] === 1, `${name}: boundary zero at ${cell}`);
    if (distance > 0) {
      let predecessor = false;
      for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) {
        if (graph.boundaryDistance[graph.neighbors[k]] === distance - 1) {
          predecessor = true;
          break;
        }
      }
      assert(predecessor, `${name}: no shortest-path predecessor for ${cell}`);
    }
  }
}

const expectedCounts = [4, 25, 169, 1156, 7921, 54289];
const expectedEdgeBoundaryCounts = [4, 15, 60, 228, 855, 3195];
const expectedTouchBoundaryCounts = [4, 15, 62, 228, 857, 3195];
let largestPatch;
for (let depth = 0; depth < expectedCounts.length; depth++) {
  const patch = buildEinsteinPatch(depth);
  if (depth === expectedCounts.length - 1) largestPatch = patch;
  assert.equal(patch.tileCount, expectedCounts[depth], `depth ${depth}: tile count`);
  assert.equal(patch.verticesPerTile, HAT_OUTLINE.length);
  assert.equal(patch.transforms.length, patch.tileCount * 6);
  assert.equal(patch.vertices.length, patch.tileCount * patch.verticesPerTile * 2);
  assert.equal(patch.centers.length, patch.tileCount * 2);
  assert.equal(patch.bboxes.length, patch.tileCount * 4);
  assert.equal(patch.boundary.length, patch.tileCount);
  assert.equal(patch.edgeBoundary.length, patch.tileCount);
  assert.equal(patch.touchBoundary.length, patch.tileCount);
  assert.strictEqual(patch.boundary, patch.edgeBoundary);
  assert.strictEqual(patch.boundaryDistance, patch.edgeBoundaryDistance);
  assert.strictEqual(patch.edgeGraph.boundary, patch.edgeBoundary);
  assert.strictEqual(patch.touchGraph.boundary, patch.touchBoundary);
  assert.strictEqual(patch.edgeGraph.boundaryDistance, patch.edgeBoundaryDistance);
  assert.strictEqual(patch.touchGraph.boundaryDistance, patch.touchBoundaryDistance);
  assert.equal(patch.edgeBoundaryCount, expectedEdgeBoundaryCounts[depth]);
  assert.equal(patch.touchBoundaryCount, expectedTouchBoundaryCounts[depth]);
  assert.equal(patch.boundaryCount, patch.edgeBoundaryCount);

  validateGraph(patch.edgeGraph, patch.tileCount, `depth ${depth} edge`);
  validateGraph(patch.touchGraph, patch.tileCount, `depth ${depth} touch`);
  validateBoundaryDistance(patch, patch.edgeGraph, `depth ${depth} edge`);
  validateBoundaryDistance(patch, patch.touchGraph, `depth ${depth} touch`);

  const edgePairs = pairSet(patch.edgeGraph, patch.tileCount);
  const touchPairs = pairSet(patch.touchGraph, patch.tileCount);
  for (const pair of edgePairs) assert(touchPairs.has(pair), `depth ${depth}: edge contact missing from touch graph`);

  let edgeBoundaryCount = 0;
  let touchBoundaryCount = 0;
  for (const value of patch.edgeBoundary) edgeBoundaryCount += value;
  for (const value of patch.touchBoundary) touchBoundaryCount += value;
  assert.equal(edgeBoundaryCount, patch.edgeBoundaryCount, `depth ${depth}: edge boundary count`);
  assert.equal(touchBoundaryCount, patch.touchBoundaryCount, `depth ${depth}: touch boundary count`);
  for (let cell = 0; cell < patch.tileCount; cell++) {
    if (patch.edgeBoundary[cell]) assert(patch.touchBoundary[cell], `depth ${depth}: edge boundary not in touch boundary`);
  }

  const picking = new PickingIndex(patch);
  const stride = Math.max(1, Math.floor(patch.tileCount / 1000));
  for (let tile = 0; tile < patch.tileCount; tile += stride) {
    const x = patch.centers[tile * 2];
    const y = patch.centers[tile * 2 + 1];
    assert(pointInTile(patch, tile, x, y), `depth ${depth}: centre outside tile ${tile}`);
    assert.equal(picking.find(x, y), tile, `depth ${depth}: centre pick ${tile}`);
    for (let vertex = 0; vertex < patch.verticesPerTile; vertex++) {
      const next = (vertex + 1) % patch.verticesPerTile;
      const offset = (tile * patch.verticesPerTile + vertex) * 2;
      const nextOffset = (tile * patch.verticesPerTile + next) * 2;
      const midpointX = (patch.vertices[offset] + patch.vertices[nextOffset]) / 2;
      const midpointY = (patch.vertices[offset + 1] + patch.vertices[nextOffset + 1]) / 2;
      assert(
        pointInTile(patch, tile, midpointX, midpointY),
        `depth ${depth}: edge midpoint outside tile ${tile}`,
      );
      assert.notEqual(
        picking.find(midpointX, midpointY),
        -1,
        `depth ${depth}: edge midpoint was not pickable`,
      );
    }
  }

  console.log(
    `depth=${depth} cells=${patch.tileCount} edgeEdges=${patch.edgeGraph.edgeCount} ` +
    `touchEdges=${patch.touchGraph.edgeCount} build=${patch.buildMilliseconds.toFixed(1)}ms`,
  );
}

assert.throws(() => buildEinsteinPatch(-1), /depth/);
assert.throws(() => buildEinsteinPatch(1.5), /depth/);
assert.throws(() => buildEinsteinPatch(7), /depth/);

const penroseDepths = [2, 4, 6, 8, 10];
const penroseCounts = [20, 160, 1140, 7920, 54560];
const penroseThinCounts = [10, 60, 440, 3030, 20860];
const penroseThickCounts = [10, 100, 700, 4890, 33700];
const penroseEdgeCounts = [30, 290, 2210, 15650, 108630];
const penroseTouchCounts = [60, 680, 5150, 36860, 256430];
const penroseEdgeBoundaryCounts = [15, 40, 100, 280, 730];
const penroseTouchBoundaryCounts = [15, 55, 160, 425, 1130];
let largestPenrosePatch;

assert.deepEqual(
  PATCH_OPTIONS.penrose.map((entry) => [entry.depth, entry.tileCount]),
  penroseDepths.map((depth, index) => [depth, penroseCounts[index]]),
);
assert.deepEqual(
  PATCH_OPTIONS.hat.map((entry) => [entry.depth, entry.tileCount]),
  expectedCounts.slice(1).map((tileCount, index) => [index + 1, tileCount]),
);
assert.equal(buildPatch('einstein', 1).tileCount, 25);
assert.equal(buildPatch('penrose-p3', 2).tileCount, 20);
assert.equal(buildPatch('square-grid', 3).tileCount, 9);
assert.equal(buildPatch('hexagonal', 2).tileCount, 19);
assert.throws(() => buildPatch('octagonal', 2), /Unknown tiling/);


assert.deepEqual(
  PATCH_OPTIONS.square.map((entry) => [entry.depth, entry.tileCount]),
  [[25, 625], [51, 2601], [101, 10201], [201, 40401], [301, 90601]],
);
assert.deepEqual(
  PATCH_OPTIONS.hex.map((entry) => [entry.depth, entry.tileCount]),
  [[8, 217], [16, 817], [32, 3169], [64, 12481], [128, 49537]],
);

const squarePatch = buildSquarePatch(25);
assert.equal(squarePatch.tileCount, 625);
assert.equal(squarePatch.verticesPerTile, SQUARE_OUTLINE.length);
assert.equal(squarePatch.edgeGraph.edgeCount, 2 * 25 * 24);
assert.equal(squarePatch.touchGraph.edgeCount, 4 * 25 * 25 - 6 * 25 + 2);
assert.equal(squarePatch.edgeGraph.maxDegree, 4);
assert.equal(squarePatch.touchGraph.maxDegree, 8);
assert.equal(squarePatch.edgeBoundaryCount, 4 * 25 - 4);
assert.equal(squarePatch.touchBoundaryCount, 4 * 25 - 4);
validateGraph(squarePatch.edgeGraph, squarePatch.tileCount, 'square edge');
validateGraph(squarePatch.touchGraph, squarePatch.tileCount, 'square touch');
validateBoundaryDistance(squarePatch, squarePatch.edgeGraph, 'square edge');
validateBoundaryDistance(squarePatch, squarePatch.touchGraph, 'square touch');
const squarePicking = new PickingIndex(squarePatch, squarePatch.pickingCellSize);
for (let cell = 0; cell < squarePatch.tileCount; cell += 17) {
  assert.equal(squarePicking.find(squarePatch.centers[cell * 2], squarePatch.centers[cell * 2 + 1]), cell);
}
assert.throws(() => buildSquarePatch(2), /square size/);
assert.throws(() => buildSquarePatch(3.5), /square size/);

const hexPatch = buildHexPatch(8);
assert.equal(hexPatch.tileCount, 1 + 3 * 8 * 9);
assert.equal(hexPatch.latticePointCount, 6 * 9 ** 2);
assert.equal(hexPatch.verticesPerTile, HEX_OUTLINE.length);
assert.equal(hexPatch.edgeGraph.maxDegree, 6);
assert.equal(hexPatch.touchGraph.maxDegree, 6);
assert.equal(hexPatch.edgeBoundaryCount, 6 * 8);
assert.equal(hexPatch.touchBoundaryCount, 6 * 8);
validateGraph(hexPatch.edgeGraph, hexPatch.tileCount, 'hex edge');
validateGraph(hexPatch.touchGraph, hexPatch.tileCount, 'hex touch');
validateBoundaryDistance(hexPatch, hexPatch.edgeGraph, 'hex edge');
validateBoundaryDistance(hexPatch, hexPatch.touchGraph, 'hex touch');
assert.deepEqual(pairSet(hexPatch.edgeGraph, hexPatch.tileCount), pairSet(hexPatch.touchGraph, hexPatch.tileCount));
assert.notStrictEqual(hexPatch.edgeGraph, hexPatch.touchGraph);
const hexPicking = new PickingIndex(hexPatch, hexPatch.pickingCellSize);
for (let cell = 0; cell < hexPatch.tileCount; cell += 11) {
  assert.equal(hexPicking.find(hexPatch.centers[cell * 2], hexPatch.centers[cell * 2 + 1]), cell);
}
assert.throws(() => buildHexPatch(0), /hex radius/);
assert.throws(() => buildHexPatch(2.5), /hex radius/);

for (let index = 0; index < penroseDepths.length; index++) {
  const depth = penroseDepths[index];
  const patch = buildPenrosePatch(depth);
  if (index === penroseDepths.length - 1) largestPenrosePatch = patch;
  assert.equal(patch.tiling, 'penrose');
  assert.equal(patch.seed, 'sun');
  assert.equal(patch.tileCount, penroseCounts[index], `Penrose depth ${depth}: tile count`);
  assert.equal(patch.verticesPerTile, PENROSE_OUTLINE.length);
  assert.equal(patch.typeCounts.thin, penroseThinCounts[index]);
  assert.equal(patch.typeCounts.thick, penroseThickCounts[index]);
  assert.equal(patch.typeCounts.thin + patch.typeCounts.thick, patch.tileCount);
  assert.equal(patch.edgeGraph.edgeCount, penroseEdgeCounts[index]);
  assert.equal(patch.touchGraph.edgeCount, penroseTouchCounts[index]);
  assert.equal(patch.edgeBoundaryCount, penroseEdgeBoundaryCounts[index]);
  assert.equal(patch.touchBoundaryCount, penroseTouchBoundaryCounts[index]);
  assert.equal(patch.transforms.length, patch.tileCount * 6);
  assert.equal(patch.vertices.length, patch.tileCount * 8);
  assert.equal(patch.tilePointIds.length, patch.tileCount * 4);
  assert.equal(patch.tileTypes.length, patch.tileCount);
  assert.strictEqual(patch.labels, patch.tileTypes);
  assert.strictEqual(patch.edgeGraph.boundary, patch.edgeBoundary);
  assert.strictEqual(patch.touchGraph.boundary, patch.touchBoundary);
  assert.strictEqual(patch.edgeGraph.boundaryDistance, patch.edgeBoundaryDistance);
  assert.strictEqual(patch.touchGraph.boundaryDistance, patch.touchBoundaryDistance);

  validateGraph(patch.edgeGraph, patch.tileCount, `Penrose depth ${depth} edge`);
  validateGraph(patch.touchGraph, patch.tileCount, `Penrose depth ${depth} touch`);
  validateBoundaryDistance(patch, patch.edgeGraph, `Penrose depth ${depth} edge`);
  validateBoundaryDistance(patch, patch.touchGraph, `Penrose depth ${depth} touch`);

  const edgePairs = pairSet(patch.edgeGraph, patch.tileCount);
  const touchPairs = pairSet(patch.touchGraph, patch.tileCount);
  for (const pair of edgePairs) {
    assert(touchPairs.has(pair), `Penrose depth ${depth}: edge contact missing from touch graph`);
  }

  const stride = Math.max(1, Math.floor(patch.tileCount / 1200));
  const picking = new PickingIndex(patch, 1);
  for (let tile = 0; tile < patch.tileCount; tile += stride) {
    const x = patch.centers[tile * 2];
    const y = patch.centers[tile * 2 + 1];
    assert(pointInTile(patch, tile, x, y), `Penrose depth ${depth}: centre outside ${tile}`);
    assert.equal(picking.find(x, y), tile, `Penrose depth ${depth}: centre pick ${tile}`);

    const transformOffset = tile * 6;
    const T = patch.transforms.subarray(transformOffset, transformOffset + 6);
    for (let vertex = 0; vertex < 4; vertex++) {
      const local = PENROSE_OUTLINE[vertex];
      const expectedX = T[0] * local.x + T[1] * local.y + T[2];
      const expectedY = T[3] * local.x + T[4] * local.y + T[5];
      const worldOffset = (tile * 4 + vertex) * 2;
      assert(Math.abs(expectedX - patch.vertices[worldOffset]) < 2e-5);
      assert(Math.abs(expectedY - patch.vertices[worldOffset + 1]) < 2e-5);
      const nextOffset = (tile * 4 + ((vertex + 1) % 4)) * 2;
      const side = Math.hypot(
        patch.vertices[nextOffset] - patch.vertices[worldOffset],
        patch.vertices[nextOffset + 1] - patch.vertices[worldOffset + 1],
      );
      assert(Math.abs(side - 1) < 3e-5, `Penrose depth ${depth}: non-unit side`);
      const midpointX = (patch.vertices[worldOffset] + patch.vertices[nextOffset]) / 2;
      const midpointY = (patch.vertices[worldOffset + 1] + patch.vertices[nextOffset + 1]) / 2;
      assert(pointInTile(patch, tile, patch.vertices[worldOffset], patch.vertices[worldOffset + 1]));
      assert(pointInTile(patch, tile, midpointX, midpointY));
      assert.notEqual(
        picking.find(patch.vertices[worldOffset], patch.vertices[worldOffset + 1]),
        -1,
        `Penrose depth ${depth}: vertex pick`,
      );
      assert.notEqual(picking.find(midpointX, midpointY), -1, `Penrose depth ${depth}: edge pick`);
    }
  }

  const mirror = buildPenrosePatch(depth, { seed: 'sun-mirror' });
  assert.equal(mirror.tileCount, patch.tileCount);
  assert.deepEqual(mirror.typeCounts, patch.typeCounts);
  assert.equal(mirror.edgeGraph.edgeCount, patch.edgeGraph.edgeCount);
  assert.equal(mirror.touchGraph.edgeCount, patch.touchGraph.edgeCount);
  const mirrorCenters = new Set();
  for (let tile = 0; tile < mirror.tileCount; tile++) {
    mirrorCenters.add(
      `${Math.round(mirror.centers[tile * 2] * 1000)},` +
      `${Math.round(mirror.centers[tile * 2 + 1] * 1000)},${mirror.tileTypes[tile]}`,
    );
  }
  for (let tile = 0; tile < patch.tileCount; tile++) {
    const reflected =
      `${Math.round(patch.centers[tile * 2] * 1000)},` +
      `${Math.round(-patch.centers[tile * 2 + 1] * 1000)},${patch.tileTypes[tile]}`;
    assert(mirrorCenters.has(reflected), `Penrose depth ${depth}: mirrored centre ${tile}`);
  }

  console.log(
    `penrose depth=${depth} cells=${patch.tileCount} edgeEdges=${patch.edgeGraph.edgeCount} ` +
    `touchEdges=${patch.touchGraph.edgeCount} build=${patch.buildMilliseconds.toFixed(1)}ms`,
  );
}

// Non-UI odd depths are public core API values too. Keep exact regression
// counts and graph invariants for them rather than testing only menu choices.
const penroseOddExpectations = [
  { depth: 1, cells: 10, thin: 5, thick: 5, points: 16, edge: 15, touch: 25, edgeBoundary: 5, touchBoundary: 10 },
  { depth: 3, cells: 60, thin: 25, thick: 35, points: 76, edge: 105, touch: 240, edgeBoundary: 25, touchBoundary: 25 },
  { depth: 5, cells: 430, thin: 165, thick: 265, points: 476, edge: 815, touch: 1900, edgeBoundary: 55, touchBoundary: 100 },
  { depth: 7, cells: 3010, thin: 1155, thick: 1855, points: 3126, edge: 5905, touch: 13860, edgeBoundary: 175, touchBoundary: 255 },
  { depth: 9, cells: 20800, thin: 7955, thick: 12845, points: 21106, edge: 41295, touch: 97390, edgeBoundary: 445, touchBoundary: 700 },
];
for (const expected of penroseOddExpectations) {
  const patch = buildPenrosePatch(expected.depth);
  const mirror = buildPenrosePatch(expected.depth, { seed: 'sun-mirror' });
  assert.equal(patch.tileCount, expected.cells);
  assert.deepEqual(patch.typeCounts, { thin: expected.thin, thick: expected.thick });
  assert.equal(patch.exactPointCount, expected.points);
  assert.equal(patch.edgeGraph.edgeCount, expected.edge);
  assert.equal(patch.touchGraph.edgeCount, expected.touch);
  assert.equal(patch.edgeBoundaryCount, expected.edgeBoundary);
  assert.equal(patch.touchBoundaryCount, expected.touchBoundary);
  validateGraph(patch.edgeGraph, patch.tileCount, `Penrose depth ${expected.depth} edge`);
  validateGraph(patch.touchGraph, patch.tileCount, `Penrose depth ${expected.depth} touch`);
  validateBoundaryDistance(patch, patch.edgeGraph, `Penrose depth ${expected.depth} edge`);
  validateBoundaryDistance(patch, patch.touchGraph, `Penrose depth ${expected.depth} touch`);
  assert.equal(mirror.tileCount, patch.tileCount);
  assert.deepEqual(mirror.typeCounts, patch.typeCounts);
  assert.equal(mirror.edgeGraph.edgeCount, patch.edgeGraph.edgeCount);
  assert.equal(mirror.touchGraph.edgeCount, patch.touchGraph.edgeCount);
}

assert.throws(() => buildPenrosePatch(0), /depth/);
assert.throws(() => buildPenrosePatch(1.5), /depth/);
assert.throws(() => buildPenrosePatch(12), /depth/);
assert.throws(() => buildPenrosePatch(2, { seed: 'star' }), /seed/);

// Rule grammar, canonicalisation, and lookup semantics.
let rule = parseRule(' B3 / S23 ', 7);
assert.deepEqual(rule.birth, [3]);
assert.deepEqual(rule.survive, [2, 3]);
assert.equal(rule.text, 'B3/S23');
assert.equal(rule.birthLookup[3], 1);
assert.equal(rule.surviveLookup[2], 1);
assert.equal(rule.surviveLookup[3], 1);

rule = parseRule('B2,4/S1,2,3', 7);
assert.deepEqual(rule.birth, [2, 4]);
assert.deepEqual(rule.survive, [1, 2, 3]);
assert.equal(rule.text, 'B24/S123');

rule = parseRule('B[10]/S[9,10,12]', 12);
assert.deepEqual(rule.birth, [10]);
assert.deepEqual(rule.survive, [9, 10, 12]);
assert.equal(rule.text, 'B[10]/S[9,10,12]');
assert.deepEqual(parseRule(rule.text, 12).birth, rule.birth);
assert.deepEqual(parseRule(rule.text, 12).survive, rule.survive);

// Unbracketed compact notation remains one digit per count.
assert.deepEqual(parseRule('B10/S', 12).birth, [0, 1]);
rule = parseRule('B[12,10,10]/S[11,8]', 9);
assert.equal(rule.text, 'B[10,12]/S[8,11]');
assert.deepEqual(rule.ignored, [10, 11, 12]);
assert.deepEqual(parseRule('B/S', 0).birth, []);
assert.equal(parseRule('B3/S23').text, 'B3/S23');
assert.equal(formatRule([12, 3, 3], [10, 2]), 'B[3,12]/S[2,10]');
assert.throws(() => formatRule([NaN], []), /integers/);
assert.throws(() => formatRule(null, []), /iterable/);
assert.throws(() => parseRule('23/3', 7), /B…\/S…/);
assert.throws(() => parseRule('B[10/S2', 12), /bracket/i);
assert.throws(() => parseRule('B2/Sx', 7), /integers/);
assert.throws(() => parseRule('B2,/S3', 7), /integers/);
assert.throws(() => parseRule('B2,,3/S', 7), /integers/);
assert.throws(() => parseRule('B[256]/S', 255), /0 to 255/);
assert.throws(() => parseRule('B3/S23', -1), /maxDegree/);
assert.throws(() => parseRule('B3/S23', 2.5), /maxDegree/);
assert.throws(() => parseRule('B3/S23', 256), /maxDegree/);

for (let mask = 0; mask < 256; mask++) {
  const values = [];
  for (let bit = 0; bit < 8; bit++) if (mask & (1 << bit)) values.push(bit + 8);
  const text = values.length ? `B[${values.join(',')}]/S[${[...values].reverse().join(',')}]` : 'B/S';
  const parsed = parseRule(text, 20);
  const reparsed = parseRule(parsed.text, 20);
  assert.deepEqual(reparsed.birth, parsed.birth, `rule birth round trip mask=${mask}`);
  assert.deepEqual(reparsed.survive, parsed.survive, `rule survival round trip mask=${mask}`);
}

assert.equal(hashSeed('einstein'), hashSeed('einstein'));
assert.notEqual(hashSeed('einstein'), hashSeed('Einstein'));
const randomA = mulberry32(12345);
const randomB = mulberry32(12345);
for (let i = 0; i < 100; i++) assert.equal(randomA(), randomB());

// State hashes and change counts support exact browser-side cycle detection.
const hashPatch = buildSquarePatch(9);
const hashSimulation = new Automaton(hashPatch, hashPatch.touchGraph, {
  rule: 'B3/S23',
  generations: 2,
  borderRings: 0,
});
const emptyHash = hashSimulation.ensureStateHash().slice();
assert(hashSimulation.setCell(40, 1));
assert.equal(hashSimulation.hashDirty, true);
const liveHash = hashSimulation.ensureStateHash().slice();
assert.notDeepEqual(liveHash, emptyHash);
assert.equal(hashSimulation.hashDirty, false);

// Documented direct state writes must not let a locked border cell influence
// the first step after derived state is refreshed.
const maskedPatch = buildSquarePatch(5);
const maskedSimulation = new Automaton(maskedPatch, maskedPatch.edgeGraph, {
  rule: 'B1/S',
  generations: 2,
  borderRings: 1,
});
maskedSimulation.state[0] = 1;
maskedSimulation.refreshDerivedState();
assert.equal(maskedSimulation.state[0], 0);
maskedSimulation.step();
assert.equal(maskedSimulation.aliveCount(), 0);
const stateBeforeStep = hashSimulation.state.slice();
hashSimulation.step();
let independentlyChanged = 0;
for (let cell = 0; cell < hashSimulation.state.length; cell++) {
  if (hashSimulation.state[cell] !== stateBeforeStep[cell]) independentlyChanged++;
}
assert.equal(hashSimulation.lastChangedCount, independentlyChanged);
assert.deepEqual(hashSimulation.ensureStateHash(), [hashSimulation.stateHashA, hashSimulation.stateHashB]);
hashSimulation.state[10] = 1;
hashSimulation.hashDirty = true;
assert.equal(hashSimulation.refreshDerivedState(), hashSimulation.aliveCount());
assert.equal(hashSimulation.hashDirty, false);

const patch = buildEinsteinPatch(2);
let sim = new Automaton(patch, patch.edgeGraph, {
  rule: 'B3/S23',
  generations: 2.9,
  borderRings: 2.9,
});
assert.equal(sim.generations, 2);
assert.equal(sim.borderRings, 2);
assert.strictEqual(sim.boundaryDistance, patch.edgeBoundaryDistance);

sim = new Automaton(patch, patch.edgeGraph, { generations: 'invalid', borderRings: NaN });
assert.equal(sim.generations, 2);
assert.equal(sim.borderRings, 0);
assert.throws(() => new Automaton(patch, patch.edgeGraph, { rule: '' }), /B…\/S…/);
assert.equal(sim.setGenerations(5.9), 5);
assert.equal(sim.setGenerations(NaN), 5);
assert.equal(sim.setBorderRings(3.8), 3);
assert.equal(sim.setBorderRings(Infinity), 3);
assert.equal(sim.setCell(NaN, 1), false);
assert.equal(sim.setCell(1.5, 1), false);
assert.equal(pointInTile(patch, NaN, 0, 0), false);
assert.equal(pointInTile(patch, 1.5, 0, 0), false);
assert.equal(pointInTile(patch, -1, 0, 0), false);
assert.equal(pointInTile(patch, patch.tileCount, 0, 0), false);
assert.equal(pointInTile(patch, 0, Infinity, 0), false);
assert.throws(() => new PickingIndex(patch, 0), /cellSize/);
assert.throws(() => new PickingIndex(patch, NaN), /cellSize/);
assert.throws(() => new PickingIndex(patch, Number.MIN_VALUE), /cellSize/);
const boundedPicking = new PickingIndex(patch);
assert.equal(boundedPicking.find(Infinity, 0), -1);
assert.equal(boundedPicking.find(0, NaN), -1);

sim.clear();
sim.setBorderRings(0);
sim.setRule('B0/S');
sim.step();
assert.equal(sim.aliveCount(), patch.tileCount, 'B0 births every dead cell with zero live neighbours');

sim.setRule('B/S');
sim.setGenerations(4);
sim.setBorderRings(0);
sim.lastStepMilliseconds = 4;
sim.smoothedStepMilliseconds = 3;
sim.clear();
assert.equal(sim.lastStepMilliseconds, 0);
assert.equal(sim.smoothedStepMilliseconds, 0);
const centerCell = patch.boundaryDistance.findIndex((distance) => distance >= 2);
assert(centerCell >= 0);
assert(sim.setCell(centerCell, 1));
sim.step();
assert.equal(sim.state[centerCell], 2);
sim.step();
assert.equal(sim.state[centerCell], 3);
sim.step();
assert.equal(sim.state[centerCell], 0);

sim.lastStepMilliseconds = 4;
sim.smoothedStepMilliseconds = 3;
sim.randomize(0.37, 'repeatable');
assert.equal(sim.lastStepMilliseconds, 0);
assert.equal(sim.smoothedStepMilliseconds, 0);
const repeatable = sim.state.slice();
sim.randomize(0.37, 'repeatable');
assert.deepEqual(sim.state, repeatable);
sim.randomize(NaN, 'density');
assert.equal(sim.aliveCount(), 0);
sim.setBorderRings(0);
sim.randomize(Infinity, 'density');
assert.equal(sim.aliveCount(), patch.tileCount);

// A tile that only meets the geometric patch boundary at a point is a
// boundary tile for the touch graph even when none of its own edges is exposed.
const pointOnlyTouchBoundaryCell = patch.touchBoundary.findIndex(
  (value, cell) => value && !patch.edgeBoundary[cell],
);
assert(pointOnlyTouchBoundaryCell >= 0, 'expected a point-only touch boundary cell at depth 2');
assert.equal(patch.edgeBoundaryDistance[pointOnlyTouchBoundaryCell], 1);
assert.equal(patch.touchBoundaryDistance[pointOnlyTouchBoundaryCell], 0);
sim = new Automaton(patch, patch.touchGraph, { rule: 'B3/S23', borderRings: 1 });
assert.equal(sim.setCell(pointOnlyTouchBoundaryCell, 1), false, 'touch boundary cell must be locked by ring 1');

// Border rings must follow the active graph. At depth 2, some cells are two
// edge steps but one corner-contact step from the boundary.
const distanceDifferenceCell = patch.edgeBoundaryDistance.findIndex(
  (distance, cell) => distance >= 2 && patch.touchBoundaryDistance[cell] < 2,
);
assert(distanceDifferenceCell >= 0, 'expected a graph-dependent border distance');
sim.setGraph(patch.edgeGraph);
sim.clear();
sim.setBorderRings(2);
assert(sim.setCell(distanceDifferenceCell, 1), 'cell should be unlocked in edge graph');
sim.setGraph(patch.touchGraph);
assert.strictEqual(sim.boundaryDistance, patch.touchBoundaryDistance);
assert.equal(sim.state[distanceDifferenceCell], 0, 'graph switch must apply the touch-graph border mask');

// Multi-digit rules must survive graph switches without changing meaning.
const wideGraph = { ...patch.edgeGraph, maxDegree: 12 };
wideGraph.boundaryDistance = patch.edgeBoundaryDistance;
sim = new Automaton(patch, wideGraph, { rule: 'B[10]/S[11,12]' });
sim.setGraph({ ...wideGraph, boundaryDistance: patch.edgeBoundaryDistance });
assert.deepEqual(sim.rule.birth, [10]);
assert.deepEqual(sim.rule.survive, [11, 12]);

// The byte neighbour counter is exact through the documented maximum degree 255.
const starCount = 256;
const starOffsets = new Uint32Array(starCount + 1);
starOffsets[1] = 255;
for (let cell = 1; cell < starCount; cell++) starOffsets[cell + 1] = 255 + cell;
const starNeighbors = new Uint32Array(510);
for (let leaf = 1; leaf < starCount; leaf++) {
  starNeighbors[leaf - 1] = leaf;
  starNeighbors[254 + leaf] = 0;
}
const starGraph = {
  offsets: starOffsets,
  neighbors: starNeighbors,
  degree: Uint32Array.from({ length: starCount }, (_, cell) => cell === 0 ? 255 : 1),
  maxDegree: 255,
  averageDegree: 510 / starCount,
  edgeCount: 255,
  histogram: new Uint32Array(256),
  boundary: new Uint8Array(starCount),
  boundaryDistance: new Uint16Array(starCount),
};
starGraph.histogram[1] = 255;
starGraph.histogram[255] = 1;
const starPatch = {
  tileCount: starCount,
  boundary: new Uint8Array(starCount),
  boundaryDistance: starGraph.boundaryDistance,
};
const star = new Automaton(starPatch, starGraph, { rule: 'B[255]/S' });
for (let leaf = 1; leaf < starCount; leaf++) star.state[leaf] = 1;
star.liveListDirty = true;
star.step();
assert.equal(star.state[0], 1);
assert.equal(star.aliveCount(), 1);

function formatTestCounts(values) {
  return values.some((value) => value >= 10)
    ? `[${values.join(',')}]`
    : values.join('');
}

function referenceStep(state, graph, parsedRule, generations, locked) {
  const next = new Uint8Array(state.length);
  for (let cell = 0; cell < state.length; cell++) {
    if (locked(cell)) continue;
    let liveNeighbors = 0;
    for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) {
      if (state[graph.neighbors[k]] === 1) liveNeighbors++;
    }
    const value = state[cell];
    if (value === 0) next[cell] = parsedRule.birth.includes(liveNeighbors) ? 1 : 0;
    else if (value === 1) {
      next[cell] = parsedRule.survive.includes(liveNeighbors) ? 1 : generations > 2 ? 2 : 0;
    } else next[cell] = value + 1 < generations ? value + 1 : 0;
  }
  return next;
}

for (let caseNumber = 0; caseNumber < 120; caseNumber++) {
  const random = mulberry32(caseNumber * 7919 + 17);
  const graph = random() < 0.5 ? patch.edgeGraph : patch.touchGraph;
  const generations = 2 + Math.floor(random() * 8);
  const birth = [];
  const survive = [];
  for (let count = 0; count <= graph.maxDegree; count++) {
    if (random() < 0.35) birth.push(count);
    if (random() < 0.45) survive.push(count);
  }
  const parsed = parseRule(`B${birth.join('')}/S${survive.join('')}`, graph.maxDegree);
  const borderRings = Math.floor(random() * 4);
  const automaton = new Automaton(patch, graph, {
    rule: parsed.text,
    generations,
    borderRings,
  });
  for (let cell = 0; cell < patch.tileCount; cell++) {
    automaton.state[cell] = Math.floor(random() * generations);
  }
  automaton.applyBorderMask();
  automaton.liveListDirty = true;
  for (let step = 0; step < 20; step++) {
    const expected = referenceStep(
      automaton.state,
      graph,
      parsed,
      generations,
      (cell) => borderRings > 0 && graph.boundaryDistance[cell] < borderRings,
    );
    automaton.step();
    assert.deepEqual(automaton.state, expected, `reference case=${caseNumber} step=${step}`);
  }
}

// Repeat the optimised-versus-reference comparison on Penrose graphs,
// including the multi-digit neighbour counts available in touch mode.
const penroseFuzzPatch = buildPenrosePatch(4);
for (let caseNumber = 0; caseNumber < 80; caseNumber++) {
  const random = mulberry32(caseNumber * 104729 + 29);
  const graph = random() < 0.5 ? penroseFuzzPatch.edgeGraph : penroseFuzzPatch.touchGraph;
  const generations = 2 + Math.floor(random() * 10);
  const birth = [];
  const survive = [];
  for (let count = 0; count <= graph.maxDegree; count++) {
    if (random() < 0.38) birth.push(count);
    if (random() < 0.47) survive.push(count);
  }
  const parsed = parseRule(
    `B${formatTestCounts(birth)}/S${formatTestCounts(survive)}`,
    graph.maxDegree,
  );
  const borderRings = Math.floor(random() * 4);
  const automaton = new Automaton(penroseFuzzPatch, graph, {
    rule: parsed.text,
    generations,
    borderRings,
  });
  for (let cell = 0; cell < penroseFuzzPatch.tileCount; cell++) {
    automaton.state[cell] = Math.floor(random() * generations);
  }
  automaton.applyBorderMask();
  automaton.liveListDirty = true;
  for (let step = 0; step < 16; step++) {
    const expected = referenceStep(
      automaton.state,
      graph,
      parsed,
      generations,
      (cell) => borderRings > 0 && graph.boundaryDistance[cell] < borderRings,
    );
    automaton.step();
    assert.deepEqual(
      automaton.state,
      expected,
      `Penrose reference case=${caseNumber} step=${step}`,
    );
  }
}

assert(largestPatch.edgeGraph.maxDegree <= 6);
assert(largestPatch.touchGraph.maxDegree <= 7);
assert.equal(largestPenrosePatch.edgeGraph.maxDegree, 4);
assert.equal(largestPenrosePatch.touchGraph.maxDegree, 11);
console.log('core geometry, rule, automaton, boundary, and picking checks passed');
