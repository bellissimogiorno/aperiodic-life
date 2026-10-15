'use strict';

// Dependency-free unit checks for viewport calculations, discovery camera
// policy, and the pointer state machine. The production file intentionally
// exposes no testing global, so this test injects one just before startup
// while evaluating the otherwise unmodified source in a VM.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Core = require('./core.js');

const sourcePath = path.join(__dirname, 'app.js');
const marker = "  window.addEventListener('DOMContentLoaded', () => {";
const source = fs.readFileSync(sourcePath, 'utf8');
assert(source.includes(marker), 'app startup marker changed');

const instrumented = source.replace(
  marker,
  "  window.__interactionTestClasses = { AperiodicLifeApp, WebGLRenderer };\n\n" + marker,
);
const windowStub = {
  AperiodicLifeCore: Core,
  AperiodicLifeDiscoveries: [],
  addEventListener() {},
};
class HTMLElementStub {}
class DOMNodeStub extends HTMLElementStub {
  constructor(tagName) {
    super();
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this._text = '';
    this.value = '';
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map((child) => child.textContent).join(''); }
  set innerHTML(_) { throw new Error('Example credits must use text and DOM nodes'); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this._text = ''; this.children = children; }
  get options() {
    return this.children.flatMap((child) => child.tagName === 'OPTION' ? [child] : child.options || []);
  }
  querySelector() { return this.options.find((option) => option.value === '') || null; }
}
const documentStub = {
  createElement: (tagName) => new DOMNodeStub(tagName),
  createTextNode: (textContent) => ({ textContent }),
};
const runtime = {
  window: windowStub, HTMLElement: HTMLElementStub, document: documentStub, URL,
  Math: Object.create(Math), Date: class extends Date {},
};
vm.runInNewContext(instrumented, runtime);
const { AperiodicLifeApp, WebGLRenderer } = windowStub.__interactionTestClasses;

function seedHarness(tiling = 'square', neighborhood = 'touch') {
  const patch = Core.buildPatch(tiling, Core.PATCH_OPTIONS[tiling][1].depth);
  const graph = neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const simulation = new Core.Automaton(patch, graph, {
    rule: 'B3/S23', generations: 4, borderRings: 1,
  });
  const node = (tagName = 'BUTTON') => Object.assign(new HTMLElementStub(), {
    tagName, value: '', listeners: new Map(),
    addEventListener(type, handler) { this.listeners.set(type, handler); },
  });
  const elements = new Proxy({}, {
    get(target, key) { return target[key] || (target[key] = node()); },
  });
  elements.seedInput = node('INPUT');
  elements.seedInput.value = 'aperiodic';
  elements.densityInput.value = '0.37';
  elements.aboutDialog.open = false;
  elements.rulesDialog.open = false;
  const app = Object.create(AperiodicLifeApp.prototype);
  Object.assign(app, {
    patch, simulation, elements, canvas: node('CANVAS'), randomSeedCounter: 0,
    controls: { classList: { contains() { return false; } } },
    activeDiscovery: 'example', automaticDiscoveryView: true, discoveryViewManaged: true,
    renderer: { updateState(state) { assert.strictEqual(state, simulation.state); } },
    cycleResets: 0, statsUpdates: 0, dirty: false,
    resetCycleDetector() { this.cycleResets++; },
    updateStats(force) { assert.equal(force, true); this.statsUpdates++; },
    showToast(message) { this.lastToast = message; },
  });
  return app;
}

{
  // Exercise the real seeded automaton across all four tilings and both
  // neighbourhoods. Fresh UI randomisation must not change core determinism.
  let entropyCalls = 0;
  windowStub.crypto = {
    getRandomValues(words) {
      entropyCalls++;
      // A repeated entropy sample also exercises the per-session counter.
      words.set([123456789, 987654321]);
      return words;
    },
  };
  for (const tiling of ['square', 'hex', 'hat', 'penrose']) {
    for (const neighborhood of ['edge', 'touch']) {
      const app = seedHarness(tiling, neighborhood);
      app.randomize();
      const seed = app.elements.seedInput.value;
      const first = app.simulation.state.slice();
      assert.notEqual(seed, 'aperiodic', `${tiling}/${neighborhood}: Randomise must replace the old seed`);
      assert.equal(app.simulation.generation, 0);
      assert.equal(app.activeDiscovery, null);
      assert.equal(app.automaticDiscoveryView, false);
      assert.equal(app.discoveryViewManaged, false);
      assert.equal(app.dirty, true);
      assert(app.lastToast.includes(seed), 'the displayed seed must describe the new pattern');

      app.simulation.step();
      app.randomize();
      assert.notEqual(app.elements.seedInput.value, seed, 'consecutive clicks need fresh seeds');
      assert.notDeepEqual(app.simulation.state, first, `${tiling}/${neighborhood}: consecutive random patterns repeated`);
      assert.equal(app.simulation.generation, 0, 'randomising must reset the generation');

      app.elements.seedInput.value = seed;
      app.applySeed();
      assert.deepEqual(app.simulation.state, first, `${tiling}/${neighborhood}: the saved seed must reproduce every cell`);
      app.simulation.step();
      app.applySeed(false);
      assert.deepEqual(app.simulation.state, first, 'Apply seed must reset evolved or edited states');
      assert.equal(app.elements.seedInput.value, seed, 'Apply seed must retain the exact seed');
      assert.equal(app.cycleResets, 4, 'all pattern resets must discard old cycle observations');
      assert.equal(app.statsUpdates, 4);

      for (const density of ['0', '1']) {
        app.elements.densityInput.value = density;
        app.randomize(false);
        for (let cell = 0; cell < app.simulation.state.length; cell++) {
          assert.equal(app.simulation.state[cell], density === '1' && !app.simulation.isLocked(cell) ? 1 : 0,
            'density endpoints and locked borders must still be respected');
        }
      }
    }
  }
  assert.equal(entropyCalls, 32, 'only fresh Randomise actions should request entropy');

  const app = seedHarness();
  app.bindEvents();
  app.elements.randomizeButton.listeners.get('click')();
  const buttonSeed = app.elements.seedInput.value;
  app.keyDown({ key: 'r', target: null });
  assert.notEqual(app.elements.seedInput.value, buttonSeed, 'R must also choose a fresh seed');
  const keyboardSeed = app.elements.seedInput.value;
  app.keyDown({ key: 'r', target: app.elements.seedInput });
  assert.equal(app.elements.seedInput.value, keyboardSeed, 'typing r inside the seed must not randomise');

  const typedSeed = '  exact Unicode seed: \u03b1\u03b2  ';
  app.elements.seedInput.value = typedSeed;
  app.elements.applySeedButton.listeners.get('click')();
  const typedPattern = app.simulation.state.slice();
  app.simulation.step();
  let prevented = false;
  app.elements.seedInput.listeners.get('keydown')({
    key: 'Enter', preventDefault() { prevented = true; },
  });
  assert.equal(prevented, true);
  assert.equal(app.elements.seedInput.value, typedSeed, 'typed seed text must not be normalised');
  assert.deepEqual(app.simulation.state, typedPattern, 'Enter must reproduce the same pattern as Apply seed');

  for (const unavailable of ['busy', 'missing']) {
    const simulation = app.simulation;
    app.busyState = unavailable === 'busy';
    if (unavailable === 'missing') app.simulation = null;
    const callsBefore = entropyCalls;
    const resetsBefore = app.cycleResets;
    app.randomize();
    app.applySeed();
    assert.equal(app.elements.seedInput.value, typedSeed, 'an unavailable board must not silently consume a new seed');
    assert.equal(entropyCalls, callsBefore);
    assert.equal(app.cycleResets, resetsBefore);
    assert.deepEqual(simulation.state, typedPattern);
    app.simulation = simulation;
  }
  delete windowStub.crypto;
}

