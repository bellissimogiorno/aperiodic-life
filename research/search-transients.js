#!/usr/bin/env node
'use strict';

/** Deterministic evolutionary search for compact long-lived seeds. */
const fs = require('fs');
const Core = require('../core.js');
const {
  SparseAutomaton,
  centralCells,
  randomConnectedSeed,
} = require('./lib/sparse-automaton.js');

if (require.main === module && process.argv.includes('--help')) {
  console.log(`Usage: node research/search-transients.js [options]

` +
    `Options are supplied as --name value pairs. Important options:
` +
    `  --tiling penrose|hat --depth N --neighborhood edge|touch
` +
    `  --rule B.../S... --generations N --iterations N --horizon N
` +
    `  --minSeed N --maxSeed N --maxActive N --maxRadius N
` +
    `  --minimumBoundaryDistance N --startSeed text --output path.json

` +
    `Sparse searches reject B0 rules because zero-neighbour births are global.`);
  process.exit(0);
}


function parseArguments(argv) {
  const result = {
    tiling: 'penrose', depth: 8, neighborhood: 'touch', rule: 'B3/S23',
    generations: 2, iterations: 20000, horizon: 2000, maxActive: 300,
    maxRadius: 24, minSeed: 3, maxSeed: 30, minimumBoundaryDistance: 18,
    startSeed: '', output: '',
  };
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index].replace(/^--/, '');
    if (!(key in result) || argv[index + 1] === undefined) throw new Error(`Unknown or incomplete option ${argv[index]}`);
    result[key] = [
      'depth', 'generations', 'iterations', 'horizon', 'maxActive', 'maxRadius',
      'minSeed', 'maxSeed', 'minimumBoundaryDistance',
    ].includes(key) ? Number(argv[index + 1]) : argv[index + 1];
  }
  return result;
}

function mutate(entries, graph, random, generations, minimumSize, maximumSize) {
  const cells = new Map(entries);
  const operations = 1 + Math.floor(random() * 5);
  for (let operation = 0; operation < operations; operation++) {
    const keys = [...cells.keys()];
    const choice = random();
    if (choice < 0.30 && keys.length > minimumSize) {
      cells.delete(keys[Math.floor(random() * keys.length)]);
    } else if (choice < 0.82 && keys.length < maximumSize && keys.length) {
      const base = keys[Math.floor(random() * keys.length)];
      const begin = graph.offsets[base];
      const end = graph.offsets[base + 1];
      const cell = graph.neighbors[begin + Math.floor(random() * (end - begin))];
      cells.set(cell, 1 + Math.floor(random() * (generations - 1)));
    } else if (keys.length) {
      const cell = keys[Math.floor(random() * keys.length)];
      cells.set(cell, 1 + Math.floor(random() * (generations - 1)));
    }
  }
  return [...cells.entries()].sort((left, right) => left[0] - right[0]);
}

function geometry(automaton) {
  const cells = automaton.live.length ? automaton.live : automaton.active;
  if (!cells.length) return { center: null, radius: 0 };
  let x = 0;
  let y = 0;
  for (const cell of cells) {
    x += automaton.patch.centers[cell * 2];
    y += automaton.patch.centers[cell * 2 + 1];
  }
  x /= cells.length;
  y /= cells.length;
  let radius = 0;
  for (const cell of automaton.active) {
    radius = Math.max(radius, Math.hypot(
      automaton.patch.centers[cell * 2] - x,
      automaton.patch.centers[cell * 2 + 1] - y,
    ));
  }
  return { center: [x, y], radius };
}

function evaluate(automaton, entries, options) {
  const seen = new Map();
  const territory = new Set(automaton.active);
  const initialGeometry = geometry(automaton);
  let maximumActive = automaton.active.length;
  let maximumRadius = initialGeometry.radius;
  let minimumBoundaryDistance = 0xffff;
  let totalChanged = 0;
  let previousSignature = null;
  for (const cell of automaton.active) {
    minimumBoundaryDistance = Math.min(
      minimumBoundaryDistance,
      automaton.graph.boundaryDistance[cell],
    );
  }

  if (
    maximumActive > options.maxActive ||
    maximumRadius > options.maxRadius ||
    minimumBoundaryDistance < 2
  ) {
    return finish('unbounded', 0, 0, 0, automaton.signature());
  }

  for (let step = 0; step <= options.horizon; step++) {
    if (!automaton.active.length) {
      return finish('extinct', step, 0, step, null);
    }
    const signature = automaton.signature();
    const earlier = seen.get(signature);
    if (earlier !== undefined) {
      return finish('cycle', step, step - earlier, earlier, signature);
    }
    if (step === options.horizon) {
      return finish('horizon', step, 0, step, signature);
    }
    seen.set(signature, step);
    previousSignature = signature;

    const before = automaton.active.length;
    automaton.step();
    const after = automaton.active.length;
    totalChanged += Math.abs(after - before);
    maximumActive = Math.max(maximumActive, after);
    const currentGeometry = geometry(automaton);
    maximumRadius = Math.max(maximumRadius, currentGeometry.radius);
    for (const cell of automaton.active) {
      territory.add(cell);
      minimumBoundaryDistance = Math.min(minimumBoundaryDistance, automaton.graph.boundaryDistance[cell]);
    }
    if (maximumActive > options.maxActive || maximumRadius > options.maxRadius || minimumBoundaryDistance < 2) {
      return finish('unbounded', step + 1, 0, step + 1, previousSignature);
    }
  }

  throw new Error('evaluation fell through');

  function finish(outcome, survived, period, transient, finalSignature) {
    const finalGeometry = geometry(automaton);
    const displacement = initialGeometry.center && finalGeometry.center
      ? Math.hypot(finalGeometry.center[0] - initialGeometry.center[0], finalGeometry.center[1] - initialGeometry.center[1])
      : 0;
    const localized = maximumActive <= options.maxActive && maximumRadius <= options.maxRadius;
    let score = transient * 12 + period * 4 + Math.min(territory.size, 1200) * 0.08;
    score += Math.min(displacement, 30) * 2;
    score -= entries.length * 1.2 + maximumActive * 0.06 + maximumRadius * 0.7;
    if (outcome === 'horizon' && localized) score += options.horizon * 10 + 1000;
    if (outcome === 'unbounded') score -= 5000;
    if (outcome === 'extinct') score -= 300;
    return {
      outcome,
      survived,
      transient,
      period,
      initialActive: entries.length,
      finalActive: automaton.active.length,
      maximumActive,
      maximumRadius,
      territory: territory.size,
      minimumBoundaryDistance: minimumBoundaryDistance === 0xffff ? null : minimumBoundaryDistance,
      displacement,
      totalChanged,
      localized,
      finalSignature,
      score,
    };
  }
}

