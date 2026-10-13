'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const Core = require('./core.js');
const discoveries = require('./discoveries.js');
const { SparseAutomaton } = require('./research/lib/sparse-automaton.js');
const Mobility = require('./research/search-mobile-patterns.js');

function runJson(script, args = []) {
  return JSON.parse(childProcess.execFileSync(process.execPath, [script, ...args], {
    cwd: __dirname,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }));
}

// The current fixture specifies every curated example. Recompute each result
// through the production engine.
const expected = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'research/fixtures/catalogue-verification.json'), 'utf8',
));
const catalogue = runJson('research/verify-catalog.js');
assert.deepStrictEqual(catalogue, expected, 'current catalogue verification drift');
assert.equal(catalogue.catalogEntries, 81, 'curated catalogue size');
assert.equal(new Set(catalogue.results.map((entry) => entry.id)).size, discoveries.length);
assert.deepStrictEqual(
  catalogue.results.map((entry) => entry.id),
  discoveries.map((entry) => entry.id),
  'every catalogue entry must have a verification result',
);
const byId = new Map(catalogue.results.map((entry) => [entry.id, entry]));
for (const entry of discoveries) {
  const checked = byId.get(entry.id);
  assert.equal(checked.rule, entry.rule, `${entry.id}: rule`);
  assert.equal(checked.generations, entry.generations, `${entry.id}: state count`);
  if (entry.expectedTravel) {
    assert.equal(checked.kind, 'compact finite traveller', `${entry.id}: finite interpretation`);
    assert.equal(checked.verifiedThrough, entry.expectedTravel.steps, `${entry.id}: finite horizon`);
    assert.equal(
      checked.translatedReturn.neighborhoodRadius,
      entry.expectedTravel.translatedReturn.neighborhoodRadius,
      `${entry.id}: translated neighbourhood radius`,
    );
  }
}

// The sparse engine is a search optimisation, not a separate model.
// Exercise it against the dense reference on every board family, both graphs,
// binary and refractory rules, and a range of deterministic initial states.
let sparseDenseCases = 0;
for (const [tiling, depth] of [['square', 9], ['hex', 4], ['hat', 2], ['penrose', 4]]) {
  const patch = Core.buildPatch(tiling, depth, { seed: 'sun' });
  for (const neighborhood of ['edge', 'touch']) {
    const graph = neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
    for (const [rule, generations] of [['B3/S23', 2], ['B2/S', 3], ['B2/S345', 4]]) {
      const random = Core.mulberry32(Core.hashSeed(`${tiling}-${neighborhood}-${rule}-${generations}-sparse-parity`));
      const entries = [];
      for (let cell = 0; cell < patch.tileCount; cell++) {
        if (random() < 0.16) entries.push([cell, 1 + Math.floor(random() * (generations - 1))]);
      }
      if (!entries.length) entries.push([Math.floor(patch.tileCount / 2), 1]);

      const sparse = new SparseAutomaton(patch, graph, rule, generations);
      const dense = new Core.Automaton(patch, graph, { rule, generations, borderRings: 0 });
      sparse.initialize(entries);
      for (const [cell, state] of entries) dense.state[cell] = state;
      dense.refreshDerivedState();
      for (let generation = 0; generation <= 25; generation++) {
        assert.deepStrictEqual(
          sparse.state,
          dense.state,
          `${tiling}/${neighborhood}/${rule}/C${generations}: sparse mismatch at ${generation}`,
        );
        if (generation < 25) {
          sparse.step();
          dense.step();
        }
      }
      sparseDenseCases++;
    }
  }
}
const sparseB0Patch = Core.buildSquarePatch(5);
assert.throws(
  () => new SparseAutomaton(sparseB0Patch, sparseB0Patch.touchGraph, 'B0/S', 2),
  /does not support B0/,
);

// A Penrose rhomb can have the same centred polygon after a reflection even
// when its raw affine-matrix coefficients have opposite signs. Translation
// matching must compare rendered geometry rather than those coefficients.
const penroseTranslationPatch = Core.buildPatch('penrose', 8, { seed: 'sun' });
const penroseSpatial = Mobility.makeSpatialIndex(penroseTranslationPatch);
const penroseSource = 2;
const penroseDestination = 7;
const penroseDx = penroseTranslationPatch.centers[penroseDestination * 2] -
  penroseTranslationPatch.centers[penroseSource * 2];