{
  // Offline/insecure contexts may lack Web Crypto. Even identical random and
  // clock samples must produce distinct, reproducible seeds on rapid clicks.
  runtime.Math.random = () => 0.25;
  runtime.Date.now = () => 123456789;
  const app = seedHarness();
  const seeds = new Set();
  const patterns = new Set();
  for (let click = 0; click < 32; click++) {
    app.randomize(false);
    seeds.add(app.elements.seedInput.value);
    patterns.add(Buffer.from(app.simulation.state).toString('base64'));
  }
  assert.equal(seeds.size, 32, 'fallback seeds must not repeat when the clock and entropy repeat');
  assert.equal(patterns.size, 32, 'the checked fallback samples must produce distinct patterns');
  const expected = app.simulation.state.slice();
  app.simulation.step();
  app.applySeed(false);
  assert.deepEqual(app.simulation.state, expected, 'fallback-generated seeds must remain reproducible');
  delete runtime.Math.random;
  delete runtime.Date.now;
}

{
  // Credits follow the selected example without retaining stale attribution.
  // Markup-looking credit text stays text, and only web links are clickable.
  const app = Object.create(AperiodicLifeApp.prototype);
  const first = {
    id: 'credited', title: 'Finite traveller', summary: 'A finite replay.',
    category: 'Hat examples', tiling: 'hat', generations: 4, rule: 'TABLE:HAT-B',
    provenance: {
      status: 'published', credit: '<img src=x> James Edmond',
      sources: [
        { label: 'Unsafe', url: 'javascript:alert(1)' },
        { label: 'Broken', url: 'not a URL' },
        { label: 'Project <b>site</b>', url: 'https://offlattice.org/monotile/' },
        { label: 'Paper', url: 'https://arxiv.org/abs/2609.22579' },
        { label: 'Compendium', url: 'https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md' },
        { label: 'Fourth source', url: 'https://example.org/' },
      ],
    },
  };
  const second = {
    id: 'unresolved', title: 'Unresolved example', summary: 'A recorded example.',
    category: 'Other examples',
    provenance: { status: 'unresolved', credit: 'Earlier attribution is unconfirmed.', sources: [] },
  };
  const uncredited = { id: 'legacy', summary: 'No provenance record.' };
  app.discoveryById = new Map([first, second, uncredited].map((entry) => [entry.id, entry]));
  app.busyState = false;
  app.elements = Object.fromEntries([
    'discoverySelect', 'discoverySearch', 'discoveryCount', 'catalogueCount',
    'discoveryDescription', 'discoveryProvenance', 'loadDiscoveryButton', 'loadRunDiscoveryButton',
  ].map((id) => [id, new DOMNodeStub('span')]));
  const placeholder = new DOMNodeStub('option');
  app.elements.discoverySelect.appendChild(placeholder);
  const container = app.elements.discoveryProvenance;

  app.updateDiscoveryDescription();
  assert.equal(container.hidden, true);
  assert.equal(container.children.length, 0);
  assert.equal(app.elements.loadDiscoveryButton.disabled, true);
  app.elements.discoverySelect.value = first.id;
  app.updateDiscoveryDescription();
  assert.equal(container.hidden, false);
  assert.equal(app.elements.discoveryDescription.textContent, first.summary);
  assert.equal(container.children[0].textContent, 'Published example: ');
  assert.equal(container.children[1].textContent, '<img src=x> James Edmond');
  const links = container.children[2].children.filter((child) => child.tagName === 'A');
  assert.equal(links.length, 3, 'show at most three usable source links');
  assert.equal(links[0].textContent, 'Project <b>site</b>');
  assert.equal(links[0].href, 'https://offlattice.org/monotile/');
  for (const link of links) {
    assert.equal(link.target, '_blank');
    assert.equal(link.rel, 'noopener noreferrer');
  }
  assert.equal(first.provenance.sources.length, 6, 'rendering must preserve the complete source record');

  app.elements.discoverySelect.value = second.id;
  app.updateDiscoveryDescription();
  assert.equal(container.children.length, 2, 'switching examples must remove old links');
  assert.equal(container.children[0].textContent, 'Attribution unresolved: ');
  assert(!container.textContent.includes('Edmond'));
  app.elements.discoverySelect.value = uncredited.id;
  app.updateDiscoveryDescription();
  assert.equal(container.hidden, true, 'legacy records must not inherit another example’s credit');

  // Searching by author preserves a matching selection, then clears its credit
  // and disables loading when a later filter removes that example.
  windowStub.AperiodicLifeDiscoveries.push(first, second);
  app.elements.discoverySelect.value = first.id;
  app.elements.discoverySearch.value = 'Edmond';
  app.populateDiscoveries();
  assert.equal(app.elements.discoverySelect.value, first.id);
  assert.equal(app.elements.discoveryCount.textContent, '1 of 2 examples');
  assert.equal(container.hidden, false);
  app.elements.discoverySearch.value = 'absent author';
  app.populateDiscoveries();
  assert.equal(app.elements.discoverySelect.value, '');
  assert.equal(app.elements.discoveryCount.textContent, '0 of 2 examples');
  assert.equal(placeholder.textContent, 'No matching examples');
  assert.equal(container.hidden, true);
  assert.equal(app.elements.loadRunDiscoveryButton.disabled, true);
  windowStub.AperiodicLifeDiscoveries.length = 0;
}

