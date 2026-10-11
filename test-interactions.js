'use strict';

// Dependency-free unit checks for viewport calculations, discovery camera
// policy, and the pointer state machine. The production file intentionally
// exposes no testing global, so this test injects one just before startup
// while evaluating the otherwise unmodified source in a VM.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.join(__dirname, 'app.js');
const marker = "  window.addEventListener('DOMContentLoaded', () => {";
const source = fs.readFileSync(sourcePath, 'utf8');
assert(source.includes(marker), 'app startup marker changed');

const instrumented = source.replace(
  marker,
  "  window.__interactionTestClasses = { AperiodicLifeApp, WebGLRenderer };\n\n" + marker,
);
const windowStub = {
  AperiodicLifeCore: {},
  AperiodicLifeDiscoveries: [],
  addEventListener() {},
};
class HTMLElementStub {}
vm.runInNewContext(instrumented, { window: windowStub, HTMLElement: HTMLElementStub });
const { AperiodicLifeApp, WebGLRenderer } = windowStub.__interactionTestClasses;

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
    busy: {}, busyTitle: {}, busyDetail: {},
    updateStats() {},
    elements: {
      runButton, viewportRunButton,
      stepButton: {}, randomizeButton: {}, clearButton: {},
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
  app.setRunning(true);
  assert.equal(app.running, false, 'busy simulation must not start from either control');
  assert.equal(viewportRunButton.textContent, 'Play');
  app.setBusy(false);
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
  return { app, classes, captured, released, pans, painted, fits, zooms, state };
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

console.log('viewport bounds, discovery camera policy, manual overrides, and pointer interaction checks passed');
