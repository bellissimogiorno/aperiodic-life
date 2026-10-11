'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Core = require('./core.js');
const discoveries = require('./discoveries.js');
const { SparseAutomaton } = require('./research/lib/sparse-automaton.js');

// Check complete states, rendered tile polygons and graph adjacency directly.
// This deliberately does not call the search engine's translation matcher.
// A successful Penrose replay establishes only the stated finite trajectory.
const TOLERANCE = 0.0015;
const patchCache = new Map();

// Replay the published source coordinates with an unbounded axial-grid
// reference. This verifies the external pattern's mapping independently of
// patch construction, Core.Automaton and the catalogue's rotated placement.
function decodeRle(body) {
  const cells = [];
  let x = 0;
  let y = 0;
  let digits = '';
  let terminated = false;
  for (const symbol of body.replace(/\s+/g, '')) {
    assert(!terminated, 'unexpected content after RLE terminator');
    if (/\d/.test(symbol)) {
      digits += symbol;
      continue;
    }
    const count = Number(digits || 1);
    assert(Number.isSafeInteger(count) && count > 0, 'invalid source RLE run length');
    if (symbol === 'o') {
      for (let index = 0; index < count; index++) cells.push([x + index, y]);
      x += count;
    } else if (symbol === 'b') {
      x += count;
    } else if (symbol === '$') {
      y += count;
      x = 0;
    } else if (symbol === '!') {
      assert.equal(digits, '', 'RLE terminator cannot have a count');
      terminated = true;
    } else {
      assert.fail(`unexpected source RLE symbol ${symbol}`);
    }
    digits = '';
  }
  assert(terminated, 'source RLE lacks a terminator');
  return cells;
}

function hexReferenceStep(live) {
  const counts = new Map();
  const offsets = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
  for (const key of live) {
    const [q, r] = key.split(',').map(Number);
    if (!counts.has(key)) counts.set(key, 0);
    for (const [dq, dr] of offsets) {
      const neighbour = `${q + dq},${r + dr}`;
      counts.set(neighbour, (counts.get(neighbour) || 0) + 1);
    }
  }
  return new Set([...counts].filter(([key, count]) =>
    live.has(key) ? count === 3 : [2, 4, 5].includes(count)).map(([key]) => key));
}

function canonicalCoordinates(cells) {
  const minimumQ = Math.min(...cells.map(([q]) => q));
  const minimumR = Math.min(...cells.map(([, r]) => r));
  return cells.map(([q, r]) => [q - minimumQ, r - minimumR])
    .sort((left, right) => left[0] - right[0] || left[1] - right[1]);
}

const sourceFixture = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'research/fixtures/hex-b245s3-source.json'), 'utf8',
));
assert.equal(sourceFixture.officialDocumentation.rule, 'B245/S3H');
const sourceSquareCoordinates = decodeRle(sourceFixture.officialDocumentation.rleBody);
const [sourceWidth, sourceHeight] = sourceFixture.officialDocumentation.declaredBounds;
assert(sourceSquareCoordinates.every(([x, y]) => x >= 0 && x < sourceWidth && y >= 0 && y < sourceHeight));
const sourceAxialCoordinates = sourceSquareCoordinates.map(([x, y]) => [x, y - x]);
let sourceLive = new Set(sourceAxialCoordinates.map((cell) => cell.join(',')));
assert.equal(sourceLive.size, 9, 'published source population');
const sourcePopulations = [sourceLive.size];
for (let step = 0; step < sourceFixture.expectedReplay.period; step++) {
  sourceLive = hexReferenceStep(sourceLive);
  sourcePopulations.push(sourceLive.size);
}
assert.deepStrictEqual(sourcePopulations, sourceFixture.expectedReplay.phasePopulationsGeneration0Through10);
const [sourceDq, sourceDr] = sourceFixture.expectedReplay.mappedAxialTranslation;
assert.deepStrictEqual(sourceLive, new Set(sourceAxialCoordinates.map(([q, r]) => `${q + sourceDq},${r + sourceDr}`)));
const sourceEquivalence = sourceFixture.expectedReplay.catalogueFixtureD6Equivalence;
assert.equal(sourceEquivalence.reflected, false);
let rotatedSource = sourceAxialCoordinates;
for (let rotation = 0; rotation < sourceEquivalence.rotation60Steps; rotation++) {
  rotatedSource = rotatedSource.map(([q, r]) => [-r, q + r]);
}
const baysEntry = discoveries.find((entry) => entry.id === 'hex-b245s3-p10-traveller');
assert(baysEntry.coordinateStates.every(([, , state]) => state === 1));
assert.deepStrictEqual(
  canonicalCoordinates(rotatedSource),
  canonicalCoordinates(baysEntry.coordinateStates),
  'published source and catalogue differ after the stated rotation and translation',
);

