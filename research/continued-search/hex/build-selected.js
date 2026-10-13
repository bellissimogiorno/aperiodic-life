'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const H = require('./hex-reference');
const Core = require(path.resolve(process.argv[2]));
const head = require('./centred-puffer-candidate.json');
const twin = require('./twin-puffer-evidence.json');
const source = require('./p48-source.json');
const launch = H.findOrbit({ ...source, coordinateStates: source.initial }, { maxSteps: 70 });
assert.equal(launch.transient, 16);
assert.equal(launch.period, 48);
let chosen = launch.phases.reduce((a, b) => a.size <= b.size ? a : b);
const normal = H.normalise(chosen);
const centre = [0, 1].map(axis => Math.floor(Math.max(...normal.cells.map(c => c[axis])) / 2));
const shipCells = normal.cells.map(([q, r, v]) => [q - centre[0], r - centre[1], v]);
const provenance = (note) => ({ status: 'package-found', credit: 'Found and independently verified in this package’s bounded search; discovery priority has not been established.', note, sources: [], evidence: ['research/continued-search/hex/campaigns.json', 'research/continued-search/hex/selected-evidence.json'] });
const shared = { tiling: 'hex', neighborhood: 'edge', borderRings: 1, speed: 4 };
const entries = [
  { ...shared, id: 'hex-b245s02-c5-p6-puffer', category: 'Hexagonal guns, puffers and replication', title: 'Hexagonal p6 single-cell-trail puffer', summary: 'A five-state puffer shifts by axial (−2,4) every six generations, depositing one stationary live cell each cycle. Exact separation certificates prove continued propagation on the infinite hexagonal lattice.', depth: 128, ...head.entry, expectedActivityThrough: 120, provenance: provenance('A moving head extracted from the three-cell mixed-state seed. Its complete period-6 recurrence and permanent separation from every deposit are certified. B5 is unused in flight; the three-cell launch uses B5 twice. This is a newly verified package example, not a claim of first discovery.') },
  { ...shared, id: 'hex-b245s02-c5-three-cell-twin-puffer-launcher', category: 'Hexagonal guns, puffers and replication', title: 'Hexagonal three-cell twin-puffer launcher', summary: 'Two live cells and one refractory cell launch two opposite puffers. By generation 30 they have separated from four stationary cells; each puffer then deposits one live cell every six generations.', depth: 128, ...twin.launcher, expectedActivityThrough: 120, provenance: provenance('Mixed-state exhaustive campaign, seed mixed-n3-c5-s10. Complete replay gives two opposite certified p6 puffers and four stationary live cells at generation 30. This is a finite launch, not a stationary gun. A related four-live-cell seed had remained unclassified in the earlier exhaustive campaign; priority outside this package is unestablished.') },
  { ...shared, id: 'hex-b2345s24-c4-p48-traveller', category: 'Hexagonal travellers', title: 'Hexagonal p48 long-cycle spaceship', summary: 'A four-state spaceship follows a 48-generation cycle, moving by axial (−32,16). It can also be launched from seven live cells, as recorded in the accompanying evidence.', depth: 192, rule: source.rule, generations: 4, coordinateStates: shipCells, expectedPeriod: 48, moving: true, translation: source.translation, provenance: provenance('Seven-cell exhaustive campaign, seed n7c4s245: seven live cells settle after 16 generations into this exact period-48 ship. The displayed recurrent phase was centred for viewing. Full D6/phase comparison finds no match in the preceding 33-entry hexagonal catalogue. Independent decomposition at every phase confirms one persistent body with short-lived sparks, rather than a convoy of independently recurring ships. No worldwide priority claim is made.') },
];
const evidence = [];
for (const entry of entries) {
  const orbit = entry.moving ? H.findOrbit(entry, { maxSteps: entry.expectedPeriod }) : null;
  if (orbit) { assert.equal(orbit.transient, 0); assert.equal(orbit.period, 48); assert(H.equivalentOrbits(orbit, launch)); }
  const coreSteps = orbit ? 192 : 120;
  const comparison = H.compareCore(entry, Core, coreSteps);
  assert(entry.depth >= comparison.depth);
  const patch = Core.buildHexPatch(entry.depth), indices = new Map();
  for (let i = 0; i < patch.tileCount; i++) indices.set(`${patch.coordinates[2 * i]},${patch.coordinates[2 * i + 1]}`, i);
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  const rule = H.parseRule(entry.rule, entry.generations);
  const hash = crypto.createHash('sha256');
  let state = H.fromCoordinates(entry.coordinateStates, entry.generations);
  for (let generation = 0; generation <= coreSteps; generation++) {
    hash.update(JSON.stringify(H.toCoordinates(state)) + '\n');
    if (generation <= 60) for (const [coordinate] of state) {
      const cell = indices.get(coordinate);
      for (let axis = 0; axis < 2; axis++) { bounds[axis] = Math.min(bounds[axis], patch.bboxes[4 * cell + axis]); bounds[axis + 2] = Math.max(bounds[axis + 2], patch.bboxes[4 * cell + axis + 2]); }
    }
    if (generation < coreSteps) state = H.step(state, rule);
  }
  entry.view = { mode: 'trajectory', bounds, steps: 60, padding: 3 };
  const record = { id: entry.id, entry, coreComparison: comparison, trajectorySha256: hash.digest('hex') };
  if (entry.id === 'hex-b245s02-c5-p6-puffer') { record.emissionProof = head.proof; record.emissionCertificate = H.verifyEmitter(entry, head.proof); }
  else if (entry.id.includes('twin-puffer')) record.twinProofFile = 'twin-puffer-evidence.json';
  else { record.expectedOrbit = H.serialisableOrbit(orbit); record.launcher = { rule: source.rule, generations: 4, coordinateStates: source.initial, transient: launch.transient, period: launch.period, translation: launch.translation }; }
  evidence.push(record);
  console.log(JSON.stringify({ id: entry.id, cells: entry.coordinateStates.length, coreComparison: comparison }));
}
fs.writeFileSync(`${__dirname}/recommended-catalogue.json`, JSON.stringify(entries, null, 2) + '\n');
fs.writeFileSync(`${__dirname}/selected-evidence.json`, JSON.stringify({ schema: 'aperiodic-life-continued-hex-evidence-v1', scope: 'Complete-state unbounded certificates and boundary-safe comparisons with Core. Discovery priority is not established.', entries: evidence }, null, 2) + '\n');
