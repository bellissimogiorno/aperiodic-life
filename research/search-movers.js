#!/usr/bin/env node
'use strict';

/*
 * Deterministic bounded heuristic search for localised moving patterns.
 * A failure to find a spaceship is evidence about this search only, never a
 * proof that no spaceship exists.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');
const {
  SparseAutomaton,
  centralCells,
  randomConnectedSeed,
} = require('./lib/sparse-automaton.js');

if (require.main === module && process.argv.includes('--help')) {
  console.log(`Usage: node research/search-movers.js [options]

` +
    `Options are supplied as --name value pairs. Important options:
` +
    `  --tiling penrose|hat --depth N --neighborhood edge|touch
` +
    `  --rule B.../S... --generations N --iterations N --steps N
` +
    `  --check saved-result.json

` +
    `Sparse searches reject B0 rules because zero-neighbour births are global.`);
  process.exit(0);
}


function parseArguments(argv) {
  const result = {
    tiling: 'penrose', depth: 8, neighborhood: 'touch', rule: 'B2/S',
    generations: 3, iterations: 20000, steps: 400, check: null,
  };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (!(key in result) || argv[i + 1] === undefined) throw new Error(`Unknown or incomplete option ${argv[i]}`);
    result[key] = ['depth', 'generations', 'iterations', 'steps'].includes(key) ? Number(argv[i + 1]) : argv[i + 1];
  }
  return result;
}

function mutate(entries, graph, random, generations) {
  const cells = new Map(entries);
  const operations = 1 + Math.floor(random() * 4);
  for (let operation = 0; operation < operations; operation++) {
    const keys = [...cells.keys()];
    const choice = random();
    if (choice < 0.38 && keys.length) {
      cells.delete(keys[Math.floor(random() * keys.length)]);
    } else if (choice < 0.78 && keys.length) {
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
  return [...cells.entries()];
}

function evaluate(automaton, steps) {
  const { patch, graph } = automaton;
  const seen = new Map();
  const territory = new Set(automaton.active);
  let initial = null;
  let last = null;
  let path = 0;
  let maximumRadius = 0;
  let maximumActive = automaton.active.length;
  let minimumBoundaryDistance = 0xffff;
  for (const cell of automaton.active) {
    minimumBoundaryDistance = Math.min(minimumBoundaryDistance, graph.boundaryDistance[cell]);
  }

  const centroid = () => {
    const cells = automaton.live.length ? automaton.live : automaton.active;
    if (!cells.length) return null;
    let x = 0;
    let y = 0;
    for (const cell of cells) {
      x += patch.centers[cell * 2];
      y += patch.centers[cell * 2 + 1];
    }
    return [x / cells.length, y / cells.length];
  };

  initial = centroid();
  last = initial;
  for (let step = 0; step <= steps; step++) {
    if (!automaton.active.length) return { survived: step, extinct: true, score: -1000 + step };
    if (step % 5 === 0 || step === steps) {
      const center = centroid();
      if (center && last) path += Math.hypot(center[0] - last[0], center[1] - last[1]);
      last = center;
      let radius = 0;
      for (const cell of automaton.active) {
        radius = Math.max(radius, Math.hypot(patch.centers[cell * 2] - center[0], patch.centers[cell * 2 + 1] - center[1]));
      }
      maximumRadius = Math.max(maximumRadius, radius);
    }
    const signature = automaton.signature();
    if (seen.has(signature)) {
      const displacement = initial && last ? Math.hypot(last[0] - initial[0], last[1] - initial[1]) : 0;
      return {
        survived: step,
        period: step - seen.get(signature),
        displacement,
        path,
        maximumRadius,
        maximumActive,
        territory: territory.size,
        minimumBoundaryDistance,
        finalActive: automaton.active.length,
        score: step + displacement * 20 + path * 2 - maximumRadius * 5,
      };
    }
    if (step === steps) break;
    seen.set(signature, step);
    if (seen.size > 80) seen.delete(seen.keys().next().value);
    automaton.step();
    maximumActive = Math.max(maximumActive, automaton.active.length);
    if (maximumActive > 500) {
      return { survived: step + 1, exploded: true, maximumActive, score: -500 - maximumActive };
    }
    for (const cell of automaton.active) {
      territory.add(cell);
      minimumBoundaryDistance = Math.min(minimumBoundaryDistance, graph.boundaryDistance[cell]);
    }
  }

  const final = centroid();
  const displacement = initial && final ? Math.hypot(final[0] - initial[0], final[1] - initial[1]) : 0;
  const localized = maximumRadius < 18 && maximumActive < 180;
  const score = steps * 2 + displacement * 40 + path * 3 + Math.min(territory.size, 1000) * 0.2 - maximumRadius * 8 + (localized ? 200 : 0);
  return { survived: steps, period: 0, displacement, path, maximumRadius, maximumActive, territory: territory.size, minimumBoundaryDistance, finalActive: automaton.active.length, localized, score };
}

function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const patch = Core.buildPatch(options.tiling, options.depth, { seed: 'sun' });
  const graph = options.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const randomSeed = `${options.tiling}-${options.neighborhood}-${options.rule}-${options.generations}-mover-search-v1`;
  const random = Core.mulberry32(Core.hashSeed(randomSeed));
  const centers = centralCells(patch, graph, 15, 1000);
  const seedStarts = centers.slice(0, 100);
  const automaton = new SparseAutomaton(patch, graph, options.rule, options.generations);
  let elites = [];
  let best = null;
  let survivorsToHorizon = 0;

  for (let iteration = 0; iteration < options.iterations; iteration++) {
    const entries = elites.length && random() < 0.75
      ? mutate(elites[Math.floor(random() * elites.length)].entries, graph, random, options.generations)
      : randomConnectedSeed(
        graph,
        seedStarts,
        random,
        3 + Math.floor(random() * 25),
        options.generations,
        Infinity,
      );
    automaton.initialize(entries);
    const metrics = evaluate(automaton, options.steps);
    const result = { entries, metrics };
    if (
      metrics.survived === options.steps &&
      metrics.period === 0 &&
      !metrics.extinct &&
      !metrics.exploded
    ) survivorsToHorizon++;
    if (!best || metrics.score > best.metrics.score) best = result;
    elites.push(result);
    elites.sort((left, right) => right.metrics.score - left.metrics.score);
    elites = elites.slice(0, 40);
  }

  const search = { ...options };
  delete search.check;
  const output = {
    schema: 1,
    search,
    deterministicSeed: randomSeed,
    candidatesEvaluated: options.iterations,
    survivorsToHorizon,
    verifiedSpaceships: 0,
    note: 'No translational-equivalence classifier is claimed here. The best candidate is reported for follow-up; exact coordinate recurrence was used only for ordinary cycles.',
    best,
  };
  if (options.check) {
    const expectedPath = path.resolve(process.cwd(), options.check);
    assert.deepStrictEqual(
      output,
      JSON.parse(fs.readFileSync(expectedPath, 'utf8')),
      `${options.check}: deterministic mover result drift`,
    );
    console.log(JSON.stringify({
      checked: options.check,
      candidates: options.iterations,
      result: 'passed',
    }));
  } else {
    console.log(JSON.stringify(output, null, 2));
  }
}

if (require.main === module) main();

module.exports = Object.freeze({ evaluate, main, parseArguments });