function nonzeroEntries(state) {
  const result = [];
  for (let cell = 0; cell < state.length; cell++) {
    if (state[cell]) result.push([cell, state[cell]]);
  }
  return result;
}

function graphBall(graph, support, radius) {
  const distances = new Map(support.map((cell) => [cell, 0]));
  const queue = [...support];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    if (distances.get(cell) === radius) continue;
    for (let cursor = graph.offsets[cell]; cursor < graph.offsets[cell + 1]; cursor++) {
      const neighbour = graph.neighbors[cursor];
      if (!distances.has(neighbour)) {
        distances.set(neighbour, distances.get(cell) + 1);
        queue.push(neighbour);
      }
    }
  }
  return distances;
}

function polygon(patch, cell) {
  const points = [];
  for (let vertex = 0; vertex < patch.verticesPerTile; vertex++) {
    const offset = (cell * patch.verticesPerTile + vertex) * 2;
    points.push([patch.vertices[offset], patch.vertices[offset + 1]]);
  }
  return points;
}

function assertTranslatedPolygon(patch, source, destination, dx, dy) {
  const remaining = polygon(patch, destination);
  for (const [x, y] of polygon(patch, source)) {
    const match = remaining.findIndex(([tx, ty]) =>
      Math.abs(tx - x - dx) <= TOLERANCE && Math.abs(ty - y - dy) <= TOLERANCE);
    assert(match >= 0, `tile ${source}: translated polygon differs`);
    remaining.splice(match, 1);
  }
  assert.equal(remaining.length, 0, 'translated polygon is not a bijection');
}

function assertCompleteTranslation(patch, graph, before, after, dx, dy, radius) {
  assert(Math.hypot(dx, dy) > TOLERANCE, 'translation must have nonzero displacement');
  const initial = nonzeroEntries(before);
  const final = nonzeroEntries(after);
  assert(initial.length > 0, 'translated state is empty');
  assert.equal(initial.length, final.length, 'complete nonzero population differs');
  const sourceBall = graphBall(graph, initial.map(([cell]) => cell), radius);
  const destinationBall = graphBall(graph, final.map(([cell]) => cell), radius);
  assert.equal(sourceBall.size, destinationBall.size, 'local graph size differs');
  const mapping = new Map();
  const used = new Set();
  for (const [source, distance] of sourceBall) {
    const targetX = patch.centers[source * 2] + dx;
    const targetY = patch.centers[source * 2 + 1] + dy;
    const matches = [...destinationBall.keys()].filter((cell) =>
      Math.abs(patch.centers[cell * 2] - targetX) <= TOLERANCE &&
      Math.abs(patch.centers[cell * 2 + 1] - targetY) <= TOLERANCE);
    assert.equal(matches.length, 1, `tile ${source}: translated centre is not unique`);
    const destination = matches[0];
    assert(!used.has(destination), 'translated cell mapping is not one-to-one');
    used.add(destination);
    mapping.set(source, destination);
    assert.equal(destinationBall.get(destination), distance, 'local graph distance differs');
    assert.equal(before[source], after[destination], `tile ${source}: complete state differs`);
    assert.equal(patch.tileTypes[source], patch.tileTypes[destination], 'tile type differs');
    assertTranslatedPolygon(patch, source, destination, dx, dy);
    assert.equal(graph.degree[source], graph.degree[destination], 'local graph degree differs');
  }
  assert.deepStrictEqual(used, new Set(destinationBall.keys()), 'local graph mapping is not onto');
  for (const [source, destination] of mapping) {
    const translatedNeighbours = new Set();
    for (let cursor = graph.offsets[source]; cursor < graph.offsets[source + 1]; cursor++) {
      const neighbour = graph.neighbors[cursor];
      if (sourceBall.has(neighbour)) translatedNeighbours.add(mapping.get(neighbour));
    }
    const destinationNeighbours = new Set();
    for (let cursor = graph.offsets[destination]; cursor < graph.offsets[destination + 1]; cursor++) {
      const neighbour = graph.neighbors[cursor];
      if (destinationBall.has(neighbour)) destinationNeighbours.add(neighbour);
    }
    assert.deepStrictEqual(translatedNeighbours, destinationNeighbours, 'local graph adjacency differs');
  }
  return mapping;
}

function prepare(entry) {
  const key = `${entry.tiling}:${entry.depth}:${entry.penroseSeed || ''}`;
  if (!patchCache.has(key)) {
    patchCache.set(key, Core.buildPatch(entry.tiling, entry.depth, { seed: entry.penroseSeed }));
  }
  const patch = patchCache.get(key);
  const graph = entry.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const coordinateCells = new Map();
  if (patch.coordinates) {
    for (let cell = 0; cell < patch.tileCount; cell++) {
      coordinateCells.set(`${patch.coordinates[cell * 2]},${patch.coordinates[cell * 2 + 1]}`, cell);
    }
  }
  const entries = [...(entry.cellStates || [])];
  for (const [x, y, state] of entry.coordinateStates || []) {
    const cell = coordinateCells.get(`${x},${y}`);
    assert.notEqual(cell, undefined, `${entry.id}: missing initial coordinate`);
    entries.push([cell, state]);
  }
  const dense = new Core.Automaton(patch, graph, {
    rule: entry.rule, generations: entry.generations, borderRings: entry.borderRings,
  });
  const sparse = new SparseAutomaton(patch, graph, entry.rule, entry.generations);
  sparse.initialize(entries);
  for (const [cell, state] of entries) {
    assert(!dense.isLocked(cell), `${entry.id}: initial cell lies in the dead border`);
    dense.state[cell] = state;
  }
  dense.refreshDerivedState();
  return { patch, graph, coordinateCells, dense, sparse };
}

