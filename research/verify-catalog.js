#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const Core = require('../core.js');
const discoveries = require('../discoveries.js');
const Mobility = require('./search-mobile-patterns.js');

function statesEqual(left, right) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index++) if (left[index] !== right[index]) return false;
  return true;
}

function placeEntry(entry) {
  const patch = Core.buildPatch(entry.tiling, entry.depth, { seed: entry.penroseSeed });
  const graph = entry.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const simulation = new Core.Automaton(patch, graph, {
    rule: entry.rule,
    generations: entry.generations,
    borderRings: entry.borderRings,
  });

  if (entry.randomize) {
    simulation.randomize(entry.density, entry.randomSeed);
    return { patch, graph, simulation };
  }

  const coordinateMap = new Map();
  if (patch.coordinates) {
    for (let cell = 0; cell < patch.tileCount; cell++) {
      coordinateMap.set(`${patch.coordinates[cell * 2]},${patch.coordinates[cell * 2 + 1]}`, cell);
    }
  }
  const assignments = [...(entry.cellStates || [])];
  for (const [first, second, state] of entry.coordinateStates || []) {
    const cell = coordinateMap.get(`${first},${second}`);
    assert.notEqual(cell, undefined, `${entry.id}: missing coordinate ${first},${second}`);
    assignments.push([cell, state]);
  }
  for (const [cell, state] of assignments) {
    assert(Number.isInteger(cell) && cell >= 0 && cell < patch.tileCount, `${entry.id}: invalid cell ${cell}`);
    assert(!simulation.isLocked(cell), `${entry.id}: initial cell ${cell} lies in the dead border`);
    simulation.state[cell] = state;
  }
  simulation.refreshDerivedState();
  return { patch, graph, simulation };
}

function liveCoordinates(patch, simulation) {
  const result = [];
  for (let cell = 0; cell < patch.tileCount; cell++) {
    if (simulation.state[cell] === 1) result.push([patch.coordinates[cell * 2], patch.coordinates[cell * 2 + 1]]);
  }
  return result;
}

function exactFirstCycle(simulation, limit) {
  const buckets = new Map();
  const states = [];
  for (let generation = 0; generation <= limit; generation++) {
    states.push(simulation.state.slice());
    const [hashA, hashB] = simulation.ensureStateHash();
    const key = `${hashA}:${hashB}:${simulation.aliveCount()}`;
    const bucket = buckets.get(key);
    if (bucket) {
      for (const previous of bucket) {
        if (statesEqual(previous.state, simulation.state)) {
          return {
            transient: previous.generation,
            period: generation - previous.generation,
            states: states.slice(previous.generation, generation),
          };
        }
      }
    }
    if (generation === limit) break;
    const record = { generation, state: states[states.length - 1] };
    if (bucket) bucket.push(record);
    else buckets.set(key, [record]);
    simulation.step();
  }
  return null;
}

function geometryMetrics(patch, graph, support) {
  if (!support.length) return { supportCells: 0, radius: 0, minimumBoundaryDistance: null };
  let cx = 0;
  let cy = 0;
  let minimumBoundaryDistance = 0xffff;
  for (const cell of support) {
    cx += patch.centers[cell * 2];
    cy += patch.centers[cell * 2 + 1];
    minimumBoundaryDistance = Math.min(minimumBoundaryDistance, graph.boundaryDistance[cell]);
  }
  cx /= support.length;
  cy /= support.length;
  let radius = 0;
  for (const cell of support) {
    radius = Math.max(radius, Math.hypot(patch.centers[cell * 2] - cx, patch.centers[cell * 2 + 1] - cy));
  }
  return { supportCells: support.length, minimumBoundaryDistance, center: [cx, cy], radius };
}

function nonzeroEntries(simulation) {
  const entries = [];
  for (let cell = 0; cell < simulation.state.length; cell++) {
    if (simulation.state[cell]) entries.push([cell, simulation.state[cell]]);
  }
  return entries;
}

