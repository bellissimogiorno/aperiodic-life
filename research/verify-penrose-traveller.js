#!/usr/bin/env node
'use strict';

/**
 * Reproduce and transplant the compact four-state Penrose traveller.
 *
 * The source state was found on the depth-8 sun patch.  A transplant is
 * accepted only when every nonzero source tile has an exactly corresponding
 * polygon (up to the documented floating-point quantisation) under one common
 * Euclidean translation.  Each eligible placement is then evolved until the
 * requested horizon, extinction, loss of compactness, or a boundary approach.
 */
const assert = require('assert');
const fs = require('fs');
const Core = require('../core.js');
const { SparseAutomaton } = require('./lib/sparse-automaton.js');

const SOURCE_DEPTH = 8;
const SOURCE_ENTRIES = Object.freeze([
  Object.freeze([1100, 1]),
  Object.freeze([1102, 3]),
  Object.freeze([1104, 1]),
  Object.freeze([1107, 3]),
  Object.freeze([1112, 3]),
  Object.freeze([1113, 3]),
  Object.freeze([1115, 3]),
  Object.freeze([1121, 1]),
  Object.freeze([1134, 2]),
]);
const POLYGON_SCALE = 128;
const CENTER_TOLERANCE = 0.002;

if (process.argv.includes('--help')) {
  console.log(`Usage: node research/verify-penrose-traveller.js [options]

Options are supplied as --name value pairs:
  --depth N                       target Penrose depth (default 11)
  --horizon N                     maximum generations (default 1000)
  --minimumBoundaryDistance N     initial placement margin (default 15)
  --maxActive N                   compactness population cap (default 30)
  --maxRadius N                   compactness radius cap (default 5)
  --output path.json`);
  process.exit(0);
}

