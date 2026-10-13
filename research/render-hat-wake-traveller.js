#!/usr/bin/env node
'use strict';

// Exact local hat polygons and complete states from a direct neighbour-query
// replay of the verified four-row rule. No invented tile placements are used.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');

const evidencePath = process.argv[3] || path.join(__dirname, 'continued-search/verification/hat-relay-evidence.json');
const evidence = JSON.parse(fs.readFileSync(evidencePath));
const entry = evidence.cases.find(item => item.id === 'hat-relay-depth6-long-flight');
assert(entry, 'Missing verified depth-6 flight fixture');
const table = evidence.reducedTable;
const patch = Core.buildPatch('hat', entry.depth);
const graph = patch.touchGraph;
const times = [60, 128, 500, 1000];
const colours = ['#f6f8fb', '#2265a5', '#d5a126', '#b5466c'];
const output = process.argv[2] || path.join(__dirname, 'figures/hat-wake-traveller.svg');

function advance(state) {
  const candidates = new Set(state.keys());
  for (const cell of state.keys()) {
    for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) candidates.add(graph.neighbors[k]);
  }
  const next = new Map();
  for (const cell of candidates) {
    const own = state.get(cell) || 0;
    const counts = [0, 0, 0, 0];
    for (let k = graph.offsets[cell]; k < graph.offsets[cell + 1]; k++) counts[state.get(graph.neighbors[k]) || 0]++;
    let value = table.default;
    for (const row of table.rows) {
      if (row.state !== null && row.state !== own) continue;
      if (!Object.entries(row.atLeast).every(([s, n]) => counts[Number(s)] >= n)) continue;
      value = row.next;
      break;
    }
    if (value) next.set(cell, value);
  }
  return next;
}

function centroid(state) {
  let x = 0;
  let y = 0;
  for (const cell of state.keys()) { x += patch.centers[2 * cell]; y += patch.centers[2 * cell + 1]; }
  return [x / state.size, y / state.size];
}

let state = new Map(entry.cellStates);
const initialCentre = centroid(state);
const frames = [];
let minimumBoundary = Infinity;
let maximumActive = 0;
for (let generation = 0; generation <= times[times.length - 1]; generation++) {
  assert(state.size, 'Unexpected extinction in verified flight');
  maximumActive = Math.max(maximumActive, state.size);
  for (const cell of state.keys()) minimumBoundary = Math.min(minimumBoundary, graph.boundaryDistance[cell]);
  if (times.includes(generation)) frames.push({generation, state: new Map(state), centre: centroid(state)});
  if (generation < times[times.length - 1]) state = advance(state);
}
const displacement = Math.hypot(frames[3].centre[0] - initialCentre[0], frames[3].centre[1] - initialCentre[1]);
assert.equal(minimumBoundary, 8, 'Expected eight boundary rings through generation 1000');
assert.equal(maximumActive, 9, 'Expected complete-state population bound');
assert(Math.abs(displacement - 1071.9832130281436) < 0.001, 'Verified finite displacement changed');

const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="590" viewBox="0 0 1280 590">',
  '<rect width="1280" height="590" fill="#ffffff"/>',
  '<style>text{font-family:Arial,Helvetica,sans-serif;fill:#213347}.title{font-size:29px;font-weight:700}.heading{font-size:20px;font-weight:700}.note{font-size:16px;fill:#4a5c70}.small{font-size:14px;fill:#4a5c70}</style>'];
function text(x, y, value, cls = 'note') { parts.push(`<text x="${x}" y="${y}" class="${cls}">${xml(value)}</text>`); }
text(32, 43, 'Einstein-hat wake traveller', 'title');
text(32, 73, 'Four-state priority rule · exact tile polygons and complete states · finite verified flight');
for (let value = 0; value < 4; value++) {
  const x = 32 + value * 176;
  parts.push(`<rect x="${x}" y="99" width="19" height="19" rx="3" fill="${colours[value]}" stroke="#bdc9d4"/>`);
  text(x + 28, 114, value ? `State ${value}` : 'State 0 (dead)', 'small');
}
text(32, 147, 'Four mature snapshots at the same scale; each view is centred on the travelling object.', 'small');

frames.forEach((frame, panel) => {
  const x = 32 + panel * 309;
  const y = 187;
  const width = 287;
  const height = 252;
  const world = [frame.centre[0] - 9, frame.centre[1] - 8, frame.centre[0] + 9, frame.centre[1] + 8];
  const scale = Math.min(width / 18, height / 16);
  const ox = x + width / 2 - frame.centre[0] * scale;
  const oy = y + height / 2 - frame.centre[1] * scale;
  const clip = `panel-${panel}`;
  text(x + 8, 176, `Generation ${frame.generation}`, 'heading');
  parts.push(`<defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="9"/></clipPath></defs>`);
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="9" fill="#fafbfd" stroke="#d6dfe8"/>`);
  parts.push(`<g clip-path="url(#${clip})">`);
  function polygon(cell, value) {
    const points = [];
    for (let j = 0; j < patch.verticesPerTile; j++) {
      const k = (cell * patch.verticesPerTile + j) * 2;
      points.push(`${(ox + patch.vertices[k] * scale).toFixed(2)},${(oy + patch.vertices[k + 1] * scale).toFixed(2)}`);
    }
    parts.push(`<polygon points="${points.join(' ')}" fill="${colours[value]}" stroke="${value ? '#ffffff' : '#cdd7e1'}" stroke-width="${value ? '0.8' : '0.6'}"/>`);
  }
  for (let cell = 0; cell < patch.tileCount; cell++) {
    const box = patch.bboxes.subarray(4 * cell, 4 * cell + 4);
    if (box[2] < world[0] || box[0] > world[2] || box[3] < world[1] || box[1] > world[3]) continue;
    polygon(cell, 0);
  }
  for (const [cell, value] of frame.state) {
    const box = patch.bboxes.subarray(4 * cell, 4 * cell + 4);
    assert(box[0] >= world[0] && box[1] >= world[1] && box[2] <= world[2] && box[3] <= world[3], 'An active polygon would be clipped');
    polygon(cell, value);
  }
  parts.push('</g>');
  const travelled = Math.hypot(frame.centre[0] - initialCentre[0], frame.centre[1] - initialCentre[1]);
  const boundary = Math.min(...[...frame.state.keys()].map(cell => graph.boundaryDistance[cell]));
  text(x + 8, 467, `${frame.state.size} nonzero tiles`, 'note');
  text(x + 8, 491, `Net displacement: ${travelled.toFixed(1)}`, 'small');
  text(x + 8, 514, `Boundary clearance: ${boundary} rings`, 'small');
});
text(32, 551, `Generation 1000: ${displacement.toFixed(2)} world units from the initial centroid; at least eight dead boundary rings throughout.`, 'small');
text(32, 575, 'These are local views of a finite verified trajectory, not a proof of indefinite motion or a claim of historical priority.', 'small');
parts.push(`<metadata>${xml(JSON.stringify({fixture: entry.id, depth: entry.depth, table, frames: frames.map(frame => ({generation: frame.generation, cellStates: [...frame.state]})), displacement, minimumBoundary, maximumActive}))}</metadata>`);
parts.push('</svg>');
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, parts.join('\n') + '\n');
console.log(JSON.stringify({output, displacement, minimumBoundary, maximumActive, frames: frames.map(frame => ({generation: frame.generation, active: frame.state.size}))}));
