#!/usr/bin/env node
'use strict';

// Measure current patch construction and simulation on this host.
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const crypto = require('crypto');
const Core = require('../core.js');
const catalogue = require('../discoveries.js');
const options = { rounds: 5, output: '', quick: false };
for (let index = 2; index < process.argv.length; index++) {
  const name = process.argv[index];
  if (name === '--quick') options.quick = true;
  else if (name === '--rounds' && process.argv[index + 1]) options.rounds = Number(process.argv[++index]);
  else if (name === '--output' && process.argv[index + 1]) options.output = process.argv[++index];
  else throw new Error('Usage: node --expose-gc research/benchmark-core-performance.js [--rounds N] [--quick] [--output path.json]');
}
const rounds = options.rounds;
if (!Number.isSafeInteger(rounds) || rounds < 1) throw new RangeError('rounds must be a positive integer');
const median = (values) => {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const results = [];
const timing = (callback) => {
  if (global.gc) global.gc();
  const start = performance.now();
  const value = callback();
  return { value, milliseconds: performance.now() - start };
};

for (const seed of ['sun', 'sun-mirror']) {
  for (const depth of options.quick ? [6, 8] : [8, 10, 11]) {
    // Warm each configuration before collecting timed samples.
    Core.buildPenrosePatch(depth, { seed });
    const durations = [];
    let tileCount;
    for (let round = 0; round < rounds; round++) {
      const result = timing(() => Core.buildPenrosePatch(depth, { seed }));
      durations.push(result.milliseconds);
      tileCount = result.value.tileCount;
    }
    results.push({
      operation: 'buildPenrosePatch', seed, depth, tileCount,
      milliseconds: durations, medianMilliseconds: median(durations),
    });
    process.stderr.write(`${seed} depth ${depth}: ${median(durations).toFixed(1)} ms\n`);
  }
}

// Measure representative sparse and dense simulation workloads.
const stepping = [];
function entriesFor(entry, patch) {
  const coordinates = new Map();
  if (patch.coordinates) for (let cell = 0; cell < patch.tileCount; cell++) {
    coordinates.set(`${patch.coordinates[cell * 2]},${patch.coordinates[cell * 2 + 1]}`, cell);
  }
  return [...(entry.cellStates || []), ...(entry.coordinateStates || []).map(([a, b, state]) => {
    const cell = coordinates.get(`${a},${b}`);
    assert.notEqual(cell, undefined);
    return [cell, state];
  })];
}
function measureSteps(label, patch, graph, options, entries, steps = 200) {
  const simulation = new Core.Automaton(patch, graph, options);
  const initialize = () => {
    simulation.clear();
    for (const [cell, state] of entries) simulation.state[cell] = state;
    simulation.refreshDerivedState();
  };
  initialize();
  for (let i = 0; i < steps; i++) simulation.step();
  const durations = [];
  for (let round = 0; round < rounds; round++) {
    initialize();
    const start = performance.now();
    for (let i = 0; i < steps; i++) simulation.step();
    durations.push((performance.now() - start) / steps);
  }
  stepping.push({ label, tiling: patch.tiling, depth: patch.depth, tileCount: patch.tileCount,
    rule: options.rule, generations: options.generations, stepsPerRound: steps,
    millisecondsPerStep: durations, medianMillisecondsPerStep: median(durations),
    initialNonzeroCells: entries.length, finalLiveCells: simulation.aliveCount() });
}
for (const id of ['square-glider', 'penrose-b2-c4-compact-traveller', 'hat-conway-p26']) {
  const selected = catalogue.find((candidate) => candidate.id === id);
  assert(selected, `Missing benchmark catalogue entry ${id}`);
  const patch = Core.buildPatch(selected.tiling, selected.depth, { seed: selected.penroseSeed });
  const graph = selected.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  measureSteps(selected.id, patch, graph, selected, entriesFor(selected, patch));
}
for (const [tiling, depth] of [['square', 301], ['penrose', 10], ['hat', 5]]) {
  const patch = Core.buildPatch(tiling, depth);
  const options = { rule: tiling === 'square' ? 'B3/S23' : 'B2/S', generations: 3, borderRings: 1 };
  const simulation = new Core.Automaton(patch, patch.touchGraph, options);
  simulation.randomize(0.4, 'aperiodic-life-dense-performance');
  const entries = [];
  for (let cell = 0; cell < patch.tileCount; cell++) if (simulation.state[cell]) entries.push([cell, 1]);
  measureSteps(`${tiling}-dense-soup`, patch, patch.touchGraph, options, entries, 100);
}

const report = {
  schema: 1, generatedBy: 'research/benchmark-core-performance.js',
  generatedAt: new Date().toISOString(), runtime: process.version,
  platform: `${process.platform}/${process.arch}`, cpu: os.cpus()[0]?.model || 'not exposed',
  explicitGc: Boolean(global.gc), rounds,
  currentCoreSha256: crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '../core.js'))).digest('hex'),
  interpretation: 'Wall-clock samples from this host after warm-up. Timings depend on runtime, hardware and other workloads; they are measurements of this implementation, not universal speed guarantees.',
  patchConstruction: results, simulation: stepping,
};
const json = JSON.stringify(report, null, 2) + '\n';
if (options.output) fs.writeFileSync(options.output, json);
else process.stdout.write(json);