function parseArguments(argv) {
  const result = {
    depth: 11,
    horizon: 1000,
    minimumBoundaryDistance: 15,
    maxActive: 30,
    maxRadius: 5,
    output: '',
  };
  const numeric = new Set([
    'depth', 'horizon', 'minimumBoundaryDistance', 'maxActive', 'maxRadius',
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
  for (const key of ['depth', 'horizon', 'minimumBoundaryDistance', 'maxActive']) {
    result[key] = Math.trunc(result[key]);
  }
  if (result.depth < SOURCE_DEPTH || result.depth > 11) {
    throw new RangeError(`depth must be from ${SOURCE_DEPTH} to 11`);
  }
  if (result.horizon < 1 || result.minimumBoundaryDistance < 2 || result.maxActive < 1) {
    throw new RangeError('horizon and maxActive must be positive; minimumBoundaryDistance must be at least 2');
  }
  if (!(result.maxRadius > 0)) throw new RangeError('maxRadius must be positive');
  return result;
}

function makePolygonKeyer(patch) {
  const outlineCenter = patch.outline.reduce(
    (sum, point) => [sum[0] + point.x, sum[1] + point.y],
    [0, 0],
  ).map((sum) => sum / patch.outline.length);

  return function polygonKey(cell) {
    const transform = cell * 6;
    const vertices = patch.outline.map((point) => {
      const localX = point.x - outlineCenter[0];
      const localY = point.y - outlineCenter[1];
      const x = patch.transforms[transform] * localX +
        patch.transforms[transform + 1] * localY;
      const y = patch.transforms[transform + 3] * localX +
        patch.transforms[transform + 4] * localY;
      return `${Math.round(x * POLYGON_SCALE)},${Math.round(y * POLYGON_SCALE)}`;
    }).sort();
    const type = patch.tileTypes ? patch.tileTypes[cell] : 0;
    return `${type}|${vertices.join('|')}`;
  };
}

function makeSpatialIndex(patch) {
  const buckets = new Map();
  for (let cell = 0; cell < patch.tileCount; cell++) {
    const key = `${Math.round(patch.centers[cell * 2] * POLYGON_SCALE)},` +
      `${Math.round(patch.centers[cell * 2 + 1] * POLYGON_SCALE)}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(cell);
    else buckets.set(key, [cell]);
  }
  return buckets;
}

function translatedCell(patch, polygonKeys, spatial, x, y, polygonKey) {
  const qx = Math.round(x * POLYGON_SCALE);
  const qy = Math.round(y * POLYGON_SCALE);
  let best = -1;
  let bestDistance = Infinity;
  for (let offsetX = -1; offsetX <= 1; offsetX++) {
    for (let offsetY = -1; offsetY <= 1; offsetY++) {
      const bucket = spatial.get(`${qx + offsetX},${qy + offsetY}`) || [];
      for (const candidate of bucket) {
        if (polygonKeys[candidate] !== polygonKey) continue;
        const distance = Math.hypot(
          patch.centers[candidate * 2] - x,
          patch.centers[candidate * 2 + 1] - y,
        );
        if (distance < bestDistance) {
          best = candidate;
          bestDistance = distance;
        }
      }
    }
  }
  return bestDistance <= CENTER_TOLERANCE ? best : -1;
}

function findPlacements(sourcePatch, targetPatch, targetGraph, minimumBoundaryDistance) {
  const sourcePolygonKey = makePolygonKeyer(sourcePatch);
  const targetPolygonKey = makePolygonKeyer(targetPatch);
  const sourceKeys = new Map(
    SOURCE_ENTRIES.map(([cell]) => [cell, sourcePolygonKey(cell)]),
  );
  const targetKeys = Array.from(
    { length: targetPatch.tileCount },
    (_, cell) => targetPolygonKey(cell),
  );
  const spatial = makeSpatialIndex(targetPatch);
  const anchor = SOURCE_ENTRIES[0][0];
  const anchorX = sourcePatch.centers[anchor * 2];
  const anchorY = sourcePatch.centers[anchor * 2 + 1];
  const anchorKey = sourceKeys.get(anchor);
  const placements = [];
  let exactPlacements = 0;

  for (let target = 0; target < targetPatch.tileCount; target++) {
    if (targetKeys[target] !== anchorKey) continue;
    const dx = targetPatch.centers[target * 2] - anchorX;
    const dy = targetPatch.centers[target * 2 + 1] - anchorY;
    const entries = [];
    let valid = true;
    for (const [source, state] of SOURCE_ENTRIES) {
      const destination = translatedCell(
        targetPatch,
        targetKeys,
        spatial,
        sourcePatch.centers[source * 2] + dx,
        sourcePatch.centers[source * 2 + 1] + dy,
        sourceKeys.get(source),
      );
      if (destination < 0) {
        valid = false;
        break;
      }
      entries.push([destination, state]);
    }
    if (!valid || new Set(entries.map(([cell]) => cell)).size !== entries.length) continue;
    exactPlacements++;
    const initialBoundaryDistance = Math.min(
      ...entries.map(([cell]) => targetGraph.boundaryDistance[cell]),
    );
    if (initialBoundaryDistance >= minimumBoundaryDistance) {
      placements.push({ dx, dy, entries, initialBoundaryDistance });
    }
  }
  return { exactPlacements, placements };
}

function geometry(patch, cells) {
  if (!cells.length) return { center: null, radius: 0 };
  let x = 0;
  let y = 0;
  for (const cell of cells) {
    x += patch.centers[cell * 2];
    y += patch.centers[cell * 2 + 1];
  }
  x /= cells.length;
  y /= cells.length;
  let radius = 0;
  for (const cell of cells) {
    radius = Math.max(radius, Math.hypot(
      patch.centers[cell * 2] - x,
      patch.centers[cell * 2 + 1] - y,
    ));
  }
  return { center: [x, y], radius };
}

function componentCount(graph, cells) {
  const included = new Set(cells);
  const seen = new Set();
  let components = 0;
  for (const start of cells) {
    if (seen.has(start)) continue;
    components++;
    const queue = [start];
    seen.add(start);
    for (let head = 0; head < queue.length; head++) {
      const cell = queue[head];
      for (let cursor = graph.offsets[cell]; cursor < graph.offsets[cell + 1]; cursor++) {
        const neighbor = graph.neighbors[cursor];
        if (included.has(neighbor) && !seen.has(neighbor)) {
          seen.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }
  return components;
}

function evaluate(automaton, placement, options) {
  automaton.initialize(placement.entries);
  const initialGeometry = geometry(automaton.patch, automaton.active);
  const territory = new Set(automaton.active);
  const checkpoints = {};
  let outcome = 'horizon';
  let evaluatedGenerations = 0;
  let minimumActive = Infinity;
  let maximumActive = 0;
  let minimumLive = Infinity;
  let maximumLive = 0;
  let maximumRadius = 0;
  let minimumBoundaryDistance = Infinity;
  let maximumComponents = 0;
  let pathLength = 0;
  let previousCenter = initialGeometry.center;
  let finalGeometry = initialGeometry;
  let sumT = 0;
  let sumTT = 0;
  let sumX = 0;
  let sumY = 0;
  let sumTX = 0;
  let sumTY = 0;
  let observations = 0;
  const regressionPoints = [];

  for (let generation = 0; generation <= options.horizon; generation++) {
    evaluatedGenerations = generation;
    if (!automaton.active.length) {
      outcome = 'extinct';
      break;
    }

    const currentGeometry = geometry(automaton.patch, automaton.active);
    finalGeometry = currentGeometry;
    if (generation > 0) {
      pathLength += Math.hypot(
        currentGeometry.center[0] - previousCenter[0],
        currentGeometry.center[1] - previousCenter[1],
      );
    }
    previousCenter = currentGeometry.center;
    const boundaryDistance = Math.min(
      ...automaton.active.map((cell) => automaton.graph.boundaryDistance[cell]),
    );
    const active = automaton.active.length;
    const live = automaton.live.length;
    minimumActive = Math.min(minimumActive, active);
    maximumActive = Math.max(maximumActive, active);
    minimumLive = Math.min(minimumLive, live);
    maximumLive = Math.max(maximumLive, live);
    maximumRadius = Math.max(maximumRadius, currentGeometry.radius);
    minimumBoundaryDistance = Math.min(minimumBoundaryDistance, boundaryDistance);
    maximumComponents = Math.max(
      maximumComponents,
      componentCount(automaton.graph, automaton.active),
    );
    for (const cell of automaton.active) territory.add(cell);

    const displacement = Math.hypot(
      currentGeometry.center[0] - initialGeometry.center[0],
      currentGeometry.center[1] - initialGeometry.center[1],
    );
    if (generation === 100 || generation === 200) {
      checkpoints[generation] = { active, live, displacement, boundaryDistance };
    }
    sumT += generation;
    sumTT += generation * generation;
    sumX += currentGeometry.center[0];
    sumY += currentGeometry.center[1];
    sumTX += generation * currentGeometry.center[0];
    sumTY += generation * currentGeometry.center[1];
    observations++;
    regressionPoints.push([generation, ...currentGeometry.center]);

    if (maximumActive > options.maxActive || maximumRadius > options.maxRadius) {
      outcome = 'spread';
      break;
    }
    if (boundaryDistance < 2) {
      outcome = 'boundary';
      break;
    }
    if (generation < options.horizon) automaton.step();
  }

  const displacement = finalGeometry.center ? Math.hypot(
    finalGeometry.center[0] - initialGeometry.center[0],
    finalGeometry.center[1] - initialGeometry.center[1],
  ) : 0;
  const denominator = observations * sumTT - sumT * sumT;
  const velocityX = denominator ? (observations * sumTX - sumT * sumX) / denominator : 0;
  const velocityY = denominator ? (observations * sumTY - sumT * sumY) / denominator : 0;
  const meanT = sumT / observations;
  const meanX = sumX / observations;
  const meanY = sumY / observations;
  let residual = 0;
  let total = 0;
  for (const [generation, x, y] of regressionPoints) {
    residual += (x - (meanX + velocityX * (generation - meanT))) ** 2 +
      (y - (meanY + velocityY * (generation - meanT))) ** 2;
    total += (x - meanX) ** 2 + (y - meanY) ** 2;
  }

  return {
    outcome,
    evaluatedGenerations,
    initialBoundaryDistance: placement.initialBoundaryDistance,
    minimumBoundaryDistance,
    initialActive: placement.entries.length,
    finalActive: automaton.active.length,
    activeRange: [minimumActive, maximumActive],
    liveRange: [minimumLive, maximumLive],
    maximumRadius,
    maximumComponents,
    territory: territory.size,
    initialCenter: initialGeometry.center,
    finalCenter: finalGeometry.center,
    displacement,
    pathLength,
    velocity: [velocityX, velocityY],
    speed: Math.hypot(velocityX, velocityY),
    trajectoryR2: total ? 1 - residual / total : null,
    checkpoints,
    finalEntries: automaton.entries(),
  };
}

function verifyDense(entries, generations, patch, graph) {
  const sparse = new SparseAutomaton(patch, graph, 'B2/S', 4);
  const dense = new Core.Automaton(patch, graph, {
    rule: 'B2/S', generations: 4, borderRings: 0,
  });
  sparse.initialize(entries);
  for (const [cell, state] of entries) dense.state[cell] = state;
  dense.refreshDerivedState();
  for (let generation = 0; generation <= generations; generation++) {
    assert.deepStrictEqual(
      sparse.state,
      dense.state,
      `sparse/dense mismatch at generation ${generation}`,
    );
    if (generation < generations) {
      sparse.step();
      dense.step();
    }
  }
  return { passed: true, generationsCompared: generations + 1 };
}

const options = parseArguments(process.argv.slice(2));
const sourcePatch = Core.buildPatch('penrose', SOURCE_DEPTH, { seed: 'sun' });
const targetPatch = Core.buildPatch('penrose', options.depth, { seed: 'sun' });
const targetGraph = targetPatch.touchGraph;
const { exactPlacements, placements } = findPlacements(
  sourcePatch,
  targetPatch,
  targetGraph,
  options.minimumBoundaryDistance,
);
if (!placements.length) throw new Error('no eligible exact-polygon transplants found');

const automaton = new SparseAutomaton(targetPatch, targetGraph, 'B2/S', 4);
const results = placements.map((placement) => ({
  entries: placement.entries,
  metrics: evaluate(automaton, placement, options),
}));
results.sort((left, right) =>
  right.metrics.evaluatedGenerations - left.metrics.evaluatedGenerations ||
  right.metrics.displacement - left.metrics.displacement);
const best = results[0];
const outcomes = { horizon: 0, boundary: 0, extinct: 0, spread: 0 };
for (const result of results) outcomes[result.metrics.outcome]++;
const compactThrough100 = results.filter((result) =>
  result.metrics.evaluatedGenerations >= 100 && result.metrics.checkpoints[100]).length;
const travelled80By100 = results.filter((result) =>
  result.metrics.checkpoints[100]?.displacement > 80).length;
const compactThrough200 = results.filter((result) =>
  result.metrics.evaluatedGenerations >= 200 && result.metrics.checkpoints[200]).length;
const travelled160By200 = results.filter((result) =>
  result.metrics.checkpoints[200]?.displacement > 160).length;

const searchOptions = { ...options };
delete searchOptions.output;
const output = {
  schema: 1,
  generatedBy: 'research/verify-penrose-traveller.js',
  model: {
    tiling: 'penrose',
    seed: 'sun',
    neighborhood: 'touch',
    rule: 'B2/S',
    generations: 4,
  },
  source: { depth: SOURCE_DEPTH, entries: SOURCE_ENTRIES },
  target: { depth: options.depth, cells: targetPatch.tileCount },
  options: searchOptions,
  matching: {
    method: 'common Euclidean translation with canonical affine-outline polygon keys',
    polygonQuantizationScale: POLYGON_SCALE,
    centerTolerance: CENTER_TOLERANCE,
    exactPlacements,
    eligiblePlacements: placements.length,
  },
  outcomes,
  robustness: {
    compactThrough100,
    travelled80By100,
    compactThrough200,
    travelled160By200,
  },
  interpretation: 'All measurements are finite-patch observations. A boundary outcome means the compact state was stopped before another potentially boundary-dependent transition.',
  denseVerification: verifyDense(
    best.entries,
    best.metrics.evaluatedGenerations,
    targetPatch,
    targetGraph,
  ),
  best,
  top: results.slice(0, 10),
};
const text = `${JSON.stringify(output, null, 2)}\n`;
if (options.output) fs.writeFileSync(options.output, text);
else process.stdout.write(text);
