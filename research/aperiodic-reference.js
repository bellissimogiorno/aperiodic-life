'use strict';

// The reference update counts each candidate's neighbours directly. It does not
// use either production engine's counts, transition function or signature.
const assert = require('assert');
const Core = require('../core.js');
const { SparseAutomaton } = require('./lib/sparse-automaton.js');
const EPSILON = 0.002;

function parseRule(text) {
  const match = /^B([^/]*)\/S(.*)$/i.exec(text.replace(/\s/g, ''));
  assert(match, 'invalid rule');
  return match.slice(1).map((part) => {
    const list = /^[\[({]/.test(part) || /[,;]/.test(part);
    part = part.replace(/[\[\](){}]/g, '');
    const numbers = !part ? [] : list ? part.split(/[,;]/).map(Number) : [...part].map(Number);
    assert(numbers.every((n) => Number.isInteger(n) && n >= 0 && n <= 255));
    return new Set(numbers);
  });
}

class ReferenceGraph {
  constructor(graph, rule, generations, entries) {
    [this.birth, this.survive] = parseRule(rule);
    assert(!this.birth.has(0), 'unbounded dead-background reference excludes B0');
    assert(Number.isInteger(generations) && generations >= 2 && generations <= 255);
    this.graph = graph;
    this.generations = generations;
    this.state = new Map(entries.filter(([, value]) => value));
    assert.equal(this.state.size, entries.filter(([, value]) => value).length, 'duplicate initial cells');
    for (const [cell, value] of this.state) {
      assert(Number.isInteger(cell) && cell >= 0 && cell < graph.degree.length);
      assert(Number.isInteger(value) && value >= 1 && value < generations);
    }
  }
  step() {
    const candidates = new Set(this.state.keys());
    for (const cell of this.state.keys()) {
      for (let cursor = this.graph.offsets[cell]; cursor < this.graph.offsets[cell + 1]; cursor++) {
        candidates.add(this.graph.neighbors[cursor]);
      }
    }
    const next = new Map();
    for (const cell of candidates) {
      let count = 0;
      for (let cursor = this.graph.offsets[cell]; cursor < this.graph.offsets[cell + 1]; cursor++) {
        if (this.state.get(this.graph.neighbors[cursor]) === 1) count++;
      }
      const current = this.state.get(cell) || 0;
      const value = current === 0 ? Number(this.birth.has(count))
        : current === 1 ? this.survive.has(count) ? 1 : this.generations === 2 ? 0 : 2
        : current + 1 === this.generations ? 0 : current + 1;
      if (value) next.set(cell, value);
    }
    this.state = next;
    return next;
  }
  entries() { return [...this.state].sort((a, b) => a[0] - b[0]); }
}

class PriorityReference {
  constructor(graph, table, entries) {
    this.graph = graph;
    this.table = table;
    assert(Number.isInteger(table.states) && table.states >= 2);
    assert.equal(table.default, 0, 'finite-support reference requires default zero');
    this.state = new Map(entries.filter(([, value]) => value));
    for (const [cell, value] of this.state) {
      assert(Number.isInteger(cell) && cell >= 0 && cell < graph.degree.length);
      assert(Number.isInteger(value) && value > 0 && value < table.states);
    }
    for (let degree = 0; degree <= graph.maxDegree; degree++) {
      const counts = Array(table.states).fill(0);
      counts[0] = degree;
      assert.equal(this.nextValue(0, counts), 0, 'table births spontaneously on a dead background');
    }
  }
  nextValue(current, counts) {
    for (const row of this.table.rows) {
      if (row.state !== undefined && row.state !== current) continue;
      if (!Object.entries(row.atLeast || {}).every(([state, count]) => counts[state] >= count)) continue;
      if (!Object.entries(row.equal || {}).every(([state, count]) => counts[state] === count)) continue;
      return row.next;
    }
    return this.table.default;
  }
  step() {
    const candidates = new Set(this.state.keys());
    for (const cell of this.state.keys()) for (let k = this.graph.offsets[cell]; k < this.graph.offsets[cell + 1]; k++) candidates.add(this.graph.neighbors[k]);
    const next = new Map();
    for (const cell of candidates) {
      const counts = Array(this.table.states).fill(0);
      for (let k = this.graph.offsets[cell]; k < this.graph.offsets[cell + 1]; k++) counts[this.state.get(this.graph.neighbors[k]) || 0]++;
      assert.equal(counts.reduce((a, b) => a + b, 0), this.graph.degree[cell]);
      const value = this.nextValue(this.state.get(cell) || 0, counts);
      if (value) next.set(cell, value);
    }
    this.state = next;
    return next;
  }
  entries() { return [...this.state].sort((a, b) => a[0] - b[0]); }
}

const PUBLISHED_TABLES = {
  spectre: { states: 4, default: 0, rows: [
    { state: 0, atLeast: { 0: 3, 1: 1 }, next: 3 },
    { state: 3, atLeast: { 3: 3 }, next: 0 },
    { state: 3, atLeast: { 1: 1 }, next: 1 },
  ] },
  penroseGoucher: { states: 4, default: 0, rows: [
    { state: 0, atLeast: { 1: 1, 2: 1 }, next: 3 },
    { state: 0, atLeast: { 1: 1, 3: 2 }, next: 1 },
    { state: 1, atLeast: { 3: 1 }, next: 2 },
    { state: 1, next: 1 },
    { state: 2, next: 3 },
  ] },
  hatA: { states: 4, default: 0, rows: [
    { state: 0, atLeast: { 2: 2 }, next: 0 },
    { atLeast: { 1: 3 }, next: 3 },
    { state: 2, atLeast: { 1: 1, 0: 1 }, next: 1 },
    { state: 1, atLeast: { 2: 1 }, next: 3 },
    { state: 0, atLeast: { 1: 1 }, next: 2 },
  ] },
  hatB: { states: 4, default: 0, rows: [
    { state: 0, atLeast: { 1: 2, 0: 1 }, next: 0 },
    { state: 0, atLeast: { 0: 2, 2: 2 }, next: 1 },
    { state: 0, atLeast: { 0: 2, 3: 1 }, next: 1 },
    { state: 1, atLeast: { 3: 1 }, next: 3 },
  ] },
  hatSimple: { states: 3, default: 0, rows: [
    { state: 0, atLeast: { 1: 2 }, next: 0 },
    { state: 0, atLeast: { 2: 1 }, next: 1 },
    { state: 1, atLeast: { 2: 1 }, next: 2 },
  ] },
  hatC: { states: 4, default: 0, rows: [
    { atLeast: { 2: 1, 1: 3 }, next: 3 },
    { state: 1, atLeast: { 2: 1 }, next: 2 },
    { state: 3, atLeast: { 3: 3 }, next: 3 },
    { state: 0, atLeast: { 3: 2 }, next: 1 },
    { atLeast: { 2: 1 }, next: 1 },
  ] },
};

function graphBall(graph, support, radius) {
  const distance = new Map([...support].map((cell) => [cell, 0]));
  const queue = [...distance.keys()];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    if (distance.get(cell) >= radius) continue;
    for (let cursor = graph.offsets[cell]; cursor < graph.offsets[cell + 1]; cursor++) {
      const other = graph.neighbors[cursor];
      if (!distance.has(other)) { distance.set(other, distance.get(cell) + 1); queue.push(other); }
    }
  }
  return distance;
}

function polygon(patch, cell) {
  return Array.from({ length: patch.verticesPerTile }, (_, vertex) => {
    const offset = (cell * patch.verticesPerTile + vertex) * 2;
    return [patch.vertices[offset], patch.vertices[offset + 1]];
  });
}

function polygonKey(patch, cell) {
  const x = patch.centers[2 * cell];
  const y = patch.centers[2 * cell + 1];
  return `${patch.tileTypes[cell]}:` + polygon(patch, cell).map(([px, py]) =>
    `${Math.round((px - x) * 128)},${Math.round((py - y) * 128)}`).sort().join(';');
}

function makeSpatialIndex(patch) {
  const index = new Map();
  for (let cell = 0; cell < patch.tileCount; cell++) {
    const key = `${Math.floor(patch.centers[2 * cell])},${Math.floor(patch.centers[2 * cell + 1])}`;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(cell);
  }
  return index;
}

function nearCells(patch, index, x, y) {
  const result = [];
  for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
    for (const cell of index.get(`${Math.floor(x) + ox},${Math.floor(y) + oy}`) || []) {
      if (Math.hypot(patch.centers[2 * cell] - x, patch.centers[2 * cell + 1] - y) < EPSILON) result.push(cell);
    }
  }
  return result;
}

function transformedPoint(x, y, transform) {
  const angle = transform.angle || 0;
  const cx = transform.centre ? transform.centre[0] : 0;
  const cy = transform.centre ? transform.centre[1] : 0;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [cosine * (x - cx) - sine * (y - cy) + cx + (transform.dx || 0),
    sine * (x - cx) + cosine * (y - cy) + cy + (transform.dy || 0)];
}

// The same map must preserve every polygon vertex, tile label, state, graph
// edge and degree, including the complete zero-state halo. A centroid match is
// used only to identify a possible tile; it never suffices for acceptance.
function certifyIsometry(sourcePatch, sourceGraph, sourceEntries, targetPatch, targetGraph, targetEntries, transform, radius = 3, index = null) {
  const source = new Map(sourceEntries);
  const target = new Map(targetEntries);
  assert(source.size && source.size === target.size, 'complete nonzero population differs');
  const sourceBall = graphBall(sourceGraph, source.keys(), radius);
  const targetBall = graphBall(targetGraph, target.keys(), radius);
  assert.equal(sourceBall.size, targetBall.size, 'complete halo cardinality differs');
  index ||= makeSpatialIndex(targetPatch);
  const mapping = new Map();
  const used = new Set();
  let worstPolygonError = 0;
  for (const [cell, distance] of sourceBall) {
    const [x, y] = transformedPoint(sourcePatch.centers[2 * cell], sourcePatch.centers[2 * cell + 1], transform);
    const candidates = nearCells(targetPatch, index, x, y).filter((other) => targetBall.has(other));
    assert.equal(candidates.length, 1, 'translated tile centre absent or ambiguous');
    const other = candidates[0];
    assert(!used.has(other), 'tile map is not injective');
    assert.equal(sourceBall.get(cell), targetBall.get(other), 'halo graph distance differs');
    assert.equal(source.get(cell) || 0, target.get(other) || 0, 'complete cell state differs');
    assert.equal(sourcePatch.tileTypes[cell], targetPatch.tileTypes[other], 'tile type or chirality differs');
    assert.equal(sourceGraph.degree[cell], targetGraph.degree[other], 'tile degree differs');
    assert(sourceGraph.boundaryDistance[cell] > 0 && targetGraph.boundaryDistance[other] > 0, 'halo reaches incomplete patch boundary');
    const remaining = polygon(targetPatch, other);
    for (const [px, py] of polygon(sourcePatch, cell)) {
      const [tx, ty] = transformedPoint(px, py, transform);
      let best = -1;
      let error = Infinity;
      remaining.forEach(([qx, qy], k) => { const d = Math.hypot(qx - tx, qy - ty); if (d < error) { best = k; error = d; } });
      assert(error < EPSILON, 'complete tile polygon differs');
      worstPolygonError = Math.max(worstPolygonError, error);
      remaining.splice(best, 1);
    }
    assert.equal(remaining.length, 0);
    mapping.set(cell, other);
    used.add(other);
  }
  assert.deepStrictEqual(used, new Set(targetBall.keys()), 'halo map is not onto');
  for (const [cell, other] of mapping) {
    const left = [];
    const right = [];
    for (let k = sourceGraph.offsets[cell]; k < sourceGraph.offsets[cell + 1]; k++) if (mapping.has(sourceGraph.neighbors[k])) left.push(mapping.get(sourceGraph.neighbors[k]));
    for (let k = targetGraph.offsets[other]; k < targetGraph.offsets[other + 1]; k++) if (used.has(targetGraph.neighbors[k])) right.push(targetGraph.neighbors[k]);
    assert.deepStrictEqual(left.sort((a, b) => a - b), right.sort((a, b) => a - b), 'induced halo graph adjacency differs');
  }
  return { cells: source.size, haloCells: mapping.size, radius, transform, worstPolygonError, mapping: [...mapping] };
}

function measure(patch, graph, entries) {
  const cells = [...entries];
  if (!cells.length) return { active: 0, live: 0, components: 0, radius: 0, centroid: null, boundaryDistance: null };
  const support = new Set(cells.map(([cell]) => cell));
  let components = 0;
  while (support.size) {
    components++;
    const queue = [support.values().next().value];
    support.delete(queue[0]);
    for (let i = 0; i < queue.length; i++) {
      const cell = queue[i];
      for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) {
        if (support.delete(graph.neighbors[k])) queue.push(graph.neighbors[k]);
      }
    }
  }
  const centroid = cells.reduce((sum, [cell]) => [sum[0] + patch.centers[2 * cell], sum[1] + patch.centers[2 * cell + 1]], [0, 0]).map((v) => v / cells.length);
  return { active: cells.length, live: cells.filter(([, state]) => state === 1).length, components,
    centroid, radius: Math.max(...cells.map(([cell]) => Math.hypot(patch.centers[2 * cell] - centroid[0], patch.centers[2 * cell + 1] - centroid[1]))),
    boundaryDistance: Math.min(...cells.map(([cell]) => graph.boundaryDistance[cell])) };
}

