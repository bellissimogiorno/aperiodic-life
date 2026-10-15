'use strict';

// Exercise the production startup element collector and event wiring against
// the complete HTML, without requiring WebGL or a browser installation.
// Native DOM/layout/rendering behavior remains covered by test-browser.js.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const marker = "  window.addEventListener('DOMContentLoaded', () => {";
const version = read('VERSION').trim();
const index = read('index.html');
const standalone = read('aperiodic-life-standalone.html');
const appSource = read('app.js');

function elementsFromHTML(html) {
  const markup = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');
  const elements = new Map();
  for (const match of markup.matchAll(/\bid="([^"]+)"/g)) {
    const id = match[1];
    assert(!elements.has(id), `duplicate HTML element ID #${id}`);
    elements.set(id, {
      id,
      listeners: new Map(),
      addEventListener(type, callback) {
        const callbacks = this.listeners.get(type) || [];
        callbacks.push(callback);
        this.listeners.set(type, callbacks);
      },
    });
  }
  return elements;
}

function interfaceHarness(source, html) {
  assert(source.includes(marker), 'application startup marker changed');
  const elements = elementsFromHTML(html);
  const windowStub = {
    AperiodicLifeCore: {},
    AperiodicLifeDiscoveries: [],
    addEventListener() {},
  };
  const documentStub = { getElementById: (id) => elements.get(id) || null };
  vm.runInNewContext(source.replace(marker,
    '  window.__interfaceTests = { AperiodicLifeApp };\n' + marker),
  { window: windowStub, document: documentStub });
  const app = Object.create(windowStub.__interfaceTests.AperiodicLifeApp.prototype);
  return { app, elements };
}

function checkInterface(source, html, label) {
  const { app, elements } = interfaceHarness(source, html);
  // This is the actual method called by the constructor. Its required-ID list
  // is not duplicated here, so adding or renaming any control is checked.
  app.elements = app.collectElements();
  app.canvas = elements.get('lifeCanvas');
  app.bindEvents();
  assert(app.elements.applySeedButton, `${label}: seed replay control is missing`);
  assert(!elements.has('newSeedButton'), `${label}: obsolete seed control remains`);

  const calls = [];
  app.randomize = () => calls.push('randomise');
  app.applySeed = () => calls.push('apply seed');
  for (const [id, type, event] of [
    ['randomizeButton', 'click', {}],
    ['applySeedButton', 'click', {}],
    ['seedInput', 'keydown', { key: 'Enter', preventDefault() { calls.push('prevent default'); } }],
  ]) {
    const callbacks = elements.get(id).listeners.get(type) || [];
    assert.strictEqual(callbacks.length, 1, `${label}: ${id} must have exactly one ${type} listener`);
    callbacks[0](event);
  }
  assert.deepStrictEqual(calls, ['randomise', 'apply seed', 'prevent default', 'apply seed'],
    `${label}: seed controls must connect to their correct actions`);

  const seedButton = elements.get('applySeedButton');
  elements.delete('applySeedButton');
  assert.throws(() => app.collectElements(), /Required interface element #applySeedButton is missing/,
    `${label}: missing controls must be detected before binding events`);
  elements.set('applySeedButton', seedButton);
  return Object.keys(app.elements).length;
}

const sourceCount = checkInterface(appSource, index, 'expanded source');
const inlineScripts = [...standalone.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)]
  .map((match) => match[1]);
const standaloneApps = inlineScripts.filter((source) => source.includes(marker));
assert.strictEqual(standaloneApps.length, 1, 'standalone must contain exactly one application startup');
const standaloneCount = checkInterface(standaloneApps[0], standalone, 'standalone');
assert.strictEqual(standaloneCount, sourceCount);

// Reproduce the reported diagnostic: old JavaScript requests the removed New
// button from current markup. This demonstrates why mixed assets must not be
// silently accepted or aliased to a button with different behavior.
const staleSource = appSource.replace("'applySeedButton'", "'newSeedButton'");
assert.notStrictEqual(staleSource, appSource);
const stale = interfaceHarness(staleSource, index);
assert.throws(() => stale.app.collectElements(), /Required interface element #newSeedButton is missing/);

// Each expanded runtime URL changes with a release. A browser caching an old
// unversioned app.js must therefore request a new resource for the new HTML.
const runtimeURLs = [...index.matchAll(/<(?:link|script)\b[^>]*\b(?:href|src)="([^"]+)"[^>]*>/gi)]
  .map((match) => match[1]);
for (const name of ['styles.css', 'core.js', 'discoveries.js', 'app.js']) {
  const matches = runtimeURLs.filter((url) => url.split('?')[0] === name);
  assert.deepStrictEqual(matches, [`${name}?v=${version}`],
    `${name} must have exactly one runtime URL matching the release version`);
}
assert(!/<script\b[^>]*\bsrc=/i.test(standalone), 'standalone cannot depend on separately cached JavaScript');

// Optionally check the handover convenience HTML after assembly as well.
const additionalEntrypoints = [];
for (const filename of process.argv.slice(2)) {
  const html = fs.readFileSync(filename, 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)]
    .map((match) => match[1]).filter((source) => source.includes(marker));
  assert.strictEqual(scripts.length, 1, `${filename}: expected one application startup`);
  assert.strictEqual(checkInterface(scripts[0], html, filename), sourceCount);
  additionalEntrypoints.push(path.basename(filename));
}

console.log(JSON.stringify({
  startupElementsPerEntrypoint: sourceCount,
  entrypoints: ['expanded source', 'standalone', ...additionalEntrypoints],
  seedEventWiring: 'passed',
  missingControlDetection: 'passed',
  staleJavaScriptDiagnostic: 'reproduced',
  versionedRuntimeAssets: version,
}));
