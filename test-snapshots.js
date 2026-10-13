'use strict';

// Exercise the actual browser snapshot code against all four real backends.
// No production testing global or DOM/browser dependency is introduced.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Core = require('./core.js');
const catalogue = require('./discoveries.js');
const marker = "  window.addEventListener('DOMContentLoaded', () => {";
const source = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
assert(source.includes(marker));
const windowStub = {
  AperiodicLifeCore: Core, AperiodicLifeDiscoveries: catalogue, addEventListener() {},
};
vm.runInNewContext(source.replace(marker,
  '  window.snapshotTests = { AperiodicLifeApp, validateSnapshot, prepareSnapshot, graphFingerprint, discoveryMatches };\n' + marker),
{ window: windowStub });
const { AperiodicLifeApp, validateSnapshot, prepareSnapshot, graphFingerprint, discoveryMatches } = windowStub.snapshotTests;
const clone = (data) => JSON.parse(JSON.stringify(data));

function experiment(tiling, neighborhood, seed = 'sun') {
  const patch = Core.buildPatch(tiling, Core.PATCH_OPTIONS[tiling][0].depth, { seed });
  const graph = neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const simulation = new Core.Automaton(patch, graph, { rule: 'B2/S', generations: 4, borderRings: 1 });
  simulation.generation = 17;
  let count = 0;
  for (let cell = 0; cell < patch.tileCount && count < 9; cell++) {
    if (!simulation.isLocked(cell)) simulation.state[cell] = ++count % 3 + 1;
  }
  assert(count > 0, `${tiling} test requires an interior`);
  simulation.refreshDerivedState();
  const app = Object.create(AperiodicLifeApp.prototype);
  Object.assign(app, {
    patch, simulation,
    renderer: { camera: { x: 2, y: -1, zoom: 13 } },
    elements: { speedInput: { value: '12' }, paletteSelect: { value: 'cyan' },
      gridCheckbox: { checked: true }, typeCheckbox: { checked: false } },
  });
  return app;
}

let roundTrips = 0;
for (const tiling of ['square', 'hex', 'hat', 'penrose']) {
  for (const neighborhood of ['edge', 'touch']) {
    for (const seed of tiling === 'penrose' ? ['sun', 'sun-mirror'] : ['sun']) {
      const original = experiment(tiling, neighborhood, seed);
      const snapshot = clone(original.createSnapshot());
      assert(snapshot.cellStates.some((pair) => pair[1] > 1), 'save the refractory phase as well as live cells');
      const restored = prepareSnapshot(snapshot);
      assert.equal(restored.patch.tiling, tiling);
      assert.equal(restored.simulation.generation, 17);
      assert.deepStrictEqual(restored.simulation.state, original.simulation.state);
      assert.equal(restored.simulation.rule.text, original.simulation.rule.text);
      assert.deepStrictEqual(restored.simulation.ensureStateHash(), original.simulation.ensureStateHash());
      for (let generation = 0; generation < 20; generation++) {
        restored.simulation.step();
        original.simulation.step();
        assert.deepStrictEqual(restored.simulation.state, original.simulation.state,
          `${tiling}/${neighborhood}/${seed} continuation differs at step ${generation + 1}`);
      }
      roundTrips++;
    }
  }
}

// Named tables retain their model and every visible signal state on export.
for (const rule of ['TABLE:HAT-A', 'TABLE:HAT-B', 'TABLE:HAT-C', 'TABLE:HAT-SIMPLE']) {
  const original = experiment('hat', 'touch');
  original.simulation.setRule(rule);
  const snapshot = clone(original.createSnapshot());
  const restored = prepareSnapshot(snapshot);
  assert.equal(restored.simulation.rule.text, rule);
  assert.deepStrictEqual(restored.simulation.state, original.simulation.state);
  for (let step = 0; step < 20; step++) {
    restored.simulation.step();
    original.simulation.step();
    assert.deepStrictEqual(restored.simulation.state, original.simulation.state);
  }
  snapshot.generations = 5;
  assert.throws(() => validateSnapshot(snapshot), /state count/);
  roundTrips++;
}

// Preset switching must unlock the B/S state control and remove invalid states.
const controls = experiment('hat', 'touch');
Object.assign(controls.elements, {
  presetSelect: { value: 'hatsimple' }, generationsInput: { value: 4 },
  ruleInput: { value: '', classList: { add() {}, remove() {} }, setAttribute() {} },
  ruleHelp: {}, ruleMeaningHelp: {}, statesHelp: {},
});
controls.renderer.updateState = () => {};
controls.clearActiveDiscovery = controls.resetCycleDetector = controls.updateStats = () => {};
controls.applyPreset();
assert.equal(controls.simulation.rule.text, 'TABLE:HAT-SIMPLE');
assert.equal(controls.simulation.generations, 3);
assert.equal(controls.elements.generationsInput.disabled, true);
assert(controls.elements.statesHelp.textContent.includes('signals'));
controls.elements.presetSelect.value = 'conway';
controls.applyPreset();
assert.equal(controls.simulation.generations, 2);
assert.equal(controls.elements.generationsInput.disabled, false);
assert(controls.simulation.state.every((value) => value < 2));
assert(controls.elements.ruleMeaningHelp.textContent.includes('Only state-1'));

