'use strict';

// Candidate verification, separate from each miner. No release files are edited.
// Input is an object with tiling/depth/neighborhood, rule or table, generations,
// cellStates, horizon; optional checkpoints, expectedFinal, claimedReturns.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const repository = path.resolve(__dirname, '../../..');
const V = require(path.join(repository, 'research/aperiodic-reference.js'));
const { SparseAutomaton } = require(path.join(repository, 'research/lib/sparse-automaton.js'));

function transition(table, own, counts) {
  for (const row of table.rows) {
    if (row.state !== undefined && row.state !== own) continue;
    if (!Object.entries(row.atLeast || {}).every(([state, n]) => counts[state] >= n)) continue;
    if (!Object.entries(row.atMost || {}).every(([state, n]) => counts[state] <= n)) continue;
    if (!Object.entries(row.equal || {}).every(([state, n]) => counts[state] === n)) continue;
    return row.next;
  }
  return table.default;
}

class TableReference {
  constructor(graph, table, cells) {
    assert.equal(table.default, 0);
    assert(Number.isInteger(table.states) && table.states >= 2);
    this.graph = graph;
    this.table = table;
    this.state = new Map(cells);
    this.contexts = new Map();
    assert.equal(this.state.size, cells.length);
    for (const [cell, value] of cells) {
      assert(Number.isInteger(cell) && cell >= 0 && cell < graph.degree.length);
      assert(Number.isInteger(value) && value > 0 && value < table.states);
    }
    for (let degree = 0; degree <= graph.maxDegree; degree++) {
      const counts = Array(table.states).fill(0);
      counts[0] = degree;
      assert.equal(transition(table, 0, counts), 0, 'Non-quiescent background');
    }
  }
  entries() { return [...this.state].sort((a, b) => a[0] - b[0]); }
  step() {
    const candidates = new Set(this.state.keys());
    const graph = this.graph;
    for (const cell of this.state.keys()) {
      for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) candidates.add(graph.neighbors[k]);
    }
    const next = new Map();
    for (const cell of candidates) {
      const counts = Array(this.table.states).fill(0);
      for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) {
        counts[this.state.get(graph.neighbors[k]) || 0]++;
      }
      assert.equal(counts.reduce((a, b) => a + b, 0), graph.degree[cell]);
      const own = this.state.get(cell) || 0;
      const after = transition(this.table, own, counts);
      assert(Number.isInteger(after) && after >= 0 && after < this.table.states);
      const context = [own, ...counts, after];
      const key = context.join(',');
      if (!this.contexts.has(key)) this.contexts.set(key, { own, counts, after, uses: 0 });
      this.contexts.get(key).uses++;
      if (after) next.set(cell, after);
    }
    this.state = next;
  }
}

function labelMaps(sourceStates, targetStates) {
  if (sourceStates > targetStates) return [];
  const output = [];
  function visit(map) {
    if (map.length === sourceStates) { output.push(map); return; }
    for (let value = 1; value < targetStates; value++) if (!map.includes(value)) visit([...map, value]);
  }
  visit([0]);
  return output;
}

function comparePublishedContexts(contexts, states) {
  const output = [];
  for (const [name, table] of Object.entries(V.PUBLISHED_TABLES)) {
    for (const map of labelMaps(states, table.states)) {
      let mismatches = 0, firstMismatch = null;
      for (const context of contexts) {
        const counts = Array(table.states).fill(0);
        context.counts.forEach((value, state) => { counts[map[state]] += value; });
        const expected = transition(table, map[context.own], counts);
        if (expected !== map[context.after]) {
          mismatches++;
          firstMismatch ||= { ...context, mappedNext: map[context.after], publishedNext: expected };
        }
      }
      output.push({ name, stateMap: map, distinctContextMismatches: mismatches, firstMismatch });
    }
  }
  return output.sort((a, b) => a.distinctContextMismatches - b.distinctContextMismatches);
}

function sorted(cells) { return cells.map(pair => pair.slice()).sort((a, b) => a[0] - b[0]); }

