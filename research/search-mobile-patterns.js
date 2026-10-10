#!/usr/bin/env node
'use strict';

/**
 * Deterministic evolutionary search for compact mobile behaviour.
 *
 * This improves on search-movers.js by scoring net travel relative to pattern
 * radius (rather than centroid path length alone) and detecting exact
 * translated returns of the complete nonzero state. Translation positives are
 * retained in their own bounded, de-duplicated pool, so an ordinary score elite
 * cannot hide them. A translated return is an observed finite trajectory, not
 * a claim that the aperiodic substrate is globally translation invariant or
 * that the pattern can travel forever.
 */
const assert = require('assert');
const fs = require('fs');
const Core = require('../core.js');
const {
  SparseAutomaton,
  centralCells,
  randomConnectedSeed,
} = require('./lib/sparse-automaton.js');

const HELP = `Usage: node research/search-mobile-patterns.js [options]

Options are supplied as --name value pairs:
  --tiling penrose|hat|square|hex
  --depth N --neighborhood edge|touch --rule B.../S...
  --generations N --iterations N --horizon N
  --minSeed N --maxSeed N --maxActive N --maxRadius N
  --minimumBoundaryDistance N --startSeed text --output path.json`;

function parseArguments(argv) {
  const result = {
    tiling: 'penrose',
    depth: 8,
    neighborhood: 'edge',
    rule: 'B3/S23',
    generations: 2,
    iterations: 25000,
    horizon: 600,
    minSeed: 3,
    maxSeed: 32,
    maxActive: 220,
    maxRadius: 18,
    minimumBoundaryDistance: 18,
    startSeed: '',
    output: '',
  };
  const numeric = new Set([
    'depth', 'generations', 'iterations', 'horizon', 'minSeed', 'maxSeed',
    'maxActive', 'maxRadius', 'minimumBoundaryDistance',
  ]);
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index].replace(/^--/, '');
    if (!(key in result) || argv[index + 1] === undefined) {
      throw new Error(`Unknown or incomplete option ${argv[index]}`);
    }
    result[key] = numeric.has(key) ? Number(argv[index + 1]) : argv[index + 1];
  }
  for (const key of numeric) {
    if (!Number.isFinite(result[key])) throw new RangeError(`${key} must be finite`);
  }
  result.depth = Math.trunc(result.depth);
  result.generations = Math.trunc(result.generations);
  result.iterations = Math.trunc(result.iterations);
  result.horizon = Math.trunc(result.horizon);
  result.minSeed = Math.trunc(result.minSeed);
  result.maxSeed = Math.trunc(result.maxSeed);
  result.maxActive = Math.trunc(result.maxActive);
  result.minimumBoundaryDistance = Math.trunc(result.minimumBoundaryDistance);
  if (result.generations < 2 || result.generations > 255) throw new RangeError('generations must be from 2 to 255');
  if (result.iterations < 1 || result.horizon < 1) throw new RangeError('iterations and horizon must be positive');
  if (result.minSeed < 1 || result.maxSeed < result.minSeed) throw new RangeError('invalid seed-size range');
  if (result.maxActive < result.maxSeed) throw new RangeError('maxActive must not be smaller than maxSeed');
  if (!(result.maxRadius > 0)) throw new RangeError('maxRadius must be positive');
  if (!['edge', 'touch'].includes(result.neighborhood)) throw new RangeError('neighbourhood must be edge or touch');
  return result;
}

function mutate(entries, graph, random, generations, minimumSize, maximumSize) {
  const cells = new Map(entries);
  const operations = 1 + Math.floor(random() * 5);
  for (let operation = 0; operation < operations; operation++) {
    const keys = [...cells.keys()];
    const choice = random();
    if (choice < 0.30 && keys.length > minimumSize) {
      cells.delete(keys[Math.floor(random() * keys.length)]);
    } else if (choice < 0.82 && keys.length < maximumSize && keys.length) {
      const base = keys[Math.floor(random() * keys.length)];
      const begin = graph.offsets[base];
      const end = graph.offsets[base + 1];
      if (begin < end) {
        const cell = graph.neighbors[begin + Math.floor(random() * (end - begin))];
        cells.set(cell, 1 + Math.floor(random() * (generations - 1)));
      }
    } else if (keys.length) {
      const cell = keys[Math.floor(random() * keys.length)];
      cells.set(cell, 1 + Math.floor(random() * (generations - 1)));
    }
  }
  return [...cells.entries()].sort((left, right) => left[0] - right[0]);
}

