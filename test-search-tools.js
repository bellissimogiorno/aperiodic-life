'use strict';

const assert = require('assert');
const Core = require('./core.js');
const { SparseAutomaton } = require('./research/lib/sparse-automaton.js');
const { evaluate: evaluateMover } = require('./research/search-movers.js');
const { evaluate: evaluateTransient } = require('./research/search-transients.js');
const { translatedCandidateOrder } = require('./research/search-mobile-patterns.js');

function coordinateMap(patch) {
  const result = new Map();
  for (let cell = 0; cell < patch.tileCount; cell++) {
    result.set(
      `${patch.coordinates[cell * 2]},${patch.coordinates[cell * 2 + 1]}`,
      cell,
    );
  }
  return result;
}

const patch = Core.buildSquarePatch(9);
const graph = patch.touchGraph;
const byCoordinate = coordinateMap(patch);

// The mover evaluator must inspect the state at the horizon, not merely the
// state immediately before the final update.
let automaton = new SparseAutomaton(patch, graph, 'B/S', 2);
automaton.initialize([[byCoordinate.get('0,0'), 1]]);
assert.deepStrictEqual(
  evaluateMover(automaton, 1),
  { survived: 1, extinct: true, score: -999 },
  'extinction on the horizon was reported as survival',
);

automaton = new SparseAutomaton(patch, graph, 'B3/S23', 2);
automaton.initialize([
  [byCoordinate.get('-1,0'), 1],
  [byCoordinate.get('0,0'), 1],
  [byCoordinate.get('1,0'), 1],
]);
const blinker = evaluateMover(automaton, 2);
assert.equal(blinker.survived, 2);
assert.equal(blinker.period, 2, 'recurrence on the horizon was not detected');

// Both evaluators must include generation zero when measuring proximity to
// the finite-patch boundary.
const boundaryCell = byCoordinate.get('-4,-4');
automaton = new SparseAutomaton(patch, graph, 'B3/S23', 2);
automaton.initialize([[boundaryCell, 1]]);
assert.equal(evaluateMover(automaton, 0).minimumBoundaryDistance, 0);

const entries = [[boundaryCell, 1]];
automaton = new SparseAutomaton(patch, graph, 'B3/S23', 2);
automaton.initialize(entries);
const transient = evaluateTransient(automaton, entries, {
  horizon: 5,
  maxActive: 100,
  maxRadius: 100,
});
assert.equal(transient.outcome, 'unbounded');
assert.equal(transient.survived, 0);
assert.equal(transient.minimumBoundaryDistance, 0);

// Sparse evolution cannot represent global zero-neighbour births and rejects
// unsupported rules and malformed state counts explicitly.
assert.throws(
  () => new SparseAutomaton(patch, graph, 'B0/S', 2),
  /does not support B0/,
);
assert.throws(
  () => new SparseAutomaton(patch, graph, 'B3/S23', NaN),
  /generations must be an integer/,
);
automaton = new SparseAutomaton(patch, graph, 'B3/S23', 2);
assert.throws(() => automaton.initialize([[boundaryCell, NaN]]), /not an integer/);

// Translation positives are retained independently from the general score
// elites. Prefer a return with a verified surrounding graph, then a later
// observed return; the general score must not be able to hide either signal.
function translatedCandidate(radius, toGeneration, score) {
  return {
    entries: [[0, 1]],
    metrics: {
      evaluatedGenerations: toGeneration,
      maximumDisplacement: 1,
      maximumRadius: 1,
      score,
      translatedReturns: [{
        neighborhoodRadius: radius,
        toGeneration,
        distance: 1,
      }],
    },
  };
}
const translatedPool = [
  translatedCandidate(0, 100, 1e9),
  translatedCandidate(3, 20, -1e9),
  translatedCandidate(3, 40, -1e9),
].sort(translatedCandidateOrder);
assert.equal(translatedPool[0].metrics.translatedReturns[0].toGeneration, 40);
assert.equal(translatedPool[1].metrics.translatedReturns[0].neighborhoodRadius, 3);
assert.equal(translatedPool[2].metrics.translatedReturns[0].neighborhoodRadius, 0);

console.log('sparse search evaluator boundary and horizon checks passed');
