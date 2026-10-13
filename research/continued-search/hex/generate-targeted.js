'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');
const H = require('./hex-reference');
const catalogue = require('./catalogue-baseline.json');
const mask = value => [...value].reduce((bits, digit) => bits | 1 << Number(digit), 0);
const ids = ['hex-b2s0-c3-three-cell-glider', 'hex-b234s1346-c3-four-cell-launcher', 'hex-b2456s1345-c4-five-cell-launcher', 'hex-b23s13-c4-p9-knightship-launcher', 'hex-b234s245-c5-p10-knightship-launcher', 'hex-b246s246-c4-p30-gun', 'hex-b25s34-p20-puffer'];
const entries = ids.map(id => catalogue.find(e => e.id === id));
const rules = new Map();
const phases = [];
for (const entry of entries) {
  const [, birth, survival] = /^B(.*)\/S(.*)$/.exec(entry.rule);
  const B = mask(birth), S = mask(survival), C = entry.generations;
  for (let bit = -1; bit < 13; bit++) {
    const b = bit >= 0 && bit < 6 ? B ^ 1 << (bit + 1) : B;
    const s = bit >= 6 ? S ^ 1 << (bit - 6) : S;
    const key = `${b}/${s}/${C}`;
    if (!rules.has(key)) rules.set(key, { B: b, S: s, C, basis: entry.id, changedBit: bit });
  }
  let state = H.fromCoordinates(entry.coordinateStates, C);
  const rule = H.parseRule(entry.rule, C);
  const orbit = entry.expectedTravel ? H.findOrbit(entry, { maxSteps: 200 }) : null;
  const horizon = orbit ? orbit.transient + orbit.period : 60;
  for (let generation = 0; generation < horizon; generation++) {
    if (state.size <= 180) phases.push({ id: entry.id, generation, cells: H.normalise(state).cells, B, S, C });
    state = H.step(state, rule);
  }
}
const shapes = fs.readFileSync(`${__dirname}/n8-shapes.txt`, 'utf8').trim().split('\n');
const target = fs.openSync(`${__dirname}/n8-targeted-seeds.txt`, 'w');
let trials = 0;
for (const [key, rule] of rules) for (const line of shapes) {
  const split = line.indexOf(' ');
  fs.writeSync(target, `${line.slice(0, split)}-r${key.replaceAll('/', '_')} ${rule.B} ${rule.S} ${rule.C}${line.slice(split)}\n`);
  trials++;
}
fs.closeSync(target);
let randomState = 0x3722026;
function rand(n) { randomState ^= randomState << 13; randomState ^= randomState >>> 17; randomState ^= randomState << 5; return (randomState >>> 0) % n; }
const mutation = fs.openSync(`${__dirname}/new-mutations-seeds.txt`, 'w');
const mutationTrials = 100000, baseCounts = {};
for (let trial = 0; trial < mutationTrials; trial++) {
  const phase = phases[rand(phases.length)];
  let { B, S, C } = phase;
  if (rand(4) === 0) C = 3 + rand(6);
  if (rand(4) === 0) {
    const bit = rand(13);
    if (bit < 6) B ^= 1 << (bit + 1); else S ^= 1 << (bit - 6);
  }
  const state = new Map(phase.cells.filter(c => c[2] < C).map(([q, r, v]) => [`${q},${r}`, v]));
  const edits = 1 + rand(5);
  for (let edit = 0; edit < edits; edit++) {
    const [q, r] = phase.cells[rand(phase.cells.length)];
    const at = `${q + rand(7) - 3},${r + rand(7) - 3}`;
    const value = rand(C);
    if (value) state.set(at, value); else state.delete(at);
  }
  const cells = H.toCoordinates(state);
  fs.writeSync(mutation, [`${phase.id}-g${phase.generation}-new${trial}`, B, S, C, cells.length, ...cells.flat()].join(' ') + '\n');
  baseCounts[phase.id] = (baseCounts[phase.id] || 0) + 1;
}
fs.closeSync(mutation);
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(`${__dirname}/${file}`)).digest('hex');
const manifest = { targeted: { trials, shapes: shapes.length, rules: [...rules.values()], ruleCount: rules.size, sha256: hash('n8-targeted-seeds.txt') }, mutations: { trials: mutationTrials, prng: 'xorshift32', seed: '0x3722026', basePhases: phases.length, baseCounts, method: 'One to five state substitutions in a 7-by-7 axial neighbourhood of a source-phase cell; 25% change state count to C3..8, 25% toggle one of B1..B6 or S0..S6. Refractory states retained if valid.', sha256: hash('new-mutations-seeds.txt') }, credit: 'Gun and puffer source phases are published patterns credited in catalogue-baseline.json. Five remaining bases were package search finds without established discovery priority. Targeted all-live eight-cell seeds are independent generated shapes under neighbouring rules, not imported pattern geometries.' };
fs.writeFileSync(`${__dirname}/targeted-generation.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ targetedTrials: trials, rules: rules.size, mutationTrials, phases: phases.length }));
