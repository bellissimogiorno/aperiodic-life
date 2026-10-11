#!/usr/bin/env node
'use strict';

// Reproduce catalogue configurations with the production automaton and polygons.
// Every row keeps one common frame, fitted to all active cells during its run.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');
const catalogue = require('../discoveries.js');

const selections = [
  {
    id: 'hex-b245s3-p57-pulsator',
    label: 'Period-57 pulsator',
    detail: 'A compact seed expands and contracts through an exact 57-generation cycle.',
    choosePopulationExtrema: true,
  },
  {
    id: 'hex-b2s3456-c7-p372-rotor',
    label: 'Period-372 rotor',
    detail: 'Each 62-generation interval rotates the complete configuration by 60 degrees.',
    phases: [0, 62, 124, 186],
  },
  {
    id: 'hex-b24s16-c3-p248-breather',
    label: 'Period-248 breather',
    detail: 'A maximum-size phase, the halfway configuration and the exact return at generation 248.',
    phases: [0, 124, 248],
    chooseActiveMaximum: true,
  },
  {
    id: 'hex-b2s1-c3-p999-rotor',
    label: 'Period-999 rotor',
    detail: 'Three 333-generation intervals complete one full rotational cycle.',
    phases: [0, 333, 666, 999],
  },
  {
    id: 'hex-b246s246-c4-p30-gun',
    label: 'Period-30 emitter',
    detail: 'Successive emissions: the complete expanding field is not a stationary oscillator.',
    phases: [0, 30, 60, 90],
  },
  {
    id: 'hex-parity-seven-copy',
    label: 'Seven-copy parity replicator',
    detail: 'By generation 8, seven separated copies of the original three-cell seed are present.',
    phases: [0, 1, 4, 8],
  },
];

const output = process.argv[2] || path.join(__dirname, 'figures/hexagonal-atlas.svg');
if (process.argv.length > 3) {
  throw new Error('Usage: node research/render-hexagonal-atlas.js [output.svg]');
}
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[character]));

function simulate(entry, selection) {
  const patch = Core.buildPatch(entry.tiling, entry.depth, { seed: entry.penroseSeed || 'sun' });
  const graph = entry.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
  const simulation = new Core.Automaton(patch, graph, {
    rule: entry.rule, generations: entry.generations, borderRings: entry.borderRings,
  });
  const byCoordinate = new Map();
  for (let cell = 0; cell < patch.tileCount; cell++) {
    byCoordinate.set(`${patch.coordinates[2 * cell]},${patch.coordinates[2 * cell + 1]}`, cell);
  }
  const assignments = [...(entry.cellStates || [])];
  for (const [q, r, state] of entry.coordinateStates || []) {
    const cell = byCoordinate.get(`${q},${r}`);
    assert.notEqual(cell, undefined, `${entry.id}: initial coordinate outside the patch`);
    assignments.push([cell, state]);
  }
  assert(assignments.length > 0, `${entry.id}: no initial cells`);
  for (const [cell, state] of assignments) {
    assert(!simulation.isLocked(cell), `${entry.id}: initial cell in the locked border`);
    simulation.state[cell] = state;
  }
  simulation.refreshDerivedState();

  const horizon = Math.max(selection.phases ? Math.max(...selection.phases) : 0, (entry.expectedPeriod || 1) - 1);
  assert(Number.isInteger(horizon) && horizon >= 3, `${entry.id}: missing render horizon`);
  const frames = [];
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (let generation = 0; generation <= horizon; generation++) {
    const state = simulation.state.slice();
    let live = 0, refractory = 0;
    for (let cell = 0; cell < patch.tileCount; cell++) {
      if (!state[cell]) continue;
      if (state[cell] === 1) live++; else refractory++;
      assert(graph.boundaryDistance[cell] > (entry.borderRings || 0) + 1,
        `${entry.id}: active state too close to the patch boundary at generation ${generation}`);
      const box = 4 * cell;
      bounds[0] = Math.min(bounds[0], patch.bboxes[box]);
      bounds[1] = Math.min(bounds[1], patch.bboxes[box + 1]);
      bounds[2] = Math.max(bounds[2], patch.bboxes[box + 2]);
      bounds[3] = Math.max(bounds[3], patch.bboxes[box + 3]);
    }
    frames.push({ generation, state, live, refractory });
    if (generation < horizon) simulation.step();
  }

  let phases = selection.phases || [0, 1, 2, 3].map(n => Math.floor(n * entry.expectedPeriod / 4));
  if (selection.choosePopulationExtrema) {
    let minimum = 0, maximum = 0;
    for (let index = 1; index < frames.length; index++) {
      if (frames[index].live < frames[minimum].live) minimum = index;
      if (frames[index].live > frames[maximum].live) maximum = index;
    }
    const chosen = new Set([minimum, maximum]);
    // Fill the two remaining slots with phases far from the selected extrema.
    while (chosen.size < 4) {
      let best = -1, separation = -1;
      for (let index = 0; index < frames.length; index++) {
        if (chosen.has(index)) continue;
        const distance = Math.min(...[...chosen].map(other => {
          const difference = Math.abs(index - other);
          return Math.min(difference, frames.length - difference);
        }));
        if (distance > separation) { best = index; separation = distance; }
      }
      chosen.add(best);
    }
    phases = [...chosen].sort((a, b) => a - b);
  }
  if (selection.chooseActiveMaximum) {
    let maximum = -1;
    for (let index = 0; index < frames.length; index++) {
      if (phases.includes(index)) continue;
      if (maximum < 0 || frames[index].live + frames[index].refractory >
          frames[maximum].live + frames[maximum].refractory) maximum = index;
    }
    phases = [...phases, maximum].sort((a, b) => a - b);
  }
  assert(phases.length === 4 && new Set(phases).size === 4);
  return { patch, bounds, frames: phases.map(generation => frames[generation]) };
}

