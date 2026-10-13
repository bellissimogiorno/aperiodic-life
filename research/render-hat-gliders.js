#!/usr/bin/env node
'use strict';

// Draw genuine hat polygons and states from an independent first-match replay.
// No schematic tile placements or generated imagery are used.
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');
const tables = require('./exhaustive-search/hat-targeted/priority-rules.json');
const patch = Core.buildPatch('hat', 5);
const graph = patch.touchGraph;
const colours = ['#f5f7fa', '#2166ac', '#daa33d', '#b94b69'];
const output = process.argv[2] || path.join(__dirname, 'figures/hat-gliders.svg');

function advance(state, rows) {
  const candidates = new Set(state.keys());
  for (const i of state.keys()) {
    for (let p = graph.offsets[i]; p < graph.offsets[i + 1]; p++) candidates.add(graph.neighbors[p]);
  }
  const result = new Map();
  for (const i of candidates) {
    const own = state.get(i) || 0;
    const counts = [0, 0, 0, 0];
    for (let p = graph.offsets[i]; p < graph.offsets[i + 1]; p++) counts[state.get(graph.neighbors[p]) || 0]++;
    const row = rows.find(row => (row.own === null || row.own === own) && row.counts.every(([s, n]) => counts[s] >= n));
    if (row && row.next) result.set(i, row.next);
  }
  return result;
}

function replay(seed, name, times) {
  let state = new Map(seed);
  const frames = new Map();
  for (let t = 0; t <= Math.max(...times); t++) {
    if (times.includes(t)) frames.set(t, new Map(state));
    if (t < Math.max(...times)) state = advance(state, tables[name].rows);
  }
  return frames;
}

function bounds(cells, padding = 0) {
  const result = [Infinity, Infinity, -Infinity, -Infinity];
  for (const i of cells) {
    const b = patch.bboxes.subarray(4 * i, 4 * i + 4);
    result[0] = Math.min(result[0], b[0]); result[1] = Math.min(result[1], b[1]);
    result[2] = Math.max(result[2], b[2]); result[3] = Math.max(result[3], b[3]);
  }
  return [result[0] - padding, result[1] - padding, result[2] + padding, result[3] + padding];
}

function centre(state) {
  let x = 0, y = 0;
  for (const i of state.keys()) { x += patch.centers[2 * i]; y += patch.centers[2 * i + 1]; }
  return [x / state.size, y / state.size];
}

function groups(state) {
  const remaining = new Set(state.keys()), result = [];
  while (remaining.size) {
    const queue = [remaining.values().next().value]; remaining.delete(queue[0]);
    for (let p = 0; p < queue.length; p++) {
      const a = queue[p];
      for (const b of remaining) {
        if (Math.hypot(patch.centers[2 * a] - patch.centers[2 * b], patch.centers[2 * a + 1] - patch.centers[2 * b + 1]) < 12) {
          remaining.delete(b); queue.push(b);
        }
      }
    }
    result.push(new Map(queue.map(i => [i, state.get(i)])));
  }
  return result.sort((a, b) => centre(a)[0] - centre(b)[0]);
}

const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1140" viewBox="0 0 1600 1140">',
  '<rect width="1600" height="1140" fill="#ffffff"/>',
  '<style>text{font-family:Arial,Helvetica,sans-serif;fill:#223348}.title{font-size:30px;font-weight:700}.section{font-size:22px;font-weight:700}.label{font-size:18px;font-weight:700}.note{font-size:16px;fill:#516173}.small{font-size:14px;fill:#516173}</style>'];
