'use strict';

// An unbounded, exact integer-coordinate reference for six-neighbour hexagonal
// cellular automata. Only state 1 counts as live; all other nonzero states are
// retained and advance through the refractory sequence. This implementation
// queries neighbours directly, independently of Core's count accumulation.
const assert = require('node:assert/strict');

const DIRECTIONS = Object.freeze([[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]);
const key = (q, r) => `${q},${r}`;
const coordinate = (value) => value.split(',').map(Number);
const order = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

function parseRule(text, generations = 2) {
  assert(Number.isInteger(generations) && generations >= 2 && generations <= 255);
  const match = /^B([0-6]*)\/S([0-6]*)$/.exec(text);
  assert(match, `Unsupported six-neighbour rule ${text}`);
  const birth = new Set([...match[1]].map(Number));
  const survival = new Set([...match[2]].map(Number));
  assert(!birth.has(0), 'B0 has infinite support and needs a different reference representation');
  return { birth, survival, generations };
}

function fromCoordinates(cells, generations = 2) {
  const result = new Map();
  for (const [q, r, value = 1] of cells) {
    assert(Number.isSafeInteger(q) && Number.isSafeInteger(r), 'Coordinates must be exact integers');
    assert(Number.isInteger(value) && value > 0 && value < generations, `Invalid state ${value}`);
    const cell = key(q, r);
    assert(!result.has(cell), `Repeated coordinate ${cell}`);
    result.set(cell, value);
  }
  return result;
}

function toCoordinates(state) {
  return [...state].map(([cell, value]) => [...coordinate(cell), value]).sort(order);
}

function step(state, rule, clauses) {
  const candidates = new Set(state.keys());
  for (const [cell, value] of state) {
    if (value !== 1) continue;
    const [q, r] = coordinate(cell);
    for (const [dq, dr] of DIRECTIONS) candidates.add(key(q + dq, r + dr));
  }
  const next = new Map();
  for (const cell of candidates) {
    const [q, r] = coordinate(cell);
    const before = state.get(cell) || 0;
    let count = 0;
    for (const [dq, dr] of DIRECTIONS) if (state.get(key(q + dq, r + dr)) === 1) count++;
    let after = 0;
    if (before === 0) after = rule.birth.has(count) ? 1 : 0;
    else if (before === 1) after = rule.survival.has(count) ? 1 : rule.generations > 2 ? 2 : 0;
    else after = before + 1 < rule.generations ? before + 1 : 0;
    if (clauses && after === 1) {
      const clause = `${before === 0 ? 'B' : 'S'}${count}`;
      clauses[clause] = (clauses[clause] || 0) + 1;
    }
    if (after) next.set(cell, after);
  }
  return next;
}

function normalise(state) {
  const cells = state instanceof Map ? toCoordinates(state) : state;
  if (!cells.length) return { key: '', origin: [0, 0], cells: [] };
  let minQ = Infinity;
  let minR = Infinity;
  for (const [q, r] of cells) { minQ = Math.min(minQ, q); minR = Math.min(minR, r); }
  const shifted = cells.map(([q, r, value]) => [q - minQ, r - minR, value]).sort(order);
  return { key: shifted.map((cell) => cell.join(',')).join(';'), origin: [minQ, minR], cells: shifted };
}

function transform(cells, rotation, reflected = false) {
  return cells.map(([q0, r0, value]) => {
    let q = reflected ? r0 : q0;
    let r = reflected ? q0 : r0;
    for (let index = 0; index < rotation; index++) [q, r] = [-r, q + r];
    return [q, r, value];
  });
}

function canonicalShape(state) {
  const cells = state instanceof Map ? toCoordinates(state) : state;
  let result = null;
  for (const reflected of [false, true]) {
    for (let rotation = 0; rotation < 6; rotation++) {
      const candidate = normalise(transform(cells, rotation, reflected)).key;
      if (result === null || candidate < result) result = candidate;
    }
  }
  return result;
}

function hexDistance(q, r) { return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)); }

