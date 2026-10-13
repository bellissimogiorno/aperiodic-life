'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const H = require('./hex-reference');
const selected = require('./selected-evidence.json');
const twin = require('./twin-puffer-evidence.json');
const baseline = require('./catalogue-baseline.json');
const catalogue = process.argv[2] ? require(path.resolve(process.argv[2])) : null;

for (const record of selected.entries) {
  const entry = record.entry;
  if (catalogue) {
    const current = catalogue.find(candidate => candidate.id === entry.id);
    assert(current, `Missing catalogue entry ${entry.id}`);
    for (const field of ['rule', 'generations', 'coordinateStates']) assert.deepEqual(current[field], entry[field]);
  }
  if (record.emissionProof) assert.deepEqual(H.verifyEmitter(entry, record.emissionProof), record.emissionCertificate);
  if (record.expectedOrbit) {
    const actual = H.findOrbit(entry, { maxSteps: 48 });
    assert.deepEqual(H.serialisableOrbit(actual), record.expectedOrbit);
    const launch = H.findOrbit(record.launcher, { maxSteps: 64 });
    assert.equal(launch.transient, 16);
    assert(H.equivalentOrbits(actual, launch));
    for (const previous of baseline.filter(e => e.moving || e.expectedTravel)) {
      assert(!H.equivalentOrbits(actual, H.findOrbit(previous, { maxSteps: 500 })), `Duplicate ${previous.id}`);
    }
  }
}

const rule = H.parseRule(twin.launcher.rule, twin.launcher.generations);
let full = H.fromCoordinates(twin.launcher.coordinateStates, rule.generations);
for (let generation = 0; generation < twin.generation; generation++) full = H.step(full, rule);
assert.deepEqual(H.toCoordinates(full), twin.exactSplitStates);
const debris = H.fromCoordinates(twin.stationaryDebris, rule.generations);
assert.deepEqual(H.toCoordinates(H.step(debris, rule)), twin.stationaryDebris);
let parts = twin.groups.map(group => {
  assert.deepEqual(H.verifyEmitter(group.entry, group.proof), group.certificate);
  return H.fromCoordinates(group.entry.coordinateStates, rule.generations);
});
const separation = [];
for (let phase = 0; phase < 6; phase++) {
  assert.deepEqual(H.toCoordinates(H.disjointUnion([...parts, debris])), H.toCoordinates(full));
  for (let index = 0; index < 2; index++) separation.push({ phase, first: `head-${index}`, second: 'stationary-debris', ...H.separationCertificate(parts[index], debris, twin.groups[index].proof.coreTranslation, [0, 0]) });
  separation.push({ phase, first: 'head-0', second: 'head-1', ...H.separationCertificate(parts[0], parts[1], twin.groups[0].proof.coreTranslation, twin.groups[1].proof.coreTranslation) });
  parts = parts.map(part => H.step(part, rule));
  full = H.step(full, rule);
}
assert.deepEqual(H.toCoordinates(H.disjointUnion([...parts, debris])), H.toCoordinates(full));
assert.deepEqual(separation, twin.separation);
console.log('Verified p6 puffer, exact three-cell twin-puffer launch, and distinct complete-state p48 spaceship.');
