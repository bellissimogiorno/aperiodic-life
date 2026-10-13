#!/usr/bin/env node
'use strict';

// A third simulation checks both production engines. Its state is a Map and it
// counts each candidate's neighbours directly, including all zero-state cells.
// Geometric certificates check labelled polygons and a complete dead halo.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const V = require('./aperiodic-reference.js');
const { SparseAutomaton } = require('./lib/sparse-automaton.js');
const cache = new Map();

function reference(entry, graph, cells) {
  return entry.referenceTable
    ? new V.PriorityReference(graph, V.PUBLISHED_TABLES[entry.referenceTable], cells)
    : new V.ReferenceGraph(graph, entry.rule, entry.generations, cells);
}

function verifyCase(entry, { checkExpected = true, denseParity = true } = {}) {
  const key = `${entry.tiling}:${entry.depth}:${entry.penroseSeed || ''}`;
  if (!cache.has(key)) cache.set(key, V.Core.buildPatch(entry.tiling, entry.depth, { seed: entry.penroseSeed }));
  const patch = cache.get(key);
  const graph = entry.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const independent = reference(entry, graph, entry.cellStates);
  const sparse = new SparseAutomaton(patch, graph, entry.rule, entry.generations);
  sparse.initialize(entry.cellStates);
  const dense = denseParity ? new V.Core.Automaton(patch, graph, { rule: entry.rule, generations: entry.generations, borderRings: 0 }) : null;
  if (dense) {
    for (const [cell, state] of entry.cellStates) dense.state[cell] = state;
    dense.refreshDerivedState();
  }
  const phases = [];
  const metrics = [];
  const hash = crypto.createHash('sha256');
  const seen = new Set();
  let absoluteRepeat = false;
  for (let generation = 0; generation <= entry.horizon; generation++) {
    const cells = independent.entries();
    assert.deepStrictEqual(sparse.entries(), cells, `${entry.id}: sparse state at generation ${generation}`);
    if (dense) assert.equal(Buffer.compare(Buffer.from(dense.state), Buffer.from(sparse.state)), 0, `${entry.id}: dense state at generation ${generation}`);
    const serialised = JSON.stringify(cells);
    hash.update(serialised + '\n');
    if (seen.has(serialised)) absoluteRepeat = true;
    seen.add(serialised);
    phases.push(cells);
    const metric = V.measure(patch, graph, cells);
    metrics.push(metric);
    assert(metric.active > 0, `${entry.id}: unexpected extinction`);
    assert(metric.boundaryDistance >= 3, `${entry.id}: incomplete boundary dependency neighbourhood`);
    if (generation < entry.horizon) { independent.step(); sparse.step(); if (dense) dense.step(); }
  }
  const returns = [];
  for (const claim of entry.translatedReturns || []) {
    const certificate = V.certifyIsometry(patch, graph, phases[claim.from], patch, graph, phases[claim.to], claim.transform, claim.radius);
    delete certificate.mapping;
    returns.push({ from: claim.from, to: claim.to, ...certificate });
  }
  const emissions = [];
  if (entry.emissions) {
    const { splitGeneration, parts } = entry.emissions;
    assert.deepStrictEqual(parts.flatMap((part) => part.initial).sort((a, b) => a[0] - b[0]), phases[splitGeneration], `${entry.id}: emission split must include every nonzero cell`);
    const engines = parts.map((part) => reference(entry, graph, part.initial));
    const trajectories = parts.map((part) => [part.initial]);
    for (let generation = splitGeneration + 1; generation <= entry.horizon; generation++) {
      engines.forEach((engine, index) => { engine.step(); trajectories[index].push(engine.entries()); });
      const union = trajectories.flatMap((series) => series.at(-1)).sort((a, b) => a[0] - b[0]);
      assert.equal(new Set(union.map(([cell]) => cell)).size, union.length, `${entry.id}: emitted bodies overlap`);
      assert.deepStrictEqual(union, phases[generation], `${entry.id}: emittees fail independent replay at ${generation}`);
    }
    trajectories.forEach((series, index) => {
      const claim = parts[index].translatedReturn;
      const certificate = V.certifyIsometry(patch, graph, series[claim.from - splitGeneration], patch, graph, series[claim.to - splitGeneration], claim.transform, claim.radius);
      delete certificate.mapping;
      const measures = series.map((cells) => V.measure(patch, graph, cells));
      assert(measures.every((metric) => metric.active > 0 && metric.components === 1), `${entry.id}: emittee ${index + 1} ceases to be one compact connected body`);
      const start = measures[0].centroid;
      const end = measures.at(-1).centroid;
      emissions.push({ emission: index + 1, maxActive: Math.max(...measures.map((metric) => metric.active)),
        maxRadius: Math.max(...measures.map((metric) => metric.radius)),
        minimumBoundaryDistance: Math.min(...measures.map((metric) => metric.boundaryDistance)),
        centroidDisplacement: Math.hypot(end[0] - start[0], end[1] - start[1]),
        translatedReturn: { from: claim.from, to: claim.to, ...certificate } });
    });
  }
  const start = metrics[0].centroid;
  const end = metrics.at(-1).centroid;
  const result = { id: entry.id, verifiedThrough: entry.horizon, tileCount: patch.tileCount,
    trajectorySha256: hash.digest('hex'), finalCellStates: phases.at(-1),
    minimumBoundaryDistance: Math.min(...metrics.map((metric) => metric.boundaryDistance)),
    maxActive: Math.max(...metrics.map((metric) => metric.active)),
    maxRadius: Math.max(...metrics.map((metric) => metric.radius)),
    centroidDisplacement: Math.hypot(end[0] - start[0], end[1] - start[1]),
    absoluteRepeat, translatedReturns: returns, emissions };
  if (checkExpected) assert.deepStrictEqual(result, entry.expected, `${entry.id}: evidence changed`);
  return { result, phases, metrics, patch, graph };
}

function verifyFixture({ includeLong = false, checkExpected = true } = {}) {
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/aperiodic-evidence.json'), 'utf8'));
  const baselines = new Map();
  const results = [];
  for (const entry of [...fixture.cases, ...(includeLong ? fixture.longCases : [])]) {
    const verified = verifyCase(entry, { checkExpected });
    const key = `${entry.tiling}:${entry.depth}:${entry.horizon}`;
    if (entry.referenceTable === 'hatB') baselines.set(key, verified.phases);
    if (entry.referenceTable === 'hatSimple' && baselines.has(key)) {
      assert.deepStrictEqual(verified.phases, baselines.get(key).map((phase) => phase.map(([cell, state]) => [cell, state === 3 ? 2 : state])),
        `${entry.id}: the simplified rule differs from Hat B on this particular trajectory`);
    }
    results.push(verified.result);
  }
  return results;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: node research/verify-aperiodic.js [--long] [--output path.json]\nChecks finite complete-state trajectories, independent emitted bodies and labelled tile/halo translations. --long also repeats the depth-6 hat flight.');
  } else {
    const results = verifyFixture({ includeLong: args.includes('--long') });
    const result = { result: 'passed', cases: results.length, statesCompared: results.reduce((sum, item) => sum + item.verifiedThrough + 1, 0), results,
      interpretation: 'Finite computational evidence; no proof of indefinite propagation or novelty is implied.' };
    const outputIndex = args.indexOf('--output');
    if (outputIndex >= 0) fs.writeFileSync(args[outputIndex + 1], JSON.stringify(result, null, 2) + '\n');
    else console.log(JSON.stringify(result, null, 2));
  }
}
module.exports = { verifyCase, verifyFixture };