{
  // Both entry points must describe the same playback state, including while
  // geometry is rebuilding and after an attempted start without a simulation.
  const makeButton = () => {
    const classes = new Set();
    const attributes = new Map();
    return {
      classes, attributes, disabled: false, textContent: '',
      setAttribute(name, value) { attributes.set(name, value); },
      classList: {
        toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
      },
    };
  };
  const app = Object.create(AperiodicLifeApp.prototype);
  const runButton = makeButton();
  const viewportRunButton = makeButton();
  Object.assign(app, {
    running: false, busyState: false, simulation: {}, accumulator: 0,
    activePointerId: null,
    busy: {}, busyTitle: {}, busyDetail: {},
    updateStats() {},
    elements: {
      runButton, viewportRunButton,
      stepButton: {}, randomizeButton: {}, applySeedButton: {}, clearButton: {},
      saveSnapshotButton: {}, loadSnapshotButton: {},
      loadDiscoveryButton: {}, loadRunDiscoveryButton: {},
      discoverySelect: { value: 'example' },
    },
  });
  app.setRunning(true);
  assert.equal(app.running, true);
  for (const button of [runButton, viewportRunButton]) {
    assert.equal(button.textContent, 'Pause');
    assert.equal(button.attributes.get('aria-label'), 'Pause simulation');
    assert(button.classes.has('running'));
    assert(!button.classes.has('primary'));
  }
  app.accumulator = 42;
  app.setRunning(false);
  assert.equal(app.running, false);
  assert.equal(app.accumulator, 0, 'pausing must not leave queued generations');
  assert.equal(runButton.textContent, 'Run');
  assert.equal(viewportRunButton.textContent, 'Play');
  assert.equal(viewportRunButton.attributes.get('aria-label'), 'Play simulation');
  for (const button of [runButton, viewportRunButton]) {
    assert(!button.classes.has('running'));
    assert(button.classes.has('primary'));
  }
  app.setBusy(true);
  assert(runButton.disabled && viewportRunButton.disabled, 'both controls must be disabled during rebuild');
  assert(app.elements.applySeedButton.disabled, 'Apply seed must be disabled during rebuild');
  app.setRunning(true);
  assert.equal(app.running, false, 'busy simulation must not start from either control');
  assert.equal(viewportRunButton.textContent, 'Play');
  app.setBusy(false);
  assert(!app.elements.applySeedButton.disabled, 'Apply seed must recover after rebuild');
  assert(!runButton.disabled && !viewportRunButton.disabled, 'both controls must recover after rebuild');
  app.simulation = null;
  app.setBusy(false);
  app.setRunning(true);
  assert(runButton.disabled && viewportRunButton.disabled, 'an unavailable simulation cannot be started');
  assert.equal(app.running, false);
  assert.equal(viewportRunButton.textContent, 'Play');
}

