'use strict';

const Core = require('../../core.js');

/**
 * Sparse reference engine for search workloads whose rules do not contain B0.
 *
 * The browser engine deliberately scans the complete board so that it supports
 * every parsed rule. Search jobs evaluate many small seeds, so keeping only the
 * active cells and their neighbours is substantially faster. The transition
 * semantics are otherwise identical to Core.Automaton.
 */
class SparseAutomaton {
  constructor(patch, graph, ruleText, generations) {
    this.patch = patch;
    this.graph = graph;
    if (!Number.isInteger(generations) || generations < 2 || generations > 255) {
      throw new RangeError('generations must be an integer from 2 to 255');
    }
    this.generations = generations;
    this.rule = Core.parseRule(ruleText, graph.maxDegree);
    if (this.rule.birthLookup[0]) {
      throw new RangeError('SparseAutomaton does not support B0 rules');
    }

    this.state = new Uint8Array(patch.tileCount);
    this.counts = new Uint8Array(patch.tileCount);
    this.candidateFlag = new Uint8Array(patch.tileCount);
    this.active = [];
    this.live = [];
    this.candidates = [];
    this.countTouched = [];
    this.generation = 0;
    this.lastChangedCount = 0;
  }

  initialize(entries) {
    for (const cell of this.active) this.state[cell] = 0;
    this.active.length = 0;
    this.live.length = 0;
    this.generation = 0;
    this.lastChangedCount = 0;

    const assignments = new Map(entries);
    for (const [cell, value] of assignments) {
      const state = value;
      if (!Number.isInteger(cell) || cell < 0 || cell >= this.state.length) {
        throw new RangeError(`invalid cell ${cell}`);
      }
      if (!Number.isInteger(state)) throw new RangeError(`state ${state} is not an integer`);
      if (state === 0) continue;
      if (state < 0) throw new RangeError(`state ${state} is invalid`);
      if (state >= this.generations) {
        throw new RangeError(`state ${state} is invalid for ${this.generations} generations`);
      }
      this.state[cell] = state;
      this.active.push(cell);
      if (state === 1) this.live.push(cell);
    }
  }

  step() {
    const { offsets, neighbors } = this.graph;
    this.candidates.length = 0;
    this.countTouched.length = 0;

    const mark = (cell) => {
      if (this.candidateFlag[cell]) return;
      this.candidateFlag[cell] = 1;
      this.candidates.push(cell);
    };

    for (const cell of this.active) mark(cell);
    for (const cell of this.live) {
      for (let cursor = offsets[cell]; cursor < offsets[cell + 1]; cursor++) {
        const neighbor = neighbors[cursor];
        if (this.counts[neighbor] === 0) this.countTouched.push(neighbor);
        this.counts[neighbor]++;
        mark(neighbor);
      }
    }

    const nextActive = [];
    const nextLive = [];
    let changed = 0;
    for (const cell of this.candidates) {
      const previous = this.state[cell];
      const count = this.counts[cell];
      let state;
      if (previous === 0) {
        state = this.rule.birthLookup[count] ? 1 : 0;
      } else if (previous === 1) {
        state = this.rule.surviveLookup[count]
          ? 1
          : this.generations > 2 ? 2 : 0;
      } else {
        state = previous + 1 < this.generations ? previous + 1 : 0;
      }

      this.state[cell] = state;
      if (state !== previous) changed++;
      if (state) {
        nextActive.push(cell);
        if (state === 1) nextLive.push(cell);
      }
      this.candidateFlag[cell] = 0;
    }
    for (const cell of this.countTouched) this.counts[cell] = 0;

    this.active = nextActive;
    this.live = nextLive;
    this.generation++;
    this.lastChangedCount = changed;
    return this.active.length;
  }

  signature() {
    const active = this.active.slice().sort((left, right) => left - right);
    return active.map((cell) => `${cell.toString(36)}.${this.state[cell]}`).join(',');
  }

  entries() {
    return this.active
      .map((cell) => [cell, this.state[cell]])
      .sort((left, right) => left[0] - right[0]);
  }
}

function centralCells(patch, graph, minimumDistance, limit = patch.tileCount) {
  const cells = [];
  for (let cell = 0; cell < patch.tileCount; cell++) {
    if (graph.boundaryDistance[cell] >= minimumDistance) cells.push(cell);
  }
  cells.sort((left, right) =>
    Math.hypot(patch.centers[left * 2], patch.centers[left * 2 + 1]) -
    Math.hypot(patch.centers[right * 2], patch.centers[right * 2 + 1]));
  return cells.slice(0, limit);
}

function randomConnectedSeed(
  graph,
  starts,
  random,
  size,
  generations,
  maximumAttempts = Math.max(100, size * size * 8),
) {
  if (!starts.length) throw new RangeError('no eligible starting cells');
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError('seed size must be a positive integer');
  }
  if (!Number.isInteger(generations) || generations < 2 || generations > 255) {
    throw new RangeError('generations must be an integer from 2 to 255');
  }
  if (
    maximumAttempts !== Infinity &&
    (!Number.isInteger(maximumAttempts) || maximumAttempts < 0)
  ) {
    throw new RangeError('maximumAttempts must be a nonnegative integer or Infinity');
  }
  const first = starts[Math.floor(random() * starts.length)];
  const cells = [first];
  const included = new Set(cells);
  let attempts = 0;
  while (cells.length < size && attempts++ < maximumAttempts) {
    const base = cells[Math.floor(random() * cells.length)];
    const begin = graph.offsets[base];
    const end = graph.offsets[base + 1];
    if (begin === end) continue;
    const cell = graph.neighbors[begin + Math.floor(random() * (end - begin))];
    if (!included.has(cell)) {
      included.add(cell);
      cells.push(cell);
    }
  }
  return cells.map((cell) => [cell, 1 + Math.floor(random() * (generations - 1))]);
}

module.exports = Object.freeze({ SparseAutomaton, centralCells, randomConnectedSeed });