const penroseDy = penroseTranslationPatch.centers[penroseDestination * 2 + 1] -
  penroseTranslationPatch.centers[penroseSource * 2 + 1];
assert(Mobility.sameTileGeometry(penroseTranslationPatch, penroseSource, penroseDestination));
assert.equal(
  Mobility.translatedCell(
    penroseTranslationPatch,
    penroseSpatial,
    penroseSource,
    penroseDx,
    penroseDy,
  ),
  penroseDestination,
  'Penrose translation matching regressed to raw affine-orientation equality',
);


// The search command must produce deterministic, internally consistent results
// for a small fresh workload on every tiling. Larger searches remain optional.
const searchIterations = process.argv.includes('--include-movers') ? 400 : 24;
const searchCases = [['square', 21], ['hex', 8], ['hat', 3], ['penrose', 6]];
for (const [tiling, depth] of searchCases) {
  const args = [
    '--tiling', tiling, '--depth', String(depth), '--neighborhood', 'touch',
    '--rule', 'B3/S23', '--generations', '2', '--iterations', String(searchIterations),
    '--horizon', '48', '--minSeed', '3', '--maxSeed', '8', '--maxActive', '100',
    '--maxRadius', '12', '--minimumBoundaryDistance', '2',
    '--startSeed', `current-release-search-${tiling}`,
  ];
  const first = runJson('research/search-mobile-patterns.js', args);
  const second = runJson('research/search-mobile-patterns.js', args);
  assert.deepStrictEqual(first, second, `${tiling}: deterministic search`);
  assert.equal(first.schema, 3);
  assert.equal(first.candidatesEvaluated, searchIterations);
  assert.equal(Object.values(first.outcomes).reduce((sum, count) => sum + count, 0), searchIterations);
  assert.equal(first.denseVerification.passed, true, `${tiling}: best candidate dense replay`);
  assert.equal(first.denseVerification.generationsCompared, first.best.metrics.evaluatedGenerations + 1);
  assert(first.best.metrics.evaluatedGenerations <= 48, `${tiling}: search horizon`);
  assert(first.translatedCandidates >= 0 && first.translatedCandidates <= searchIterations);
  assert.equal(Boolean(first.bestTranslated), first.translatedCandidates > 0);
  assert(first.translatedElites.length <= 10, `${tiling}: bounded translated candidate retention`);
  if (first.bestTranslated) {
    assert(first.bestTranslated.metrics.translatedReturns.length > 0);
    assert.equal(first.bestTranslatedDenseVerification.passed, true);
    assert.equal(
      first.bestTranslatedDenseVerification.generationsCompared,
      first.bestTranslated.metrics.evaluatedGenerations + 1,
    );
  }
  assert(/finite observed trajectories/.test(first.interpretation), `${tiling}: finite interpretation`);
}

// A known glider is a positive control for complete-state translation matching.
const square = Core.buildSquarePatch(31);
const squareCoordinates = new Map();
for (let cell = 0; cell < square.tileCount; cell++) {
  squareCoordinates.set(`${square.coordinates[cell * 2]},${square.coordinates[cell * 2 + 1]}`, cell);
}
const glider = discoveries.find((entry) => entry.id === 'square-glider');
const gliderEntries = glider.coordinateStates.map(([x, y, state]) => [squareCoordinates.get(`${x},${y}`), state]);
const gliderAutomaton = new SparseAutomaton(square, square.touchGraph, glider.rule, glider.generations);
const gliderMetrics = Mobility.evaluate(gliderAutomaton, gliderEntries, {
  horizon: 16, maxActive: 12, maxRadius: 4,
}, Mobility.makeSpatialIndex(square));
assert.equal(gliderMetrics.outcome, 'horizon');
assert(gliderMetrics.translatedReturns.some((entry) =>
  entry.fromGeneration === 0 && entry.toGeneration === 4 &&
  Math.abs(entry.dx - 1) < 1e-12 && Math.abs(entry.dy - 1) < 1e-12 &&
  entry.neighborhoodRadius === 3));

console.log(JSON.stringify({
  catalogueEntriesVerified: catalogue.catalogEntries,
  sparseDenseCases,
  deterministicSearchCases: searchCases.length,
  candidatesPerSearch: searchIterations,
  positiveControlGenerations: gliderMetrics.evaluatedGenerations,
  result: 'passed',
}));
