'use strict';

const assert = require('assert');
const Core = require('./core.js');
const discoveries = require('./discoveries.js');
const Mobility = require('./research/search-mobile-patterns.js');

const VIEW_EPSILON = 1e-5;
const VIEW_MODES = new Set(['initial', 'trajectory', 'contain']);
const MAX_UI_SPEED = 240;
const EXPECTED_SPEEDS = Object.freeze({
  'hex-b2s0-c3-three-cell-glider': 3,
  'hex-b234s1346-c3-four-cell-launcher': 4,
  'hex-b2456s1345-c4-five-cell-launcher': 6,
  'hex-b23s13-c4-p9-knightship-launcher': 4,
  'hex-b234s245-c5-p10-knightship-launcher': 4,
  'hat-edmond-b-glider': 6,
  'hat-edmond-a-glider': 6,
  'hat-edmond-c-glider': 6,
  'hat-simple-glider': 6,
  'hat-edmond-c-triple-launcher': 6,
  'penrose-b2-c5-five-launcher': 6,
  'penrose-b2-c6-six-launcher': 6,
  'hex-conway-p4': 4,
  'hex-conway-p5': 5,
  'hex-conway-p8': 5,
  'hex-b34s234-p269': 30,
  'hex-b245s35-p25-traveller': 8,
  'hex-b2s34-p48-rotor': 8,
  'hex-b245s3-p57-pulsator': 10,
  'hex-b24s3-p128-rotor': 16,
  'hex-b234s3-p4104': 180,
  'hex-b2s3456-c7-p372-rotor': 30,
  'hex-b24s16-c3-p248-breather': 20,
  'hex-b23s13-c5-p138-traveller': 20,
  'hex-b234s13-c4-p23-traveller': 10,
  'hex-b246s246-c4-p30-gun': 12,
  'hex-b25s34-p20-puffer': 10,
  'hex-b2s1-c3-p999-rotor': 60,
  'hex-b23s4-p13-traveller': 8,
  'hex-b2s1-c3-p158-traveller': 20,
  'hex-b2s34-wall-repair': 8,
  'hex-b2s34-p2044-billiard': 100,
  'hex-parity-seven-copy': 6,

  'hat-directional-transient-83': 6,
  'penrose-edge-b23s23-p822': 40,
  'penrose-conway-c3-p14': 7,
  'hat-b2s1-c3-rotor-p39': 8,
  'hat-b2s23-c6-rotor-p219': 20,
  'hat-b2s13-c4-clock-p11': 5,

  'square-block': 2,
  'square-blinker': 4,
  'square-pulsar': 5,
  'square-pentadecathlon': 12,
  'square-glider': 8,
  'square-lwss': 8,
  'square-highlife-replicator': 6,
  'square-diehard': 15,
  'square-r-pentomino': 100,
  'square-acorn': 180,
  'hex-conway-p2': 4,
  'hex-conway-p3': 5,
  'hex-conway-p6': 6,
  'hex-b2s35-p5-traveller': 5,
  'hex-b245s3-p10-traveller': 5,
  'hex-b235s146-c4-launcher-traveller': 6,
  'hex-b235s134-c5-launcher-traveller': 6,
  'penrose-conway-p4': 4,
  'penrose-conway-p5': 5,
  'penrose-conway-p7': 5,
  'penrose-conway-p12': 6,
  'penrose-edge-conway-p4': 4,
  'hat-conway-p6': 6,
  'hat-conway-p9': 6,
  'hat-conway-p26': 8,
  'hat-edge-conway-p15': 10,
  'hat-seeds-p8': 8,
  'hat-b23-p20': 12,
  'hat-b23-p24': 14,
  'hat-b23-p28': 14,
  'penrose-b2-c4-compact-traveller': 10,
  'penrose-b2-c5-compact-traveller': 8,
  'penrose-b2-c6-compact-traveller': 8,
  'penrose-b24-c4-launcher-traveller': 6,
  'penrose-b2s4-c5-survival-launcher': 5,
  'penrose-b26s-c4-birth-launcher': 6,
  'penrose-b27s4-c4-dual-clause-launcher': 5,
  'penrose-conway-diehard-293': 30,
  'penrose-conway-methuselah-289': 30,
  'penrose-b12-p840-field': 60,
  'penrose-brain-field': 30,
  'hat-b1-field': 30,
});