function componentSizes(keys) {
  const remaining = new Set(keys);
  const sizes = [];
  while (remaining.size) {
    const first = remaining.values().next().value;
    const queue = [first];
    remaining.delete(first);
    for (let head = 0; head < queue.length; head++) {
      const [q, r] = coordinate(queue[head]);
      for (const [dq, dr] of DIRECTIONS) {
        const neighbour = key(q + dq, r + dr);
        if (remaining.delete(neighbour)) queue.push(neighbour);
      }
    }
    sizes.push(queue.length);
  }
  return sizes.sort((a, b) => b - a);
}

function statistics(states) {
  const populations = states.map((state) => [...state.values()].filter((value) => value === 1).length);
  const supportSizes = states.map((state) => state.size);
  const stateValues = [...new Set(states.flatMap((state) => [...state.values()]))].sort((a, b) => a - b);
  const union = new Set(states.flatMap((state) => [...state.keys()]));
  return {
    populations, supportSizes, stateValues,
    minimumLive: Math.min(...populations), maximumLive: Math.max(...populations),
    minimumActive: Math.min(...supportSizes), maximumActive: Math.max(...supportSizes),
    maximumPhaseComponents: Math.max(...states.map((state) => componentSizes(state.keys()).length)),
    unionSize: union.size, unionComponents: componentSizes(union),
  };
}

function perCellPeriods(phases) {
  const period = phases.length;
  const union = new Set(phases.flatMap((state) => [...state.keys()]));
  const divisors = [];
  for (let divisor = 1; divisor <= period; divisor++) if (period % divisor === 0) divisors.push(divisor);
  const histogram = {};
  for (const cell of union) {
    const values = phases.map((state) => state.get(cell) || 0);
    const first = divisors.find((divisor) => values.every((value, index) => value === values[index % divisor]));
    histogram[first] = (histogram[first] || 0) + 1;
  }
  return histogram;
}

function findOrbit(entry, options = {}) {
  const rule = parseRule(entry.rule, entry.generations || 2);
  const maxSteps = options.maxSteps ?? 10000;
  const maxSupport = options.maxSupport ?? 100000;
  let state = fromCoordinates(entry.coordinateStates, rule.generations);
  const states = [];
  const seen = new Map();
  for (let generation = 0; generation <= maxSteps; generation++) {
    if (!state.size) return { kind: 'extinction', extinctionGeneration: generation, states };
    assert(state.size <= maxSupport, `Support exceeds ${maxSupport} at generation ${generation}`);
    const normal = normalise(state);
    const previous = seen.get(normal.key);
    if (previous) {
      const period = generation - previous.generation;
      const translation = normal.origin.map((value, axis) => value - previous.origin[axis]);
      const phases = states.slice(previous.generation);
      const moving = translation.some(Boolean);
      const ruleClauses = {};
      for (const phase of phases) step(phase, rule, ruleClauses);
      return {
        kind: moving ? 'spaceship' : period === 1 ? 'still life' : 'oscillator',
        transient: previous.generation, period, translation,
        distancePerPeriod: hexDistance(...translation),
        speed: hexDistance(...translation) / period,
        euclideanSpeedInNeighbourSpacings: Math.sqrt(translation[0] ** 2 + translation[0] * translation[1] + translation[1] ** 2) / period,
        canonicalOrbit: phases.map(canonicalShape).sort()[0],
        ruleClauses,
        ...statistics(phases),
        perCellPeriods: moving ? null : perCellPeriods(phases),
        phase0: toCoordinates(phases[0]),
        phases, states,
      };
    }
    seen.set(normal.key, { generation, origin: normal.origin });
    states.push(state);
    state = step(state, rule);
  }
  return { kind: 'unresolved', steps: maxSteps, states };
}

