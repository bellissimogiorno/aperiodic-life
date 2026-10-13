'use strict';

// Run with Node.js; no third-party packages. The optional --record flag is for
// deliberately rebuilding expected evidence after reviewing a geometry change.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { replay, TableReference, transition, V } = require('./replay.js');
const filename = path.join(__dirname, 'hat-relay-evidence.json');
const fixture = JSON.parse(fs.readFileSync(filename, 'utf8'));
const cache = new Map();

function projectionCheck(graph, table, phases, start) {
  const reference = new TableReference(graph, table, phases[start]);
  for (let t = start; t < phases.length - 1; t++) reference.step();
  const contexts = [...reference.contexts.values()];
  const matches = [];
  let mapsChecked = 0;
  for (const [name, published] of Object.entries(V.PUBLISHED_TABLES)) {
    function visit(map) {
      if (map.length < table.states) {
        for (let state = 0; state < published.states; state++) visit([...map, state]);
        return;
      }
      if (map.every(state => state === 0)) return;
      mapsChecked++;
      for (const context of contexts) {
        const counts = Array(published.states).fill(0);
        context.counts.forEach((count, state) => { counts[map[state]] += count; });
        if (transition(published, map[context.own], counts) !== map[context.after]) return;
      }
      matches.push({ name, stateMap: map });
    }
    visit([0]);
  }
  return { from: start, through: phases.length - 1, distinctContexts: contexts.length, mapsChecked, matches };
}

function verifyCase(entry) {
  if (!cache.has(entry.depth)) cache.set(entry.depth, V.Core.buildPatch('hat', entry.depth));
  const verified = replay({ ...entry, table: fixture.reducedTable }, { patch: cache.get(entry.depth) });
  const original = new TableReference(verified.graph, fixture.originalTable, entry.cellStates);
  for (let t = 0; t < verified.phases.length; t++) {
    assert.deepEqual(original.entries(), verified.phases[t], `Seven-row reduction mismatch at ${t}`);
    if (t < verified.phases.length - 1) original.step();
  }
  const result = { ...verified.result };
  delete result.publishedContextComparison;
  result.matureProjection = projectionCheck(verified.graph, fixture.reducedTable, verified.phases, 60);
  assert.equal(result.matureProjection.matches.length, 0, 'A state projection matches a published rule');
  result.originalSevenRowsMatchEveryState = true;
  return { ...verified, result };
}

function main() {
  const records = [];
  const cases = new Map();
  for (const entry of fixture.cases) {
    if (entry.depth > 5 && !process.argv.includes('--long')) continue;
    const verified = verifyCase(entry);
    const result = verified.result;
    if (process.argv.includes('--record')) entry.expected = result;
    else assert.deepEqual(result, entry.expected, `${entry.id}: evidence changed`);
    records.push({ id: entry.id, through: result.verifiedThrough, boundary: result.minimumBoundaryDistance,
      maxActive: result.maximumActive, maxRadius: result.maximumRadius, displacement: result.centroidDisplacement,
      projections: result.matureProjection.mapsChecked, matchingProjections: result.matureProjection.matches.length });
    cases.set(entry.id, verified);
  }
  let proof;
  if (process.argv.includes('--long')) {
    const source = cases.get(fixture.transplant.source);
    const target = cases.get(fixture.transplant.target);
    proof = V.certifyIsometry(source.patch, source.graph, source.phases[0], target.patch, target.graph,
      target.phases[0], fixture.transplant.transform, 3);
    delete proof.mapping;
  }
  // A nearby rule reduction is a positive control for the identity detector:
  // its mature trajectory really does match the published Spectre rule.
  const control = JSON.parse(fs.readFileSync(path.join(__dirname, 'hat-relay-reduction-control.json'), 'utf8'));
  const controlReplay = replay(control.entry, { patch: cache.get(5) });
  assert.equal(controlReplay.result.trajectorySha256, control.result.trajectorySha256);
  const controlProjection = projectionCheck(controlReplay.graph, control.entry.table, controlReplay.phases, 60);
  assert.deepEqual(controlProjection, control.matureProjection);
  assert.deepEqual(controlProjection.matches, [{ name: 'spectre', stateMap: [0, 3, 1] }]);
  if (process.argv.includes('--record')) {
    if (proof) fixture.transplant.expected = proof;
    fs.writeFileSync(filename, JSON.stringify(fixture, null, 2) + '\n');
  } else if (proof) assert.deepEqual(proof, fixture.transplant.expected);
  console.log(JSON.stringify({ passed: true, cases: records,
    spectreReductionPositiveControl: true,
    scope: 'Finite full-state replay, polygon/dead-halo returns and exact local state-projection exclusions; no historical-priority or immortality claim.' }, null, 2));
}
if (require.main === module) main();
module.exports = { projectionCheck, verifyCase };