function stateEqual(left, right) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index++) if (left[index] !== right[index]) return false;
  return true;
}

function coordinateSet(patch, simulation) {
  const result = [];
  for (let cell = 0; cell < patch.tileCount; cell++) {
    if (simulation.state[cell] === 1) result.push(`${patch.coordinates[cell * 2]},${patch.coordinates[cell * 2 + 1]}`);
  }
  return result.sort();
}

function nonzeroGeometry(patch, graph, simulation) {
  const entries = [];
  let x = 0;
  let y = 0;
  let minimumBoundaryDistance = 0xffff;
  for (let cell = 0; cell < patch.tileCount; cell++) {
    if (!simulation.state[cell]) continue;
    entries.push([cell, simulation.state[cell]]);
    x += patch.centers[cell * 2];
    y += patch.centers[cell * 2 + 1];
    minimumBoundaryDistance = Math.min(minimumBoundaryDistance, graph.boundaryDistance[cell]);
  }
  assert(entries.length, 'nonzero geometry requires a nonempty state');
  x /= entries.length;
  y /= entries.length;
  let radius = 0;
  for (const [cell] of entries) {
    radius = Math.max(radius, Math.hypot(
      patch.centers[cell * 2] - x,
      patch.centers[cell * 2 + 1] - y,
    ));
  }

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
  return {
    center: [x, y],
    components,
    connected: components === 1,
    entries,
    live: entries.reduce((count, entry) => count + Number(entry[1] === 1), 0),
    minimumBoundaryDistance,
    radius,
  };
}

