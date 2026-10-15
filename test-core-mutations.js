'use strict';

// Deterministic reference checks after interleaved rule, graph, border and state edits.
// Run from any directory with: node test-core-mutations.js
const assert = require('assert');
const C = require('./core.js');
const V = require('./research/aperiodic-reference.js');
const tables = {
  'TABLE:HAT-A': V.PUBLISHED_TABLES.hatA,
  'TABLE:HAT-B': V.PUBLISHED_TABLES.hatB,
  'TABLE:HAT-C': V.PUBLISHED_TABLES.hatC,
  'TABLE:HAT-SIMPLE': V.PUBLISHED_TABLES.hatSimple,
  'TABLE:SPECTRE': V.PUBLISHED_TABLES.spectre,
  'TABLE:PENROSE-GOUCHER': V.PUBLISHED_TABLES.penroseGoucher,
};
let comparisons = 0;
let mutations = 0;
for (const [tiling, depth] of [['hat', 2], ['penrose', 4], ['square', 15], ['hex', 7]]) {
  const patch = C.buildPatch(tiling, depth);
  for (let trial = 0; trial < 120; trial++) {
    const random = C.mulberry32(8719 * trial + C.hashSeed(tiling));
    const sim = new C.Automaton(patch, patch.edgeGraph, { rule: 'B3/S23', generations: 2 });
    for (let step = 0; step < 80; step++) {
      if (step % 3 === 0) {
        const action = Math.floor(random() * 6);
        if (action === 0) {
          sim.setGraph(random() < 0.5 ? patch.edgeGraph : patch.touchGraph);
        } else if (action === 1) {
          sim.setBorderRings(Math.floor(random() * 4));
        } else if (action === 2) {
          if (random() < 0.5) {
            const names = Object.keys(tables);
            sim.setRule(names[Math.floor(random() * names.length)]);
          } else {
            const births = [], survivals = [];
            for (let n = 0; n <= 12; n++) {
              if (random() < 0.25) births.push(n);
              if (random() < 0.3) survivals.push(n);
            }
            sim.setRule(C.formatRule(births, survivals));
            sim.setGenerations(2 + Math.floor(random() * 254));
          }
        } else if (action === 3) {
          sim.randomize(random(), `${tiling}-${trial}-${step}`);
        } else if (action === 4) {
          for (let n = 0; n < 12; n++) sim.setCell(Math.floor(random() * patch.tileCount), random() < 0.5);
        } else {
          for (let n = 0; n < 12; n++) sim.state[Math.floor(random() * patch.tileCount)] = Math.floor(random() * sim.generations);
          sim.refreshDerivedState();
        }
        mutations++;
      }
      const previous = sim.state.slice();
      const expected = new Uint8Array(previous.length);
      const table = tables[sim.rule.text];
      const reference = table ? new V.PriorityReference(sim.graph, table, []) : null;
      for (let cell = 0; cell < expected.length; cell++) {
        if (sim.isLocked(cell)) continue;
        const counts = new Uint16Array(sim.generations);
        for (let n = sim.graph.offsets[cell]; n < sim.graph.offsets[cell + 1]; n++) counts[previous[sim.graph.neighbors[n]]]++;
        const own = previous[cell];
        expected[cell] = reference ? reference.nextValue(own, counts)
          : own === 0 ? Number(sim.rule.birth.includes(counts[1]))
          : own === 1 ? sim.rule.survive.includes(counts[1]) ? 1 : sim.generations > 2 ? 2 : 0
          : own + 1 < sim.generations ? own + 1 : 0;
      }
      sim.step();
      assert.deepStrictEqual(sim.state, expected, `${tiling} trial ${trial} step ${step}`);
      assert.equal(sim.aliveCount(), [...expected].filter(n => n === 1).length);
      assert.equal(sim.lastChangedCount, expected.reduce((sum, state, cell) => sum + Number(state !== previous[cell]), 0));
      assert.deepStrictEqual(sim.ensureStateHash(), sim.hashStateArray());
      comparisons++;
    }
  }
}
console.log(JSON.stringify({ result: 'passed', comparisons, mutations }));