function closeTo(actual, expected, message) {
  assert(
    Math.abs(actual - expected) <= 1e-10,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

function rendererHarness(width = 200, height = 100) {
  const renderer = Object.create(WebGLRenderer.prototype);
  renderer.canvas = {
    getBoundingClientRect() { return { left: 0, top: 0, width, height }; },
  };
  renderer.camera = { x: 0, y: 0, zoom: 10 };
  renderer.patch = {
    tileCount: 3,
    bboxes: new Float32Array([
      -2, -1, 2, 1,
      8, -2, 12, 2,
      -20, -10, -16, -6,
    ]),
    bounds: { minX: -25, minY: -12, maxX: 15, maxY: 8 },
  };
  return renderer;
}

{
  const renderer = rendererHarness(300, 180);
  renderer.focusBounds([-10, -5, 10, 5], 5);
  assert.deepEqual(renderer.camera, { x: 0, y: 0, zoom: 9 });

  renderer.focusBounds([3, 7, 3, 7]);
  assert.deepEqual(renderer.camera, { x: 3, y: 7, zoom: 500 }, 'degenerate bounds must respect the maximum zoom');

  renderer.focusBounds([-1e9, -1e9, 1e9, 1e9]);
  assert.equal(renderer.camera.zoom, 0.02, 'very large bounds must respect the minimum zoom');

  for (const [bounds, padding] of [
    [null, 0],
    [[0, 1, 2], 0],
    [[0, 0, NaN, 1], 0],
    [[2, 0, 1, 1], 0],
    [[0, 2, 1, 1], 0],
    [[0, 0, 1, 1], -1],
    [[0, 0, 1, 1], Infinity],
  ]) {
    assert.throws(
      () => renderer.focusBounds(bounds, padding),
      /View bounds must be four ordered finite values with nonnegative padding/,
    );
  }
}

for (const [width, height] of [[1200, 700], [390, 700], [700, 390]]) {
  const renderer = rendererHarness(width, height);
  const bounds = [-103.93494415283203, 13.20820426940918, 92.43650817871094, 17.135255813598633];
  const padding = 4;
  renderer.focusBounds(bounds, padding);
  const halfWidth = width / (2 * renderer.camera.zoom);
  const halfHeight = height / (2 * renderer.camera.zoom);
  assert(renderer.camera.x - halfWidth <= bounds[0] - padding + 1e-10);
  assert(renderer.camera.y - halfHeight <= bounds[1] - padding + 1e-10);
  assert(renderer.camera.x + halfWidth >= bounds[2] + padding - 1e-10);
  assert(renderer.camera.y + halfHeight >= bounds[3] + padding - 1e-10);
}

{
  const renderer = rendererHarness();
  assert.deepEqual(
    renderer.stateBounds(new Uint8Array([0, 1, 2])),
    [-20, -10, 12, 2],
    'all nonzero generations must contribute to state bounds',
  );
  assert.deepEqual(renderer.stateBounds(new Uint8Array([1, 0, 0])), [-2, -1, 2, 1]);
  assert.equal(renderer.stateBounds(new Uint8Array(3)), null, 'an empty state has no activity bounds');
  assert.equal(renderer.stateBounds(new Uint8Array(2)), null, 'a mismatched state must be rejected');
  const patch = renderer.patch;
  renderer.patch = null;
  assert.equal(renderer.stateBounds(new Uint8Array(3)), null, 'bounds require a current patch');
  renderer.patch = patch;

  renderer.focusState(new Uint8Array([1, 0, 0]), 3);
  assert.deepEqual(renderer.camera, { x: 0, y: 0, zoom: 12.5 });

  renderer.focusState(new Uint8Array(3), 3);
  assert.equal(renderer.camera.x, -5);
  assert.equal(renderer.camera.y, -2);
  closeTo(renderer.camera.zoom, 100 / 21.6, 'empty-state fallback must fit the complete patch');
}

{
  const renderer = rendererHarness();
  const unchanged = { ...renderer.camera };
  assert.equal(renderer.containState(new Uint8Array([1, 0, 0]), 1), false);
  assert.deepEqual(renderer.camera, unchanged, 'already-contained activity must not disturb the camera');
  assert.equal(renderer.containState(new Uint8Array(3), 1), false);
  assert.deepEqual(renderer.camera, unchanged, 'an empty state must not disturb the camera');

  assert.equal(renderer.containState(new Uint8Array([0, 1, 0]), 1), true);
  assert.deepEqual(
    renderer.camera,
    { x: 3, y: 0, zoom: 10 },
    'containment must pan only far enough to expose a component and must not zoom in',
  );

  renderer.camera = { x: 0, y: 0, zoom: 10 };
  assert.equal(renderer.containState(new Uint8Array([0, 1, 1]), 2), true);
  assert.equal(renderer.camera.x, -4);
  assert.equal(renderer.camera.y, -3);
  closeTo(renderer.camera.zoom, 200 / 36, 'containment must zoom out enough for growing activity');

  renderer.camera = { x: 10, y: 0, zoom: 10 };
  assert.equal(renderer.containState(new Uint8Array([0, 1, 0]), 3), false, 'padding on the visible boundary is inclusive');
}

function event(overrides = {}) {
  return {
    pointerId: 1,
    clientX: 10,
    clientY: 20,
    button: 0,
    buttons: 1,
    pointerType: 'mouse',
    shiftKey: false,
    altKey: false,
    prevented: false,
    preventDefault() { this.prevented = true; },
    ...overrides,
  };
}

function harness(tool = 'pan', captureThrows = false) {
  const classes = new Set();
  const captured = new Set();
  const released = [];
  const pans = [];
  const painted = [];
  const fits = [];
  const zooms = [];
  const focuses = [];
  const state = new Uint8Array(2);
  const app = Object.create(AperiodicLifeApp.prototype);
  Object.assign(app, {
    busyState: false,
    simulation: {
      state,
      setCell(cell, value) {
        if (state[cell] === value) return false;
        state[cell] = value;
        painted.push([cell, value]);
        return true;
      },
    },
    elements: {
      toolSelect: { value: tool },
      discoverySelect: { value: '' },
    },
    renderer: {
      camera: { x: 0, y: 0, zoom: 10 },
      screenToWorld(clientX, clientY) { return { x: clientX, y: clientY }; },
      panPixels(dx, dy) {
        pans.push([dx, dy]);
        this.camera.x -= dx / this.camera.zoom;
        this.camera.y += dy / this.camera.zoom;
      },
      fit() { fits.push(true); },
      zoomAt(clientX, clientY, factor) { zooms.push([clientX, clientY, factor]); },
      updateState() {},
    },
    picking: { find(x) { return x < 0 ? -1 : x < 50 ? 0 : 1; } },
    canvas: {
      focus(options) {
        focuses.push(options);
        documentStub.activeElement = this;
      },
      classList: {
        add(name) { classes.add(name); },
        remove(name) { classes.delete(name); },
      },
      setPointerCapture(pointerId) {
        if (captureThrows) throw new Error('capture rejected');
        captured.add(pointerId);
      },
      hasPointerCapture(pointerId) { return captured.has(pointerId); },
      releasePointerCapture(pointerId) {
        released.push(pointerId);
        captured.delete(pointerId);
      },
    },
    pointerAction: null,
    activePointerId: null,
    lastPointer: null,
    touchPointers: new Map(),
    lastPinch: null,
    pendingTouchPaint: null,
    lastPaintedCell: -1,
    paintValue: null,
    dirty: false,
    automaticDiscoveryView: false,
    discoveryViewManaged: false,
    activeDiscovery: null,
    updateDiscoveryDescription() {},
    resetCycleDetector() {},
    updateStats() {},
  });
  return { app, classes, captured, released, pans, painted, fits, zooms, focuses, state };
}

function cameraPolicyHarness() {
  const calls = [];
  const state = new Uint8Array([1, 0]);
  const renderer = {
    containResult: false,
    focusBoundsZoom: null,
    camera: { zoom: 10 },
    focusState(actualState, padding) { calls.push(['focusState', actualState, padding]); },
    focusBounds(bounds, padding) {
      calls.push(['focusBounds', bounds, padding]);
      if (this.focusBoundsZoom !== null) this.camera.zoom = this.focusBoundsZoom;
    },
    containState(actualState, padding) {
      calls.push(['containState', actualState, padding]);
      return this.containResult;
    },
  };
  const app = Object.create(AperiodicLifeApp.prototype);
  Object.assign(app, {
    renderer,
    simulation: { state, generation: 0 },
    automaticDiscoveryView: false,
    discoveryViewManaged: false,
    activeDiscovery: null,
    discoveryById: new Map(),
    dirty: false,
  });
  return { app, calls, renderer, state };
}

{
  let toggles = 0;
  let prevented = false;
  let drawerCloses = 0;
  const app = Object.create(AperiodicLifeApp.prototype);
  Object.assign(app, {
    running: false,
    controls: { classList: { contains() { return true; } } },
    elements: {
      aboutDialog: { open: false },
      rulesDialog: { open: true },
    },
    setRunning() { toggles++; },
    closeControls() { drawerCloses++; },
  });
  const shortcut = {
    defaultPrevented: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    key: ' ',
    target: null,
    preventDefault() { prevented = true; },
  };
  app.keyDown(shortcut);
  assert.equal(toggles, 0, 'global shortcuts must not operate behind rule help');
  assert.equal(prevented, false, 'rule help must retain native modal keyboard handling');
  app.keyDown({ ...shortcut, key: 'Escape' });
  assert.equal(drawerCloses, 0, 'Escape in a modal must not also close the mobile controls drawer');

  app.elements.rulesDialog.open = false;
  app.keyDown(shortcut);
  assert.equal(toggles, 1, 'global shortcuts must resume after rule help closes');
  assert.equal(prevented, true);
}

{
  const classes = new Set(['open']);
  const attributes = new Map([['aria-expanded', 'true']]);
  let focused = false;
  const app = Object.create(AperiodicLifeApp.prototype);
  app.controls = {
    classList: {
      contains(name) { return classes.has(name); },
      remove(name) { classes.delete(name); },
    },
  };
  app.elements = {
    openControls: {
      setAttribute(name, value) { attributes.set(name, value); },
      focus() { focused = true; },
    },
  };
  app.closeControls();
  assert(!classes.has('open'));
  assert.equal(attributes.get('aria-expanded'), 'false');
  assert.equal(focused, true, 'closing the mobile drawer must move focus to its opener');
}

{
  const h = cameraPolicyHarness();
  h.app.automaticDiscoveryView = true;
  h.app.applyDiscoveryView({ id: 'legacy' });
  assert.deepEqual(h.calls.shift(), ['focusState', h.state, 4]);
  assert.equal(h.app.automaticDiscoveryView, false, 'default initial focus must not keep following activity');
  assert.equal(h.app.discoveryViewManaged, true, 'a loaded discovery view must adapt to resize');

  h.app.applyDiscoveryView({ id: 'initial', view: { mode: 'initial', padding: 7 } });
  assert.deepEqual(h.calls.shift(), ['focusState', h.state, 7]);
  assert.equal(h.app.automaticDiscoveryView, false);

  const bounds = [-10, -2, 30, 4];
  h.app.applyDiscoveryView({ id: 'trajectory', view: { mode: 'trajectory', bounds, padding: 5 } });
  assert.deepEqual(h.calls.shift(), ['focusBounds', bounds, 5]);
  assert.equal(h.app.automaticDiscoveryView, false);

  h.renderer.focusBoundsZoom = 2;
  h.app.applyDiscoveryView({ id: 'narrow-trajectory', view: { mode: 'trajectory', bounds, padding: 5 } });
  assert.deepEqual(h.calls.shift(), ['focusBounds', bounds, 5]);
  assert.deepEqual(h.calls.shift(), ['focusState', h.state, 5]);
  assert.equal(h.app.automaticDiscoveryView, true, 'an illegibly small trajectory must use responsive tracking');
  h.renderer.focusBoundsZoom = null;
  h.renderer.camera.zoom = 10;

  h.app.applyDiscoveryView({ id: 'contain', view: { mode: 'contain', padding: 3 } });
  assert.deepEqual(h.calls.shift(), ['focusState', h.state, 3]);
  assert.equal(h.app.automaticDiscoveryView, true, 'contain mode must enable automatic reframing');
  assert.equal(h.app.discoveryViewManaged, true);

  assert.throws(
    () => h.app.applyDiscoveryView({ id: 'bad', view: { mode: 'teleport', padding: 0 } }),
    /Discovery bad has unknown view mode teleport/,
  );
  assert.equal(h.calls.length, 0);
}

{
  const h = cameraPolicyHarness();
  const initial = { id: 'initial', view: { mode: 'initial', padding: 7 } };
  const trajectory = {
    id: 'trajectory',
    view: { mode: 'trajectory', bounds: [-10, -2, 30, 4], padding: 5, steps: 100 },
  };
  const contain = { id: 'contain', view: { mode: 'contain', padding: 3 } };
  h.app.discoveryViewManaged = true;
  h.app.activeDiscovery = initial.id;
  h.app.discoveryById.set(initial.id, initial);
  h.app.resizeViewport();
  assert.deepEqual(h.calls.shift(), ['focusState', h.state, 7]);
  assert.equal(h.app.dirty, true);

  h.app.dirty = false;
  h.app.activeDiscovery = trajectory.id;
  h.app.discoveryById.set(trajectory.id, trajectory);
  h.app.resizeViewport();
  assert.deepEqual(h.calls.shift(), ['focusBounds', trajectory.view.bounds, 5]);
  assert.equal(h.app.dirty, true);

  h.app.dirty = false;
  h.app.simulation.generation = 101;
  h.app.resizeViewport();
  assert.deepEqual(h.calls.shift(), ['containState', h.state, 5]);
  assert.equal(h.app.dirty, true, 'a completed trajectory must keep following through resize');
  h.app.simulation.generation = 0;

  h.app.dirty = false;
  h.app.activeDiscovery = contain.id;
  h.app.discoveryById.set(contain.id, contain);
  h.app.automaticDiscoveryView = true;
  h.app.resizeViewport();
  assert.deepEqual(h.calls.shift(), ['containState', h.state, 3]);
  assert.equal(h.app.dirty, true);

  h.app.discoveryViewManaged = false;
  h.app.dirty = false;
  h.app.resizeViewport();
  assert.equal(h.calls.length, 0, 'manual camera ownership must survive resize');
  assert.equal(h.app.dirty, true, 'resize must still request a render');
}

{
  const h = cameraPolicyHarness();
  const entry = { id: 'growing', view: { mode: 'contain', padding: 6 } };
  h.app.activeDiscovery = entry.id;
  h.app.discoveryById.set(entry.id, entry);
  h.app.automaticDiscoveryView = true;
  h.app.discoveryViewManaged = true;

  h.app.updateManagedDiscoveryView();
  assert.deepEqual(h.calls.shift(), ['containState', h.state, 6]);
  assert.equal(h.app.dirty, false, 'a still-contained state must not request a render');

  h.renderer.containResult = true;
  h.app.updateManagedDiscoveryView();
  assert.deepEqual(h.calls.shift(), ['containState', h.state, 6]);
  assert.equal(h.app.dirty, true, 'camera changes must request a render');

  h.app.dirty = false;
  h.app.discoveryById.set(entry.id, { id: entry.id, view: { mode: 'initial', padding: 4 } });
  h.app.updateManagedDiscoveryView();
  assert.equal(h.app.automaticDiscoveryView, false, 'invalidated contain policy must turn itself off');
  assert.equal(h.calls.length, 0);
  assert.equal(h.app.dirty, false);
}

{
  const h = cameraPolicyHarness();
  const entry = {
    id: 'finite-route',
    view: { mode: 'trajectory', bounds: [-10, -2, 30, 4], padding: 5, steps: 40 },
  };
  h.app.activeDiscovery = entry.id;
  h.app.discoveryById.set(entry.id, entry);
  h.app.discoveryViewManaged = true;

  h.app.automaticDiscoveryView = true;
  h.app.simulation.generation = 1;
  h.app.updateManagedDiscoveryView();
  assert.deepEqual(h.calls.shift(), ['containState', h.state, 5]);
  h.app.automaticDiscoveryView = false;

  h.app.simulation.generation = 40;
  h.app.updateManagedDiscoveryView();
  assert.equal(h.calls.length, 0, 'a trajectory must retain its fixed frame through the tested horizon');

  h.app.simulation.generation = 41;
  h.app.updateManagedDiscoveryView();
  assert.deepEqual(h.calls.shift(), ['containState', h.state, 5]);
  assert.equal(h.app.discoveryViewManaged, true, 'post-horizon following must remain managed');
}

{
  const h = harness('pan');
  h.app.automaticDiscoveryView = true;
  h.app.activeDiscovery = 'growing';
  const down = event();
  h.app.pointerDown(down);
  assert.equal(h.app.pointerAction, 'pan');
  assert.equal(h.app.activePointerId, 1);
  assert(h.classes.has('dragging'));
  assert(h.captured.has(1));
  assert(down.prevented);

  h.app.pointerMove(event({ pointerId: 2, clientX: 200, clientY: 200 }));
  assert.deepEqual(h.pans, [], 'an unrelated pointer must not move the camera');
  const move = event({ clientX: 30, clientY: 50 });
  h.app.pointerMove(move);
  assert.deepEqual(h.pans, [[20, 30]]);
  assert.equal(h.app.renderer.camera.x, -2);
  assert.equal(h.app.renderer.camera.y, 3);
  assert.equal(h.app.automaticDiscoveryView, false, 'manual panning must stop automatic reframing');
  assert.equal(h.app.discoveryViewManaged, false, 'manual panning must retain camera ownership across resize');
  assert(move.prevented);

  h.app.pointerUp(event({ pointerId: 2 }));
  assert.equal(h.app.pointerAction, 'pan', 'an unrelated pointer must not end a drag');
  h.app.pointerUp(event());
  assert.equal(h.app.pointerAction, null);
  assert.equal(h.app.activePointerId, null);
  assert(!h.classes.has('dragging'));
  assert.deepEqual(h.released, [1]);
}

{
  const h = harness('paint');
  h.app.automaticDiscoveryView = true;
  h.app.discoveryViewManaged = true;
  h.app.activeDiscovery = 'growing';
  h.app.pointerDown(event());
  assert.equal(h.app.automaticDiscoveryView, false, 'painting must stop automatic discovery framing');
  assert.equal(h.app.activeDiscovery, null, 'painting must clear the active discovery');
  assert.equal(h.app.discoveryViewManaged, false);
  h.app.pointerMove(event({ clientX: 60, clientY: 20 }));
  h.app.pointerUp(event({ clientX: 60, clientY: 20 }));
  assert.deepEqual(h.painted, [[0, 1], [1, 1]], 'paint-drag must retain continuous painting semantics');
  assert.deepEqual(h.pans, []);
}

{
  const h = harness('paint');
  h.state[0] = 1;
  h.app.pointerDown(event());
  h.app.pointerUp(event());
  assert.deepEqual(h.painted, [[0, 0]], 'pressing a live cell must begin an erase gesture');

  h.app.pointerDown(event({ clientX: -10 }));
  assert.equal(h.app.paintValue, null, 'a press outside all cells must not inherit the previous gesture');
  h.app.pointerMove(event({ clientX: 60 }));
  h.app.pointerUp(event({ clientX: 60 }));
  assert.deepEqual(
    h.painted,
    [[0, 0], [1, 1]],
    'the first cell entered after a margin press must choose paint/erase from that cell',
  );
}

{
  const h = harness('pan');
  h.app.automaticDiscoveryView = true;
  h.app.discoveryViewManaged = true;
  h.app.pointerDown(event());
  h.app.pointerMove(event());
  assert.equal(h.app.automaticDiscoveryView, true, 'a stationary pointer must not disable automatic framing');
  assert.equal(h.app.discoveryViewManaged, true);
  assert.deepEqual(h.pans, []);
  h.app.pointerUp(event());
}

{
  const h = harness('pan');
  h.app.patch = {};
  h.app.automaticDiscoveryView = true;
  h.app.discoveryViewManaged = true;
  const wheel = event({ clientX: 25, clientY: 35, deltaY: 100 });
  h.app.wheel(wheel);
  assert.equal(h.app.automaticDiscoveryView, false, 'manual zooming must stop automatic reframing');
  assert.equal(h.app.discoveryViewManaged, false);
  assert.equal(h.zooms.length, 1);
  assert.equal(h.zooms[0][0], 25);
  assert.equal(h.zooms[0][1], 35);
  closeTo(h.zooms[0][2], Math.exp(-0.14), 'wheel zoom factor');
  assert.equal(h.app.dirty, true);
  assert(wheel.prevented);

  h.app.automaticDiscoveryView = true;
  h.app.discoveryViewManaged = true;
  h.app.dirty = false;
  h.app.fit();
  assert.equal(h.app.automaticDiscoveryView, false, 'manual Fit must stop automatic reframing');
  assert.equal(h.app.discoveryViewManaged, false);
  assert.deepEqual(h.fits, [true]);
  assert.equal(h.app.dirty, true);
}

for (const override of [{ shiftKey: true }, { altKey: true }, { button: 2 }]) {
  const h = harness('paint');
  h.app.pointerDown(event(override));
  h.app.pointerMove(event({ ...override, clientX: 25, clientY: 35 }));
  h.app.pointerUp(event({ ...override, clientX: 25, clientY: 35 }));
  assert.deepEqual(h.painted, [], 'temporary pan override must not paint');
  assert.deepEqual(h.pans, [[15, 15]]);
}

{
  const h = harness('pan', true);
  assert.doesNotThrow(() => h.app.pointerDown(event()), 'capture rejection must not abort a drag');
  h.app.pointerMove(event({ clientX: 20, clientY: 25 }));
  h.app.pointerUp(event({ clientX: 20, clientY: 25 }));
  assert.deepEqual(h.pans, [[10, 5]]);
}

{
  const h = harness('pan', true);
  h.app.pointerDown(event());
  h.app.pointerMove(event({ clientX: 200, clientY: 200, buttons: 0 }));
  assert.equal(h.app.pointerAction, null, 'buttonless re-entry must end a drag whose pointerup was missed');
  assert.equal(h.app.activePointerId, null);
  assert.deepEqual(h.pans, [], 'buttonless re-entry must not ghost-pan');
  assert.doesNotThrow(
    () => h.app.pointerDown(event({ pointerId: 2 })),
    'a fresh pointerdown must be accepted after orphan cleanup',
  );
  assert.equal(h.app.activePointerId, 2);
  h.app.finishPointer();
}

{
  const h = harness('pan');
  h.app.pointerDown(event({ pointerType: 'touch' }));
  h.app.pointerMove(event({ pointerType: 'touch', buttons: 0, clientX: 20, clientY: 25 }));
  assert.deepEqual(h.pans, [[10, 5]], 'touch movement must not rely on mouse button reporting');
  h.app.pointerUp(event({ pointerType: 'touch', buttons: 0, clientX: 20, clientY: 25 }));
}

{
  const h = harness('pan');
  h.app.pointerDown(event());
  h.app.pointerCaptureLost(event({ pointerId: 2 }));
  assert.equal(h.app.pointerAction, 'pan');
  h.app.pointerCaptureLost(event());
  assert.equal(h.app.pointerAction, null);
  assert.equal(h.app.activePointerId, null);
  assert(!h.classes.has('dragging'));
}

function touch(pointerId, clientX, clientY, overrides = {}) {
  return event({ pointerType: 'touch', pointerId, clientX, clientY, ...overrides });
}

function useRealCamera(h) {
  // Exercise the actual screen/world conversion and zoom limits together with
  // the gesture, including a canvas displaced by controls or browser chrome.
  h.app.renderer.canvas = {
    getBoundingClientRect() { return { left: 15, top: 30, width: 300, height: 200 }; },
  };
  for (const name of ['screenToWorld', 'zoomAt', 'panPixels']) {
    h.app.renderer[name] = WebGLRenderer.prototype[name];
  }
}

function assertWorldPoint(renderer, screen, expected, message) {
  const actual = renderer.screenToWorld(...screen);
  closeTo(actual.x, expected.x, `${message}: world x`);
  closeTo(actual.y, expected.y, `${message}: world y`);
}

{
  const h = harness('pan');
  useRealCamera(h);
  h.app.patch = {};
  h.app.controls = { classList: { contains() { return false; } } };
  h.app.elements.aboutDialog = { open: false };
  h.app.elements.rulesDialog = { open: false };
  h.app.simulation.generation = 25;
  h.app.activeDiscovery = 'tracked';
  h.app.discoveryById = new Map([['tracked', {
    view: { mode: 'trajectory', steps: 20, bounds: [-1, -1, 1, 1], padding: 2 },
  }]]);
  h.app.renderer.containState = () => { throw new Error('Manual keyboard pan must retain camera ownership'); };
  h.app.renderer.focusState = h.app.renderer.containState;

  h.app.pointerDown(event());
  assert.strictEqual(documentStub.activeElement, h.app.canvas, 'clicking the canvas must focus its keyboard controls');
  assert.deepEqual(h.focuses, [{ preventScroll: true }], 'canvas focus must not scroll the page');
  h.app.pointerUp(event());
  const originalState = h.app.simulation.state.slice();

  for (const shiftKey of [false, true]) {
    const worldStep = shiftKey ? 12 : 4;
    for (const [key, x, y] of [
      ['ArrowLeft', -worldStep, 0], ['ArrowRight', worldStep, 0],
      ['ArrowUp', 0, worldStep], ['ArrowDown', 0, -worldStep],
    ]) {
      h.app.renderer.camera = { x: 5, y: 7, zoom: 10 };
      h.app.automaticDiscoveryView = true;
      h.app.discoveryViewManaged = true;
      h.app.dirty = false;
      const arrow = event({ key, shiftKey, target: h.app.canvas });
      h.app.keyDown(arrow);
      assert.equal(arrow.prevented, true, 'focused arrows must not scroll the page');
      assert.deepEqual(h.app.renderer.camera, { x: 5 + x, y: 7 + y, zoom: 10 },
        `${key}${shiftKey ? ' with Shift' : ''} must move the viewed area in the named direction`);
      assert.equal(h.app.dirty, true);
      assert.equal(h.app.automaticDiscoveryView, false);
      assert.equal(h.app.discoveryViewManaged, false);
      const moved = { ...h.app.renderer.camera };
      h.app.updateManagedDiscoveryView();
      h.app.resizeViewport();
      assert.deepEqual(h.app.renderer.camera, moved, 'evolution and resize must preserve the keyboard-selected view');
    }
  }
  assert.deepEqual(h.app.simulation.state, originalState, 'keyboard panning must not edit cells');
  assert.equal(h.app.simulation.generation, 25, 'keyboard panning must not advance the automaton');
  assert.equal(h.app.activeDiscovery, 'tracked', 'a camera-only change must retain example attribution');

  function untouched(overrides = {}, activeElement = h.app.canvas, shouldPrevent = false) {
    documentStub.activeElement = activeElement;
    const before = { ...h.app.renderer.camera };
    const arrow = event({ key: 'ArrowRight', target: h.app.canvas, ...overrides });
    h.app.keyDown(arrow);
    assert.deepEqual(h.app.renderer.camera, before, 'out-of-scope or unavailable arrow controls must not pan');
    assert.equal(arrow.prevented, shouldPrevent);
  }
  untouched({}, null);
  untouched({ target: null });
  for (const tagName of ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'DIV']) {
    const target = Object.assign(new HTMLElementStub(), { tagName, isContentEditable: tagName === 'DIV' });
    untouched({ target }, target);
  }
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'isComposing', 'defaultPrevented']) {
    untouched({ [modifier]: true });
  }
  for (const dialog of ['aboutDialog', 'rulesDialog']) {
    h.app.elements[dialog].open = true;
    untouched();
    h.app.elements[dialog].open = false;
  }
  h.app.busyState = true;
  untouched({}, h.app.canvas, true);
  h.app.busyState = false;
  h.app.patch = null;
  untouched({}, h.app.canvas, true);
  h.app.patch = {};
  h.app.simulation = null;
  untouched({}, h.app.canvas, true);
  documentStub.activeElement = null;
}