function replay(entry, options = {}) {
  const patch = options.patch || V.Core.buildPatch(entry.tiling, entry.depth, { seed: entry.penroseSeed });
  const graph = entry.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const initial = sorted(entry.cellStates);
  const table = entry.table || (entry.referenceTable ? V.PUBLISHED_TABLES[entry.referenceTable] : null);
  const states = table ? table.states : entry.generations;
  const reference = table ? new TableReference(graph, table, initial)
    : new V.ReferenceGraph(graph, entry.rule, states, initial);
  // Custom tables absent from the app are checked against saved miner states.
  // B/S and named published presets also get a separate production-engine replay.
  const production = entry.rule ? new SparseAutomaton(patch, graph, entry.rule, states) : null;
  if (production) production.initialize(initial);
  const horizon = entry.horizon ?? 1000;
  const phases = [], metrics = [], visits = new Set(), seen = new Map();
  const trajectoryHash = crypto.createHash('sha256');
  let reason = 'horizon', absoluteCycle = null;
  const checkpoints = new Map((entry.checkpoints || []).map(point => [point.generation, sorted(point.cellStates)]));
  for (let generation = 0; generation <= horizon; generation++) {
    const cells = reference.entries();
    if (production) assert.deepEqual(production.entries(), cells, `Production mismatch at ${generation}`);
    if (checkpoints.has(generation)) assert.deepEqual(cells, checkpoints.get(generation), `Miner checkpoint mismatch at ${generation}`);
    const text = JSON.stringify(cells);
    trajectoryHash.update(text + '\n');
    const metric = V.measure(patch, graph, cells);
    phases.push(cells); metrics.push(metric);
    cells.forEach(([cell]) => visits.add(cell));
    if (!cells.length) { reason = 'extinction'; break; }
    if (metric.boundaryDistance < (entry.stopBoundaryDistance ?? 4)) { reason = 'boundary-buffer'; break; }
    if (metric.active > (entry.maxActive ?? 3000)) { reason = 'population-cap'; break; }
    if (metric.radius > (entry.maxRadius ?? Infinity)) { reason = 'radius-cap'; break; }
    if (seen.has(text) && !absoluteCycle) absoluteCycle = { from: seen.get(text), to: generation, period: generation - seen.get(text) };
    else if (!seen.has(text)) seen.set(text, generation);
    if (generation < horizon) { reference.step(); if (production) production.step(); }
  }
  if (entry.expectedFinal) assert.deepEqual(phases.at(-1), sorted(entry.expectedFinal), 'Miner endpoint mismatch');
  const returns = (entry.claimedReturns || []).map(claim => {
    assert(phases[claim.from] && phases[claim.to]);
    const certificate = V.certifyIsometry(patch, graph, phases[claim.from], patch, graph, phases[claim.to],
      claim.transform || claim, claim.radius ?? 3);
    delete certificate.mapping;
    return { from: claim.from, to: claim.to, ...certificate };
  });
  const first = metrics[0], last = metrics.at(-1);
  const result = {
    id: entry.id, verifiedThrough: phases.length - 1, reason,
    productionParity: Boolean(production), checkedMinerCheckpoints: [...checkpoints.keys()].filter(g => g < phases.length),
    trajectorySha256: trajectoryHash.digest('hex'),
    minimumBoundaryDistance: Math.min(...metrics.filter(m => m.active).map(m => m.boundaryDistance)),
    maximumActive: Math.max(...metrics.map(m => m.active)), maximumRadius: Math.max(...metrics.map(m => m.radius)),
    maximumComponents: Math.max(...metrics.map(m => m.components)), visitedTiles: visits.size,
    centroidDisplacement: last.centroid ? Math.hypot(last.centroid[0] - first.centroid[0], last.centroid[1] - first.centroid[1]) : null,
    absoluteCycle, initial, final: phases.at(-1), returns,
    referenceSource: 'research/aperiodic-reference.js direct-neighbour B/S; verification/replay.js direct-neighbour priority tables',
    scope: 'Finite trajectory only. Local repeats do not prove infinite aperiodic propagation or historical novelty.',
  };
  if (table) {
    result.distinctLocalContexts = reference.contexts.size;
    result.publishedContextComparison = comparePublishedContexts([...reference.contexts.values()], states);
    result.comparisonScope = 'Exact state relabelling of local transitions actually encountered. A mismatch distinguishes a transition, not automatically a travelling mechanism; unvisited contexts are untested.';
  }
  return { result, phases, metrics, patch, graph };
}

if (require.main === module) {
  assert(process.argv[2], 'Usage: node replay.js candidate.json [output.json]');
  const entry = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const verified = replay(entry);
  const serialised = JSON.stringify(verified.result, null, 2) + '\n';
  if (process.argv[3]) fs.writeFileSync(process.argv[3], serialised);
  else process.stdout.write(serialised);
}
module.exports = { replay, TableReference, transition, comparePublishedContexts, repository, V };