function geometry(automaton) {
  const cells = automaton.active;
  if (!cells.length) return { center: null, radius: 0 };
  let x = 0;
  let y = 0;
  for (const cell of cells) {
    x += automaton.patch.centers[cell * 2];
    y += automaton.patch.centers[cell * 2 + 1];
  }
  x /= cells.length;
  y /= cells.length;
  let radius = 0;
  for (const cell of cells) {
    radius = Math.max(radius, Math.hypot(
      automaton.patch.centers[cell * 2] - x,
      automaton.patch.centers[cell * 2 + 1] - y,
    ));
  }
  return { center: [x, y], radius };
}

function quantized(value, scale) {
  return Math.round(value * scale);
}

function centeredTileVertices(patch, cell) {
  let outlineX = 0;
  let outlineY = 0;
  for (const point of patch.outline) {
    outlineX += point.x;
    outlineY += point.y;
  }
  outlineX /= patch.outline.length;
  outlineY /= patch.outline.length;
  const transform = cell * 6;
  const a = patch.transforms[transform];
  const b = patch.transforms[transform + 1];
  const d = patch.transforms[transform + 3];
  const e = patch.transforms[transform + 4];
  return patch.outline.map((point) => {
    const x = point.x - outlineX;
    const y = point.y - outlineY;
    return [a * x + b * y, d * x + e * y];
  });
}

function translatedShapeSignature(automaton, spatial) {
  if (!automaton.active.length) return '';
  const { patch } = automaton;
  let anchor = automaton.active[0];
  for (const cell of automaton.active) {
    const x = patch.centers[cell * 2];
    const y = patch.centers[cell * 2 + 1];
    const ax = patch.centers[anchor * 2];
    const ay = patch.centers[anchor * 2 + 1];
    if (x < ax || (x === ax && y < ay)) anchor = cell;
  }
  const anchorX = patch.centers[anchor * 2];
  const anchorY = patch.centers[anchor * 2 + 1];
  const records = automaton.active.map((cell) => {
    return [
      quantized(patch.centers[cell * 2] - anchorX, 64),
      quantized(patch.centers[cell * 2 + 1] - anchorY, 64),
      automaton.state[cell],
      patch.tileTypes ? patch.tileTypes[cell] : 0,
      spatial.shapeClasses[cell],
    ];
  });
  records.sort((left, right) => {
    for (let index = 0; index < left.length; index++) {
      if (left[index] !== right[index]) return left[index] - right[index];
    }
    return 0;
  });
  return records.map((record) => record.join('.')).join(',');
}

