#!/usr/bin/env node
'use strict';

/**
 * Deterministic soup-to-isolated-oscillator miner.
 *
 * The whole finite board is stepped until an exact state recurrence is found.
 * Dynamic connected components of that cycle are then isolated and independently
 * re-simulated. Only exact first-return oscillators are emitted.
 */
const fs = require('fs');
const Core = require('../core.js');

if (process.argv.includes('--help')) {
  console.log(`Usage: node research/mine-oscillators.js [options]

` +
    `Options are supplied as --name value pairs. Important options:
` +
    `  --tiling penrose|hat|hex|square
` +
    `  --depth N --neighborhood edge|touch --rule B.../S...
` +
    `  --generations N --seeds N --start N --limit N --maxPeriod N
` +
    `  --densities comma,separated,values --output path.json`);
  process.exit(0);
}


function parseArguments(argv) {
  const result = {
    tiling: 'penrose',
    depth: 8,
    neighborhood: 'touch',
    rule: 'B3/S23',
    generations: 2,
    seeds: 1000,
    start: 0,
    limit: 1200,
    maxPeriod: 512,
    minPeriod: 2,
    borderRings: 6,
    densities: '0.04,0.06,0.08,0.10,0.12,0.16,0.22,0.30,0.35',
    seedPrefix: '',
    output: '',
  };
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index].replace(/^--/, '');
    if (!(key in result) || argv[index + 1] === undefined) {
      throw new Error(`Unknown or incomplete option ${argv[index]}`);
    }
    result[key] = [
      'depth', 'generations', 'seeds', 'start', 'limit', 'maxPeriod', 'minPeriod', 'borderRings',
    ].includes(key) ? Number(argv[index + 1]) : argv[index + 1];
  }
  result.densities = String(result.densities).split(',').map(Number);
  if (!result.densities.length || result.densities.some((value) => !(value >= 0 && value <= 1))) {
    throw new Error('densities must be comma-separated numbers between zero and one');
  }
  return result;
}

function statesEqual(left, right) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function restrictedEqual(left, right, cells) {
  for (const cell of cells) if (left[cell] !== right[cell]) return false;
  return true;
}

function stateKey(simulation) {
  const [hashA, hashB] = simulation.ensureStateHash();
  return `${hashA}:${hashB}:${simulation.aliveCount()}`;
}

function firstCycle(simulation, limit, maximumPeriod) {
  const history = [];
  const buckets = new Map();
  for (let generation = 0; generation <= limit; generation++) {
    const key = stateKey(simulation);
    const bucket = buckets.get(key);
    if (bucket) {
      for (let cursor = bucket.length - 1; cursor >= 0; cursor--) {
        const previous = bucket[cursor];
        if (generation - previous.generation <= maximumPeriod && statesEqual(simulation.state, previous.state)) {
          const position = history.indexOf(previous);
          if (position < 0) throw new Error('cycle history bookkeeping failed');
          return {
            generation,
            transient: previous.generation,
            period: generation - previous.generation,
            states: history.slice(position).map((entry) => entry.state),
          };
        }
      }
    }
    if (generation === limit) break;

    const entry = { generation, state: simulation.state.slice(), key };
    history.push(entry);
    if (bucket) bucket.push(entry);
    else buckets.set(key, [entry]);
    while (history.length > maximumPeriod) {
      const oldest = history.shift();
      const oldBucket = buckets.get(oldest.key);
      const oldPosition = oldBucket.indexOf(oldest);
      if (oldPosition >= 0) oldBucket.splice(oldPosition, 1);
      if (!oldBucket.length) buckets.delete(oldest.key);
    }
    simulation.step();
  }
  return null;
}

function connectedComponents(support, graph) {
  const inside = new Uint8Array(graph.degree.length);
  const seen = new Uint8Array(graph.degree.length);
  for (const cell of support) inside[cell] = 1;
  const result = [];
  for (const start of support) {
    if (seen[start]) continue;
    const queue = [start];
    const component = [];
    seen[start] = 1;
    for (let head = 0; head < queue.length; head++) {
      const cell = queue[head];
      component.push(cell);
      for (let cursor = graph.offsets[cell]; cursor < graph.offsets[cell + 1]; cursor++) {
        const neighbor = graph.neighbors[cursor];
        if (inside[neighbor] && !seen[neighbor]) {
          seen[neighbor] = 1;
          queue.push(neighbor);
        }
      }
    }
    result.push(component.sort((left, right) => left - right));
  }
  return result;
}

function minimumRestrictedPeriod(cycle, component) {
  for (let period = 1; period <= cycle.length; period++) {
    if (cycle.length % period) continue;
    let valid = true;
    for (let phase = 0; phase < cycle.length; phase++) {
      if (!restrictedEqual(cycle[phase], cycle[(phase + period) % cycle.length], component)) {
        valid = false;
        break;
      }
    }
    if (valid) return period;
  }
  return cycle.length;
}

function verifyIsolated(patch, graph, rule, generations, component, phaseState, expectedPeriod) {
  const simulation = new Core.Automaton(patch, graph, { rule, generations, borderRings: 0 });
  for (const cell of component) simulation.state[cell] = phaseState[cell];
  simulation.refreshDerivedState();
  const initial = simulation.state.slice();
  const supportFlag = new Uint8Array(patch.tileCount);
  const aliveSequence = [];
  const activeSequence = [];

  for (let step = 0; step < expectedPeriod; step++) {
    let alive = 0;
    let active = 0;
    for (let cell = 0; cell < simulation.state.length; cell++) {
      const value = simulation.state[cell];
      if (value) {
        supportFlag[cell] = 1;
        active++;
        if (value === 1) alive++;
      }
    }
    aliveSequence.push(alive);
    activeSequence.push(active);
    simulation.step();
    if (statesEqual(simulation.state, initial)) {
      if (step + 1 !== expectedPeriod) return null;
      const support = [];
      for (let cell = 0; cell < supportFlag.length; cell++) if (supportFlag[cell]) support.push(cell);
      return { support, aliveSequence, activeSequence };
    }
  }
  return null;
}

