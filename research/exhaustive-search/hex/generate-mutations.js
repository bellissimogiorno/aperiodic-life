'use strict';
const fs = require('node:fs');
const path = require('node:path');
const outputDirectory = path.resolve(process.argv[2] || '.');
fs.mkdirSync(outputDirectory, { recursive: true });
const H = require('../../hex-reference');
const catalogue = require('./mutation-bases.json');
let rngState = 0x3652026;
function rand(n) { rngState ^= rngState << 13; rngState ^= rngState >>> 17; rngState ^= rngState << 5; return (rngState >>> 0) % n; }
const mask = s => [...s].reduce((a, v) => a | 1 << Number(v), 0);
const bases = [];
for (const entry of catalogue.filter(e => e.tiling === 'hex' && (e.moving || e.expectedTravel || e.expectedActivityThrough))) {
  const [, birth, survival] = /^B(.*)\/S(.*)$/.exec(entry.rule);
  const rule = H.parseRule(entry.rule, entry.generations);
  let state = H.fromCoordinates(entry.coordinateStates, entry.generations);
  const phaseCount = entry.expectedPeriod || (entry.expectedTravel ? 90 : 30);
  for (let i = 0; i < phaseCount; i++) {
    if (state.size && state.size <= 150) bases.push({ id: `${entry.id}-g${i}`, B: mask(birth), S: mask(survival), C: entry.generations, cells: H.normalise(state).cells });
    state = H.step(state, rule);
  }
}
const output = fs.openSync(path.join(outputDirectory, 'mutation-seeds.txt'), 'w');
const counts = {};
const trials = Number(process.argv[3] || 200000);
for (let trial = 0; trial < trials; trial++) {
  const base = bases[rand(bases.length)];
  let { B, S, C } = base;
  if (rand(5) === 0) C = 2 + rand(7);
  const changes = rand(4) === 0 ? 1 + rand(2) : 0;
  for (let i = 0; i < changes; i++) { const bit = rand(12); if (bit < 6) B ^= 1 << (bit + 1); else S ^= 1 << (bit - 6); }
  const state = new Map(base.cells.filter(c => c[2] < C).map(c => [`${c[0]},${c[1]}`, c[2]]));
  const edits = 1 + rand(6);
  for (let i = 0; i < edits; i++) {
    const [q, r] = base.cells[rand(base.cells.length)];
    const dq = rand(5) - 2, dr = rand(5) - 2;
    const key = `${q + dq},${r + dr}`;
    if (state.has(key) && rand(2) === 0) state.delete(key);
    else state.set(key, rand(4) === 0 ? 1 + rand(C - 1) : 1);
  }
  const cells = H.toCoordinates(state);
  fs.writeSync(output, [`${base.id}-trial${trial}`, B, S, C, cells.length, ...cells.flat()].join(' ') + '\n');
  counts[base.id.replace(/-g\d+$/, '')] = (counts[base.id.replace(/-g\d+$/, '')] || 0) + 1;
}
fs.closeSync(output);
fs.writeFileSync(path.join(outputDirectory, 'mutation-generation.json'), JSON.stringify({ prng: 'xorshift32', initialSeed: '0x3652026', trials, basePhases: bases.length, counts, method: '1–6 cell edits within a 5×5 axial box around a randomly selected phase cell; 20% random C in 2..8; 25% one or two flips among B1..B6 and S0..S5; all surviving refractory states retained.' }, null, 2));
