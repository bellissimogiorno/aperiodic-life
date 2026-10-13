'use strict';

// Independent finite emission audit. Run with Node.js, no third-party packages.
// --record deliberately rebuilds the saved evidence; the default compares it.
// This uses the shared geometry, a direct-neighbour reference update and the
// production dense engine. It does not invoke the emitter miner or its updater.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const V = require('../../aperiodic-reference.js');
const Core = require('../../../core.js');
const filename = path.join(__dirname, 'hat-emitter-independent.json');

const INPUT = {
  rule: 'TABLE:HAT-B', tiling: 'hat', depth: 5, neighbourhood: 'touch',
  sourceGeneration: 30, extractionRadius: 30, emissionInterval: 40,
  parentSeed: [[23821,1],[23824,3],[23836,1]],
  source: [[6748,1],[6759,3],[23788,1],[23789,1],[23790,1],[23791,1],[23801,1],[23802,1],[23803,3],[23805,1],[23810,1],[23811,1],[23812,1],[23823,3],[23827,3],[23836,1],[23837,1],[23838,3],[23839,1],[23841,3],[23885,3],[23886,3],[23889,1],[23890,1],[23892,1],[23893,1],[23902,1],[23906,3],[23907,3],[23909,1],[23910,1],[23911,3],[23913,1],[23955,1],[23987,1],[23989,1],[24002,1],[24017,3],[24550,3],[24554,1],[24555,1],[24556,1],[24557,1],[24566,1],[24567,1],[24568,1],[24569,1],[24571,1],[24580,1],[24581,3],[24585,1],[24587,1],[24588,1],[24600,1],[24603,1],[24629,3]],
  emittedPacket: [[2200,3],[2201,1],[2204,1],[2205,1],[2207,1],[6821,1],[6822,1],[6823,1],[6824,1],[6827,1],[6828,1],[6853,3],[11882,3],[11917,1],[12088,1],[12090,1],[12095,1],[24715,3],[24729,1],[24736,1],[24738,1],[24741,1],[24743,1]],
  provenance: {
    seedSearchPrng: 3721313, seedSearchTrial: 8686,
    sourceFixture: 'B-native-emission-identity.json',
    ruleCredit: 'James Edmond, arXiv:2609.22579, Hat B priority table',
    ruleUrl: 'https://arxiv.org/html/2609.22579v1',
    note: 'The source is the radius-30 portion of the three-cell launch at generation 30. The earlier 38-cell crop is not this certificate.'
  }
};

// All four rows of the published table, in first-match order. State 2 is
// unused by this seed but retained to avoid silently changing the model.
const TABLE = { states: 4, default: 0, rows: [
  { state: 0, atLeast: { 1: 2, 0: 1 }, next: 0 },
  { state: 0, atLeast: { 0: 2, 2: 2 }, next: 1 },
  { state: 0, atLeast: { 0: 2, 3: 1 }, next: 1 },
  { state: 1, atLeast: { 3: 1 }, next: 3 }
] };

function sorted(cells) { return cells.map(pair => pair.slice()).sort((a, b) => a[0] - b[0]); }
function disjointUnion(parts, context) {
  const cells = new Map();
  for (const part of parts) for (const [cell, value] of part) {
    assert(!cells.has(cell), `${context}: overlapping nonzero supports at ${cell}`);
    cells.set(cell, value);
  }
  return sorted([...cells]);
}

function components(graph, cells) {
  const remaining = new Map(cells), output = [];
  while (remaining.size) {
    const first = remaining.keys().next().value, queue = [first];
    const component = [[first, remaining.get(first)]];
    remaining.delete(first);
    for (let i = 0; i < queue.length; i++) {
      const cell = queue[i];
      for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) {
        const neighbour = graph.neighbors[k];
        if (!remaining.has(neighbour)) continue;
        component.push([neighbour, remaining.get(neighbour)]);
        remaining.delete(neighbour); queue.push(neighbour);
      }
    }
    output.push(sorted(component));
  }
  return output;
}