function initialEntries(entry, patch) {
  if (entry.cellStates) return entry.cellStates;
  const cells = new Map();
  for (let cell = 0; cell < patch.tileCount; cell++) cells.set(`${patch.coordinates[2 * cell]},${patch.coordinates[2 * cell + 1]}`, cell);
  return entry.coordinateStates.map(([x, y, state]) => { const cell = cells.get(`${x},${y}`); assert.notEqual(cell, undefined); return [cell, state]; });
}

function signature(entries) { return entries.map(([cell, value]) => `${cell}:${value}`).join(','); }

function verifyReplay(entry, options = {}) {
  const patch = options.patch || Core.buildPatch(entry.tiling, entry.depth, { seed: entry.penroseSeed });
  const graph = entry.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const initial = initialEntries(entry, patch);
  const reference = new ReferenceGraph(graph, entry.rule, entry.generations, initial);
  const sparse = new SparseAutomaton(patch, graph, entry.rule, entry.generations);
  sparse.initialize(initial);
  const dense = new Core.Automaton(patch, graph, { rule: entry.rule, generations: entry.generations, borderRings: 0 });
  for (const [cell, value] of initial) dense.state[cell] = value;
  dense.refreshDerivedState();
  const horizon = options.horizon || entry.horizon || entry.expectedExtinction || entry.expectedPeriod * 2 || 1000;
  const maxActive = options.maxActive || 10000;
  const seen = new Map();
  const phases = [];
  const metrics = [];
  let firstAbsoluteCycle = null;
  let extinction = null;
  let firstWithoutLive = null;
  let minimumBoundaryDistance = Infinity;
  let reason = 'horizon';
  let comparisons = 0;
  for (let generation = 0; generation <= horizon; generation++) {
    const entries = reference.entries();
    assert.deepStrictEqual(sparse.entries(), entries, `sparse disagreement at generation ${generation}`);
    const denseEntries = [];
    for (let cell = 0; cell < dense.state.length; cell++) if (dense.state[cell]) denseEntries.push([cell, dense.state[cell]]);
    assert.deepStrictEqual(denseEntries, entries, `dense disagreement at generation ${generation}`);
    comparisons++;
    phases.push(entries);
    const metric = measure(patch, graph, entries);
    metrics.push(metric);
    if (metric.live === 0 && firstWithoutLive === null) firstWithoutLive = generation;
    if (!metric.active) { extinction = generation; reason = 'extinction'; break; }
    minimumBoundaryDistance = Math.min(minimumBoundaryDistance, metric.boundaryDistance);
    if (metric.boundaryDistance < 2) { reason = 'boundary'; break; }
    if (entries.length > maxActive) { reason = 'population-cap'; break; }
    const key = signature(entries);
    if (seen.has(key) && firstAbsoluteCycle === null) firstAbsoluteCycle = { start: seen.get(key), period: generation - seen.get(key), at: generation };
    if (!seen.has(key)) seen.set(key, generation);
    if (generation < horizon) { reference.step(); sparse.step(); dense.step(); }
  }
  const returns = [];
  for (const claim of entry.claimedReturns || []) {
    assert(phases[claim.from] && phases[claim.to], 'claimed phase outside replay');
    const certificate = certifyIsometry(patch, graph, phases[claim.from], patch, graph, phases[claim.to], claim, claim.radius || 3);
    delete certificate.mapping;
    returns.push({ from: claim.from, to: claim.to, ...certificate });
  }
  const first = metrics[0];
  const final = metrics[metrics.length - 1];
  const result = { id: entry.id || null, tiling: entry.tiling, depth: entry.depth, neighborhood: entry.neighborhood, rule: entry.rule,
    generations: entry.generations, tileCount: patch.tileCount, requestedHorizon: horizon, verifiedThrough: phases.length - 1,
    comparisons, reason, extinction, firstWithoutLive, minimumBoundaryDistance, firstAbsoluteCycle,
    peakActive: Math.max(...metrics.map((m) => m.active)), peakRadius: Math.max(...metrics.map((m) => m.radius)),
    peakComponents: Math.max(...metrics.map((m) => m.components)),
    centroidDisplacement: final.centroid ? Math.hypot(final.centroid[0] - first.centroid[0], final.centroid[1] - first.centroid[1]) : null,
    initial: phases[0], final: phases[phases.length - 1], returns,
    interpretation: 'Finite full-state replay. A local return alone does not establish indefinite motion on an aperiodic tiling.' };
  return { result, patch, graph, phases, metrics };
}

