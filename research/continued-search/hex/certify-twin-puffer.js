'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const H = require('./hex-reference');
const candidate = require('./new-puffer-candidate.json');
const rule = H.parseRule(candidate.entry.rule, candidate.entry.generations);
const period = 6;
const launcher = H.fromCoordinates(candidate.launcher, rule.generations);
const states = [launcher];
for (let t = 0; t < 240; t++) states.push(H.step(states.at(-1), rule));
const at240 = H.toCoordinates(states[240]);
const referenceHeads = [at240.filter(([, r]) => r >= 147), at240.filter(([, r]) => r <= -147)];
const velocities = [[-2, 4], [2, -4]];

function puffer(head, velocity) {
  let state = H.fromCoordinates(head, rule.generations);
  for (let phase = 0; phase < period; phase++) state = H.step(state, rule);
  const deposit = new Map(state);
  for (const [key, value] of H.translate(H.fromCoordinates(head, rule.generations), velocity)) {
    assert.equal(deposit.get(key), value);
    deposit.delete(key);
  }
  const entry = { rule: candidate.entry.rule, generations: rule.generations, coordinateStates: head };
  const proof = { emissionPeriod: period, coreTranslation: velocity, debrisCoordinateStates: H.toCoordinates(deposit), debrisPeriod: 1 };
  return { entry, proof, certificate: H.verifyEmitter(entry, proof) };
}

function certifySplit(generation) {
  const shiftCount = (generation - 240) / period;
  const heads = referenceHeads.map((cells, index) => cells.map(([q, r, v]) => [q + shiftCount * velocities[index][0], r + shiftCount * velocities[index][1], v]));
  const debris = new Map(states[generation]);
  for (const head of heads) for (const [key, value] of H.fromCoordinates(head, rule.generations)) {
    assert.equal(debris.get(key), value);
    debris.delete(key);
  }
  assert.deepEqual(H.toCoordinates(H.step(debris, rule)), H.toCoordinates(debris), 'Residual debris must be exactly stationary');
  const groups = heads.map((head, index) => puffer(head, velocities[index]));
  let parts = heads.map(head => H.fromCoordinates(head, rule.generations));
  let complete = states[generation];
  const separation = [];
  for (let phase = 0; phase < period; phase++) {
    assert.deepEqual(H.toCoordinates(H.disjointUnion([...parts, debris])), H.toCoordinates(complete));
    for (let index = 0; index < 2; index++) {
      separation.push({ phase, first: `head-${index}`, second: 'stationary-debris', ...H.separationCertificate(parts[index], debris, velocities[index], [0, 0]) });
    }
    separation.push({ phase, first: 'head-0', second: 'head-1', ...H.separationCertificate(parts[0], parts[1], velocities[0], velocities[1]) });
    parts = parts.map(part => H.step(part, rule));
    complete = H.step(complete, rule);
  }
  assert.deepEqual(H.toCoordinates(H.disjointUnion([...parts, debris])), H.toCoordinates(complete));
  return { generation, groups, stationaryDebris: H.toCoordinates(debris), separation, exactSplitStates: H.toCoordinates(states[generation]), checkedCompleteGenerations: generation + period };
}

let split;
for (let generation = 0; generation <= 240; generation += period) {
  try { split = certifySplit(generation); break; } catch (error) { if (generation === 240) throw error; }
}
assert(split);
const clausesByGeneration = [];
let reduced = launcher;
let firstDivergence = null;
for (let generation = 0; generation < 36; generation++) {
  const clauses = {};
  H.step(states[generation], rule, clauses);
  if (clauses.B5) clausesByGeneration.push({ transitionFrom: generation, transitionTo: generation + 1, B5: clauses.B5 });
  reduced = H.step(reduced, H.parseRule('B24/S02', rule.generations));
  if (firstDivergence === null && JSON.stringify(H.toCoordinates(reduced)) !== JSON.stringify(H.toCoordinates(states[generation + 1]))) firstDivergence = generation + 1;
}
const counterfactual = H.findOrbit({ rule: 'B24/S02', generations: rule.generations, coordinateStates: candidate.launcher }, { maxSteps: 100, maxSupport: 2000 });
const evidence = {
  schema: 'aperiodic-life-hex-twin-puffer-v1',
  launcher: { rule: candidate.entry.rule, generations: rule.generations, coordinateStates: candidate.launcher },
  source: { campaign: 'mixed', seedId: candidate.sourceSeedId, initialLive: 2, initialRefractory: 1 },
  claim: 'Two opposite indefinitely propagating period-6 puffers, each leaving one stationary live-cell deposit per six generations. This is a finite launch of two puffers, not a stationary glider gun.',
  proofExplanation: 'Exact finite replay gives the complete split. Each head separately satisfies a complete-state translated-core-plus-deposit recurrence with permanently disjoint dependency neighbourhoods. At every phase the two heads and pre-existing stationary debris have separating cube-coordinate projections; each head moves outwards. Each head’s later deposits lie on its own outward ray, behind that head and separated from the other head and its deposits. Translation invariance and determinism then extend the decomposition indefinitely on the unbounded hexagonal lattice.',
  minimalSplitScope: 'Earliest successful split among generations divisible by six, for the selected complete head phases; not a claim of the earliest possible phase-dependent decomposition.',
  ...split,
  launcherClauseEvidence: { originalRule: 'B245/S02', orbitEffectiveRule: 'B24/S02', clausesByGeneration, firstDivergenceWhenRemovingB5: firstDivergence, counterfactualAt100: { kind: counterfactual.kind, period: counterfactual.period, transient: counterfactual.transient } },
};
fs.writeFileSync(`${__dirname}/twin-puffer-evidence.json`, JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ splitGeneration: split.generation, stationaryDebris: split.stationaryDebris.length, heads: split.groups.map(group => ({ states: group.entry.coordinateStates.length, certificate: group.certificate })), interGroupChecks: split.separation.length, minimumGap: Math.min(...split.separation.map(x => x.gap)) }));
