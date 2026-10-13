#!/usr/bin/env node
'use strict';

// Independent neighbour-query replay: every candidate cell counts its live
// neighbours afresh. No incremental counts or recurrence hashes are shared
// with the C++ miner or the production automaton.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Core = require('../../../core.js');
const Mobility = require('../../search-mobile-patterns.js');

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'rejected-glider-candidates.json')));
const patch = Core.buildPatch(fixture.tiling, fixture.depth);
const spatial = Mobility.makeSpatialIndex(patch);
const report = [];

function step(state, graph, rule, generations) {
  const candidates = new Set(state.keys());
  for (const [cell, value] of state) {
    if (value !== 1) continue;
    for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) candidates.add(graph.neighbors[k]);
  }
  const next = new Map();
  for (const cell of candidates) {
    let neighbours = 0;
    for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) {
      if (state.get(graph.neighbors[k]) === 1) neighbours++;
    }
    const previous = state.get(cell) || 0;
    const value = previous === 0 ? (rule.birthLookup[neighbours] ? 1 : 0)
      : previous === 1 ? (rule.surviveLookup[neighbours] ? 1 : generations > 2 ? 2 : 0)
        : previous + 1 < generations ? previous + 1 : 0;
    if (value) next.set(cell, value);
  }
  return next;
}

for (const entry of fixture.examples) {
  const graph = patch[`${entry.neighborhood}Graph`];
  const rule = Core.parseRule(entry.rule, graph.maxDegree);
  const dense = new Core.Automaton(patch, graph, {rule: entry.rule, generations: entry.generations, borderRings: 0});
  let state = new Map(entry.cellStates);
  for (const [cell, value] of state) dense.state[cell] = value;
  dense.refreshDerivedState();
  const seen = new Map();
  let previous = null;
  let returnHalo = null;
  let maxPopulation = 0;
  let maximumRadius = 0;
  let minimumBoundaryDistance = Infinity;
  const stop = entry.expectedExtinction ?? entry.expectedCycle.transient + entry.expectedCycle.period;

  for (let generation = 0; generation <= stop; generation++) {
    const expected = new Uint8Array(patch.tileCount);
    for (const [cell, value] of state) expected[cell] = value;
    assert.deepStrictEqual(dense.state, expected, `${entry.id}: Core parity at generation ${generation}`);
    const entries = [...state].sort((a, b) => a[0] - b[0]);
    const signature = JSON.stringify(entries);
    if (state.size) {
      let x = 0;
      let y = 0;
      for (const [cell] of state) {
        x += patch.centers[2 * cell];
        y += patch.centers[2 * cell + 1];
        minimumBoundaryDistance = Math.min(minimumBoundaryDistance, graph.boundaryDistance[cell]);
      }
      x /= state.size;
      y /= state.size;
      for (const [cell] of state) maximumRadius = Math.max(maximumRadius,
        Math.hypot(patch.centers[2 * cell] - x, patch.centers[2 * cell + 1] - y));
    }
    maxPopulation = Math.max(maxPopulation, state.size);

    if (entry.translatedReturn?.from === generation) previous = {entries};
    if (entry.translatedReturn?.to === generation) {
      const automaton = {patch, graph, state: expected, active: [...state.keys()]};
      const [dx, dy] = entry.translatedReturn.translation;
      const mapping = Mobility.verifyTranslatedState(previous, automaton, spatial, dx, dy);
      assert(mapping, `${entry.id}: complete states and polygons must translate`);
      returnHalo = Mobility.translatedNeighborhoodRadius(previous, automaton, spatial, dx, dy, mapping, 3);
      const refractory = previous.entries.findIndex(([, value]) => value > 1);
      if (refractory >= 0) {
        const changed = {entries: previous.entries.map((pair) => pair.slice())};
        changed.entries[refractory][1] = changed.entries[refractory][1] === 2 ? 1 : 2;
        assert.equal(Mobility.verifyTranslatedState(changed, automaton, spatial, dx, dy), null,
          `${entry.id}: changing a refractory cell must invalidate the return`);
      }
    }

    if (generation === stop) {
      if (entry.expectedExtinction !== undefined) assert.equal(state.size, 0, `${entry.id}: extinction`);
      else {
        assert.equal(seen.get(signature), entry.expectedCycle.transient, `${entry.id}: first stationary return`);
        assert.equal(generation - seen.get(signature), entry.expectedCycle.period);
      }
      break;
    }
    assert(state.size, `${entry.id}: no earlier extinction`);
    assert(!seen.has(signature), `${entry.id}: no earlier stationary recurrence`);
    seen.set(signature, generation);
    state = step(state, graph, rule, entry.generations);
    dense.step();
  }
  assert(minimumBoundaryDistance >= 5, `${entry.id}: must remain clear of the boundary`);
  report.push({id: entry.id, generationsCompared: stop + 1, independentQueryParity: true,
    maxPopulation, maximumRadius, minimumBoundaryDistance,
    translatedReturn: entry.translatedReturn || null, matchedDeadHaloRings: returnHalo,
    outcome: entry.expectedExtinction !== undefined ? {extinction: stop} : entry.expectedCycle});
}
const output = JSON.stringify({schema: 1, examples: report}, null, 2) + '\n';
if (process.argv[2]) fs.writeFileSync(process.argv[2], output);
else process.stdout.write(output);