const travellers = discoveries.filter((entry) => entry.expectedTravel || entry.moving);
assert.equal(travellers.length, 18, 'current catalogue traveller count');
let statesCompared = 0;
let translatedReturns = 0;
let refractoryNegativeControls = 0;
const replays = [];
for (const entry of travellers) {
  const { patch, graph, coordinateCells, dense, sparse } = prepare(entry);
  const finite = entry.expectedTravel;
  const horizon = finite ? finite.steps : entry.expectedPeriod * 4;
  const initial = dense.state.slice();
  let fromState = null;
  let minimumBoundaryDistance = Infinity;
  let worldTranslation = null;
  if (!finite) {
    const origin = coordinateCells.get('0,0');
    const destination = coordinateCells.get(entry.translation.join(','));
    assert.notEqual(origin, undefined);
    assert.notEqual(destination, undefined);
    worldTranslation = [
      patch.centers[destination * 2] - patch.centers[origin * 2],
      patch.centers[destination * 2 + 1] - patch.centers[origin * 2 + 1],
    ];
  }
  for (let generation = 0; generation <= horizon; generation++) {
    assert.equal(
      Buffer.compare(Buffer.from(dense.state), Buffer.from(sparse.state)),
      0,
      `${entry.id}: dense/sparse mismatch at generation ${generation}`,
    );
    statesCompared++;
    assert(sparse.active.length > 0, `${entry.id}: extinct before the finite horizon`);
    for (const cell of sparse.active) {
      minimumBoundaryDistance = Math.min(minimumBoundaryDistance, graph.boundaryDistance[cell]);
      assert(!dense.isLocked(cell), `${entry.id}: trajectory reached the dead border`);
    }
    if (finite && generation === finite.translatedReturn.fromGeneration) fromState = dense.state.slice();
    if (finite && generation === finite.translatedReturn.toGeneration) {
      const { dx, dy, neighborhoodRadius: radius } = finite.translatedReturn;
      assert(fromState, `${entry.id}: source phase was not recorded`);
      assertCompleteTranslation(patch, graph, fromState, dense.state, dx, dy, radius);
      translatedReturns++;
      // Alter only one refractory value. A live-cell-only check would miss it.
      const refractory = sparse.active.find((cell) => dense.state[cell] > 1);
      assert.notEqual(refractory, undefined, `${entry.id}: missing refractory control cell`);
      const corrupted = dense.state.slice();
      corrupted[refractory] = dense.state[refractory] === 2 ? 3 : 2;
      assert.throws(
        () => assertCompleteTranslation(patch, graph, fromState, corrupted, dx, dy, radius),
        /complete state differs/,
        `${entry.id}: incomplete-state matching would accept a changed refractory value`,
      );
      refractoryNegativeControls++;
    }
    if (!finite && generation > 0 && generation % entry.expectedPeriod === 0) {
      const periods = generation / entry.expectedPeriod;
      assertCompleteTranslation(
        patch, graph, initial, dense.state,
        worldTranslation[0] * periods, worldTranslation[1] * periods, 3,
      );
      translatedReturns++;
    }
    if (generation < horizon) {
      dense.step();
      sparse.step();
    }
  }
  if (finite) {
    assert(minimumBoundaryDistance >= finite.minimumBoundaryDistance, `${entry.id}: finite replay boundary clearance`);
    assert.deepStrictEqual(nonzeroEntries(dense.state), finite.finalCellStates, `${entry.id}: complete final state`);
    assert.deepStrictEqual(dense.ensureStateHash(), finite.finalHash, `${entry.id}: final state hash`);
  } else {
    assert(minimumBoundaryDistance > entry.borderRings + 1, `${entry.id}: regular benchmark boundary clearance`);
  }
  replays.push({ id: entry.id, verifiedThrough: horizon });
}
console.log(JSON.stringify({
  travellerExamples: travellers.length,
  statesCompared,
  translatedReturns,
  refractoryNegativeControls,
  independentSourceReplayPeriod: sourceFixture.expectedReplay.period,
  replays,
  interpretation: 'Finite complete-state replays and local graph translations; no indefinite aperiodic motion is inferred.',
  result: 'passed',
}));