function compareCore(entry, Core, steps, options = {}) {
  const rule = parseRule(entry.rule, entry.generations || 2);
  let state = fromCoordinates(entry.coordinateStates, rule.generations);
  const reference = [state];
  let radius = 0;
  for (let generation = 0; generation <= steps; generation++) {
    for (const cell of state.keys()) radius = Math.max(radius, hexDistance(...coordinate(cell)));
    if (generation < steps) { state = step(state, rule); reference.push(state); }
  }
  const depth = options.depth ?? radius + 3;
  assert(depth <= 256, `Required depth ${depth} exceeds Core's hex patch limit`);
  assert(depth >= radius + 2, 'Nonzero cells need at least two complete dead rings outside them');
  const patch = Core.buildHexPatch(depth);
  const simulation = new Core.Automaton(patch, patch.edgeGraph, {
    rule: entry.rule, generations: rule.generations, borderRings: 1,
  });
  const coordinateMap = new Map();
  for (let cell = 0; cell < patch.tileCount; cell++) coordinateMap.set(key(patch.coordinates[cell * 2], patch.coordinates[cell * 2 + 1]), cell);
  for (const [cell, value] of reference[0]) simulation.state[coordinateMap.get(cell)] = value;
  simulation.refreshDerivedState();
  let comparisons = 0;
  for (let generation = 0; generation <= steps; generation++) {
    for (let cell = 0; cell < patch.tileCount; cell++) {
      const at = key(patch.coordinates[cell * 2], patch.coordinates[cell * 2 + 1]);
      assert.equal(simulation.state[cell], reference[generation].get(at) || 0, `Core differs at generation ${generation}, ${at}`);
      comparisons++;
    }
    if (generation < steps) simulation.step();
  }
  return { steps, depth, minimumBoundaryDistance: depth - radius, comparedCells: comparisons };
}

function verifyReplication(entry, steps, offsets) {
  const rule = parseRule(entry.rule, entry.generations || 2);
  const initial = fromCoordinates(entry.coordinateStates, rule.generations);
  let state = initial;
  for (let generation = 0; generation < steps; generation++) state = step(state, rule);
  const expected = new Map();
  for (const [dq, dr] of offsets) {
    for (const [cell, value] of initial) {
      const [q, r] = coordinate(cell);
      const destination = key(q + dq, r + dr);
      assert(!expected.has(destination), 'Replication offsets give overlapping copies');
      expected.set(destination, value);
    }
  }
  assert.deepEqual(toCoordinates(state), toCoordinates(expected), `Replication differs at generation ${steps}`);
  return { steps, copies: offsets.length, initialSupport: initial.size, replicatedSupport: state.size };
}

function serialisableOrbit(result) {
  const { phases, states, canonicalOrbit, ...summary } = result;
  return summary;
}

function rotationReturn(result) {
  if (result.kind !== 'oscillator') return null;
  const before = toCoordinates(result.phases[0]);
  for (let interval = 1; interval < result.period; interval++) {
    const after = normalise(result.phases[interval]);
    for (let rotation = 1; rotation < 6; rotation++) {
      const rotated = normalise(transform(before, rotation));
      if (rotated.key !== after.key) continue;
      const translation = after.origin.map((value, axis) => value - rotated.origin[axis]);
      for (let phase = 0; phase < result.period; phase++) {
        const actual = transform(toCoordinates(result.phases[phase]), rotation)
          .map(([q, r, value]) => [q + translation[0], r + translation[1], value]).sort(order);
        assert.deepEqual(actual, toCoordinates(result.phases[(phase + interval) % result.period]), 'Rotation relation must hold at every phase');
      }
      const [[a, c], [b, d]] = transform([[1, 0, 1], [0, 1, 1]], rotation);
      const determinant = (1 - a) * (1 - d) - b * c;
      assert(determinant !== 0);
      const centreNumerators = [(1 - d) * translation[0] + b * translation[1], c * translation[0] + (1 - a) * translation[1]];
      const gcd = (a0, b0) => { let a = Math.abs(a0); let b = Math.abs(b0); while (b) [a, b] = [b, a % b]; return a; };
      return {
        interval, rotation60Steps: rotation, translation,
        centreAxial: centreNumerators.map((value) => { const divisor = gcd(value, determinant); return [value / divisor, determinant / divisor]; }),
        verifiedPhases: result.period,
      };
    }
  }
  return null;
}

