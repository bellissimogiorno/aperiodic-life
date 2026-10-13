'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { replay, TableReference, V } = require('./replay.js');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'hat-a-six-launcher-evidence.json'), 'utf8'));
const verified = replay(fixture.entry);
assert.equal(verified.result.trajectorySha256, fixture.trajectorySha256);
assert.equal(verified.result.minimumBoundaryDistance, 7);
const { graph, patch, phases } = verified;
const split = fixture.split;
assert.deepEqual(fixture.packets.flatMap(p => p.initial).sort((a, b) => a[0] - b[0]), phases[split]);
const engines = fixture.packets.map(p => new TableReference(graph, fixture.entry.table, p.initial));
const traces = fixture.packets.map(p => [p.initial]);
for (let generation = split + 1; generation <= fixture.entry.horizon; generation++) {
  engines.forEach((engine, i) => { engine.step(); traces[i].push(engine.entries()); });
  const union = traces.flatMap(t => t.at(-1)).sort((a, b) => a[0] - b[0]);
  assert.equal(new Set(union.map(([cell]) => cell)).size, union.length);
  assert.deepEqual(union, phases[generation], `Emitted bodies interact at ${generation}`);
}
const records = [];
fixture.packets.forEach((packet, i) => {
  const claim = packet.translatedReturn;
  const proof = V.certifyIsometry(patch, graph, traces[i][claim.from - split], patch, graph,
    traces[i][claim.to - split], claim.transform, 3);
  delete proof.mapping;
  assert.deepEqual({ from: claim.from, to: claim.to, ...proof }, claim);
  const metrics = traces[i].map(cells => V.measure(patch, graph, cells));
  assert(metrics.every(m => m.active > 0 && m.components === 1));
  records.push({ maxActive: Math.max(...metrics.map(m => m.active)), maxRadius: Math.max(...metrics.map(m => m.radius)),
    translatedFrom: claim.from, translatedTo: claim.to });
});
assert.equal(records.length, 6);
console.log(JSON.stringify({ passed: true, rule: 'Published Edmond Hat A', completeReplayThrough: fixture.entry.horizon,
  independentBodies: 6, splitGeneration: split, allSixHaveRadius3PolygonReturns: true, minimumBoundaryDistance: 7,
  bodies: records, scope: 'A finite six-body launcher under a published rule. The seed is package-found, historical priority unestablished; this is not an immortal-motion or stationary-gun proof.' }, null, 2));
