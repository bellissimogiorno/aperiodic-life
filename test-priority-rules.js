'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Core = require('./core.js');
const { SparseAutomaton } = require('./research/lib/sparse-automaton.js');
const V = require('./research/aperiodic-reference.js');
const { verifyFixture } = require('./research/verify-aperiodic.js');

// Exhaust all neighbour-count histograms through degree ten, rather than only
// testing table rows in isolation. Overlapping guards must respect row order.
const names = {
  'TABLE:HAT-A': 'hatA', 'TABLE:HAT-B': 'hatB', 'TABLE:HAT-C': 'hatC',
  'TABLE:HAT-SIMPLE': 'hatSimple', 'TABLE:SPECTRE': 'spectre',
  'TABLE:PENROSE-GOUCHER': 'penroseGoucher',
};
let localCases = 0;
for (const [name, key] of Object.entries(names)) {
  const parsed = Core.parseRule(name, 10);
  const table = V.PUBLISHED_TABLES[key];
  assert.equal(parsed.kind, 'priority');
  assert.equal(parsed.states, table.states);
  const reference = new V.PriorityReference({ degree: new Uint8Array(1), maxDegree: 10 }, table, []);
  const counts = new Uint16Array(table.states);
  function enumerate(state, remaining) {
    if (state === counts.length - 1) {
      counts[state] = remaining;
      for (let own = 0; own < table.states; own++) {
        const before = [...counts];
        assert.equal(Core.priorityTransition(parsed, own, counts), reference.nextValue(own, counts), `${name}, own=${own}, counts=${before}`);
        assert.deepStrictEqual([...counts], before, 'transition mutates its neighbour counts');
        localCases++;
      }
      return;
    }
    for (let count = 0; count <= remaining; count++) { counts[state] = count; enumerate(state + 1, remaining - count); }
  }
  for (let degree = 0; degree <= 10; degree++) enumerate(0, degree);
}

// Independent closed-form descriptions of the new searched rules. Exhausting
// every histogram through degree ten includes every possible Hat neighbourhood
// (the touch graph has maximum degree seven), including overlapping conditions.
const searchedRules = [
  ['TABLE:HAT-WAKE', 4, (own, n) => {
    if (own === 1) return n[2] >= 1 && n[0] >= 3 ? 2 : n[0] >= 4 ? 3 : 0;
    if (own === 0) return n[2] < 1 ? 0 : n[0] >= 4 ? 1 : n[1] >= 1 ? 3 : 0;
    return 0;
  }],
  ['TABLE:HAT-RELAY', 3, (own, n) => n[2] < 1 ? 0 : own === 1 ? 2 : own === 0 && n[0] >= 4 ? 1 : 0],
];
for (const [name, states, expected] of searchedRules) {
  const parsed = Core.parseRule(name, 10);
  assert.equal(parsed.kind, 'priority');
  assert.equal(parsed.states, states);
  const counts = new Uint16Array(states);
  function enumerate(state, remaining) {
    if (state === states - 1) {
      counts[state] = remaining;
      for (let own = 0; own < states; own++) {
        const before = [...counts];
        assert.equal(Core.priorityTransition(parsed, own, counts), expected(own, before), `${name}, own=${own}, counts=${before}`);
        assert.deepStrictEqual([...counts], before, 'transition mutates its neighbour counts');
        localCases++;
      }
      return;
    }
    for (let count = 0; count <= remaining; count++) { counts[state] = count; enumerate(state + 1, remaining - count); }
  }
  for (let degree = 0; degree <= 10; degree++) enumerate(0, degree);
}

// Hat B's state-2 guard matters for manually painted states even though state 2
// is absent from its published seed's trajectory. All nonzero states count.
assert.equal(Core.priorityTransition(Core.parseRule('TABLE:HAT-B'), 0, [2, 0, 2, 0]), 1);
assert.equal(Core.priorityTransition(Core.parseRule('TABLE:HAT-B'), 0, [1, 2, 0, 2]), 0);
assert.equal(Core.priorityTransition(Core.parseRule('TABLE:HAT-B'), 0, [2, 0, 0, 1]), 1);
assert.equal(Core.priorityTransition(Core.parseRule('TABLE:HAT-B'), 0, [1, 0, 0, 1]), 0);
// The new SIMPLE rule removes the empty-neighbour guard. It is not globally
// equivalent to the published rule under a relabelling of states.
assert.equal(Core.priorityTransition(Core.parseRule('TABLE:HAT-B'), 0, [0, 0, 0, 6]), 0);
assert.equal(Core.priorityTransition(Core.parseRule('TABLE:HAT-SIMPLE'), 0, [0, 0, 6]), 1);
assert.throws(() => Core.parseRule('TABLE:UNKNOWN'));

