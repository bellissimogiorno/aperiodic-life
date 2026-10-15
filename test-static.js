'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const { hasRawEndTag } = require('./build-standalone.js');

const root = __dirname;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

childProcess.execFileSync(process.execPath, ['build-standalone.js', '--check'], {
  cwd: root,
  stdio: 'pipe',
});

for (const source of ['</script>', '</SCRIPT>', '</script >', '</script\n>', '</script/>']) {
  assert(hasRawEndTag(source, 'script'), `raw script end tag was not rejected: ${JSON.stringify(source)}`);
}
for (const source of ['</style>', '</STYLE >', '</style\t>']) {
  assert(hasRawEndTag(source, 'style'), `raw style end tag was not rejected: ${JSON.stringify(source)}`);
}
assert(!hasRawEndTag('</scripture>', 'script'));
assert(!hasRawEndTag('<\\/script>', 'script'));

const standalone = read('aperiodic-life-standalone.html');
const index = read('index.html');
const core = read('core.js');
const discoveries = read('discoveries.js');
const app = read('app.js');

const embeddedStyles = [...standalone.matchAll(/  <style>\n([\s\S]*?)\n  <\/style>/g)].map((match) => match[1]);
const embeddedScripts = [...standalone.matchAll(/  <script>\n([\s\S]*?)\n  <\/script>/g)].map((match) => match[1]);
assert.deepStrictEqual(embeddedStyles, [read('styles.css').replace(/\s+$/, '')], 'standalone stylesheet bytes drifted');
assert.deepStrictEqual(
  embeddedScripts,
  [core, discoveries, app].map((source) => source.replace(/\s+$/, '')),
  'standalone JavaScript bytes drifted during embedding',
);
assert(standalone.includes("symbol === '$'"), 'standalone lost the RLE row separator literal');