function supportComponentCount(graph, entries) {
  if (!entries.length) return 0;
  const support = new Set(entries.map(([cell]) => cell));
  const reached = new Set();
  let components = 0;
  for (const [root] of entries) {
    if (reached.has(root)) continue;
    components++;
    reached.add(root);
    const queue = [root];
    for (let head = 0; head < queue.length; head++) {
      const cell = queue[head];
      for (let cursor = graph.offsets[cell]; cursor < graph.offsets[cell + 1]; cursor++) {
        const neighbor = graph.neighbors[cursor];
        if (support.has(neighbor) && !reached.has(neighbor)) {
          reached.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }
  return components;
}

function ruleClauseTrackers(contract, rule) {
  const clauses = [...(contract.expectedRuleClauses || [])];
  // Count the explicitly required birth clause for the B24/S launcher.
  if (contract.requiredBirths) {
    clauses.push({
      kind: 'birth',
      liveNeighbors: contract.requiredBirths.liveNeighbors,
      count: contract.requiredBirths.count,
      lastToGeneration: contract.requiredBirths.lastToGeneration,
      tracksRequiredBirths: true,
    });
  }
  const seen = new Set();
  return clauses.map((expected) => {
    assert(
      expected.kind === 'birth' || expected.kind === 'survival',
      `unsupported rule-clause kind ${expected.kind}`,
    );
    assert(
      Number.isInteger(expected.liveNeighbors) && expected.liveNeighbors >= 0,
      `invalid ${expected.kind} neighbour count ${expected.liveNeighbors}`,
    );
    const key = `${expected.kind}:${expected.liveNeighbors}`;
    assert(!seen.has(key), `duplicate expected rule clause ${key}`);
    seen.add(key);
    const enabled = expected.kind === 'birth'
      ? rule.birthLookup[expected.liveNeighbors]
      : rule.surviveLookup[expected.liveNeighbors];
    assert.equal(enabled, 1, `${key}: tracked clause is not enabled by ${rule.text}`);
    assert(Number.isInteger(expected.count) && expected.count >= 0, `${key}: invalid expected count`);
    assert(
      expected.lastToGeneration === null ||
      (Number.isInteger(expected.lastToGeneration) && expected.lastToGeneration >= 1),
      `${key}: invalid last generation`,
    );
    return { expected, count: 0, lastToGeneration: null };
  });
}

function observeRuleClauses(graph, simulation, trackers, toGeneration) {
  if (!trackers.length) return;
  const byClause = new Map();
  const kinds = new Set();
  for (const tracker of trackers) {
    assert(tracker.expected.liveNeighbors <= graph.maxDegree, 'rule clause exceeds graph degree');
    byClause.set(`${tracker.expected.kind}:${tracker.expected.liveNeighbors}`, tracker);
    kinds.add(tracker.expected.kind);
  }
  for (let cell = 0; cell < simulation.state.length; cell++) {
    if (simulation.isLocked(cell)) continue;
    const kind = simulation.state[cell] === 0
      ? 'birth'
      : (simulation.state[cell] === 1 ? 'survival' : null);
    if (!kind || !kinds.has(kind)) continue;
    let liveNeighbors = 0;
    for (let cursor = graph.offsets[cell]; cursor < graph.offsets[cell + 1]; cursor++) {
      liveNeighbors += Number(simulation.state[graph.neighbors[cursor]] === 1);
    }
    const tracker = byClause.get(`${kind}:${liveNeighbors}`);
    if (!tracker) continue;
    tracker.count++;
    tracker.lastToGeneration = toGeneration;
  }
}

function verifyRuleClauses(entry, trackers) {
  const result = [];
  for (const tracker of trackers) {
    const { expected } = tracker;
    const label = `${expected.kind} ${expected.liveNeighbors}`;
    assert.equal(tracker.count, expected.count, `${entry.id}: ${label} rule-clause events`);
    assert.equal(
      tracker.lastToGeneration,
      expected.lastToGeneration,
      `${entry.id}: final ${label} rule-clause event`,
    );
    result.push({
      kind: expected.kind,
      liveNeighbors: expected.liveNeighbors,
      count: tracker.count,
      lastToGeneration: tracker.lastToGeneration,
    });
  }
  return result;
}

function verifyEntry(entry) {
  const { patch, graph, simulation } = placeEntry(entry);
  const common = {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    tiling: entry.tiling,
    cells: patch.tileCount,
    neighborhood: entry.neighborhood,
    rule: simulation.rule.text,
    generations: simulation.generations,
  };

  if (entry.expectedTravel) {
    const expected = entry.expectedTravel;
    const spatial = Mobility.makeSpatialIndex(patch);
    let initialCenter = null;
    let translatedFrom = null;
    let minimumActive = Infinity;
    let maximumActive = 0;
    let minimumLive = Infinity;
    let maximumLive = 0;
    let maximumRadius = 0;
    let minimumBoundaryDistance = 0xffff;
    let finalGeometry = null;
    let observedTranslation = null;
    let pathLength = 0;
    let previousCenter = null;
    let maximumSupportComponents = 0;
    const componentCountHistogram = {};
    const disconnectedGenerations = [];
    const initialActive = nonzeroEntries(simulation).length;
    const clauseTrackers = ruleClauseTrackers(expected, simulation.rule);
    for (let generation = 0; generation <= expected.steps; generation++) {
      const entries = nonzeroEntries(simulation);
      const support = entries.map(([cell]) => cell);
      const geometry = geometryMetrics(patch, graph, support);
      const live = entries.reduce((count, [, state]) => count + Number(state === 1), 0);
      const components = supportComponentCount(graph, entries);
      if (!initialCenter) initialCenter = geometry.center;
      if (previousCenter) {
        pathLength += Math.hypot(
          geometry.center[0] - previousCenter[0],
          geometry.center[1] - previousCenter[1],
        );
      }
      previousCenter = geometry.center;
      finalGeometry = geometry;
      minimumActive = Math.min(minimumActive, entries.length);
      maximumActive = Math.max(maximumActive, entries.length);
      minimumLive = Math.min(minimumLive, live);
      maximumLive = Math.max(maximumLive, live);
      maximumRadius = Math.max(maximumRadius, geometry.radius);
      minimumBoundaryDistance = Math.min(minimumBoundaryDistance, geometry.minimumBoundaryDistance);
      maximumSupportComponents = Math.max(maximumSupportComponents, components);
      componentCountHistogram[components] = (componentCountHistogram[components] || 0) + 1;
      if (components !== 1) disconnectedGenerations.push(generation);
      if (expected.connectedThroughout !== false) {
        assert.equal(components, 1, `${entry.id}: disconnected at ${generation}`);
      }
      assert(entries.length >= expected.minimumActive && entries.length <= expected.maximumActive, `${entry.id}: active range at ${generation}`);
      if (Number.isInteger(expected.minimumLive)) {
        assert(live >= expected.minimumLive && live <= expected.maximumLive, `${entry.id}: live range at ${generation}`);
      }
      assert(geometry.radius <= expected.maximumRadius, `${entry.id}: radius at ${generation}`);

      const translated = expected.translatedReturn;
      if (generation === translated.fromGeneration) {
        translatedFrom = { center: geometry.center, entries };
      } else if (generation === translated.toGeneration) {
        const dx = geometry.center[0] - translatedFrom.center[0];
        const dy = geometry.center[1] - translatedFrom.center[1];
        assert(Math.abs(dx - translated.dx) < 1e-5 && Math.abs(dy - translated.dy) < 1e-5, `${entry.id}: translation vector`);
        const automatonView = { patch, graph, state: simulation.state, active: support };
        const mapping = Mobility.verifyTranslatedState(translatedFrom, automatonView, spatial, dx, dy);
        assert(mapping, `${entry.id}: exact translated state`);
        const neighborhoodRadius = Mobility.translatedNeighborhoodRadius(
          translatedFrom, automatonView, spatial, dx, dy, mapping,
        );
        assert.equal(neighborhoodRadius, translated.neighborhoodRadius, `${entry.id}: translated neighbourhood`);
        observedTranslation = {
          fromGeneration: translated.fromGeneration,
          toGeneration: translated.toGeneration,
          dx,
          dy,
          neighborhoodRadius,
        };
      }
      if (generation < expected.steps) {
        observeRuleClauses(graph, simulation, clauseTrackers, generation + 1);
        simulation.step();
      }
    }
    const displacement = Math.hypot(
      finalGeometry.center[0] - initialCenter[0],
      finalGeometry.center[1] - initialCenter[1],
    );
    assert(displacement >= expected.minimumDisplacement, `${entry.id}: displacement`);
    if (Number.isFinite(expected.minimumDirectionality)) {
      assert(displacement / pathLength >= expected.minimumDirectionality, `${entry.id}: directionality`);
    }
    if (expected.connectivity) {
      assert.equal(maximumSupportComponents, expected.connectivity.maximumSupportComponents, `${entry.id}: component maximum`);
      assert.deepEqual(componentCountHistogram, expected.connectivity.componentCountHistogram, `${entry.id}: component histogram`);
      assert.deepEqual(disconnectedGenerations, expected.connectivity.disconnectedGenerations, `${entry.id}: disconnected generations`);
      const finalDisconnected = disconnectedGenerations.at(-1) ?? -1;
      assert.equal(finalDisconnected + 1, expected.connectivity.firstGenerationConnectedThereafter, `${entry.id}: continuously connected generation`);
    }
    const ruleClauseActivity = verifyRuleClauses(entry, clauseTrackers);
    const tracksRequiredBirths = clauseTrackers.find((tracker) => tracker.expected.tracksRequiredBirths);
    assert(minimumBoundaryDistance >= expected.minimumBoundaryDistance, `${entry.id}: boundary distance`);
    assert.deepEqual(nonzeroEntries(simulation), expected.finalCellStates, `${entry.id}: final state`);
    assert.deepEqual(simulation.ensureStateHash(), expected.finalHash, `${entry.id}: final hash`);
    return {
      ...common,
      kind: 'compact finite traveller',
      verifiedThrough: expected.steps,
      initialActive,
      finalActive: expected.finalCellStates.length,
      minimumActive,
      maximumActive,
      minimumLive,
      maximumLive,
      maximumRadius,
      minimumBoundaryDistance,
      displacement,
      directionality: displacement / pathLength,
      maximumSupportComponents,
      disconnectedGenerations,
      requiredBirthCount: tracksRequiredBirths ? tracksRequiredBirths.count : 0,
      ruleClauseActivity,
      translatedReturn: observedTranslation,
      finalHash: expected.finalHash,
    };
  }

  if (entry.expectedReplication) {
    const before = liveCoordinates(patch, simulation);
    for (let step = 0; step < entry.expectedReplication.steps; step++) simulation.step();
    const expected = new Set();
    for (const [dx, dy] of entry.expectedReplication.translations) {
      for (const [x, y] of before) expected.add(`${x + dx},${y + dy}`);
    }
    const after = new Set(liveCoordinates(patch, simulation).map(([x, y]) => `${x},${y}`));
    assert.deepEqual(after, expected, `${entry.id}: exact replication`);
    return {
      ...common,
      kind: 'replicator benchmark',
      steps: entry.expectedReplication.steps,
      translations: entry.expectedReplication.translations,
      initialLiveCells: before.length,
      resultingLiveCells: after.size,
    };
  }

  if (entry.moving) {
    const before = liveCoordinates(patch, simulation);
    const phasePopulations = [simulation.aliveCount()];
    const clauseTrackers = ruleClauseTrackers(entry, simulation.rule);
    for (let step = 0; step < entry.expectedPeriod; step++) {
      observeRuleClauses(graph, simulation, clauseTrackers, step + 1);
      simulation.step();
      phasePopulations.push(simulation.aliveCount());
    }
    if (entry.expectedPhasePopulations) {
      assert.deepEqual(phasePopulations, entry.expectedPhasePopulations, `${entry.id}: phase populations`);
    }
    const [dx, dy] = entry.translation;
    const expected = before.map(([x, y]) => `${x + dx},${y + dy}`).sort();
    const after = liveCoordinates(patch, simulation).map(([x, y]) => `${x},${y}`).sort();
    assert.deepEqual(after, expected, `${entry.id}: exact translation`);
    const ruleClauseActivity = verifyRuleClauses(entry, clauseTrackers);
    return {
      ...common,
      kind: 'spaceship benchmark',
      steps: entry.expectedPeriod,
      translation: entry.translation,
      liveCells: after.length,
      phasePopulations,
      ruleClauseActivity,
    };
  }

  if (entry.expectedExtinction) {
    let maximumAlive = simulation.aliveCount();
    let totalChanged = 0;
    for (let step = 1; step < entry.expectedExtinction; step++) {
      simulation.step();
      totalChanged += simulation.lastChangedCount;
      maximumAlive = Math.max(maximumAlive, simulation.aliveCount());
      assert(simulation.state.some(value => value !== 0), `${entry.id}: extinct early at ${step}`);
    }
    simulation.step();
    totalChanged += simulation.lastChangedCount;
    assert(simulation.state.every(value => value === 0), `${entry.id}: not extinct at ${entry.expectedExtinction}`);
    return {
      ...common,
      kind: 'compact extinction transient',
      extinctionGeneration: entry.expectedExtinction,
      maximumAlive,
      totalChanged,
    };
  }

  if (entry.expectedPeriod) {
    const cycle = exactFirstCycle(simulation, (entry.expectedTransient || 0) + entry.expectedPeriod);
    assert(cycle, `${entry.id}: cycle absent`);
    assert.equal(cycle.transient, entry.expectedTransient || 0, `${entry.id}: transient`);
    assert.equal(cycle.period, entry.expectedPeriod, `${entry.id}: period`);
    const supportFlag = new Uint8Array(patch.tileCount);
    let minimumAlive = Infinity;
    let maximumAlive = 0;
    for (const state of cycle.states) {
      let alive = 0;
      for (let cell = 0; cell < state.length; cell++) {
        if (state[cell]) supportFlag[cell] = 1;
        if (state[cell] === 1) alive++;
      }
      minimumAlive = Math.min(minimumAlive, alive);
      maximumAlive = Math.max(maximumAlive, alive);
    }
    const support = [];
    for (let cell = 0; cell < supportFlag.length; cell++) if (supportFlag[cell]) support.push(cell);
    return {
      ...common,
      kind: cycle.transient ? 'localized transient to cycle' : (cycle.period === 1 ? 'still life' : 'isolated oscillator'),
      transient: cycle.transient,
      exactPeriod: cycle.period,
      minimumAlive,
      maximumAlive,
      ...geometryMetrics(patch, graph, support),
    };
  }

  if (entry.expectedActivityThrough) {
    const checkpoints = [];
    let maximumAlive = simulation.aliveCount();
    let totalChanged = 0;
    const interval = entry.expectedActivityThrough >= 1000 ? 250 : 50;
    for (let step = 1; step <= entry.expectedActivityThrough; step++) {
      simulation.step();
      totalChanged += simulation.lastChangedCount;
      maximumAlive = Math.max(maximumAlive, simulation.aliveCount());
      assert(simulation.aliveCount() > 0, `${entry.id}: extinct at ${step}`);
      if (step % interval === 0 || step === entry.expectedActivityThrough) {
        checkpoints.push({ generation: step, alive: simulation.aliveCount(), changed: simulation.lastChangedCount });
      }
    }
    assert(simulation.lastChangedCount > 0, `${entry.id}: static at horizon`);
    return {
      ...common,
      kind: entry.randomize ? 'sustained field' : 'long-lived compact seed',
      verifiedThrough: entry.expectedActivityThrough,
      finalAlive: simulation.aliveCount(),
      finalChanged: simulation.lastChangedCount,
      maximumAlive,
      totalChanged,
      checkpoints,
    };
  }

  throw new Error(`${entry.id}: no verification contract`);
}

const results = discoveries.map(verifyEntry);
const output = `${JSON.stringify({
  schema: 2,
  generatedBy: 'research/verify-catalog.js',
  catalogEntries: results.length,
  results,
}, null, 2)}\n`;
if (process.argv.length === 2) {
  process.stdout.write(output);
} else if (process.argv.length === 4 && process.argv[2] === '--output') {
  fs.writeFileSync(process.argv[3], output);
} else {
  throw new Error('Usage: node research/verify-catalog.js [--output path.json]');
}