const width = 1320, margin = 30, gutter = 20;
const panelWidth = 300, panelHeight = 220, rowHeight = 320, top = 122;
const height = top + selections.length * rowHeight + 44;
const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="atlas-title atlas-description">`,
  '<title id="atlas-title">Hexagonal configurations in Aperiodic Life</title>',
  '<desc id="atlas-description">Six configurations, each shown at four exact generations. Each row retains the same view and scale so expansion, rotation and emitted patterns can be compared. Blue cells are live; gold cells are refractory.</desc>',
  '<rect width="100%" height="100%" fill="#f7f9fc"/>',
  '<g font-family="DejaVu Sans,Arial,sans-serif" fill="#162840">',
  '<text x="30" y="42" font-size="29" font-weight="700">Hexagonal configurations · Aperiodic Life</text>',
  '<text x="30" y="73" font-size="15">Exact simulation phases on the six-neighbour grid. One common view and scale within each row.</text>',
  '<rect x="30" y="89" width="13" height="13" fill="#0674bb"/>',
  '<text x="51" y="101" font-size="13">Live (state 1)</text>',
  '<rect x="186" y="89" width="13" height="13" fill="#eab145"/>',
  '<text x="207" y="101" font-size="13">Refractory (states 2 and above)</text>',
  '<rect x="459" y="89" width="13" height="13" fill="#eef2f6" stroke="#a9b6c5"/>',
  '<text x="480" y="101" font-size="13">Dead</text>',
];

for (let row = 0; row < selections.length; row++) {
  const selection = selections[row];
  const entry = catalogue.find(candidate => candidate.id === selection.id);
  assert(entry, `Missing catalogue entry: ${selection.id}`);
  const { patch, frames, bounds } = simulate(entry, selection);
  const y = top + row * rowHeight;
  svg.push(`<text x="30" y="${y + 15}" font-size="19" font-weight="700">${escape(selection.label)} · ${escape(entry.rule)} · ${entry.generations} states</text>`);
  svg.push(`<text x="30" y="${y + 38}" font-size="13">${escape(selection.detail)}</text>`);

  const scale = Math.min((panelWidth - 24) / (bounds[2] - bounds[0] + 3),
    (panelHeight - 24) / (bounds[3] - bounds[1] + 3));
  const centreX = (bounds[0] + bounds[2]) / 2, centreY = (bounds[1] + bounds[3]) / 2;
  const visible = [];
  for (let cell = 0; cell < patch.tileCount; cell++) {
    const box = cell * 4;
    if (patch.bboxes[box + 2] >= bounds[0] - 2 && patch.bboxes[box] <= bounds[2] + 2 &&
        patch.bboxes[box + 3] >= bounds[1] - 2 && patch.bboxes[box + 1] <= bounds[3] + 2) visible.push(cell);
  }

  // Store the exact dead-cell geometry once per row and reuse it in all panels.
  // Only active polygons need their own per-frame colour assignment.
  const gridId = `hex-grid-${row}`;
  const gridPath = [];
  for (const cell of visible) {
    const points = [];
    for (let vertex = 0; vertex < patch.verticesPerTile; vertex++) {
      const offset = (cell * patch.verticesPerTile + vertex) * 2;
      const px = panelWidth / 2 + (patch.vertices[offset] - centreX) * scale;
      const py = panelHeight / 2 - (patch.vertices[offset + 1] - centreY) * scale;
      points.push(`${px.toFixed(3)},${py.toFixed(3)}`);
    }
    gridPath.push(`M${points.join('L')}Z`);
  }
  const gridStroke = Math.min(0.32, scale * 0.055).toFixed(3);
  svg.push(`<defs><path id="${gridId}" d="${gridPath.join('')}" fill="#eef2f6" stroke="#b7c2ce" stroke-width="${gridStroke}"/></defs>`);

  for (let column = 0; column < 4; column++) {
    const x = margin + column * (panelWidth + gutter), panelY = y + 50;
    const frame = frames[column], clip = `hex-panel-${row}-${column}`;
    svg.push(`<defs><clipPath id="${clip}"><rect x="${x}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="5"/></clipPath></defs>`,
      `<rect x="${x}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="5" fill="#fff" stroke="#ced6e0"/>`,
      `<g clip-path="url(#${clip})">`,
      `<use href="#${gridId}" transform="translate(${x},${panelY})"/>`);
    for (const cell of visible) {
      if (!frame.state[cell]) continue;
      const points = [];
      for (let vertex = 0; vertex < patch.verticesPerTile; vertex++) {
        const offset = (cell * patch.verticesPerTile + vertex) * 2;
        const px = x + panelWidth / 2 + (patch.vertices[offset] - centreX) * scale;
        const py = panelY + panelHeight / 2 - (patch.vertices[offset + 1] - centreY) * scale;
        if (frame.state[cell]) {
          assert(px > x && px < x + panelWidth && py > panelY && py < panelY + panelHeight,
            `${entry.id}: active polygon clipped at generation ${frame.generation}`);
        }
        points.push(`${px.toFixed(3)},${py.toFixed(3)}`);
      }
      const fill = frame.state[cell] === 1 ? '#0674bb' : frame.state[cell] > 1 ? '#eab145' : '#eef2f6';
      svg.push(`<polygon points="${points.join(' ')}" fill="${fill}" stroke="#b7c2ce" stroke-width="0.38"/>`);
    }
    svg.push('</g>',
      `<text x="${x + 5}" y="${panelY + 240}" font-size="14" font-weight="700">Generation ${frame.generation}</text>`,
      `<text x="${x + 5}" y="${panelY + 259}" font-size="12">${frame.live} live${entry.generations > 2 ? ` · ${frame.refractory} refractory` : ''}</text>`);
  }
}
svg.push(`<text x="30" y="${height - 18}" font-size="13">Generated from the catalogue, production automaton and exact tile polygons. All active cells fit inside every panel.</text>`,
  '</g></svg>');
fs.writeFileSync(output, svg.join('\n') + '\n');
console.log(output);