// The minimum phase shape is a cheap duplicate candidate key. Full orbit
// equivalence must also compare subsequent phases: different rules can share
// one phase while producing distinct trajectories from it.
function equivalentOrbits(left, right) {
  if (left.period !== right.period || left.canonicalOrbit !== right.canonicalOrbit) return false;
  const initial = toCoordinates(left.phases[0]);
  for (let shift = 0; shift < right.period; shift++) {
    const rightInitial = normalise(right.phases[shift]);
    for (const reflected of [false, true]) for (let rotation = 0; rotation < 6; rotation++) {
      const transformed = normalise(transform(initial, rotation, reflected));
      if (transformed.key !== rightInitial.key) continue;
      const translation = rightInitial.origin.map((value, axis) => value - transformed.origin[axis]);
      let equal = true;
      for (let phase = 0; phase < left.period; phase++) {
        const actual = transform(toCoordinates(left.phases[phase]), rotation, reflected)
          .map(([q, r, value]) => [q + translation[0], r + translation[1], value]).sort(order);
        const wraps = Math.floor((phase + shift) / right.period);
        const expected = toCoordinates(right.phases[(phase + shift) % right.period])
          .map(([q, r, value]) => [q + wraps * right.translation[0], r + wraps * right.translation[1], value]);
        if (JSON.stringify(actual) !== JSON.stringify(expected)) { equal = false; break; }
      }
      if (equal) {
        const [[dq, dr]] = transform([[...left.translation, 1]], rotation, reflected);
        if (dq === right.translation[0] && dr === right.translation[1]) return { shift, rotation60Steps: rotation, reflected, translation };
      }
    }
  }
  return false;
}

function translate(state, offset) {
  return new Map([...state].map(([cell, value]) => {
    const [q, r] = coordinate(cell);
    return [key(q + offset[0], r + offset[1]), value];
  }));
}

function disjointUnion(states) {
  const result = new Map();
  for (const state of states) for (const [cell, value] of state) {
    assert(!result.has(cell), `Supposedly independent components overlap at ${cell}`);
    result.set(cell, value);
  }
  return result;
}

// Each of these projections changes by at most one across a hexagonal edge.
// A gap of three therefore makes the radius-one dependency neighbourhoods
// disjoint. Nonnegative outward increments certify separation for all future
// emissions, rather than only for a finite simulated sample.
function separationCertificate(first, second, firstOffset, secondOffset) {
  const axes = [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [-1, -1]];
  for (const axis of axes) {
    const dot = ([q, r]) => axis[0] * q + axis[1] * r;
    const firstIncrement = dot(firstOffset);
    const secondIncrement = dot(secondOffset);
    if (firstIncrement < 0 || secondIncrement > 0) continue;
    const lower = Math.min(...[...first.keys()].map((cell) => dot(coordinate(cell))));
    const upper = Math.max(...[...second.keys()].map((cell) => dot(coordinate(cell))));
    const gap = lower - upper;
    if (gap >= 3) return { axis, gap, firstIncrement, secondIncrement };
  }
  assert.fail('No outward cube-coordinate separation certificate exists');
}