for (const tool of ['pan', 'paint']) {
  const h = harness(tool);
  useRealCamera(h);
  h.app.automaticDiscoveryView = true;
  h.app.discoveryViewManaged = true;
  const anchor = h.app.renderer.screenToWorld(130, 100);
  h.app.pointerDown(touch(7, 80, 100));
  h.app.pointerDown(touch(8, 180, 100));
  assert.equal(h.app.pointerAction, 'pinch');
  assert.deepEqual(h.painted, [], `${tool}: starting a pinch must not edit a cell`);
  assert(h.captured.has(7) && h.captured.has(8), 'both fingers must be captured');
  assert.equal(h.app.automaticDiscoveryView, true, 'stationary fingers must retain automatic framing');

  h.app.pointerMove(touch(7, 55, 100));
  h.app.pointerMove(touch(8, 205, 100));
  closeTo(h.app.renderer.camera.zoom, 15, 'spreading fingers must zoom in proportion to their distance');
  assertWorldPoint(h.app.renderer, [130, 100], anchor, 'off-centre pinch must keep its world anchor');
  assert.equal(h.app.automaticDiscoveryView, false);
  assert.equal(h.app.discoveryViewManaged, false);

  h.app.pointerMove(touch(7, 79, 118));
  h.app.pointerMove(touch(8, 229, 118));
  closeTo(h.app.renderer.camera.zoom, 15, 'parallel finger movement must retain the final scale');
  assertWorldPoint(h.app.renderer, [154, 118], anchor, 'the world anchor must follow the midpoint');

  h.app.pointerMove(touch(7, 109, 118));
  h.app.pointerMove(touch(8, 199, 118));
  closeTo(h.app.renderer.camera.zoom, 9, 'bringing fingers together must zoom out');
  assertWorldPoint(h.app.renderer, [154, 118], anchor, 'zoom out must preserve the anchor');
  const camera = { ...h.app.renderer.camera };
  h.app.pointerUp(touch(7, 109, 118));
  assert.equal(h.app.pointerAction, 'pan');
  assert.equal(h.app.activePointerId, 8);
  assert.deepEqual(h.app.renderer.camera, camera, 'lifting the first finger must not jump the camera');
  h.app.pointerCaptureLost(touch(7, 109, 118));
  assert.equal(h.app.activePointerId, 8, 'automatic capture loss for the lifted finger must not cancel the survivor');
  h.app.pointerMove(touch(8, 217, 127));
  closeTo(h.app.renderer.camera.x, camera.x - 2, 'remaining finger must resume panning from its own position');
  closeTo(h.app.renderer.camera.y, camera.y + 1, 'remaining finger pan y');
  h.app.pointerUp(touch(8, 217, 127));
  assert.equal(h.app.pointerAction, null);
  assert.equal(h.app.touchPointers.size, 0);
  assert.equal(h.captured.size, 0);
  assert(!h.classes.has('dragging'));
  assert.deepEqual(h.painted, [], `${tool}: navigation and finger release must not paint`);
}

