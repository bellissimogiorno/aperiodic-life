'use strict';

// Tie the playable examples to the independently replayed fixtures. Display
// wording and playback speeds may change without altering these identities.
const assert = require('node:assert/strict');
const catalogue = require('../../../discoveries.js');
const wake = require('./hat-relay-evidence.json');
const relay = require('./hat-relay-reduction-control.json');
const six = require('./hat-a-six-launcher-evidence.json');
const emitter = require('./hat-emitter-independent.json');
const twelve = require('../penrose/twelve-launcher-evidence.json');
const puffers = require('./puffer-evidence.json');
const ship = require('./new-hex-ship-evidence.json');
const { next } = require('./verify-puffer.js');
const checked = [];

function sorted(cells) {
  return cells.map(cell => [...cell]).sort((a, b) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
  });
}
function find(id) {
  const matches = catalogue.filter(entry => entry.id === id);
  assert.equal(matches.length, 1, `Missing or duplicated catalogue entry: ${id}`);
  checked.push(id);
  return matches[0];
}
function aperiodic(id, fixture) {
  const entry = find(id);
  for (const field of ['tiling', 'depth', 'neighborhood', 'penroseSeed', 'rule']) {
    assert.equal(entry[field], fixture[field], `${id}: ${field}`);
  }
  assert.equal(entry.generations, fixture.generations ?? fixture.table.states, `${id}: states`);
  assert.deepEqual(sorted(entry.cellStates), sorted(fixture.cellStates), `${id}: complete seed`);
  assert.equal(entry.expectedActivityThrough, fixture.horizon, `${id}: finite horizon`);
}
aperiodic('hat-wake-traveller', wake.cases.find(entry => entry.id === 'hat-relay-source-six-cell'));
aperiodic('hat-two-row-relay', relay.entry);
// The stable catalogue ID differs from the miner's original candidate ID.
aperiodic('hat-edmond-a-six-way-launcher', six.entry);
aperiodic('hat-edmond-b-periodic-emitter', {
  tiling: emitter.input.tiling, depth: emitter.input.depth,
  neighborhood: emitter.input.neighbourhood, rule: emitter.input.rule,
  generations: 4, cellStates: emitter.input.parentSeed, horizon: 180,
});
aperiodic('penrose-b2-c6-twelve-launcher', twelve);

function hex(id, fixture) {
  const entry = find(id);
  assert.equal(entry.tiling, 'hex');
  assert.equal(entry.neighborhood, 'edge');
  assert.equal(entry.rule, fixture.rule, `${id}: rule`);
  assert.equal(entry.generations, fixture.generations, `${id}: states`);
  assert.deepEqual(sorted(entry.coordinateStates), sorted(fixture.coordinateStates), `${id}: complete seed`);
}
hex('hex-b245s02-c5-p6-puffer', puffers.centred.entry);
hex('hex-b245s02-c5-three-cell-twin-puffer-launcher', puffers.twin.launcher);

// The displayed spaceship starts at a smaller, centred phase of the same
// labelled orbit. Check translation-only identity against all 48 exact phases.
function shape(cells) {
  const q = Math.min(...cells.map(cell => cell[0]));
  const r = Math.min(...cells.map(cell => cell[1]));
  return JSON.stringify(sorted(cells.map(([x, y, state]) => [x - q, y - r, state])));
}
const displayed = find('hex-b2345s24-c4-p48-traveller');
assert.equal(displayed.tiling, 'hex');
assert.equal(displayed.neighborhood, 'edge');
assert.equal(displayed.rule, ship.rule);
assert.equal(displayed.generations, ship.generations);
assert.equal(displayed.expectedPeriod, ship.period);
const wanted = shape(displayed.coordinateStates);
let state = new Map(ship.coordinateStates.map(([q, r, value]) => [`${q},${r}`, value]));
let matchingPhase = null;
for (let phase = 0; phase < ship.period; phase++) {
  const cells = [...state].map(([cell, value]) => [...cell.split(',').map(Number), value]);
  if (shape(cells) === wanted) matchingPhase = phase;
  state = next(state, ship.rule, ship.generations);
}
assert.notEqual(matchingPhase, null, 'Displayed p48 state is absent from the verified orbit');
console.log(JSON.stringify({ passed: true, catalogueEntriesLinkedToFixtures: checked, p48DisplayedPhase: matchingPhase }));
