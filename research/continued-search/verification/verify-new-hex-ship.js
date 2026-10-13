'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { next } = require('./verify-puffer.js');
const { repository } = require('./replay.js');
const H = require(path.join(repository, 'research/hex-reference.js'));
const catalogue = require(path.join(repository, 'discoveries.js'));
const entry = JSON.parse(fs.readFileSync(path.join(__dirname, 'new-hex-ship-evidence.json'), 'utf8'));
const key = (q, r) => `${q},${r}`;
const asState = cells => new Map(cells.map(([q, r, value]) => [key(q, r), value]));
const coordinates = state => [...state].map(([cell, value]) => [...cell.split(',').map(Number), value])
  .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
function shape(cells) {
  const q = Math.min(...cells.map(c => c[0])), r = Math.min(...cells.map(c => c[1]));
  return { origin: [q, r], key: JSON.stringify(cells.map(([x, y, value]) => [x - q, y - r, value])) };
}
function dependencyGroups(cells) {
  const remaining = new Set(cells.map((_, i) => i));
  const groups = [];
  while (remaining.size) {
    const queue = [remaining.values().next().value]; remaining.delete(queue[0]);
    for (let i = 0; i < queue.length; i++) for (const j of [...remaining]) {
      const dq = cells[j][0] - cells[queue[i]][0], dr = cells[j][1] - cells[queue[i]][1];
      if (Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) <= 2) { remaining.delete(j); queue.push(j); }
    }
    groups.push(queue.map(i => cells[i]));
  }
  return groups;
}
function main() {
  const initial = asState(entry.coordinateStates), normal = shape(coordinates(initial));
  let current = initial, reduced = initial;
  const populations = [], active = [], components = [], phases = [];
  for (let generation = 0; generation <= entry.period; generation++) {
    const cells = coordinates(current), signature = shape(cells);
    assert.deepEqual(cells, coordinates(reduced), 'Inactive B5 changes the recurrent orbit');
    if (generation > 0 && generation < entry.period) assert.notEqual(signature.key, normal.key, 'Smaller translated period exists');
    if (generation === entry.period) {
      assert.equal(signature.key, normal.key);
      assert.deepEqual(signature.origin.map((n, i) => n - normal.origin[i]), entry.translation);
    } else {
      populations.push(cells.filter(c => c[2] === 1).length); active.push(cells.length);
      phases.push(current);
      components.push(dependencyGroups(cells).length);
      current = next(current, entry.rule, entry.generations);
      reduced = next(reduced, 'B234/S24', entry.generations);
    }
  }
  assert.deepEqual(populations, entry.evidence.populations);
  assert.deepEqual(active, entry.evidence.supportSizes);
  let launch = asState(entry.initial);
  for (let generation = 0; generation < entry.transient; generation++) launch = next(launch, entry.rule, entry.generations);
  assert.equal(shape(coordinates(launch)).key, normal.key, 'Seven-cell launch does not reach the recorded orbit');
  const separationTests = [];
  for (let phase = 0; phase < phases.length; phase++) {
    const groups = dependencyGroups(coordinates(phases[phase]));
    if (groups.length <= 1) continue;
    let pieces = groups.map(asState), whole = phases[phase], failedAfter = null;
    const extinctAt = groups.map(() => null);
    for (let step = 1; step <= entry.period; step++) {
      pieces = pieces.map(piece => next(piece, entry.rule, entry.generations));
      pieces.forEach((piece, i) => { if (!piece.size && extinctAt[i] === null) extinctAt[i] = step; });
      whole = next(whole, entry.rule, entry.generations);
      const combined = coordinates(new Map(pieces.flatMap(piece => [...piece])));
      const overlap = new Set(pieces.flatMap(piece => [...piece.keys()])).size !== pieces.reduce((sum, p) => sum + p.size, 0);
      if (overlap || JSON.stringify(combined) !== JSON.stringify(coordinates(whole))) { failedAfter = step; break; }
    }
    const persistent = pieces.filter(piece => piece.size).length;
    if (failedAfter === null && persistent > 1) {
      const piecesEvidence = groups.map((coordinateStates, i) => {
        const orbit = H.findOrbit({ ...entry, coordinateStates }, { maxSteps: 500 });
        return { initial: coordinateStates, afterPeriod: coordinates(pieces[i]), orbit: H.serialisableOrbit(orbit) };
      });
      fs.writeFileSync(path.join(__dirname, 'p48-decomposition.json'), JSON.stringify({ phase, pieces: piecesEvidence }, null, 2) + '\n');
      assert.fail(`Independent convoy at phase${phase}, ${persistent} persistent pieces`);
    }
    separationTests.push({ phase, groups: groups.length, failsIndependentEvolutionAfter: failedAfter, persistentPiecesAfterPeriod: persistent, extinctAt });
  }
  // Orbit identity comparison against the frozen earlier catalogue is additional
  // to the independently implemented recurrence above. Ignore this new entry if
  // it has already been integrated into the live catalogue.
  const ours = H.findOrbit(entry, { maxSteps: entry.period });
  const matches = [];
  for (const old of catalogue.filter(e => e.tiling === 'hex' && e.generations === entry.generations && e.coordinateStates && e.expectedPeriod === entry.period)) {
    if (/b2345s24.*p48/.test(old.id)) continue;
    const orbit = H.findOrbit(old, { maxSteps: entry.period });
    const match = H.equivalentOrbits(ours, orbit);
    if (match) matches.push({ id: old.id, match });
  }
  assert.equal(matches.length, 0, 'Already represented by a catalogue orbit');
  const result = { passed: true, rule: entry.rule, states: entry.generations, minimalTranslatedPeriod: entry.period,
    translation: entry.translation, sevenLiveCellLaunchTransient: entry.transient,
    liveRange: [Math.min(...populations), Math.max(...populations)], activeRange: [Math.min(...active), Math.max(...active)],
    maximumDependencyComponents: Math.max(...components), recurrentEffectiveRule: 'B234/S24',
    testedSpatialPartitions: separationTests.length,
    independentPartitionsWithOnlyOnePersistentPiece: separationTests.filter(x => x.failsIndependentEvolutionAfter === null).length,
    maximumDetachedSparkLifetime: Math.max(...separationTests.flatMap(x => x.extinctAt.filter(n => n !== null))),
    matchingEarlierCatalogueOrbits: matches,
    scope: 'Exact full-state recurrence proves an unbounded hexagonal spaceship. Each spatial dependency partition has only one persistent body; detached fragments die, so these splits are sparks rather than a convoy. This is not a general indecomposability theorem. Historical priority is unestablished.' };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
if (require.main === module) main();
module.exports = { main };
