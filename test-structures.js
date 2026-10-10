'use strict';

const assert = require('node:assert/strict');
const Core = require('./core.js');
const catalogue = require('./discoveries.js');

// These are dynamic expectations for the current catalogue, independent of its
// presentation metadata. Replay uses no stored reports and no border locking.
const expectations = [
  { id: 'penrose-edge-b23s23-p822', period: 822, supportTiles: 46, fullPeriodCells: 39 },
  { id: 'penrose-conway-c3-p14', period: 14 },
  { id: 'hat-b2s1-c3-rotor-p39', period: 39, rotation: { phaseAdvance: 13, pivot: [54, 42] } },
  { id: 'hat-b2s23-c6-rotor-p219', period: 219, rotation: { phaseAdvance: 73, pivot: [62, 10] } },
  { id: 'hat-b2s13-c4-clock-p11', period: 11, supportTiles: 8 },
  { id: 'hat-directional-transient-83', extinction: 83, firstWithoutLiveCells: 75 },
];

// Deliberately update every cell by counting its live neighbours directly. This
// does not use Core's simulation kernel or its sparse frontier implementation.
function step(state, graph, birth, survive, generations, targets = null) {
  const next = new Uint8Array(state.length);
  for (let i = 0; i < (targets ? targets.length : state.length); i++) {
    const cell = targets ? targets[i] : i;
    let liveNeighbours = 0;
    for (let j = graph.offsets[cell]; j < graph.offsets[cell + 1]; j++) {
      if (state[graph.neighbors[j]] === 1) liveNeighbours++;
    }
    const value = state[cell];
    if (value === 0) next[cell] = birth.has(liveNeighbours) ? 1 : 0;
    else if (value === 1) {
      next[cell] = survive.has(liveNeighbours) ? 1 : generations > 2 ? 2 : 0;
    } else next[cell] = value + 1 < generations ? value + 1 : 0;
  }
  return next;
}