function rotateMinimum(values) {
  if (!values.length) return '';
  let best = null;
  for (let shift = 0; shift < values.length; shift++) {
    const value = values.slice(shift).concat(values.slice(0, shift)).join(',');
    if (best === null || value < best) best = value;
  }
  return best;
}

function coarseFingerprint(candidate, support, graph, patch) {
  const degreeTypes = support.map((cell) => `${graph.degree[cell]}.${patch.tileTypes ? patch.tileTypes[cell] : 0}`).sort();
  return [
    candidate.period,
    support.length,
    rotateMinimum(candidate.aliveSequence),
    rotateMinimum(candidate.activeSequence),
    degreeTypes.join(','),
  ].join('|');
}

const options = parseArguments(process.argv.slice(2));
const patch = Core.buildPatch(options.tiling, options.depth, { seed: 'sun' });
const graph = options.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
const normalizedRule = Core.parseRule(options.rule, graph.maxDegree).text;
const prefix = options.seedPrefix || `${options.tiling}-${options.neighborhood}-${normalizedRule}-${options.generations}-osc-v3`;
const found = [];
const fingerprints = new Set();
let cycles = 0;
let noCycles = 0;
let componentsExamined = 0;
const started = Date.now();

for (let offset = 0; offset < options.seeds; offset++) {
  const index = options.start + offset;
  const density = options.densities[index % options.densities.length];
  const seed = `${prefix}-${index}`;
  const simulation = new Core.Automaton(patch, graph, {
    rule: normalizedRule,
    generations: options.generations,
    borderRings: options.borderRings,
  });
  simulation.randomize(density, seed);
  const globalCycle = firstCycle(simulation, options.limit, options.maxPeriod);
  if (!globalCycle) {
    noCycles++;
    continue;
  }
  cycles++;

  const support = [];
  for (let cell = 0; cell < patch.tileCount; cell++) {
    if (globalCycle.states.some((state) => state[cell] !== 0)) support.push(cell);
  }

  for (const component of connectedComponents(support, graph)) {
    componentsExamined++;
    let varying = false;
    for (const cell of component) {
      for (let phase = 1; phase < globalCycle.states.length; phase++) {
        if (globalCycle.states[phase][cell] !== globalCycle.states[0][cell]) {
          varying = true;
          break;
        }
      }
      if (varying) break;
    }
    if (!varying) continue;

    const period = minimumRestrictedPeriod(globalCycle.states, component);
    if (period < options.minPeriod || period > options.maxPeriod) continue;
    const verified = verifyIsolated(
      patch, graph, normalizedRule, options.generations,
      component, globalCycle.states[0], period,
    );
    if (!verified) continue;

    let minimumBoundaryDistance = 0xffff;
    for (const cell of verified.support) {
      minimumBoundaryDistance = Math.min(minimumBoundaryDistance, graph.boundaryDistance[cell]);
    }
    if (minimumBoundaryDistance < 2) continue;

    const cellStates = [];
    for (const cell of component) {
      if (globalCycle.states[0][cell]) cellStates.push([cell, globalCycle.states[0][cell]]);
    }
    const candidate = {
      tiling: options.tiling,
      depth: options.depth,
      neighborhood: options.neighborhood,
      rule: normalizedRule,
      generations: options.generations,
      source: {
        index,
        seed,
        density,
        globalTransient: globalCycle.transient,
        globalPeriod: globalCycle.period,
        detectedAt: globalCycle.generation,
      },
      period,
      phaseActive: cellStates.length,
      minimumAlive: Math.min(...verified.aliveSequence),
      maximumAlive: Math.max(...verified.aliveSequence),
      minimumActive: Math.min(...verified.activeSequence),
      maximumActive: Math.max(...verified.activeSequence),
      aliveSequence: verified.aliveSequence,
      activeSequence: verified.activeSequence,
      supportCells: verified.support.length,
      minimumBoundaryDistance,
      cellStates,
    };
    const fingerprint = coarseFingerprint(candidate, verified.support, graph, patch);
    if (fingerprints.has(fingerprint)) continue;
    fingerprints.add(fingerprint);
    candidate.coarseFingerprint = fingerprint;
    found.push(candidate);
    found.sort((left, right) =>
      right.period - left.period ||
      left.supportCells - right.supportCells ||
      left.phaseActive - right.phaseActive);
    console.error(`found p${period} support=${verified.support.length} phase=${cellStates.length} seed=${index}`);
  }

  if ((offset + 1) % 250 === 0) {
    console.error(`progress ${offset + 1}/${options.seeds} cycles=${cycles} found=${found.length} elapsed=${((Date.now() - started) / 1000).toFixed(1)}s`);
  }
}

const output = {
  schema: 2,
  generatedBy: 'research/mine-oscillators.js',
  options: { ...options, densities: options.densities, seedPrefix: prefix },
  patchCells: patch.tileCount,
  cycles,
  noCycles,
  componentsExamined,
  uniqueCoarseFingerprints: found.length,
  elapsedSeconds: (Date.now() - started) / 1000,
  found,
};
const text = `${JSON.stringify(output, null, 2)}\n`;
if (options.output) fs.writeFileSync(options.output, text);
else process.stdout.write(text);