function ruleClauseTrackers(contract, rule) {
  const clauses = [...(contract.expectedRuleClauses || [])];
  // Track the B24/S launcher's required birth clause.
  if (contract.requiredBirths) {
    clauses.push({
      kind: 'birth',
      liveNeighbors: contract.requiredBirths.liveNeighbors,
      count: contract.requiredBirths.count,
      lastToGeneration: contract.requiredBirths.lastToGeneration,
      legacyRequiredBirths: true,
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

function assertRuleClauses(entry, trackers) {
  for (const tracker of trackers) {
    const { expected } = tracker;
    const label = `${expected.kind} ${expected.liveNeighbors}`;
    assert.equal(tracker.count, expected.count, `${entry.id}: ${label} rule-clause events`);
    assert.equal(
      tracker.lastToGeneration,
      expected.lastToGeneration,
      `${entry.id}: final ${label} rule-clause event`,
    );
  }
}

function stateBounds(patch, state) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let cell = 0; cell < state.length; cell++) {
    if (!state[cell]) continue;
    const offset = cell * 4;
    minX = Math.min(minX, patch.bboxes[offset]);
    minY = Math.min(minY, patch.bboxes[offset + 1]);
    maxX = Math.max(maxX, patch.bboxes[offset + 2]);
    maxY = Math.max(maxY, patch.bboxes[offset + 3]);
  }
  return Number.isFinite(minX) ? [minX, minY, maxX, maxY] : null;
}

function expandedBounds(bounds, padding) {
  return [
    bounds[0] - padding,
    bounds[1] - padding,
    bounds[2] + padding,
    bounds[3] + padding,
  ];
}

function boundsContain(outer, inner, epsilon = VIEW_EPSILON) {
  return (
    inner[0] >= outer[0] - epsilon &&
    inner[1] >= outer[1] - epsilon &&
    inner[2] <= outer[2] + epsilon &&
    inner[3] <= outer[3] + epsilon
  );
}

function assertStateWithinBounds(entry, patch, simulation, bounds, generation) {
  for (let cell = 0; cell < simulation.state.length; cell++) {
    if (!simulation.state[cell]) continue;
    const offset = cell * 4;
    assert(
      patch.bboxes[offset] >= bounds[0] - VIEW_EPSILON &&
      patch.bboxes[offset + 1] >= bounds[1] - VIEW_EPSILON &&
      patch.bboxes[offset + 2] <= bounds[2] + VIEW_EPSILON &&
      patch.bboxes[offset + 3] <= bounds[3] + VIEW_EPSILON,
      `${entry.id}: cell ${cell} leaves the trajectory view at generation ${generation}`,
    );
  }
}

function cloneSimulation(patch, simulation) {
  const clone = new Core.Automaton(patch, simulation.graph, {
    rule: simulation.rule.text,
    generations: simulation.generations,
    borderRings: simulation.borderRings,
  });
  clone.state.set(simulation.state);
  clone.refreshDerivedState();
  return clone;
}

function validatePresentation(entry, patch, simulation) {
  assert(
    Number.isInteger(entry.speed) && entry.speed >= 1 && entry.speed <= MAX_UI_SPEED,
    `${entry.id}: speed must be an integer from 1 to ${MAX_UI_SPEED}`,
  );
  assert.equal(entry.speed, EXPECTED_SPEEDS[entry.id], `${entry.id}: expected playback speed changed`);
  assert(entry.view && typeof entry.view === 'object', `${entry.id}: missing view metadata`);
  assert(Object.isFrozen(entry.view), `${entry.id}: view metadata must be immutable`);
  assert(VIEW_MODES.has(entry.view.mode), `${entry.id}: invalid view mode ${entry.view.mode}`);
  assert(
    Number.isFinite(entry.view.padding) && entry.view.padding >= 0,
    `${entry.id}: view padding must be finite and nonnegative`,
  );

  const initialBounds = stateBounds(patch, simulation.state);
  assert(initialBounds, `${entry.id}: discovery must have a nonempty initial state`);

  if (entry.view.mode === 'trajectory') {
    const bounds = entry.view.bounds;
    assert(Array.isArray(bounds) && bounds.length === 4, `${entry.id}: trajectory view needs four bounds`);
    assert(bounds.every(Number.isFinite), `${entry.id}: trajectory bounds must be finite`);
    assert(bounds[0] < bounds[2] && bounds[1] < bounds[3], `${entry.id}: trajectory bounds must be strictly ordered`);
    assert(Object.isFrozen(bounds), `${entry.id}: trajectory bounds must be immutable`);
    assert(
      Number.isInteger(entry.view.steps) && entry.view.steps > 0 && entry.view.steps <= 10000,
      `${entry.id}: trajectory steps must be a sensible positive integer`,
    );
    assert(
      bounds[0] >= patch.bounds.minX - VIEW_EPSILON &&
      bounds[1] >= patch.bounds.minY - VIEW_EPSILON &&
      bounds[2] <= patch.bounds.maxX + VIEW_EPSILON &&
      bounds[3] <= patch.bounds.maxY + VIEW_EPSILON,
      `${entry.id}: trajectory view lies outside the finite patch`,
    );

    const replay = cloneSimulation(patch, simulation);
    for (let generation = 0; generation <= entry.view.steps; generation++) {
      assertStateWithinBounds(entry, patch, replay, bounds, generation);
      if (generation < entry.view.steps) replay.step();
    }
    return null;
  }

  assert(!Object.hasOwn(entry.view, 'bounds'), `${entry.id}: ${entry.view.mode} view must not define bounds`);
  assert(!Object.hasOwn(entry.view, 'steps'), `${entry.id}: ${entry.view.mode} view must not define steps`);
  const initialEnvelope = expandedBounds(initialBounds, entry.view.padding);
  if (entry.view.mode === 'initial') return initialEnvelope;

  // A contain view should be used only when the initial framing really does
  // become inadequate.  A short probe catches accidental mode changes while
  // avoiding a second replay of each long methuselah.
  const probe = cloneSimulation(patch, simulation);
  const probeLimit = Math.min(64, entry.expectedActivityThrough || 64);
  let escapedInitialView = false;
  for (let generation = 1; generation <= probeLimit; generation++) {
    probe.step();
    const bounds = stateBounds(patch, probe.state);
    if (bounds && !boundsContain(initialEnvelope, bounds)) {
      escapedInitialView = true;
      break;
    }
  }
  assert(escapedInitialView, `${entry.id}: contain view is unnecessary during its initial evolution`);
  return null;
}

function configure(entry) {
  const patch = Core.buildPatch(entry.tiling, entry.depth, { seed: entry.penroseSeed });
  const graph = entry.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const simulation = new Core.Automaton(patch, graph, {
    rule: entry.rule,
    generations: entry.generations,
    borderRings: entry.borderRings,
  });

  if (entry.randomize) {
    simulation.randomize(entry.density, entry.randomSeed);
  } else {
    const coordinateMap = new Map();
    if (patch.coordinates) {
      for (let cell = 0; cell < patch.tileCount; cell++) {
        coordinateMap.set(`${patch.coordinates[cell * 2]},${patch.coordinates[cell * 2 + 1]}`, cell);
      }
    }
    const assignments = [];
    for (const [first, second, state] of entry.coordinateStates || []) {
      const cell = coordinateMap.get(`${first},${second}`);
      assert.notEqual(cell, undefined, `${entry.id}: coordinate ${first},${second} is absent`);
      assignments.push([cell, state]);
    }
    assignments.push(...(entry.cellStates || []));
    for (const [cell, state] of assignments) {
      assert(Number.isInteger(cell) && cell >= 0 && cell < patch.tileCount, `${entry.id}: invalid cell ${cell}`);
      assert(!simulation.isLocked(cell), `${entry.id}: initial cell ${cell} is locked by the border`);
      assert(Number.isInteger(state) && state > 0 && state < simulation.generations, `${entry.id}: invalid state ${state}`);
      simulation.state[cell] = state;
    }
    simulation.refreshDerivedState();
  }
  return { patch, graph, simulation };
}

function exactFirstCycle(simulation, limit, observe = null) {
  const buckets = new Map();
  for (let generation = 0; generation <= limit; generation++) {
    if (observe) observe(generation);
    const [hashA, hashB] = simulation.ensureStateHash();
    const key = `${hashA}:${hashB}:${simulation.aliveCount()}`;
    const bucket = buckets.get(key);
    if (bucket) {
      for (const previous of bucket) {
        if (stateEqual(previous.state, simulation.state)) {
          return { transient: previous.generation, period: generation - previous.generation };
        }
      }
    }
    if (generation === limit) break;
    const record = { generation, state: simulation.state.slice() };
    if (bucket) bucket.push(record);
    else buckets.set(key, [record]);
    simulation.step();
  }
  return null;
}

assert.equal(discoveries.length, 81);
assert.equal(new Set(discoveries.map((entry) => entry.id)).size, discoveries.length, 'discovery IDs must be unique');
assert.equal(Object.keys(EXPECTED_SPEEDS).length, discoveries.length, 'expected speed table must cover the catalogue exactly');

const results = [];
for (const entry of discoveries) {
  const { patch, simulation } = configure(entry);
  assert.equal(simulation.rule.text, Core.parseRule(entry.rule, simulation.graph.maxDegree).text);
  const initialViewBounds = validatePresentation(entry, patch, simulation);
  const observeInitialView = initialViewBounds
    ? (generation) => {
      const bounds = stateBounds(patch, simulation.state);
      if (bounds) {
        assert(
          boundsContain(initialViewBounds, bounds),
          `${entry.id}: state leaves its fixed initial view at generation ${generation}`,
        );
      }
    }
    : null;

  if (entry.expectedTravel) {
    const expected = entry.expectedTravel;
    const spatial = Mobility.makeSpatialIndex(patch);
    let initialGeometry = null;
    let translatedFrom = null;
    let minimumBoundaryDistance = 0xffff;
    let pathLength = 0;
    let previousCenter = null;
    let maximumSupportComponents = 0;
    const componentCountHistogram = {};
    const disconnectedGenerations = [];
    const clauseTrackers = ruleClauseTrackers(expected, simulation.rule);
    for (let generation = 0; generation <= expected.steps; generation++) {
      const current = nonzeroGeometry(patch, simulation.graph, simulation);
      if (!initialGeometry) initialGeometry = current;
      if (previousCenter) {
        pathLength += Math.hypot(
          current.center[0] - previousCenter[0],
          current.center[1] - previousCenter[1],
        );
      }
      previousCenter = current.center;
      minimumBoundaryDistance = Math.min(minimumBoundaryDistance, current.minimumBoundaryDistance);
      maximumSupportComponents = Math.max(maximumSupportComponents, current.components);
      componentCountHistogram[current.components] = (componentCountHistogram[current.components] || 0) + 1;
      if (!current.connected) disconnectedGenerations.push(generation);
      if (expected.connectedThroughout !== false) {
        assert(current.connected, `${entry.id}: support disconnected at generation ${generation}`);
      }
      assert(
        current.entries.length >= expected.minimumActive && current.entries.length <= expected.maximumActive,
        `${entry.id}: ${current.entries.length} active cells at generation ${generation}`,
      );
      if (Number.isInteger(expected.minimumLive)) {
        assert(
          current.live >= expected.minimumLive && current.live <= expected.maximumLive,
          `${entry.id}: ${current.live} live cells at generation ${generation}`,
        );
      }
      assert(
        current.radius <= expected.maximumRadius,
        `${entry.id}: radius ${current.radius} exceeds ${expected.maximumRadius} at generation ${generation}`,
      );

      const translated = expected.translatedReturn;
      if (generation === translated.fromGeneration) {
        translatedFrom = { center: current.center, entries: current.entries };
      } else if (generation === translated.toGeneration) {
        assert(translatedFrom, `${entry.id}: missing translated-return source state`);
        const dx = current.center[0] - translatedFrom.center[0];
        const dy = current.center[1] - translatedFrom.center[1];
        assert(Math.abs(dx - translated.dx) < 1e-5, `${entry.id}: translated-return dx ${dx}`);
        assert(Math.abs(dy - translated.dy) < 1e-5, `${entry.id}: translated-return dy ${dy}`);
        const active = current.entries.map(([cell]) => cell);
        const automatonView = { patch, graph: simulation.graph, state: simulation.state, active };
        const mapping = Mobility.verifyTranslatedState(
          translatedFrom,
          automatonView,
          spatial,
          dx,
          dy,
        );
        assert(mapping, `${entry.id}: complete state did not translate exactly`);
        assert.equal(
          Mobility.translatedNeighborhoodRadius(
            translatedFrom,
            automatonView,
            spatial,
            dx,
            dy,
            mapping,
          ),
          translated.neighborhoodRadius,
          `${entry.id}: translated neighbourhood radius`,
        );
      }
      if (generation < expected.steps) {
        observeRuleClauses(simulation.graph, simulation, clauseTrackers, generation + 1);
        simulation.step();
      }
    }
    const finalGeometry = nonzeroGeometry(patch, simulation.graph, simulation);
    const displacement = Math.hypot(
      finalGeometry.center[0] - initialGeometry.center[0],
      finalGeometry.center[1] - initialGeometry.center[1],
    );
    assert(displacement >= expected.minimumDisplacement, `${entry.id}: displacement ${displacement}`);
    if (Number.isFinite(expected.minimumDirectionality)) {
      assert(
        displacement / pathLength >= expected.minimumDirectionality,
        `${entry.id}: directionality ${displacement / pathLength}`,
      );
    }
    if (expected.connectivity) {
      assert.equal(
        maximumSupportComponents,
        expected.connectivity.maximumSupportComponents,
        `${entry.id}: maximum support components`,
      );
      assert.deepEqual(
        componentCountHistogram,
        expected.connectivity.componentCountHistogram,
        `${entry.id}: component-count histogram`,
      );
      assert.deepEqual(
        disconnectedGenerations,
        expected.connectivity.disconnectedGenerations,
        `${entry.id}: disconnected generations`,
      );
      const finalDisconnected = disconnectedGenerations.at(-1) ?? -1;
      assert.equal(
        finalDisconnected + 1,
        expected.connectivity.firstGenerationConnectedThereafter,
        `${entry.id}: first continuously connected generation`,
      );
    }
    assertRuleClauses(entry, clauseTrackers);
    assert(
      minimumBoundaryDistance >= expected.minimumBoundaryDistance,
      `${entry.id}: boundary distance ${minimumBoundaryDistance}`,
    );
    assert.deepEqual(finalGeometry.entries, expected.finalCellStates, `${entry.id}: final complete state`);
    assert.deepEqual(simulation.ensureStateHash(), expected.finalHash, `${entry.id}: final hash`);
    results.push({
      id: entry.id,
      behavior: `compact travel ${displacement.toFixed(3)} through ${expected.steps}`,
      active: finalGeometry.entries.length,
    });
  } else if (entry.expectedReplication) {
    assert(patch.coordinates, `${entry.id}: replication verification requires integer coordinates`);
    const before = [];
    for (let cell = 0; cell < patch.tileCount; cell++) {
      if (simulation.state[cell] === 1) before.push([patch.coordinates[cell * 2], patch.coordinates[cell * 2 + 1]]);
    }
    for (let step = 0; step < entry.expectedReplication.steps; step++) simulation.step();
    const expected = [];
    for (const [dx, dy] of entry.expectedReplication.translations) {
      for (const [x, y] of before) expected.push(`${x + dx},${y + dy}`);
    }
    assert.deepEqual(coordinateSet(patch, simulation), [...new Set(expected)].sort(), `${entry.id}: expected translated replicas`);
    results.push({ id: entry.id, behavior: `${entry.expectedReplication.translations.length} replicas after ${entry.expectedReplication.steps}`, alive: simulation.aliveCount() });
  } else if (entry.moving) {
    assert(patch.coordinates, `${entry.id}: moving verification requires integer coordinates`);
    const before = [];
    for (let cell = 0; cell < patch.tileCount; cell++) {
      if (simulation.state[cell]) before.push([patch.coordinates[cell * 2], patch.coordinates[cell * 2 + 1], simulation.state[cell]]);
    }
    const phasePopulations = [simulation.aliveCount()];
    const clauseTrackers = ruleClauseTrackers(entry, simulation.rule);
    for (let step = 0; step < entry.expectedPeriod; step++) {
      observeRuleClauses(simulation.graph, simulation, clauseTrackers, step + 1);
      simulation.step();
      phasePopulations.push(simulation.aliveCount());
    }
    if (entry.expectedPhasePopulations) {
      assert.deepEqual(
        phasePopulations,
        entry.expectedPhasePopulations,
        `${entry.id}: phase populations`,
      );
    }
    const [dx, dy] = entry.translation;
    const expected = before.map(([x, y, state]) => `${x + dx},${y + dy},${state}`).sort();
    const after = [];
    for (let cell = 0; cell < patch.tileCount; cell++) {
      if (simulation.state[cell]) after.push(`${patch.coordinates[cell * 2]},${patch.coordinates[cell * 2 + 1]},${simulation.state[cell]}`);
    }
    assert.deepEqual(after.sort(), expected, `${entry.id}: expected period-${entry.expectedPeriod} translation`);
    assertRuleClauses(entry, clauseTrackers);
    results.push({ id: entry.id, behavior: `translation ${dx},${dy} after ${entry.expectedPeriod}`, alive: simulation.aliveCount() });
  } else if (entry.expectedExtinction) {
    for (let step = 1; step < entry.expectedExtinction; step++) {
      simulation.step();
      assert(simulation.state.some(value => value !== 0), `${entry.id}: extinct early at generation ${step}`);
    }
    simulation.step();
    assert(simulation.state.every(value => value === 0), `${entry.id}: not extinct at generation ${entry.expectedExtinction}`);
    results.push({ id: entry.id, behavior: `extinction at ${entry.expectedExtinction}`, alive: 0 });
  } else if (entry.expectedPeriod) {
    const expectedTransient = entry.expectedTransient || 0;
    const cycle = exactFirstCycle(
      simulation,
      expectedTransient + entry.expectedPeriod,
      observeInitialView,
    );
    assert(cycle, `${entry.id}: no exact cycle by expected return`);
    assert.deepEqual(cycle, { transient: expectedTransient, period: entry.expectedPeriod }, `${entry.id}: exact first recurrence`);
    results.push({
      id: entry.id,
      behavior: `${expectedTransient ? `transient ${expectedTransient}, ` : ''}period ${entry.expectedPeriod}`,
      alive: simulation.aliveCount(),
    });
  } else if (entry.expectedActivityThrough) {
    let totalChanged = 0;
    if (observeInitialView) observeInitialView(0);
    for (let step = 1; step <= entry.expectedActivityThrough; step++) {
      simulation.step();
      if (observeInitialView) observeInitialView(step);
      totalChanged += simulation.lastChangedCount;
      const active = simulation.rule.kind === 'priority'
        ? simulation.state.some((state) => state !== 0) : simulation.aliveCount() > 0;
      assert(active, `${entry.id}: extinct at generation ${step}`);
    }
    assert(simulation.lastChangedCount > 0, `${entry.id}: static at the tested horizon`);
    assert(totalChanged > entry.expectedActivityThrough, `${entry.id}: implausibly little cumulative activity`);
    results.push({
      id: entry.id,
      behavior: `active through ${entry.expectedActivityThrough}`,
      alive: simulation.aliveCount(),
      changed: simulation.lastChangedCount,
      totalChanged,
    });
  } else {
    assert.fail(`${entry.id}: no verifiable expected behaviour`);
  }
}

console.log(JSON.stringify({ discoveries: results }, null, 2));
console.log('all curated discoveries reproduced exactly');