function makeSpatialIndex(patch) {
  const scale = 128;
  const buckets = new Map();
  const shapeKeys = new Array(patch.tileCount);
  const shapeClassByKey = new Map();
  const shapeClasses = new Uint16Array(patch.tileCount);
  for (let cell = 0; cell < patch.tileCount; cell++) {
    const key = `${quantized(patch.centers[cell * 2], scale)},${quantized(patch.centers[cell * 2 + 1], scale)}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(cell);
    else buckets.set(key, [cell]);

    const vertices = centeredTileVertices(patch, cell).map(([x, y]) => [
      quantized(x, 128),
      quantized(y, 128),
    ]);
    vertices.sort((left, right) => left[0] - right[0] || left[1] - right[1]);
    const shapeKey = vertices.map((vertex) => vertex.join('.')).join(':');
    shapeKeys[cell] = shapeKey;
    if (!shapeClassByKey.has(shapeKey)) shapeClassByKey.set(shapeKey, shapeClassByKey.size);
    shapeClasses[cell] = shapeClassByKey.get(shapeKey);
  }

  function candidates(x, y) {
    const qx = quantized(x, scale);
    const qy = quantized(y, scale);
    const result = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = buckets.get(`${qx + dx},${qy + dy}`);
        if (bucket) result.push(...bucket);
      }
    }
    return result;
  }
  return { candidates, shapeKeys, shapeClasses };
}

function sameTileGeometry(patch, left, right, tolerance = 0.0015) {
  const a = centeredTileVertices(patch, left);
  const b = centeredTileVertices(patch, right);
  const used = new Uint8Array(b.length);
  for (const point of a) {
    let match = -1;
    for (let index = 0; index < b.length; index++) {
      if (
        !used[index] &&
        Math.abs(point[0] - b[index][0]) <= tolerance &&
        Math.abs(point[1] - b[index][1]) <= tolerance
      ) {
        match = index;
        break;
      }
    }
    if (match < 0) return false;
    used[match] = 1;
  }
  return true;
}

function translatedCell(patch, spatial, source, dx, dy) {
  const targetX = patch.centers[source * 2] + dx;
  const targetY = patch.centers[source * 2 + 1] + dy;
  let best = -1;
  let bestDistance = Infinity;
  for (const candidate of spatial.candidates(targetX, targetY)) {
    if (patch.tileTypes && patch.tileTypes[source] !== patch.tileTypes[candidate]) continue;
    if (spatial.shapeKeys[source] !== spatial.shapeKeys[candidate]) continue;
    if (!sameTileGeometry(patch, source, candidate)) continue;
    const distance = Math.hypot(
      patch.centers[candidate * 2] - targetX,
      patch.centers[candidate * 2 + 1] - targetY,
    );
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return bestDistance <= 0.0015 ? best : -1;
}

function verifyTranslatedState(previous, automaton, spatial, dx, dy) {
  if (previous.entries.length !== automaton.active.length) return null;
  const mapped = new Map();
  const used = new Set();
  for (const [source, state] of previous.entries) {
    const destination = translatedCell(automaton.patch, spatial, source, dx, dy);
    if (destination < 0 || used.has(destination) || automaton.state[destination] !== state) return null;
    used.add(destination);
    mapped.set(source, destination);
  }
  if (used.size !== automaton.active.length) return null;
  return mapped;
}

function translatedNeighborhoodRadius(previous, automaton, spatial, dx, dy, activeMapping, maximumRadius = 3) {
  const { graph, patch } = automaton;
  let frontier = previous.entries.map(([cell]) => cell);
  const distance = new Map(frontier.map((cell) => [cell, 0]));
  for (let radius = 0; radius < maximumRadius; radius++) {
    const next = [];
    for (const cell of frontier) {
      for (let cursor = graph.offsets[cell]; cursor < graph.offsets[cell + 1]; cursor++) {
        const neighbor = graph.neighbors[cursor];
        if (!distance.has(neighbor)) {
          distance.set(neighbor, radius + 1);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }

  const mapping = new Map(activeMapping);
  const usedDestinations = new Set(mapping.values());
  let matchedRadius = maximumRadius;
  for (const [source, radius] of distance) {
    if (!mapping.has(source)) {
      const destination = translatedCell(patch, spatial, source, dx, dy);
      if (destination < 0 || usedDestinations.has(destination)) {
        matchedRadius = Math.min(matchedRadius, radius - 1);
        continue;
      }
      mapping.set(source, destination);
      usedDestinations.add(destination);
    }
    const destination = mapping.get(source);
    if (graph.degree[source] !== graph.degree[destination]) {
      matchedRadius = Math.min(matchedRadius, radius - 1);
    }
  }

  for (const [source, sourceRadius] of distance) {
    if (sourceRadius > matchedRadius) continue;
    const destination = mapping.get(source);
    if (destination === undefined) return Math.max(0, sourceRadius - 1);
    const destinationNeighbors = new Set(
      graph.neighbors.slice(graph.offsets[destination], graph.offsets[destination + 1]),
    );
    for (let cursor = graph.offsets[source]; cursor < graph.offsets[source + 1]; cursor++) {
      const sourceNeighbor = graph.neighbors[cursor];
      if (!distance.has(sourceNeighbor) || distance.get(sourceNeighbor) > matchedRadius) continue;
      if (!destinationNeighbors.has(mapping.get(sourceNeighbor))) {
        return Math.max(0, sourceRadius - 1);
      }
    }
  }
  return Math.max(0, matchedRadius);
}

function candidateScore(metrics, initialSize, options) {
  let score = metrics.effectiveDisplacement * 500 + metrics.effectiveMobility * 1500;
  score += metrics.farthestGeneration * 2 + metrics.territory * 0.4;
  score += metrics.directionality * 500;
  score -= metrics.maximumRadius * 110 + metrics.maximumActive * 1.5 + initialSize * 4;
  if (metrics.translatedReturns.length) {
    const best = metrics.translatedReturns.reduce((left, right) =>
      right.distance > left.distance ? right : left);
    const sustainedFactor = Math.min(1, metrics.evaluatedGenerations / 30);
    score += sustainedFactor * (
      100000 + best.distance * 10000 + best.period * 20 + best.neighborhoodRadius * 500
    );
  }
  if (metrics.outcome === 'horizon') score += 2000;
  else if (metrics.outcome === 'limit') score -= 20000;
  else if (metrics.outcome === 'extinct') {
    score -= 300 + Math.max(0, 30 - metrics.evaluatedGenerations) * 3000;
  }
  else if (metrics.outcome === 'cycle' && metrics.maximumDisplacement < 1) score -= 1000;
  if (metrics.minimumBoundaryDistance < Math.min(3, options.minimumBoundaryDistance)) score -= 10000;
  return score;
}

function entrySignature(entries) {
  return entries.map(([cell, state]) => `${cell}.${state}`).join(',');
}

function canonicalEntrySignature(entries) {
  return entries
    .slice()
    .sort((left, right) => left[0] - right[0] || left[1] - right[1])
    .map(([cell, state]) => `${cell}.${state}`)
    .join(',');
}

function retainUnique(pool, candidate, compare, limit, signatureOf = entrySignature) {
  pool.push(candidate);
  pool.sort(compare);
  const unique = [];
  const signatures = new Set();
  for (const item of pool) {
    const signature = signatureOf(item.entries);
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    unique.push(item);
    if (unique.length >= limit) break;
  }
  return unique;
}

function translatedCandidateOrder(left, right) {
  function summary(candidate) {
    const returns = candidate.metrics.translatedReturns;
    return {
      radius: Math.max(...returns.map((item) => item.neighborhoodRadius)),
      latest: Math.max(...returns.map((item) => item.toGeneration)),
      count: returns.length,
      distance: Math.max(...returns.map((item) => item.distance)),
    };
  }
  const a = summary(left);
  const b = summary(right);
  return b.radius - a.radius ||
    b.latest - a.latest ||
    b.count - a.count ||
    right.metrics.evaluatedGenerations - left.metrics.evaluatedGenerations ||
    b.distance - a.distance ||
    right.metrics.maximumDisplacement - left.metrics.maximumDisplacement ||
    left.metrics.maximumRadius - right.metrics.maximumRadius ||
    right.metrics.score - left.metrics.score;
}

function evaluate(automaton, entries, options, spatial, captureTrace = false) {
  automaton.initialize(entries);
  const initialGeometry = geometry(automaton);
  const absoluteHistory = new Map();
  const shapeHistory = new Map();
  const territory = new Set(automaton.active);
  const translatedReturns = [];
  const trace = [];
  let maximumActive = automaton.active.length;
  let maximumRadius = initialGeometry.radius;
  let maximumDisplacement = 0;
  let farthestGeneration = 0;
  let activeAtFarthest = automaton.active.length;
  let radiusAtFarthest = initialGeometry.radius;
  let farthestTrace = null;
  let pathToFarthest = 0;
  let path = 0;
  let previousCenter = initialGeometry.center;
  let minimumBoundaryDistance = 0xffff;
  let outcome = 'horizon';
  let terminationReason = 'horizon';
  let transient = 0;
  let period = 0;
  let evaluatedGenerations = 0;

  for (let generation = 0; generation <= options.horizon; generation++) {
    evaluatedGenerations = generation;
    if (!automaton.active.length) {
      outcome = 'extinct';
      terminationReason = 'extinct';
      break;
    }

    const currentGeometry = geometry(automaton);
    if (previousCenter && currentGeometry.center && generation > 0) {
      path += Math.hypot(
        currentGeometry.center[0] - previousCenter[0],
        currentGeometry.center[1] - previousCenter[1],
      );
    }
    previousCenter = currentGeometry.center;
    const displacement = Math.hypot(
      currentGeometry.center[0] - initialGeometry.center[0],
      currentGeometry.center[1] - initialGeometry.center[1],
    );
    if (displacement > maximumDisplacement) {
      maximumDisplacement = displacement;
      farthestGeneration = generation;
      activeAtFarthest = automaton.active.length;
      radiusAtFarthest = currentGeometry.radius;
      pathToFarthest = path;
      farthestTrace = {
        generation,
        active: automaton.active.length,
        x: currentGeometry.center[0],
        y: currentGeometry.center[1],
        radius: currentGeometry.radius,
        displacement,
      };
    }
    maximumRadius = Math.max(maximumRadius, currentGeometry.radius);
    maximumActive = Math.max(maximumActive, automaton.active.length);
    for (const cell of automaton.active) {
      territory.add(cell);
      minimumBoundaryDistance = Math.min(minimumBoundaryDistance, automaton.graph.boundaryDistance[cell]);
    }
    if (captureTrace && (generation < 10 || generation % 10 === 0 || generation === options.horizon)) {
      trace.push({
        generation,
        active: automaton.active.length,
        x: currentGeometry.center[0],
        y: currentGeometry.center[1],
        radius: currentGeometry.radius,
        displacement,
      });
    }

    const absolute = automaton.signature();
    if (absoluteHistory.has(absolute)) {
      outcome = 'cycle';
      terminationReason = 'cycle';
      transient = absoluteHistory.get(absolute);
      period = generation - transient;
      break;
    }
    absoluteHistory.set(absolute, generation);

    const shape = translatedShapeSignature(automaton, spatial);
    const priorShapes = shapeHistory.get(shape);
    if (priorShapes) {
      for (let index = priorShapes.length - 1; index >= 0; index--) {
        const previous = priorShapes[index];
        const dx = currentGeometry.center[0] - previous.center[0];
        const dy = currentGeometry.center[1] - previous.center[1];
        const distance = Math.hypot(dx, dy);
        if (distance < 0.05) continue;
        const mapping = verifyTranslatedState(previous, automaton, spatial, dx, dy);
        if (!mapping) continue;
        translatedReturns.push({
          fromGeneration: previous.generation,
          toGeneration: generation,
          period: generation - previous.generation,
          dx,
          dy,
          distance,
          active: automaton.active.length,
          neighborhoodRadius: translatedNeighborhoodRadius(
            previous, automaton, spatial, dx, dy, mapping,
          ),
        });
        break;
      }
    }
    const shapeRecord = {
      generation,
      center: currentGeometry.center,
      entries: automaton.entries(),
    };
    if (priorShapes) {
      priorShapes.push(shapeRecord);
      if (priorShapes.length > 8) priorShapes.shift();
    } else {
      shapeHistory.set(shape, [shapeRecord]);
    }

    if (maximumActive > options.maxActive) {
      outcome = 'limit';
      terminationReason = 'maximum-active';
      break;
    }
    if (maximumRadius > options.maxRadius) {
      outcome = 'limit';
      terminationReason = 'maximum-radius';
      break;
    }
    if (minimumBoundaryDistance < 2) {
      outcome = 'limit';
      terminationReason = 'boundary';
      break;
    }
    if (generation === options.horizon) break;
    automaton.step();
  }

  const finalGeometry = geometry(automaton);
  const endDisplacement = finalGeometry.center
    ? Math.hypot(
      finalGeometry.center[0] - initialGeometry.center[0],
      finalGeometry.center[1] - initialGeometry.center[1],
    )
    : 0;
  const populationRetention = Math.min(entries.length, activeAtFarthest) /
    Math.max(entries.length, activeAtFarthest, 1);
  const durationFactor = Math.min(1, farthestGeneration / 30);
  const effectiveDisplacement = maximumDisplacement * Math.sqrt(populationRetention) * durationFactor;
  const metrics = {
    outcome,
    terminationReason,
    evaluatedGenerations,
    transient,
    period,
    initialActive: entries.length,
    finalActive: automaton.active.length,
    maximumActive,
    maximumRadius,
    territory: territory.size,
    minimumBoundaryDistance: minimumBoundaryDistance === 0xffff ? null : minimumBoundaryDistance,
    maximumDisplacement,
    farthestGeneration,
    activeAtFarthest,
    radiusAtFarthest,
    endDisplacement,
    pathLength: path,
    directionality: maximumDisplacement / Math.max(maximumDisplacement, pathToFarthest, 1e-9),
    populationRetention,
    effectiveDisplacement,
    mobility: maximumDisplacement / Math.max(0.5, maximumRadius),
    effectiveMobility: effectiveDisplacement / Math.max(0.5, maximumRadius),
    translatedReturns,
  };
  if (captureTrace) {
    if (farthestTrace && !trace.some((item) => item.generation === farthestTrace.generation)) {
      trace.push(farthestTrace);
      trace.sort((left, right) => left.generation - right.generation);
    }
    metrics.trace = trace;
  }
  metrics.score = candidateScore(metrics, entries.length, options);
  return metrics;
}

function verifyDense(entries, sparseMetrics, patch, graph, rule, generations) {
  const dense = new Core.Automaton(patch, graph, { rule, generations, borderRings: 0 });
  const sparse = new SparseAutomaton(patch, graph, rule, generations);
  sparse.initialize(entries);
  for (const [cell, state] of entries) dense.state[cell] = state;
  dense.refreshDerivedState();
  const limit = sparseMetrics.evaluatedGenerations;
  for (let generation = 0; generation <= limit; generation++) {
    assert.deepStrictEqual(sparse.state, dense.state, `sparse/dense mismatch at generation ${generation}`);
    if (generation < limit) {
      sparse.step();
      dense.step();
    }
  }
  return { passed: true, generationsCompared: limit + 1 };
}

function runSearch(options) {
  const patchOptions = options.tiling === 'penrose' ? { seed: 'sun' } : {};
  const patch = Core.buildPatch(options.tiling, options.depth, patchOptions);
  const graph = options.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const normalizedRule = Core.parseRule(options.rule, graph.maxDegree).text;
  if (Core.parseRule(normalizedRule, graph.maxDegree).birthLookup[0]) {
    throw new RangeError('mobile search does not support B0 rules');
  }
  const deterministicSeed = options.startSeed ||
    `${options.tiling}-${options.neighborhood}-${normalizedRule}-${options.generations}-mobile-v2`;
  const random = Core.mulberry32(Core.hashSeed(deterministicSeed));
  const starts = centralCells(patch, graph, options.minimumBoundaryDistance, 5000);
  if (!starts.length) throw new Error('no cells meet the requested boundary-distance constraint');
  const spatial = makeSpatialIndex(patch);
  const automaton = new SparseAutomaton(patch, graph, normalizedRule, options.generations);
  const outcomes = { horizon: 0, cycle: 0, extinct: 0, limit: 0 };
  let translatedCandidates = 0;
  let translatedElites = [];
  let elites = [];
  let best = null;

  for (let iteration = 0; iteration < options.iterations; iteration++) {
    const useElite = elites.length && random() < 0.78;
    const entries = useElite
      ? mutate(
        elites[Math.floor(Math.pow(random(), 2) * Math.min(50, elites.length))].entries,
        graph,
        random,
        options.generations,
        options.minSeed,
        options.maxSeed,
      )
      : randomConnectedSeed(
        graph,
        starts,
        random,
        options.minSeed + Math.floor(random() * (options.maxSeed - options.minSeed + 1)),
        options.generations,
      );
    const metrics = evaluate(automaton, entries, options, spatial);
    outcomes[metrics.outcome]++;
    const result = { entries, metrics };
    if (metrics.translatedReturns.length) {
      translatedCandidates++;
      translatedElites = retainUnique(
        translatedElites,
        result,
        translatedCandidateOrder,
        32,
        canonicalEntrySignature,
      );
    }
    if (!best || metrics.score > best.metrics.score) {
      best = result;
      console.error(
        `best iteration=${iteration} outcome=${metrics.outcome} travel=${metrics.maximumDisplacement.toFixed(3)}` +
        ` radius=${metrics.maximumRadius.toFixed(3)} mobility=${metrics.mobility.toFixed(3)}` +
        ` translated=${metrics.translatedReturns.length}`,
      );
    }
    elites = retainUnique(
      elites,
      result,
      (left, right) => right.metrics.score - left.metrics.score,
      100,
    );
    if ((iteration + 1) % 5000 === 0) {
      console.error(
        `progress ${iteration + 1}/${options.iterations}` +
        ` best=${best.metrics.maximumDisplacement.toFixed(2)}/${best.metrics.maximumRadius.toFixed(2)}` +
        ` translated=${translatedCandidates}`,
      );
    }
  }

  const traced = elites.slice(0, 10).map(({ entries }) => ({
    entries,
    metrics: evaluate(automaton, entries, options, spatial, true),
  }));
  traced.sort((left, right) => right.metrics.score - left.metrics.score);
  best = traced[0];
  const tracedTranslated = translatedElites.slice(0, 10).map(({ entries }) => ({
    entries,
    metrics: evaluate(automaton, entries, options, spatial, true),
  }));
  tracedTranslated.sort(translatedCandidateOrder);
  const bestTranslated = tracedTranslated[0] || null;
  const search = { ...options, rule: normalizedRule };
  delete search.output;
  const denseVerification = verifyDense(
    best.entries,
    best.metrics,
    patch,
    graph,
    normalizedRule,
    options.generations,
  );
  const translatedMatchesBest = bestTranslated &&
    canonicalEntrySignature(bestTranslated.entries) === canonicalEntrySignature(best.entries) &&
    bestTranslated.metrics.evaluatedGenerations === best.metrics.evaluatedGenerations;
  let bestTranslatedDenseVerification = null;
  if (bestTranslated) {
    bestTranslatedDenseVerification = translatedMatchesBest
      ? denseVerification
      : verifyDense(
        bestTranslated.entries,
        bestTranslated.metrics,
        patch,
        graph,
        normalizedRule,
        options.generations,
      );
  }
  return {
    schema: 3,
    generatedBy: 'research/search-mobile-patterns.js',
    search,
    deterministicSeed,
    patchCells: patch.tileCount,
    candidatesEvaluated: options.iterations,
    outcomes,
    translatedCandidates,
    bestTranslated,
    translatedElites: tracedTranslated,
    interpretation: 'Translated returns and travel metrics describe finite observed trajectories; they do not establish indefinite motion on an aperiodic substrate.',
    denseVerification,
    bestTranslatedDenseVerification,
    best,
    elites: traced,
  };
}

function main(argv) {
  if (argv.includes('--help')) {
    process.stdout.write(`${HELP}\n`);
    return;
  }
  const options = parseArguments(argv);
  const output = runSearch(options);
  const text = `${JSON.stringify(output, null, 2)}\n`;
  if (options.output) fs.writeFileSync(options.output, text);
  else process.stdout.write(text);
}

if (require.main === module) main(process.argv.slice(2));

module.exports = Object.freeze({
  evaluate,
  makeSpatialIndex,
  parseArguments,
  translatedCandidateOrder,
  runSearch,
  sameTileGeometry,
  translatedCell,
  translatedNeighborhoodRadius,
  translatedShapeSignature,
  verifyTranslatedState,
});