function replay(patch, graph, initial, horizon, label) {
  const reference = new V.PriorityReference(graph, TABLE, initial);
  const production = new Core.Automaton(patch, graph, {
    rule: INPUT.rule, generations: TABLE.states, borderRings: 0
  });
  for (const [cell, value] of initial) production.state[cell] = value;
  production.refreshDerivedState();
  const phases = [], metrics = [], trajectory = crypto.createHash('sha256');
  for (let generation = 0; generation <= horizon; generation++) {
    const cells = reference.entries(), dense = [];
    for (let cell = 0; cell < production.state.length; cell++) {
      if (production.state[cell]) dense.push([cell, production.state[cell]]);
    }
    assert.deepEqual(dense, cells, `${label}: complete production/reference mismatch at ${generation}`);
    const metric = V.measure(patch, graph, cells);
    assert(metric.boundaryDistance === null || metric.boundaryDistance >= 4,
      `${label}: insufficient boundary margin at ${generation}`);
    phases.push(cells); metrics.push(metric);
    trajectory.update(JSON.stringify(cells) + '\n');
    if (generation < horizon) { reference.step(); production.step(); }
  }
  const first = metrics[0], last = metrics.at(-1);
  return { phases, metrics, result: {
    label, initial: sorted(initial), final: phases.at(-1), verifiedThrough: horizon,
    completeStateComparisons: horizon + 1, transitionsPerEngine: horizon,
    productionDenseParity: true, trajectorySha256: trajectory.digest('hex'),
    minimumBoundaryDistance: metrics.some(m => m.active)
      ? Math.min(...metrics.filter(m => m.active).map(m => m.boundaryDistance)) : null,
    minimumActive: Math.min(...metrics.map(m => m.active)),
    maximumActive: Math.max(...metrics.map(m => m.active)),
    minimumComponents: Math.min(...metrics.map(m => m.components)),
    maximumComponents: Math.max(...metrics.map(m => m.components)),
    maximumRadius: Math.max(...metrics.map(m => m.radius)),
    centroidDisplacement: last.centroid && first.centroid
      ? Math.hypot(last.centroid[0] - first.centroid[0], last.centroid[1] - first.centroid[1]) : null
  } };
}