assert(standalone.startsWith('<!doctype html>\n<!--\nAperiodic Life standalone build.'));
assert(standalone.includes('MIT License'));
assert(standalone.includes('Copyright (c) 2026 Aperiodic Life contributors'));
assert(standalone.includes('BSD 3-Clause License'));
assert(standalone.includes('Copyright (c) 2023, Craig S. Kaplan'));
assert(!/href="styles\.css"|src="(?:core|discoveries|app)\.js"/.test(standalone));
assert(!/<script\s+[^>]*src=/i.test(standalone));
assert(!/<link\s+[^>]*href=["']https?:/i.test(standalone));
assert(!/<script\s+[^>]*src=["']https?:/i.test(standalone));
assert(!/\bfetch\s*\(|\bXMLHttpRequest\b/.test(core + discoveries + app));
assert(index.includes('<title>Aperiodic Life'));
for (const tiling of ['hat', 'penrose', 'square', 'hex']) {
  assert(index.includes(`value="${tiling}"`), `index does not expose ${tiling}`);
  assert(core.includes(`${tiling}: Object.freeze([`), `core has no patch menu for ${tiling}`);
}
assert(index.includes('id="penroseSeedSelect"'));
assert(index.includes('id="typeCheckbox"'));
assert(index.includes('id="discoverySelect"'));
assert(index.includes('id="changedStat"'));
assert(index.includes('id="cycleStat"'));
assert(core.includes('root.AperiodicLifeCore = api'));
assert(standalone.includes('AperiodicLifeDiscoveries'));
assert(standalone.includes('HighLife replicator'));
assert(standalone.includes('Penrose Conway p5'));
assert(standalone.includes('Penrose compact traveller'));
assert(standalone.includes('Penrose B24 launcher traveller'));
assert(standalone.includes('Hexagonal B2/S35 p5 traveller'));
assert(standalone.includes('Hexagonal B245/S3 p10 traveller'));
assert(standalone.includes('Hexagonal B235/S146 four-state launcher'));
assert(standalone.includes('Hexagonal B235/S134 five-state launcher'));
assert(standalone.includes('Penrose B2/S4 survival launcher'));
assert(standalone.includes('Penrose B26/S birth launcher'));
assert(standalone.includes('Penrose B27/S4 dual-clause launcher'));
assert(standalone.includes('Hat B23/S p20'));
assert(standalone.includes('Hat Conway p26'));

const requiredIds = [
  'tilingSelect', 'depthSelect', 'penroseSeedField', 'penroseSeedSelect',
  'neighborhoodSelect', 'neighborhoodHelp', 'neighborhoodInfoButton', 'borderInput', 'presetSelect',
  'ruleInput', 'ruleInfoButton', 'rulesDialog', 'generationsInput', 'discoverySelect', 'loadDiscoveryButton', 'loadRunDiscoveryButton',
  'discoveryDescription', 'discoveryProvenance', 'densityInput', 'seedInput', 'speedInput',
  'typeCheckbox', 'tilingStat', 'changedStat', 'cycleStat', 'tileTypesStat',
  'lifeCanvas',
];
for (const id of requiredIds) {
  assert(index.includes(`id="${id}"`), `index.html is missing #${id}`);
  assert(app.includes(`'${id}'`) || id === 'lifeCanvas', `app.js does not collect #${id}`);
}

const catalogue = require('./discoveries.js');
assert.equal(catalogue.length, 89, 'unexpected curated discovery count');
const provenance = require('./research/fixtures/catalogue-provenance.json');
assert.deepStrictEqual(catalogue.map((entry) => ({ id: entry.id, ...entry.provenance })), provenance,
  'offline credits must match the canonical records for every example');
for (const entry of catalogue) {
  assert(Object.isFrozen(entry.provenance), `mutable credit: ${entry.id}`);
  assert(Object.isFrozen(entry.provenance.sources), `mutable sources: ${entry.id}`);
  assert(entry.provenance.sources.every(Object.isFrozen), `mutable source link: ${entry.id}`);
  assert(Object.isFrozen(entry.provenance.evidence), `mutable evidence: ${entry.id}`);
}
for (const [id, title] of [
  ['hex-b245s3-p10-traveller', 'Hexagonal B245/S3 p10 traveller'],
  ['hex-b235s146-c4-launcher-traveller', 'Hexagonal B235/S146 four-state launcher'],
  ['hex-b235s134-c5-launcher-traveller', 'Hexagonal B235/S134 five-state launcher'],
  ['penrose-b2s4-c5-survival-launcher', 'Penrose B2/S4 survival launcher'],
  ['penrose-b26s-c4-birth-launcher', 'Penrose B26/S birth launcher'],
  ['penrose-b27s4-c4-dual-clause-launcher', 'Penrose B27/S4 dual-clause launcher'],
]) {
  const discovery = catalogue.find((item) => item.id === id);
  assert(discovery, `catalogue is missing ${id}`);
  assert.equal(discovery.title, title, `${id} title drifted`);
}
assert(index.includes('Load &amp; run'));
assert(index.includes('<option value="pan" selected>Pan view</option>'), 'pan must be the default pointer tool');
assert(!index.includes('<option value="paint" selected>'), 'paint must remain an explicit pointer-tool choice');
assert(index.includes('Drag to pan') && index.includes('Click canvas for arrow keys'));
assert(/<canvas[^>]*id="lifeCanvas"[^>]*tabindex="0"/.test(index), 'canvas must be keyboard focusable');
assert(index.includes('aria-describedby="canvasKeyboardHelp"') && index.includes('id="canvasKeyboardHelp"'),
  'canvas keyboard instructions must be accessible');
assert(index.includes('aria-labelledby="rulesDialogTitle"'), 'rule help dialog must have an accessible name');
assert.equal(
  (index.match(/aria-haspopup="dialog" aria-controls="rulesDialog"/g) || []).length,
  2,
  'both rule help triggers must expose their dialog relationship',
);
assert(index.includes('every cell reads the same old generation'), 'rule help must explain synchronous updates');
assert(index.includes('Cell states (total)'), 'the state-count label must say that dead and refractory states are included');
assert(index.includes('<dt>Live (state 1)</dt>'), 'the live-cell statistic must identify the counted state');
assert(index.includes('States 2 and 3 are visible refractory cells but do not count as live neighbours'), 'rule help must decode the traveller rule');
assert(index.includes('each additional ring locks cells one more neighbour step inward'), 'rule help must define finite dead-border rings');
assert(app.includes("window.addEventListener('pointermove'"), 'drag continuation must survive leaving the canvas');
assert(app.includes("window.addEventListener('blur'"), 'window blur must clear an orphaned drag');
assert(app.includes("addEventListener('lostpointercapture'"), 'lost pointer capture must clear drag state');
assert(app.includes("window.addEventListener('resize', () => this.resizeViewport())"), 'managed discovery views must adapt to viewport resize');

console.log(JSON.stringify({
  standaloneBytes: Buffer.byteLength(standalone),
  tilings: ['square', 'hex', 'hat', 'penrose'],
  embeddedRuntimeAssets: true,
  curatedDiscoveries: catalogue.length,
  requiredNotices: ['MIT', 'BSD-3-Clause'],
  externalRuntimeRequests: 0,
}));