function text(x, y, value, cls = 'note') { parts.push(`<text x="${x}" y="${y}" class="${cls}">${xml(value)}</text>`); }
function plot(box, world, state, options = {}) {
  const [x, y, width, height] = box;
  const scale = Math.min(width / (world[2] - world[0]), height / (world[3] - world[1]));
  const ox = x + (width - (world[2] - world[0]) * scale) / 2 - world[0] * scale;
  const oy = y + (height - (world[3] - world[1]) * scale) / 2 - world[1] * scale;
  const map = (wx, wy) => [ox + wx * scale, oy + wy * scale];
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="#fafbfd" stroke="#dce3ea"/>`);
  const visible = [];
  for (let i = 0; i < patch.tileCount; i++) {
    const b = patch.bboxes.subarray(4 * i, 4 * i + 4);
    if (b[0] >= world[0] && b[1] >= world[1] && b[2] <= world[2] && b[3] <= world[3]) visible.push(i);
  }
  const drawTile = (i, s) => {
    const points = [];
    for (let j = 0; j < patch.verticesPerTile; j++) {
      const p = (i * patch.verticesPerTile + j) * 2;
      const [px, py] = map(patch.vertices[p], patch.vertices[p + 1]);
      points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
    }
    parts.push(`<polygon points="${points.join(' ')}" fill="${colours[s]}" stroke="${s ? '#ffffff' : '#dbe1e8'}" stroke-width="${s ? 0.65 : options.faint ? 0.28 : 0.55}"/>`);
  };
  for (const i of visible) drawTile(i, 0);
  for (const [i, s] of state) drawTile(i, s);
  return { map, scale };
}

text(40, 48, 'Einstein-hat gliders and a three-way launcher', 'title');
text(40, 80, 'Actual hat polygons and complete states · vertex neighbourhood · independently replayed priority-table rules');
text(40, 126, 'Published Hat B: a single travelling relay', 'section');
const bFrames = replay([[2945, 1], [2943, 3]], 'B', [0, 40, 100, 200]);
const startCentre = centre(bFrames.get(0));
let index = 0;
for (const [time, state] of bFrames) {
  const x = 40 + index * 390;
  text(x + 14, 164, `Generation ${time}`, 'label');
  const c = centre(state), world = [c[0] - 11, c[1] - 8, c[0] + 11, c[1] + 8];
  plot([x, 180, 360, 258], world, state);
  text(x + 12, 463, `${state.size} nonzero tiles`, 'small');
  const displacement = Math.hypot(c[0] - startCentre[0], c[1] - startCentre[1]);
  text(x + 12, 486, `Centroid displacement: ${displacement.toFixed(1)}`, 'small');
  index++;
}
text(40, 518, 'Equal scale in the four close-ups; each is centred on the object. Displacements use the app’s world coordinates.', 'small');
text(40, 562, 'Published Hat C: two seed tiles launch three separated travelling objects', 'section');
const cFrames = replay([[23905, 1], [23907, 2]], 'C', [0, 80, 120, 160]);
const final = cFrames.get(160), separated = groups(final);
if (separated.length !== 3) throw new Error(`Expected three separated objects, got ${separated.length}`);
const allCells = new Set(); for (const frame of cFrames.values()) for (const i of frame.keys()) allCells.add(i);
const camera = plot([40, 586, 1010, 410], bounds(allCells, 13), final, { faint: true });
const seedPoint = camera.map(...centre(cFrames.get(0)));
parts.push(`<circle cx="${seedPoint[0].toFixed(2)}" cy="${seedPoint[1].toFixed(2)}" r="5" fill="none" stroke="#223348" stroke-width="1.4"/>`);
text(seedPoint[0] + 8, seedPoint[1] - 8, 'Seed', 'small');
for (let i = 0; i < separated.length; i++) {
  const group = separated[i], c = centre(group), p = camera.map(...c);
  parts.push(`<circle cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="18" fill="none" stroke="#66788a" stroke-width="1"/>`);
  text(p[0] + 21, p[1] + 6, String(i + 1), 'label');
  const y = 586 + i * 138;
  plot([1090, y, 460, 124], [c[0] - 12, c[1] - 5.7, c[0] + 12, c[1] + 5.7], group);
  text(1100, y + 22, String(i + 1), 'label');
}
text(40, 1022, 'Generation 160. The overview and the three magnified views show the same complete configuration.', 'small');
for (let s = 0; s < 4; s++) {
  const x = 40 + s * 220;
  parts.push(`<rect x="${x}" y="1048" width="20" height="20" fill="${colours[s]}" stroke="#cbd5df"/>`);
  text(x + 30, 1064, s === 0 ? 'State 0 (quiescent)' : `State ${s}`, 'small');
}
text(40, 1100, 'Rules and prior glider discovery: James Edmond, arXiv:2609.22579v1, Tables 5–6. Seed placements found in this project.', 'small');
text(40, 1124, 'These images document finite, boundary-free observations; they do not prove perpetual propagation.', 'small');
parts.push('</svg>');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, parts.join('\n') + '\n');
console.log(JSON.stringify({ output, bytes: fs.statSync(output).size, bFrames: [...bFrames].map(([t, s]) => [t, s.size]), cFinalPopulation: final.size }));