{
  const h = harness('paint');
  h.app.pointerDown(touch(1, 10, 20));
  h.app.pointerMove(touch(1, 12, 21));
  assert.deepEqual(h.painted, [], 'minor finger jitter must not commit a paint stroke before a possible pinch');
  h.app.pointerUp(touch(1, 12, 21));
  assert.deepEqual(h.painted, [[0, 1]], 'a single-finger tap must paint once on release');
  h.app.pointerDown(touch(1, 10, 20));
  h.app.pointerUp(touch(1, 10, 20));
  assert.deepEqual(h.painted, [[0, 1], [0, 0]], 'a fresh touch on a live cell must erase');
  h.app.pointerDown(touch(1, 10, 20));
  h.app.pointerMove(touch(1, 60, 20));
  h.app.pointerUp(touch(1, 60, 20));
  assert.deepEqual(h.painted.slice(2), [[0, 1], [1, 1]], 'touch painting must retain the stroke starting cell and its paint/erase action');
}

{
  const h = harness('paint');
  h.app.pointerDown(touch(1, 10, 20));
  h.app.pointerDown(touch(2, 80, 20));
  h.app.pointerUp(touch(2, 80, 20));
  h.app.pointerCaptureLost(touch(2, 80, 20));
  assert.equal(h.app.activePointerId, 1, 'lifting the second finger first must retain the first contact');
  assert.equal(h.app.pointerAction, 'pan');
  h.app.pointerMove(touch(1, 22, 26));
  assert.deepEqual(h.pans, [[12, 6]], 'the first finger must continue from its own original position');
  h.app.pointerUp(touch(1, 22, 26));
  assert.deepEqual(h.painted, [], 'lifting the second finger must not restore a pending paint tap');
  assert.equal(h.captured.size, 0);
}