function verifyHatEmitter() {
  assert.deepEqual(TABLE, V.PUBLISHED_TABLES.hatB, 'Published table transcription changed');
  const patch = Core.buildPatch(INPUT.tiling, INPUT.depth), graph = patch.touchGraph;
  const parent = replay(patch, graph, INPUT.parentSeed, 180, 'three-cell parent');
  const source = replay(patch, graph, INPUT.source, 180, 'isolated source C');
  const packet = replay(patch, graph, INPUT.emittedPacket, 140, 'emitted packet E');
  const atExtraction = parent.phases[INPUT.sourceGeneration];
  const initialCentre = V.measure(patch, graph, INPUT.parentSeed).centroid;
  const crop = atExtraction.filter(([cell]) => Math.hypot(
    patch.centers[2 * cell] - initialCentre[0],
    patch.centers[2 * cell + 1] - initialCentre[1]) <= INPUT.extractionRadius);
  assert.deepEqual(crop, sorted(INPUT.source), 'Source does not equal the specified native crop');
  const support = new Set(INPUT.source.map(([cell]) => cell));
  const rest = atExtraction.filter(([cell]) => !support.has(cell));
  assert.equal(rest.length, 0, 'C must be the entire native parent state, with no exterior remainder');
  assert.deepEqual(atExtraction, sorted(INPUT.source));
  for (let t = 0; t <= 150; t++) {
    assert.deepEqual(source.phases[t], parent.phases[t + INPUT.sourceGeneration],
      `Native source identity fails at original generation ${t + INPUT.sourceGeneration}`);
  }
  assert.deepEqual(source.phases[40], disjointUnion([source.phases[0], packet.phases[0]], 'emission identity'));
  for (let t = 0; t <= 140; t++) {
    assert.deepEqual(source.phases[t + 40], disjointUnion([source.phases[t], packet.phases[t]], `one-cycle superposition ${t}`),
      `One-cycle superposition fails at ${t}`);
  }
  for (let t = 0; t <= 180; t++) {
    const parts = [source.phases[t % 40]];
    for (let born = 40; born <= t; born += 40) parts.push(packet.phases[t - born]);
    assert.deepEqual(disjointUnion(parts, `all-cohort superposition ${t}`), source.phases[t],
      `Complete recurring-source and emitted-cohort identity fails at ${t}`);
  }
  const separated = components(graph, INPUT.emittedPacket);
  assert.equal(separated.length, 4, 'The packet must initially contain four connected bodies');
  const bodies = separated.map((cells, index) => replay(patch, graph, cells, 140, `packet body ${index + 1}`));
  for (let t = 0; t <= 140; t++) {
    assert.deepEqual(disjointUnion(bodies.map(body => body.phases[t]), `packet separation ${t}`), packet.phases[t],
      `Independent packet bodies do not reconstruct the packet at ${t}`);
  }
  for (const body of bodies) {
    assert.equal(body.result.minimumComponents, 1);
    assert.equal(body.result.maximumComponents, 1);
    assert(body.result.maximumRadius < 4);
    assert(body.result.centroidDisplacement > 140);
  }
  // Exact same-location identity is stronger here than a fitted velocity: the
  // trailing body in each stream reaches its predecessor's full initial state.
  const streamReturns = [];
  for (let behind = 0; behind < bodies.length; behind++) {
    for (let ahead = 0; ahead < bodies.length; ahead++) {
      if (behind === ahead || JSON.stringify(bodies[behind].phases[20]) !== JSON.stringify(bodies[ahead].phases[0])) continue;
      for (let t = 0; t <= 120; t++) assert.deepEqual(bodies[behind].phases[t + 20], bodies[ahead].phases[t]);
      streamReturns.push({ trailingBody: behind + 1, precedingBody: ahead + 1, delay: 20,
        identicalCompleteStatesThroughPrecedingAge: 120, stateComparisons: 121 });
    }
  }
  assert.equal(streamReturns.length, 2);
  const runs = [parent, source, packet, ...bodies];
  return {
    passed: true, input: INPUT, referenceTable: TABLE,
    geometry: { tileCount: patch.tileCount, maximumTouchDegree: graph.maxDegree },
    identity: { expression: 'F^40(C) = C disjoint-union E', sourceCells: INPUT.source.length,
      emittedCells: INPUT.emittedPacket.length, completeNonzeroStatesChecked: true,
      leastEmissionIntervalEstablished: false },
    nativeOrigin: { originalGeneration: 30, originalStateCells: atExtraction.length,
      remainderCells: rest.length, originalGenerationsChecked: [30, 180], stateComparisons: 151,
      sourceEqualsEntireParentStateAtGeneration30: true,
      interpretation: 'C is the entire nonzero parent state at generation 30. The nominal radius-30 crop removes no occupied cell: its exterior remainder is empty. Replaying C independently reproduces every complete parent state through original generation 180.' },
    repeatedEmission: {
      singleCycleIdentity: 'F^(t+40)(C) = F^t(C) disjoint-union F^t(E)',
      checkedT: [0, 140], stateComparisons: 141,
      allCohortIdentity: 'F^t(C) = F^(t mod 40)(C) disjoint-union the independently evolved packets emitted at times 40,80,...<=t',
      checkedSourceGenerations: [0, 180], allCohortStateComparisons: 181,
      completedFortyGenerationIntervals: 4,
      allUnionsHaveDisjointNonzeroSupports: true,
      interpretation: 'The native source repeats while emitting four finite compact travellers per tested 40-generation interval. No incoming exterior feed is needed over the independently checked interval.'
    },
    packetSeparation: { componentsAtBirth: 4, checkedPacketAges: [0, 140], stateComparisons: 141,
      independentlyReconstructedEveryState: true, streamReturns,
      bodies: bodies.map(body => body.result) },
    trajectories: { parent: parent.result, source: source.result, packet: packet.result },
    accounting: {
      independentTrajectories: runs.length,
      completeProductionReferenceStateComparisons: runs.reduce((sum, run) => sum + run.result.completeStateComparisons, 0),
      transitionsPerEngine: runs.reduce((sum, run) => sum + run.result.transitionsPerEngine, 0)
    },
    scope: 'Finite operational repeating-emitter evidence on a shared finite Hat geometry. The audit counts every nonzero state, checks independent evolution and all intervening phases, and maintains a minimum four-ring boundary margin. It does not prove an immortal gun, infinite outgoing corridors, a least source period, or historical novelty. The local rule is the published Edmond Hat B rule; the seed and finite emission decomposition are this search result.'
  };
}

function main() {
  const result = verifyHatEmitter();
  if (process.argv.includes('--record')) fs.writeFileSync(filename, JSON.stringify(result, null, 2) + '\n');
  else assert.deepEqual(result, JSON.parse(fs.readFileSync(filename, 'utf8')), 'Emitter evidence changed');
  console.log(JSON.stringify({ passed: true, identity: result.identity,
    parentMinimumBoundary: result.trajectories.parent.minimumBoundaryDistance,
    sourceMinimumBoundary: result.trajectories.source.minimumBoundaryDistance,
    packetBodies: result.packetSeparation.bodies.map(body => ({ maximumActive: body.maximumActive,
      maximumRadius: body.maximumRadius, displacement: body.centroidDisplacement })),
    accounting: result.accounting,
    scope: 'Finite repeating emitter only; no indefinite gun or least-period claim.' }, null, 2));
}
if (require.main === module) main();
module.exports = { verifyHatEmitter };