const original = experiment('penrose', 'touch');
const valid = clone(original.createSnapshot());
for (const mutation of [
  (data) => { data.format = 'settings-only'; },
  (data) => { data.version = 2; },
  (data) => { data.tiling = '__proto__'; },
  (data) => { data.patchDepth = 12; },
  (data) => { data.tileCount++; },
  (data) => { data.neighborhood = 'nearest'; },
  (data) => { data.penroseSeed = 'star'; },
  (data) => { data.generations = 256; },
  (data) => { data.generation = -1; },
  (data) => { data.generation = Number.MAX_SAFE_INTEGER + 1; },
  (data) => { data.deadBorderRings = 0.5; },
  (data) => { data.stepsPerSecond = 0; },
  (data) => { data.rule = 'not a rule'; },
  (data) => { data.graphFingerprint = ''; },
  (data) => { data.palette = 'constructor'; },
  (data) => { data.drawGrid = 'true'; },
  (data) => { data.view.zoom = 0; },
  (data) => { data.view.x = NaN; },
  (data) => { data.cellStates = null; },
  (data) => { data.cellStates.push(data.cellStates[0]); },
  (data) => { data.cellStates[0][0] = -1; },
  (data) => { data.cellStates[0][0] = data.tileCount; },
  (data) => { data.cellStates[0][1] = 0; },
  (data) => { data.cellStates[0][1] = 4; },
  (data) => { data.cellStates[0][1] = 1.5; },
]) {
  const invalid = clone(valid);
  mutation(invalid);
  assert.throws(() => validateSnapshot(invalid), undefined, `accepted invalid data: ${mutation}`);
}

const wrongGraph = clone(valid);
wrongGraph.graphFingerprint = '00000000-00000000';
assert.throws(() => prepareSnapshot(wrongGraph), /different cell indexing/);
const wrongSeed = clone(valid);
wrongSeed.penroseSeed = 'sun-mirror';
assert.throws(() => prepareSnapshot(wrongSeed), /different cell indexing/);
const locked = clone(valid);
const lockedCell = original.simulation.boundaryDistance.findIndex((distance) => distance === 0);
locked.cellStates.push([lockedCell, 1]);
assert.throws(() => prepareSnapshot(locked), /locked dead border/);
const empty = clone(valid);
empty.cellStates = [];
assert(prepareSnapshot(empty).simulation.state.every((state) => state === 0));
const longRule = clone(valid);
longRule.rule = Core.formatRule(Array.from({ length: 256 }, (_, index) => index), []);
assert(longRule.rule.length > 256);
assert.equal(prepareSnapshot(longRule).simulation.rule.text, longRule.rule,
  'all valid canonical rules must remain saveable, including ignored high counts');
assert.equal(graphFingerprint(original.patch, original.simulation.graph), valid.graphFingerprint);

// Search is case-insensitive, combines all words, and includes mathematical
// rules, category names, and Einstein as a synonym for the internal hat name.
assert(catalogue.filter((entry) => discoveryMatches(entry, 'PENROSE traveller')).length >= 3);
assert(catalogue.filter((entry) => discoveryMatches(entry, 'Einstein p26')).length >= 1);
assert(catalogue.filter((entry) => discoveryMatches(entry, 'B2/S 4 states')).length >= 1);
assert.equal(catalogue.filter((entry) => discoveryMatches(entry, 'no-such-pattern')).length, 0);
assert.equal(catalogue.filter((entry) => discoveryMatches(entry, '  ')).length, catalogue.length);
const creditedExample = {
  title: 'Travelling pair', tiling: 'hat', rule: 'TABLE:HAT-B', generations: 4,
  provenance: {
    credit: 'James Edmond; independently placed seed',
    sources: [{ label: 'Author’s Glider Compendium', url: 'https://example.org/' }],
  },
};
assert(discoveryMatches(creditedExample, 'JAMES EDMOND Einstein'));
assert(discoveryMatches(creditedExample, 'compendium 4 states'));
assert(!discoveryMatches(creditedExample, 'Edmond Penrose'));
assert(!discoveryMatches({ title: 'Uncredited example' }, 'Edmond'));

async function testFailedRestore() {
  const app = experiment('penrose', 'touch');
  const patch = app.patch;
  const simulation = app.simulation;
  const state = simulation.state.slice();
  const events = [];
  Object.assign(app, {
    running: true, busyState: false, rebuildRequestId: 0,
    setRunning(value) { this.running = value; events.push(['running', value]); },
    setBusy(value) { this.busyState = value; events.push(['busy', value]); },
    async nextPaint() {},
  });
  await assert.rejects(app.restoreSnapshot(wrongGraph), /different cell indexing/);
  assert.strictEqual(app.patch, patch);
  assert.strictEqual(app.simulation, simulation);
  assert.deepStrictEqual(app.simulation.state, state);
  assert.equal(app.running, true, 'a graph mismatch must resume the previous running experiment');
  assert.equal(app.busyState, false, 'a rejected import must not leave the interface busy');
  assert.deepStrictEqual(events, [['running', false], ['busy', true], ['busy', false], ['running', true]]);
  events.length = 0;
  await assert.rejects(app.restoreSnapshot({}), /state file/);
  assert.equal(events.length, 0, 'structural validation must precede changes to the active experiment');
}

testFailedRestore().then(() => {
  console.log(JSON.stringify({ roundTrips, continuationStepsPerRoundTrip: 20,
    strictSchema: 'passed', graphMismatch: 'passed', lockedBorder: 'passed',
    failurePreservesExperiment: 'passed', catalogueSearch: 'passed' }));
}).catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