for (const end of ['pointerCancel', 'pointerCaptureLost', 'finishPointer']) {
  for (const fingers of [1, 2]) {
    const h = harness('paint');
    h.app.pointerDown(touch(1, 10, 20));
    if (fingers === 2) h.app.pointerDown(touch(2, 70, 20));
    h.app[end](touch(fingers, 70, 20));
    assert.equal(h.app.touchPointers.size, 0, `${end}: all contacts must be cleared`);
    assert.equal(h.app.pointerAction, null);
    assert.equal(h.captured.size, 0);
    assert.deepEqual(h.painted, [], `${end}: cancellation must not commit a pending paint tap`);
    h.app.pointerMove(touch(1, 100, 20));
    h.app.pointerUp(touch(1, 100, 20));
    assert.deepEqual(h.painted, [], 'cancelled contacts must not cause ghost edits');
    h.app.pointerDown(touch(3, 10, 20));
    h.app.pointerUp(touch(3, 10, 20));
    assert.deepEqual(h.painted, [[0, 1]], 'a new gesture must work after cancellation');
  }
}

{
  const h = harness('pan', true);
  useRealCamera(h);
  h.app.pointerDown(touch(1, 80, 100));
  h.app.pointerDown(touch(2, 180, 100));
  h.app.pointerMove(touch(2, 280, 100));
  closeTo(h.app.renderer.camera.zoom, 20, 'pinching must work through window listeners when capture is rejected');
  h.app.pointerDown(touch(3, 150, 180));
  const before = { ...h.app.renderer.camera };
  h.app.pointerMove(touch(3, 150, 200));
  assert.deepEqual(h.app.renderer.camera, before, 'a third finger must not move the chosen pair');
  h.app.pointerUp(touch(1, 80, 100));
  assert.equal(h.app.pointerAction, 'pinch', 'two remaining fingers must continue as a fresh pair');
  assert.deepEqual(h.app.renderer.camera, before, 'switching pairs must not jump the camera');
  h.app.pointerMove(touch(3, 150, 220));
  assert(h.app.renderer.camera.zoom > before.zoom);
  h.app.finishPointer();
}