function verifyEmitter(entry, proof) {
  const rule = parseRule(entry.rule, entry.generations || 2);
  const period = proof.emissionPeriod;
  assert(Number.isInteger(period) && period > 0);
  let core = fromCoordinates(entry.coordinateStates, rule.generations);
  const initial = core;
  const corePhases = [];
  for (let phase = 0; phase < period; phase++) {
    corePhases.push(core);
    core = step(core, rule);
  }
  const certificates = [];
  if (proof.emittedGroups) {
    assert.deepEqual(proof.coreTranslation, [0, 0], 'Gun core must be stationary');
    const groups = proof.emittedGroups.map((group) => fromCoordinates(group.coordinateStates, rule.generations));
    assert.deepEqual(toCoordinates(core), toCoordinates(disjointUnion([initial, ...groups])), 'Gun emission must include its complete core and every emitted state');
    const velocities = [];
    for (const group of proof.emittedGroups) {
      const orbit = findOrbit({ ...entry, coordinateStates: group.coordinateStates }, { maxSteps: group.period });
      assert.equal(orbit.transient, 0);
      assert.equal(orbit.period, group.period);
      assert.equal(period % group.period, 0);
      const velocity = orbit.translation.map((value) => value * period / group.period);
      assert(velocity.some(Boolean), 'A gun must emit travelling patterns');
      velocities.push(velocity);
    }
    let moving = groups;
    for (let phase = 0; phase < period; phase++) {
      for (let first = 0; first < moving.length; first++) {
        certificates.push(separationCertificate(moving[first], corePhases[phase], velocities[first], [0, 0]));
        certificates.push(separationCertificate(translate(moving[first], velocities[first]), moving[first], velocities[first], [0, 0]));
        for (let second = 0; second < first; second++) {
          certificates.push(separationCertificate(moving[first], moving[second], velocities[first], velocities[second]));
        }
      }
      moving = moving.map((state) => step(state, rule));
    }
    moving.forEach((state, index) => assert.deepEqual(toCoordinates(state), toCoordinates(translate(groups[index], velocities[index]))));
    return { type: 'gun', emissionPeriod: period, groupsPerEmission: groups.length, velocities, separationChecks: certificates.length, minimumProjectionGap: Math.min(...certificates.map((proof) => proof.gap)) };
  }
  assert(proof.debrisCoordinateStates, 'Missing puffer debris');
  const velocity = proof.coreTranslation;
  assert(velocity.some(Boolean), 'A puffer must move');
  const debris = fromCoordinates(proof.debrisCoordinateStates, rule.generations);
  assert.deepEqual(toCoordinates(core), toCoordinates(disjointUnion([translate(initial, velocity), debris])), 'Puffer return must include its complete travelling core and every deposited state');
  const orbit = findOrbit({ ...entry, coordinateStates: proof.debrisCoordinateStates }, { maxSteps: proof.debrisPeriod });
  assert.equal(orbit.transient, 0);
  assert.equal(orbit.period, proof.debrisPeriod);
  assert.deepEqual(orbit.translation, [0, 0]);
  assert.equal(period % orbit.period, 0);
  let deposit = debris;
  const backwards = velocity.map((value) => -value);
  for (let phase = 0; phase < period; phase++) {
    const previousDeposit = translate(deposit, backwards);
    certificates.push(separationCertificate(corePhases[phase], previousDeposit, [0, 0], backwards));
    certificates.push(separationCertificate(deposit, previousDeposit, [0, 0], backwards));
    deposit = step(deposit, rule);
  }
  assert.deepEqual(toCoordinates(deposit), toCoordinates(debris));
  return { type: 'puffer', emissionPeriod: period, translation: velocity, debrisPeriod: orbit.period, debrisPopulation: debris.size, separationChecks: certificates.length, minimumProjectionGap: Math.min(...certificates.map((proof) => proof.gap)) };
}

function verifyRepair(entry, proof) {
  const rule = parseRule(entry.rule, entry.generations || 2);
  let damaged = fromCoordinates(entry.coordinateStates, rule.generations);
  let pristine = fromCoordinates(proof.pristineCoordinateStates, rule.generations);
  const [q, r, value] = proof.missingCoordinateState;
  assert(!damaged.has(key(q, r)));
  const restored = new Map(damaged);
  restored.set(key(q, r), value);
  assert.deepEqual(toCoordinates(restored), toCoordinates(pristine), 'Initial walls must differ at exactly the stated missing cell');
  let firstMatch = null;
  for (let generation = 0; generation <= proof.exactMatchGeneration; generation++) {
    if (JSON.stringify(toCoordinates(damaged)) === JSON.stringify(toCoordinates(pristine))) { firstMatch = generation; break; }
    if (generation < proof.exactMatchGeneration) { damaged = step(damaged, rule); pristine = step(pristine, rule); }
  }
  assert.equal(firstMatch, proof.exactMatchGeneration, 'Exact recovery generation');
  assert.deepEqual(toCoordinates(damaged), toCoordinates(fromCoordinates(proof.expectedCoordinateStates, rule.generations)));
  return { firstExactMatch: firstMatch, resultingSupport: damaged.size };
}

module.exports = {
  DIRECTIONS, fromCoordinates, toCoordinates, parseRule, step, normalise, transform,
  canonicalShape, hexDistance, componentSizes, statistics, findOrbit, compareCore,
  verifyReplication, serialisableOrbit, rotationReturn, equivalentOrbits,
  translate, disjointUnion, separationCertificate, verifyEmitter, verifyRepair,
};
