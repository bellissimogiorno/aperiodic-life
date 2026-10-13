'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const catalogue = require('./discoveries');
const reference = require('./research/hex-reference');
const fixture = require('./research/fixtures/hex-exhaustive-evidence.json');
const campaigns = require('./research/exhaustive-search/hex/campaigns.json');

assert.equal(fixture.schema, 1);
assert.equal(campaigns.exhaustiveScope.trials, 116 * 8192 * 5);
assert.equal(campaigns.totals.trials, 4998720);
for (const campaign of campaigns.campaigns) {
  const c = campaign.counts;
  assert.equal(c.extinct + c.boundaryStopped + c.populationStopped + c.periodic + c.horizonStopped, c.trials,
    `${campaign.campaign}: every executed trial has one stop reason`);
}

let generations = 0;
let launchOnlyControls = 0;
const orbits = [];
for (const evidence of fixture.entries) {
  const entry = catalogue.find(candidate => candidate.id === evidence.id);
  assert(entry, `${evidence.id}: missing playable catalogue entry`);
  assert.deepEqual(entry, evidence.entry, `${entry.id}: scientific fixture and playable entry disagree`);
  assert(entry.coordinateStates.every(cell => cell[2] === 1), 'All launch seeds consist only of live cells');
  const orbit = reference.findOrbit(entry, { maxSteps: evidence.expected.transient + evidence.expected.period });
  assert.equal(orbit.kind, 'spaceship');
  assert.equal(orbit.transient, evidence.expected.transient);
  assert.equal(orbit.period, evidence.expected.period);
  assert.deepEqual(orbit.translation, evidence.expected.translation);
  assert.deepEqual(orbit.ruleClauses, evidence.expected.ruleClauses);
  const hash = crypto.createHash('sha256');
  let state = reference.fromCoordinates(entry.coordinateStates, entry.generations);
  const rule = reference.parseRule(entry.rule, entry.generations);
  let translatedFrom;
  for (let generation = 0; generation <= entry.expectedTravel.steps; generation++) {
    hash.update(JSON.stringify(reference.toCoordinates(state)) + '\n');
    const claim = entry.expectedTravel.translatedReturn;
    if (generation === claim.fromGeneration) translatedFrom = state;
    if (generation === claim.toGeneration) {
      assert.deepEqual(reference.toCoordinates(state), reference.toCoordinates(reference.translate(translatedFrom, orbit.translation)),
        `${entry.id}: complete live and refractory state must translate`);
    }
    if (generation < entry.expectedTravel.steps) state = reference.step(state, rule);
    generations++;
  }
  assert.equal(hash.digest('hex'), evidence.trajectorySha256, `${entry.id}: full launch and flight trajectory`);
  if (evidence.obliqueDirection) {
    const [q, r] = orbit.translation;
    assert(q && r && q + r && q - r && 2 * q + r && q + 2 * r,
      `${entry.id}: knightship direction is neither a hexagonal axis nor a diagonal`);
  }
  if (evidence.launcherCounterfactual) {
    const counterfactual = evidence.launcherCounterfactual;
    const reduced = reference.findOrbit({ ...entry, rule: counterfactual.rule }, { maxSteps: 50 });
    assert.equal(reduced.kind, 'extinction');
    assert.equal(reduced.extinctionGeneration, counterfactual.extinctionGeneration);
    const launched = reference.findOrbit({ ...entry, rule: counterfactual.rule,
      coordinateStates: reference.toCoordinates(orbit.phases[0]) }, { maxSteps: orbit.period });
    assert(reference.equivalentOrbits(orbit, launched), 'Removing S5 after launch preserves the entire recurrent orbit');
    assert.deepEqual(evidence.launcherOnlyClauses, [{ clause: 'S5', count: 4, lastToGeneration: 3 }]);
    launchOnlyControls++;
  }
  orbits.push([entry.id, orbit]);
}
for (let first = 0; first < orbits.length; first++) for (let second = 0; second < first; second++) {
  assert(!reference.equivalentOrbits(orbits[first][1], orbits[second][1]), 'Phase, reflected and rotated duplicates are not distinct additions');
}
assert.equal(launchOnlyControls, 1);
console.log(JSON.stringify({ exactHexagonalConfigurations: fixture.entries.length, generations, essentialLaunchClauseControls: launchOnlyControls }));