{
  const h = harness('pan');
  useRealCamera(h);
  h.app.pointerDown(touch(1, 100, 100));
  h.app.pointerDown(touch(2, 100, 100));
  h.app.pointerMove(touch(2, 101, 100));
  h.app.pointerMove(touch(2, 100000, 100));
  closeTo(h.app.renderer.camera.zoom, 500, 'pinch must respect the maximum zoom');
  h.app.pointerMove(touch(2, 101, 100));
  closeTo(h.app.renderer.camera.zoom, 0.02, 'pinch must respect the minimum zoom');
  h.app.pointerMove(touch(2, 100, 100));
  assert(Object.values(h.app.renderer.camera).every(Number.isFinite), 'coincident fingers must not produce an invalid camera');
  h.app.finishPointer();
}

{
  const h = harness('paint');
  h.app.busy = {};
  h.app.busyTitle = {};
  h.app.busyDetail = {};
  for (const id of ['stepButton', 'randomizeButton', 'applySeedButton', 'clearButton', 'runButton', 'viewportRunButton',
    'saveSnapshotButton', 'loadSnapshotButton', 'loadDiscoveryButton', 'loadRunDiscoveryButton']) {
    h.app.elements[id] = {};
  }
  h.app.pointerDown(touch(1, 10, 20));
  h.app.pointerDown(touch(2, 70, 20));
  h.app.setBusy(true);
  assert.equal(h.app.touchPointers.size, 0, 'rebuilding must discard every contact on the old board');
  assert.equal(h.captured.size, 0);
  h.app.pointerUp(touch(1, 10, 20));
  h.app.pointerDown(touch(3, 10, 20));
  assert.deepEqual(h.painted, [], 'busy or stale touches must not paint');
  assert.equal(h.app.activePointerId, null);
}

console.log('fresh Randomise and seeded replay, entropy fallback, focused arrow panning, example provenance, viewport bounds, discovery camera policy, manual overrides, pinch zoom, touch painting and pointer interaction checks passed');