function findTranslatedPlacements(sourcePatch, sourceGraph, entries, targetPatch, targetGraph, { radius = 3, minimumBoundaryDistance = 8, maxPlacements = Infinity } = {}) {
  const index = makeSpatialIndex(targetPatch);
  const anchor = entries[0][0];
  const key = polygonKey(sourcePatch, anchor);
  const placements = [];
  let polygonPlacements = 0;
  for (let target = 0; target < targetPatch.tileCount; target++) {
    if (targetGraph.boundaryDistance[target] < minimumBoundaryDistance || polygonKey(targetPatch, target) !== key) continue;
    const dx = targetPatch.centers[2 * target] - sourcePatch.centers[2 * anchor];
    const dy = targetPatch.centers[2 * target + 1] - sourcePatch.centers[2 * anchor + 1];
    const targetEntries = [];
    for (const [source, state] of entries) {
      const candidates = nearCells(targetPatch, index, sourcePatch.centers[2 * source] + dx, sourcePatch.centers[2 * source + 1] + dy)
        .filter((other) => targetGraph.boundaryDistance[other] >= minimumBoundaryDistance && polygonKey(targetPatch, other) === polygonKey(sourcePatch, source));
      if (candidates.length !== 1) break;
      targetEntries.push([candidates[0], state]);
    }
    if (targetEntries.length !== entries.length) continue;
    polygonPlacements++;
    try {
      const certificate = certifyIsometry(sourcePatch, sourceGraph, entries, targetPatch, targetGraph, targetEntries, { dx, dy }, radius, index);
      delete certificate.mapping;
      placements.push({ entries: targetEntries, certificate });
      if (placements.length >= maxPlacements) break;
    } catch (error) {
      if (!(error instanceof assert.AssertionError)) throw error;
    }
  }
  return { polygonPlacements, placements };
}

module.exports = { Core, ReferenceGraph, PriorityReference, PUBLISHED_TABLES, EPSILON, parseRule, polygon, polygonKey, graphBall, measure, initialEntries,
  makeSpatialIndex, nearCells, transformedPoint, certifyIsometry, verifyReplay, findTranslatedPlacements };
