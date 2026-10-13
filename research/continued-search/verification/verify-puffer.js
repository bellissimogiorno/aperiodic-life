'use strict';

// A separate integer-coordinate updater and separation proof. This file does
// not import the miner, production engine, or research/hex-reference.js.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'puffer-evidence.json'), 'utf8'));
const neighbours = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
const axes = [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [-1, -1]];
const key = (q, r) => `${q},${r}`;
const array = state => [...state].map(([k, value]) => [...k.split(',').map(Number), value]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
function state(cells) {
  const result = new Map(cells.map(([q, r, value]) => [key(q, r), value]));
  assert.equal(result.size, cells.length);
  return result;
}
function next(current, rule, generations) {
  const [birth, survival] = /^B([0-6]*)\/S([0-6]*)$/.exec(rule).slice(1).map(s => new Set([...s].map(Number)));
  assert(!birth.has(0));
  const candidates = new Set(current.keys());
  for (const [q, r] of array(current)) for (const [dq, dr] of neighbours) candidates.add(key(q + dq, r + dr));
  const result = new Map();
  for (const cell of candidates) {
    const [q, r] = cell.split(',').map(Number);
    const count = neighbours.reduce((sum, [dq, dr]) => sum + Number(current.get(key(q + dq, r + dr)) === 1), 0);
    const own = current.get(cell) || 0;
    const after = own === 0 ? Number(birth.has(count)) : own === 1 ? (survival.has(count) ? 1 : generations > 2 ? 2 : 0)
      : own + 1 < generations ? own + 1 : 0;
    if (after) result.set(cell, after);
  }
  return result;
}
function union(parts) {
  const result = new Map();
  for (const part of parts) for (const [cell, value] of part) {
    assert(!result.has(cell), 'Components overlap'); result.set(cell, value);
  }
  return result;
}
function translated(current, [dq, dr]) { return state(array(current).map(([q, r, value]) => [q + dq, r + dr, value])); }
function separated(first, second, firstVelocity, secondVelocity) {
  for (const [q, r] of axes) {
    const dot = point => q * point[0] + r * point[1];
    const firstIncrement = dot(firstVelocity), secondIncrement = dot(secondVelocity);
    if (firstIncrement < 0 || secondIncrement > 0) continue;
    const gap = Math.min(...array(first).map(dot)) - Math.max(...array(second).map(dot));
    if (gap >= 3) return { axis: [q, r], gap, firstIncrement, secondIncrement };
  }
  assert.fail('No permanently separating projection');
}
function certifyPuffer(entry, proof) {
  assert.equal(proof.debrisPeriod, 1, 'This verifier targets stationary deposits');
  const initial = state(entry.coordinateStates), deposit = state(proof.debrisCoordinateStates);
  const velocity = proof.coreTranslation, backwards = velocity.map(x => -x);
  let current = initial;
  const phases = [], separation = [];
  assert.deepEqual(array(next(deposit, entry.rule, entry.generations)), array(deposit), 'Deposit is not stationary');
  for (let phase = 0; phase < proof.emissionPeriod; phase++) {
    phases.push(current);
    separation.push(separated(current, translated(deposit, backwards), [0, 0], backwards));
    separation.push(separated(deposit, translated(deposit, backwards), [0, 0], backwards));
    current = next(current, entry.rule, entry.generations);
  }
  assert.deepEqual(array(current), array(union([translated(initial, velocity), deposit])), 'Complete core-plus-deposit recurrence');
  return { phases, deposit, result: { emissionPeriod: proof.emissionPeriod, translation: velocity,
    depositPopulation: deposit.size, separationChecks: separation.length, minimumGap: Math.min(...separation.map(s => s.gap)) } };
}
function main() {
  const single = certifyPuffer(fixture.centred.entry, fixture.centred.proof);
  const twin = fixture.twin;
  let full = state(twin.launcher.coordinateStates);
  for (let generation = 0; generation < twin.generation; generation++) full = next(full, twin.launcher.rule, twin.launcher.generations);
  assert.deepEqual(array(full), twin.exactSplitStates);
  const fixed = state(twin.stationaryDebris);
  assert.deepEqual(array(next(fixed, twin.launcher.rule, twin.launcher.generations)), array(fixed));
  const certificates = twin.groups.map(group => certifyPuffer(group.entry, group.proof));
  let parts = twin.groups.map(group => state(group.entry.coordinateStates));
  const velocities = twin.groups.map(group => group.proof.coreTranslation);
  const checks = [];
  for (let phase = 0; phase < 6; phase++) {
    assert.deepEqual(array(union([...parts, fixed])), array(full), 'Complete-state split fails');
    for (let i = 0; i < 2; i++) {
      checks.push(separated(parts[i], fixed, velocities[i], [0, 0]));
      // Deposits are contained in each head's envelope at all six phases.
      // Their outward translates therefore keep the same separation from
      // the other puffer and the pre-existing stationary cells forever.
      for (const [cell, value] of certificates[i].deposit) assert.equal(parts[i].get(cell), value);
    }
    checks.push(separated(parts[0], parts[1], velocities[0], velocities[1]));
    parts = parts.map(part => next(part, twin.launcher.rule, twin.launcher.generations));
    full = next(full, twin.launcher.rule, twin.launcher.generations);
  }
  assert.deepEqual(array(union([...parts, fixed])), array(full));
  const result = { passed: true, updater: 'separate direct-neighbour integer-coordinate implementation',
    isolated: single.result, splitGeneration: twin.generation, initialLive: 2, initialRefractory: 1,
    fixedCellsAtSplit: fixed.size, twinHeads: certificates.map(c => c.result),
    interGroupSeparationChecks: checks.length, minimumInterGroupGap: Math.min(...checks.map(s => s.gap)),
    scope: 'Exact recurrences plus outward dependency separation prove indefinite twin puffer propagation on the unbounded hexagonal lattice. This is not a stationary gun or a historical-priority claim.' };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
if (require.main === module) main();
module.exports = { main, next, certifyPuffer };