const patches = new Map();
const replays = new Map();
const reports = [];
for (const expected of expectations) {
  const matches = catalogue.filter(entry => entry.id === expected.id);
  assert.equal(matches.length, 1, `${expected.id}: unique catalogue entry`);
  const entry = matches[0];
  assert.equal(entry.expectedPeriod, expected.period, `${entry.id}: advertised period`);
  assert.equal(entry.expectedExtinction, expected.extinction, `${entry.id}: advertised extinction`);
  assert(['edge', 'touch'].includes(entry.neighborhood), `${entry.id}: recognised graph`);
  assert(Number.isInteger(entry.generations) && entry.generations >= 2);

  const patchKey = JSON.stringify([entry.tiling, entry.depth, entry.penroseSeed || 'sun']);
  if (!patches.has(patchKey)) {
    patches.set(patchKey, Core.buildPatch(entry.tiling, entry.depth, { seed: entry.penroseSeed || 'sun' }));
  }
  const patch = patches.get(patchKey);
  const graph = entry.neighborhood === 'edge' ? patch.edgeGraph : patch.touchGraph;
  let state = new Uint8Array(patch.tileCount);
  const seedCells = new Set();
  for (const [cell, value] of entry.cellStates) {
    assert(Number.isInteger(cell) && cell >= 0 && cell < state.length, `${entry.id}: seed cell`);
    assert(!seedCells.has(cell), `${entry.id}: duplicate seed cell`);
    assert(Number.isInteger(value) && value > 0 && value < entry.generations, `${entry.id}: seed state`);
    seedCells.add(cell);
    state[cell] = value;
  }
  const initial = state.slice();
  const horizon = expected.period || expected.extinction;
  const parsedRule = /^B([0-9]*)\/S([0-9]*)$/.exec(entry.rule);
  assert(parsedRule, `${entry.id}: supported totalistic rule`);
  const birth = new Set([...parsedRule[1]].map(Number));
  const survive = new Set([...parsedRule[2]].map(Number));
  assert(!birth.has(0), `${entry.id}: quiescent empty exterior`);

  const words = new Map();
  const frames = [];
  let minimumBoundaryDistance = Infinity;
  let maximumActive = 0;
  let firstWithoutLiveCells = null;
  for (let generation = 0; generation <= horizon; generation++) {
    if (expected.rotation && generation < horizon) frames.push(state);
    let active = 0;
    let live = 0;
    for (let cell = 0; cell < state.length; cell++) {
      if (!state[cell]) continue;
      active++;
      if (state[cell] === 1) live++;
      minimumBoundaryDistance = Math.min(minimumBoundaryDistance, graph.boundaryDistance[cell]);
      if (!words.has(cell)) words.set(cell, new Uint8Array(horizon));
      if (generation < horizon) words.get(cell)[generation] = state[cell];
    }
    maximumActive = Math.max(maximumActive, active);
    if (live === 0 && firstWithoutLiveCells === null) firstWithoutLiveCells = generation;

    if (generation === horizon) {
      if (expected.period) assert.deepEqual(state, initial, `${entry.id}: complete return`);
      else assert.equal(active, 0, `${entry.id}: complete extinction`);
      break;
    }
    if (expected.period && generation > 0) {
      assert.notDeepEqual(state, initial, `${entry.id}: no earlier return`);
    } else if (!expected.period) assert(active > 0, `${entry.id}: no earlier extinction`);
    state = step(state, graph, birth, survive, entry.generations);
  }

  assert(minimumBoundaryDistance >= 10, `${entry.id}: support remains clear of the boundary`);
  if (expected.supportTiles !== undefined) {
    assert.equal(words.size, expected.supportTiles, `${entry.id}: support size`);
  }
  if (expected.firstWithoutLiveCells !== undefined) {
    assert.equal(firstWithoutLiveCells, expected.firstWithoutLiveCells, `${entry.id}: live-cell extinction`);
  }

  let fullPeriodCells = 0;
  if (expected.period) {
    const divisors = [];
    for (let divisor = 1; divisor <= expected.period; divisor++) {
      if (expected.period % divisor === 0) divisors.push(divisor);
    }
    for (const word of words.values()) {
      const leastPeriod = divisors.find(divisor => word.every((value, t) => value === word[(t + divisor) % expected.period]));
      if (leastPeriod === expected.period) fullPeriodCells++;
    }
    assert(fullPeriodCells > 0, `${entry.id}: period is not only an LCM of smaller components`);
    if (expected.fullPeriodCells !== undefined) {
      assert.equal(fullPeriodCells, expected.fullPeriodCells, `${entry.id}: cells with full period`);
    }
  }
  reports.push({
    id: entry.id,
    period: expected.period || null,
    extinction: expected.extinction || null,
    supportTiles: words.size,
    maximumActive,
    minimumBoundaryDistance,
    fullPeriodCells,
    ...(expected.extinction ? { firstWithoutLiveCells } : {}),
  });
  replays.set(entry.id, { entry, patch, graph, initial, birth, survive, frames, support: new Set(words.keys()) });
}

// Hat vertices lie on the triangular lattice x = qx/4, y = sqrt(3)*qy/4.
// Check the floating-point conversion, then rotate and match whole polygons
// with integer arithmetic. This checks the recurrent support and its induced
// graph; it does not assert a rotational symmetry of the whole tiling.
const hatPatch = replays.get('hat-b2s1-c3-rotor-p39').patch;
let maximumLatticeResidual = 0;
const polygons = Array.from({ length: hatPatch.tileCount }, (_, cell) =>
  Array.from({ length: hatPatch.verticesPerTile }, (_, vertex) => {
    const index = (cell * hatPatch.verticesPerTile + vertex) * 2;
    const x = hatPatch.vertices[index] * 4;
    const y = hatPatch.vertices[index + 1] * 4 / Math.sqrt(3);
    const residual = Math.max(Math.abs(x - Math.round(x)), Math.abs(y - Math.round(y)));
    maximumLatticeResidual = Math.max(maximumLatticeResidual, residual);
    assert(residual < 0.0001, 'hat vertices lie on the expected triangular lattice');
    return [Math.round(x), Math.round(y)];
  }));
const polygonKey = polygon => polygon.map(([x, y]) => `${x},${y}`).sort().join(';');
const polygonIndex = new Map(polygons.map((polygon, cell) => [polygonKey(polygon), cell]));
assert.equal(polygonIndex.size, hatPatch.tileCount, 'unique hat polygons');
const rotationReports = [];