const patch = Core.buildPatch('hex', 8);
const model = new Core.Automaton(patch, patch.edgeGraph, { rule: 'TABLE:HAT-B', generations: 200, borderRings: 0 });
assert.equal(model.generations, 4);
assert.equal(model.setGenerations(20), 4);
model.state[0] = 3;
model.setRule('TABLE:HAT-SIMPLE');
assert.equal(model.generations, 3);
assert.equal(model.state[0], 0, 'switching to fewer states clears an invalid old state');
model.setRule('B2/S13');
assert.equal(model.setGenerations(6), 6);

// Existing B/S Generations semantics must survive the additional rule family.
let ordinaryComparisons = 0;
for (const [rule, generations] of [['B3/S23', 2], ['B2/S13', 4], ['B24/S', 6]]) {
  const initial = [[60, 1], [61, 1], [62, generations - 1], [74, 1], [75, 1]];
  const reference = new V.ReferenceGraph(patch.edgeGraph, rule, generations, initial);
  const sparse = new SparseAutomaton(patch, patch.edgeGraph, rule, generations);
  sparse.initialize(initial);
  const dense = new Core.Automaton(patch, patch.edgeGraph, { rule, generations, borderRings: 0 });
  for (const [cell, value] of initial) dense.state[cell] = value;
  dense.refreshDerivedState();
  for (let generation = 0; generation <= 32; generation++) {
    assert.deepStrictEqual(sparse.entries(), reference.entries());
    assert.equal(Buffer.compare(Buffer.from(sparse.state), Buffer.from(dense.state)), 0);
    ordinaryComparisons++;
    if (generation < 32) { reference.step(); sparse.step(); dense.step(); }
  }
}

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'research/fixtures/aperiodic-evidence.json'), 'utf8'));
const discoveries = require('./discoveries.js');
for (const entry of fixture.cases) {
  const catalogue = discoveries.find((item) => item.id === entry.id);
  assert(catalogue, `missing playable example ${entry.id}`);
  for (const field of ['tiling', 'depth', 'neighborhood', 'rule', 'generations']) assert.equal(catalogue[field], entry[field], `${entry.id}: ${field}`);
  assert.deepStrictEqual(catalogue.cellStates.slice().sort((a, b) => a[0] - b[0]), entry.cellStates.slice().sort((a, b) => a[0] - b[0]));
  assert.equal(catalogue.expectedActivityThrough, entry.horizon);
}
const results = verifyFixture();

// Reject a counterfeit certificate that changes only a labelled state or a
// dead halo. These checks would evade a live-cell or centroid-only matcher.
const seedEntry = fixture.cases.find((entry) => entry.id === 'hat-edmond-b-glider');
const { verifyCase } = require('./research/verify-aperiodic.js');
const checked = verifyCase(seedEntry);
const claim = seedEntry.translatedReturns[0];
const wrongState = checked.phases[claim.to].map(([cell, state], index) => [cell, index === 0 ? state === 1 ? 3 : 1 : state]);
assert.throws(() => V.certifyIsometry(checked.patch, checked.graph, checked.phases[claim.from], checked.patch, checked.graph, wrongState, claim.transform, 3), /complete cell state differs/);
const changedType = checked.patch.tileTypes.slice();
const halo = V.graphBall(checked.graph, checked.phases[claim.to].map(([cell]) => cell), 3);
const support = new Set(checked.phases[claim.to].map(([cell]) => cell));
const dead = [...halo.keys()].find((cell) => !support.has(cell));
changedType[dead] = (changedType[dead] + 1) % 255;
assert.throws(() => V.certifyIsometry(checked.patch, checked.graph, checked.phases[claim.from], { ...checked.patch, tileTypes: changedType }, checked.graph, checked.phases[claim.to], claim.transform, 3), /tile type or chirality differs/);
const changedVertices = checked.patch.vertices.slice();
changedVertices[dead * checked.patch.verticesPerTile * 2] += 0.1;
assert.throws(() => V.certifyIsometry(checked.patch, checked.graph, checked.phases[claim.from], { ...checked.patch, vertices: changedVertices }, checked.graph, checked.phases[claim.to], claim.transform, 3), /complete tile polygon differs/);

console.log(JSON.stringify({ result: 'passed', localCases, ordinaryComparisons,
  finiteTrajectories: results.length, fullStateComparisons: results.reduce((sum, item) => sum + item.verifiedThrough + 1, 0),
  isolatedEmittees: results.reduce((sum, item) => sum + item.emissions.length, 0), negativeControls: 3 }));