function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const patch = Core.buildPatch(options.tiling, options.depth, { seed: 'sun' });
  const graph = options.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const normalizedRule = Core.parseRule(options.rule, graph.maxDegree).text;
  const deterministicSeed = options.startSeed ||
    `${options.tiling}-${options.neighborhood}-${normalizedRule}-${options.generations}-transient-v1`;
  const random = Core.mulberry32(Core.hashSeed(deterministicSeed));
  const centers = centralCells(patch, graph, options.minimumBoundaryDistance, 1600);
  if (!centers.length) throw new Error('no cells meet the requested boundary-distance constraint');
  const seedStarts = centers.slice(0, 120);
  const automaton = new SparseAutomaton(patch, graph, normalizedRule, options.generations);
  let elites = [];
  let best = null;
  let horizonSurvivors = 0;
  let exactCycles = 0;
  let extinctions = 0;
  let unbounded = 0;
  const started = Date.now();

  function createRandomSeed() {
    const size = options.minSeed + Math.floor(
      random() * (options.maxSeed - options.minSeed + 1),
    );
    return randomConnectedSeed(
      graph,
      seedStarts,
      random,
      size,
      options.generations,
      size * 50,
    );
  }

  for (let iteration = 0; iteration < options.iterations; iteration++) {
    const entries = elites.length && random() < 0.82
      ? mutate(
        elites[Math.floor(random() * Math.min(elites.length, 30))].entries,
        graph,
        random,
        options.generations,
        options.minSeed,
        options.maxSeed,
      )
      : createRandomSeed();
    automaton.initialize(entries);
    const metrics = evaluate(automaton, entries, options);
    if (metrics.outcome === 'horizon') horizonSurvivors++;
    else if (metrics.outcome === 'cycle') exactCycles++;
    else if (metrics.outcome === 'extinct') extinctions++;
    else unbounded++;
    const result = { entries, metrics };
    if (!best || metrics.score > best.metrics.score) {
      best = result;
      console.error(
        `best iteration=${iteration} outcome=${metrics.outcome} ` +
        `transient=${metrics.transient} period=${metrics.period} ` +
        `max=${metrics.maximumActive} radius=${metrics.maximumRadius.toFixed(2)} ` +
        `seed=${entries.length}`,
      );
    }
    elites.push(result);
    elites.sort((left, right) => right.metrics.score - left.metrics.score);
    const unique = [];
    const signatures = new Set();
    for (const candidate of elites) {
      const signature = candidate.entries.map(([cell, state]) => `${cell}.${state}`).join(',');
      if (signatures.has(signature)) continue;
      signatures.add(signature);
      unique.push(candidate);
      if (unique.length >= 60) break;
    }
    elites = unique;
    if ((iteration + 1) % 2000 === 0) {
      console.error(
        `progress ${iteration + 1}/${options.iterations} ` +
        `elapsed=${((Date.now() - started) / 1000).toFixed(1)}s ` +
        `best=${best.metrics.transient}/${best.metrics.period}`,
      );
    }
  }

  const search = { ...options, rule: normalizedRule };
  delete search.output;
  const output = {
    schema: 1,
    generatedBy: 'research/search-transients.js',
    search,
    deterministicSeed,
    patchCells: patch.tileCount,
    candidatesEvaluated: options.iterations,
    outcomes: { horizonSurvivors, exactCycles, extinctions, unbounded },
    elapsedSeconds: (Date.now() - started) / 1000,
    best,
    elites: elites.slice(0, 20),
  };
  const text = `${JSON.stringify(output, null, 2)}\n`;
  if (options.output) fs.writeFileSync(options.output, text);
  else process.stdout.write(text);
}

if (require.main === module) main();

module.exports = Object.freeze({ evaluate, geometry, main, parseArguments });