for (const expected of expectations.filter(item => item.rotation)) {
  const { frames, support, graph, patch } = replays.get(expected.id);
  assert.equal(patch, hatPatch, `${expected.id}: common hat geometry`);
  const { pivot, phaseAdvance } = expected.rotation;
  assert.equal(phaseAdvance * 3, expected.period, `${expected.id}: three rotation phases`);
  function rotate([x, y]) {
    const u = x - pivot[0], v = y - pivot[1];
    const result = [(-u + 3 * v) / 2 + pivot[0], (-u - v) / 2 + pivot[1]];
    assert(result.every(Number.isInteger), `${expected.id}: integer polygon rotation`);
    return result;
  }
  const rotation = new Map([...support].map(cell =>
    [cell, polygonIndex.get(polygonKey(polygons[cell].map(rotate)))]));
  for (const cell of support) {
    const rotatedCell = rotation.get(cell);
    assert(support.has(rotatedCell), `${expected.id}: rotation preserves recurrent support`);
    assert.equal(rotation.get(rotation.get(rotatedCell)), cell, `${expected.id}: full rotation`);
    const rotatedNeighbours = [], actualNeighbours = [];
    for (let j = graph.offsets[cell]; j < graph.offsets[cell + 1]; j++) {
      const neighbour = graph.neighbors[j];
      if (support.has(neighbour)) rotatedNeighbours.push(rotation.get(neighbour));
    }
    for (let j = graph.offsets[rotatedCell]; j < graph.offsets[rotatedCell + 1]; j++) {
      const neighbour = graph.neighbors[j];
      if (support.has(neighbour)) actualNeighbours.push(neighbour);
    }
    assert.deepEqual(rotatedNeighbours.sort((a, b) => a - b), actualNeighbours.sort((a, b) => a - b),
      `${expected.id}: rotation preserves the induced support graph`);
  }
  for (let generation = 0; generation < frames.length; generation++) {
    for (const cell of support) {
      assert.equal(frames[generation][cell], frames[(generation + phaseAdvance) % frames.length][rotation.get(cell)],
        `${expected.id}: complete-state rotation at generation ${generation}`);
    }
  }
  rotationReports.push({
    id: expected.id, phaseAdvance, angleDegrees: -120,
    pivotScaledTriangularLattice: pivot, mappedPolygons: support.size,
    completeStateAllPhaseMapping: true, inducedSupportGraphAutomorphism: true,
  });
}

const clock = replays.get('hat-b2s13-c4-clock-p11');
const halo = new Set();
for (const cell of clock.support) {
  for (let j = clock.graph.offsets[cell]; j < clock.graph.offsets[cell + 1]; j++) {
    const neighbour = clock.graph.neighbors[j];
    if (!clock.support.has(neighbour)) halo.add(neighbour);
  }
}
const targets = [...clock.support, ...halo];
assert(!clock.birth.has(0), 'clock: no births without a live neighbour');
for (let generations = 4; generations <= 255; generations++) {
  let state = clock.initial;
  const expectedPeriod = 2 * generations + 3;
  const support = new Set();
  for (let generation = 0; generation < expectedPeriod; generation++) {
    for (const cell of clock.support) if (state[cell]) support.add(cell);
    const next = step(state, clock.graph, clock.birth, clock.survive, generations, targets);
    // Every exterior neighbour is explicitly updated and stays zero. With no
    // B0, all cells beyond that halo therefore stay zero by induction; comparing
    // targets below is consequently a complete-state comparison.
    for (const cell of halo) {
      assert.equal(next[cell], 0, `clock C${generations}: zero halo at generation ${generation + 1}`);
    }
    const returned = targets.every(cell => next[cell] === clock.initial[cell]);
    assert.equal(returned, generation + 1 === expectedPeriod,
      `clock C${generations}: first return is ${expectedPeriod}`);
    state = next;
  }
  assert.equal(support.size, 8, `clock C${generations}: eight-tile support`);
}

console.log(JSON.stringify({
  independentDirectNeighbourReplay: 'passed', structures: reports,
  rotations: { maximumLatticeResidual, scope: 'Recurrent-support polygons and induced graph', structures: rotationReports },
  clockFamily: { stateCounts: 252, minimumStates: 4, maximumStates: 255, periodFormula: '2*C+3', supportTiles: 8, haloTiles: halo.size, haloRemainsZero: true },
}, null, 2));
