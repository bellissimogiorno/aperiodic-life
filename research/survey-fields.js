#!/usr/bin/env node
'use strict';

/* Deterministic exact-state survey of a small, documented rule panel. */
const Core = require('../core.js');

const RULES = [
  ['B3/S23', 2],
  ['B1/S', 2],
  ['B2/S', 2],
  ['B12/S', 2],
  ['B23/S', 2],
  ['B2/S', 3],
  ['B3/S', 3],
  ['B34/S', 3],
];
const STEPS = 3000;
const HISTORY_LIMIT = 1024;
const DENSITY = 0.12;

function statesEqual(left, right) {
  for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return false;
  return true;
}

function stateCounts(state) {
  let alive = 0;
  let active = 0;
  for (const value of state) {
    if (value) active++;
    if (value === 1) alive++;
  }
  return { alive, active };
}

function runCase(tiling, depth, neighborhood, rule, generations) {
  const patch = Core.buildPatch(tiling, depth, { seed: 'sun' });
  const graph = neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const seed = `${tiling}-${neighborhood}-${rule}-${generations}`;
  const simulation = new Core.Automaton(patch, graph, {
    rule,
    generations,
    borderRings: 8,
  });
  simulation.randomize(DENSITY, seed);

  const buckets = new Map();
  const order = [];
  const samples = [];
  let minimumAlive = Infinity;
  let maximumAlive = 0;
  let totalChanged = 0;

  for (let generation = 0; generation <= STEPS; generation++) {
    const counts = stateCounts(simulation.state);
    minimumAlive = Math.min(minimumAlive, counts.alive);
    maximumAlive = Math.max(maximumAlive, counts.alive);
    if (generation % 250 === 0) {
      samples.push({ generation, alive: counts.alive, active: counts.active, changed: simulation.lastChangedCount });
    }

    const [hashA, hashB] = simulation.ensureStateHash();
    const key = `${hashA}:${hashB}:${counts.active}:${counts.alive}`;
    const bucket = buckets.get(key);
    if (bucket) {
      for (let index = bucket.length - 1; index >= 0; index--) {
        const previous = bucket[index];
        if (statesEqual(previous.state, simulation.state)) {
          return {
            tiling, neighborhood, rule: simulation.rule.text, generations, seed,
            outcome: 'cycle', transient: previous.generation,
            period: generation - previous.generation, detectedAt: generation,
            minimumAlive, maximumAlive, samples,
          };
        }
      }
    }

    if (counts.active === 0) {
      return {
        tiling, neighborhood, rule: simulation.rule.text, generations, seed,
        outcome: 'extinct', generation, minimumAlive, maximumAlive, samples,
      };
    }
    if (generation === STEPS) break;

    const entry = { key, generation, state: simulation.state.slice() };
    if (bucket) bucket.push(entry);
    else buckets.set(key, [entry]);
    order.push(entry);
    while (order.length > HISTORY_LIMIT) {
      const oldest = order.shift();
      const oldBucket = buckets.get(oldest.key);
      const position = oldBucket.indexOf(oldest);
      if (position >= 0) oldBucket.splice(position, 1);
      if (!oldBucket.length) buckets.delete(oldest.key);
    }

    simulation.step();
    totalChanged += simulation.lastChangedCount;
  }

  const final = stateCounts(simulation.state);
  return {
    tiling, neighborhood, rule: simulation.rule.text, generations, seed,
    outcome: 'active-at-horizon', generation: STEPS,
    finalAlive: final.alive, finalActive: final.active,
    finalChanged: simulation.lastChangedCount,
    totalChanged, minimumAlive, maximumAlive, samples,
  };
}

const cases = [];
for (const [tiling, depth] of [['hat', 4], ['penrose', 8]]) {
  for (const neighborhood of ['edge', 'touch']) {
    for (const [rule, generations] of RULES) {
      cases.push(runCase(tiling, depth, neighborhood, rule, generations));
    }
  }
}

const counts = {};
for (const result of cases) counts[result.outcome] = (counts[result.outcome] || 0) + 1;
console.log(JSON.stringify({
  schema: 1,
  methodology: {
    density: DENSITY,
    borderRings: 8,
    horizon: STEPS,
    exactStateHistory: HISTORY_LIMIT,
    ruleNotation: 'Compact digits denote separate counts: B12 means birth on 1 or 2 neighbours.',
  },
  counts,
  cases,
}, null, 2));
