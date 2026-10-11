'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const Core = require('./core.js');
const catalogue = require('./discoveries.js').filter((entry) => entry.tiling === 'hex');
const reference = require('./research/hex-reference.js');
const fixture = require('./research/fixtures/hexagonal-evidence.json');

// This reference never calls Core's neighbour-counting or state-update code.
// It models the infinite axial lattice with exact integer coordinates and
// compares every nonzero state, including every refractory value.
assert.equal(fixture.schema, 1);
assert.deepEqual(fixture.entries.map((entry) => entry.id).sort(), catalogue.map((entry) => entry.id).sort());
const results = new Map();
let comparedCells = 0;
let comparedGenerations = 0;
let emitterSeparationChecks = 0;
let refractoryControl = null;
let emitterControl = null;

for (const evidence of fixture.entries) {
  const entry = catalogue.find((candidate) => candidate.id === evidence.id);
  assert.equal(entry.rule, evidence.rule, entry.id);
  assert.equal(entry.generations, evidence.generations, entry.id);
  if (evidence.type === 'cycle') {
    const result = reference.findOrbit(entry, { maxSteps: evidence.expected.transient + evidence.expected.period });
    assert.equal(result.transient, evidence.expected.transient, `${entry.id}: first recurrent generation`);
    assert.equal(result.period, evidence.expected.period, `${entry.id}: minimal complete-state period`);
    if (entry.expectedPeriod !== undefined) assert.equal(result.period, entry.expectedPeriod, entry.id);
    if (entry.expectedTransient !== undefined) assert.equal(result.transient, entry.expectedTransient, entry.id);
    if (entry.translation) assert.deepEqual(result.translation, entry.translation, entry.id);
    const trace = crypto.createHash('sha256');
    for (const phase of result.phases) trace.update(JSON.stringify(reference.toCoordinates(phase)) + '\n');
    const actual = {
      kind: result.kind, transient: result.transient, period: result.period,
      translation: result.translation,
      liveRange: [result.minimumLive, result.maximumLive],
      activeRange: [result.minimumActive, result.maximumActive],
      unionSize: result.unionSize, unionComponents: result.unionComponents,
      perCellPeriods: result.perCellPeriods, ruleClauses: result.ruleClauses,
      phaseStatesSha256: trace.digest('hex'),
    };
    assert.deepEqual(actual, evidence.expected, `${entry.id}: complete orbit evidence`);
    if (evidence.rotation) assert.deepEqual(reference.rotationReturn(result), evidence.rotation, `${entry.id}: all-phase rotation about the stated exact centre`);
    if (evidence.repair) assert.deepEqual(reference.verifyRepair(entry, evidence.repair), evidence.expectedRepair, `${entry.id}: exact wall recovery`);
    results.set(entry.id, result);
    if (entry.generations > 2 && !refractoryControl) refractoryControl = result;
  } else if (evidence.type === 'emitter') {
    const actual = reference.verifyEmitter(entry, evidence.proof);
    assert.deepEqual(actual, evidence.expected, `${entry.id}: indefinite emission proof`);
    assert.equal(evidence.coreSteps, entry.expectedActivityThrough, entry.id);
    emitterSeparationChecks += actual.separationChecks;
    if (!emitterControl && evidence.proof.emittedGroups) emitterControl = { entry, proof: evidence.proof };
  } else if (evidence.type === 'replicator') {
    for (const check of evidence.checks) {
      const actual = reference.verifyReplication(entry, check.steps, check.translations);
      assert.equal(actual.copies, 7);
      assert.equal(actual.replicatedSupport, 7 * entry.coordinateStates.length);
    }
    assert(evidence.checks.some((check) => check.steps === entry.expectedReplication.steps &&
      JSON.stringify(check.translations) === JSON.stringify(entry.expectedReplication.translations)));
  } else {
    assert.fail(`Unrecognised evidence type ${evidence.type}`);
  }

  // The smallest safely padded Core patch avoids spending most of this test
  // scanning irrelevant empty cells. The catalogue board must be at least as
  // large. Three dead rings keep the nonzero support clear of the fixed border.
  const comparison = reference.compareCore(entry, Core, evidence.coreSteps);
  assert(entry.depth >= comparison.depth, `${entry.id}: catalogue patch cannot contain the reference trajectory with its dead margin`);
  assert(comparison.minimumBoundaryDistance >= 3);
  comparedCells += comparison.comparedCells;
  comparedGenerations += comparison.steps + 1;
}

// Phase shifts, all six rotations, reflections and arbitrary translations
// must not count as distinct curated cycles. Compare the complete trajectories
// after the cheap canonical-shape filter, because different rules can share a
// single phase and then evolve differently.
const cycles = [...results];
for (let first = 0; first < cycles.length; first++) {
  for (let second = 0; second < first; second++) {
    assert.equal(reference.equivalentOrbits(cycles[first][1], cycles[second][1]), false,
      `${cycles[first][0]} duplicates ${cycles[second][0]} under D6 and phase shifts`);
  }
}

const originalEntry = catalogue.find((entry) => entry.id === 'hex-b245s35-p25-traveller');
const original = results.get(originalEntry.id);
const transformedEntry = {
  ...originalEntry,
  coordinateStates: reference.transform(reference.toCoordinates(original.phases[7]), 2, true)
    .map(([q, r, value]) => [q + 11, r - 13, value]),
};
const transformed = reference.findOrbit(transformedEntry, { maxSteps: original.period });
assert(reference.equivalentOrbits(original, transformed), 'Duplicate detector must recognise a translated, reflected, rotated later phase');

// Deliberately alter only a refractory value. Live-cell geometry is unchanged,
// but the complete-orbit comparison and the emission identity must reject it.
const corrupted = { ...refractoryControl, phases: refractoryControl.phases.map((phase) => new Map(phase)) };
const refractory = [...corrupted.phases[1]].find(([, value]) => value > 1);
assert(refractory);
corrupted.phases[1].set(refractory[0], refractory[1] === 2 ? 3 : 2);
assert.deepEqual([...corrupted.phases[1]].filter(([, value]) => value === 1), [...refractoryControl.phases[1]].filter(([, value]) => value === 1));
assert.equal(reference.equivalentOrbits(refractoryControl, corrupted), false, 'Refractory-only corruption cannot pass as an equivalent orbit');
const alteredProof = JSON.parse(JSON.stringify(emitterControl.proof));
const alteredCell = alteredProof.emittedGroups[0].coordinateStates.find(([, , value]) => value > 1);
assert(alteredCell);
alteredCell[2] = alteredCell[2] === 2 ? 3 : 2;
assert.throws(() => reference.verifyEmitter(emitterControl.entry, alteredProof), /complete core and every emitted state/);

console.log(JSON.stringify({
  hexagonalConfigurations: catalogue.length,
  exactCycles: results.size,
  comparedGenerations,
  comparedCells,
  emitterSeparationChecks,
  transformedDuplicateControl: true,
  refractoryNegativeControls: 2,
}));
