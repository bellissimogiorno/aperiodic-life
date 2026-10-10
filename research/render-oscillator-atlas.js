#!/usr/bin/env node
'use strict';
// Exact catalogue phases drawn from production geometry; no illustrative cells.
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');
const catalogue = require('../discoveries.js');
const atlasIds = [
  "penrose-edge-b23s23-p822",
  "penrose-conway-c3-p14",
  "hat-b2s1-c3-rotor-p39",
  "hat-b2s23-c6-rotor-p219",
  "hat-b2s13-c4-clock-p11"
];
const output = process.argv[2] || path.join(__dirname, 'figures/oscillator-atlas.svg');
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const width = 1200, rowHeight = 300, top = 100;
const rows = atlasIds.map(id => catalogue.find(entry => entry.id === id));
if (rows.some(entry => !entry)) throw new Error('An atlas entry is missing from the catalogue');
const height = top + rows.length * rowHeight + 38;
const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  '<rect width="100%" height="100%" fill="#f7f9fc"/>',
  '<g font-family="DejaVu Sans,Arial,sans-serif" fill="#162840">',
  '<text x="30" y="38" font-size="26" font-weight="700">Localised oscillators · Aperiodic Life</text>',
  '<text x="30" y="68" font-size="15">Exact simulation phases. Blue: live (state 1). Gold: refractory (states 2 and above). Pale: dead.</text>'];
for (let row = 0; row < rows.length; row++) {
  const entry = rows[row], y = top + row * rowHeight;
  const patch = Core.buildPatch(entry.tiling, entry.depth, {seed: entry.penroseSeed || 'sun'});
  const graph = entry.neighborhood === 'edge' ? patch.edgeGraph : patch.touchGraph;
  const sim = new Core.Automaton(patch, graph, {rule:entry.rule, generations:entry.generations, borderRings:entry.borderRings});
  for (const [cell,state] of entry.cellStates) sim.state[cell] = state;
  sim.refreshDerivedState();
  const target = [0, Math.floor(entry.expectedPeriod/4), Math.floor(entry.expectedPeriod/2), Math.floor(3*entry.expectedPeriod/4)];
  const frames = new Map(), bounds = [Infinity,Infinity,-Infinity,-Infinity];
  for (let generation=0; generation<entry.expectedPeriod; generation++) {
    if(target.includes(generation)) frames.set(generation, sim.state.slice());
    for(let cell=0; cell<patch.tileCount; cell++) if(sim.state[cell]) {
      const b=cell*4; bounds[0]=Math.min(bounds[0],patch.bboxes[b]); bounds[1]=Math.min(bounds[1],patch.bboxes[b+1]);
      bounds[2]=Math.max(bounds[2],patch.bboxes[b+2]); bounds[3]=Math.max(bounds[3],patch.bboxes[b+3]);
    }
    sim.step();
  }
  const label = `${entry.title} | ${entry.rule} | ${entry.generations} states | ${entry.neighborhood} graph`;
  svg.push(`<text x="30" y="${y+6}" font-size="16" font-weight="700">${escape(label)}</text>`);
  const margin=1.5;
  bounds[0]-=margin; bounds[1]-=margin; bounds[2]+=margin; bounds[3]+=margin;
  const visible=[];
  for(let cell=0;cell<patch.tileCount;cell++) {
    const b=cell*4;
    if(patch.bboxes[b+2]>=bounds[0]&&patch.bboxes[b]<=bounds[2]&&patch.bboxes[b+3]>=bounds[1]&&patch.bboxes[b+1]<=bounds[3]) visible.push(cell);
  }
  for(let column=0;column<4;column++) {
    const x=30+column*292, panelY=y+24, panelWidth=278, panelHeight=228;
    const scale=Math.min(panelWidth/(bounds[2]-bounds[0]),panelHeight/(bounds[3]-bounds[1]));
    const cx=(bounds[0]+bounds[2])/2, cy=(bounds[1]+bounds[3])/2;
    const state=frames.get(target[column]);
    const clip=`panel-${row}-${column}`;
    svg.push(`<defs><clipPath id="${clip}"><rect x="${x}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="5"/></clipPath></defs>`,
      `<rect x="${x}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="5" fill="#ffffff" stroke="#ced6e0"/>`,
      `<g clip-path="url(#${clip})">`);
    for(const cell of visible) {
      const points=[];
      for(let vertex=0;vertex<patch.verticesPerTile;vertex++) {
        const offset=(cell*patch.verticesPerTile+vertex)*2;
        points.push(`${(x+panelWidth/2+(patch.vertices[offset]-cx)*scale).toFixed(3)},${(panelY+panelHeight/2-(patch.vertices[offset+1]-cy)*scale).toFixed(3)}`);
      }
      const fill=state[cell]===1?'#0674bb':state[cell]>1?'#eab145':'#eef2f6';
      svg.push(`<polygon points="${points.join(' ')}" fill="${fill}" stroke="#a9b6c5" stroke-width="0.45"/>`);
    }
    svg.push('</g>',`<text x="${x+6}" y="${panelY+250}" font-size="14">Generation ${target[column]}</text>`);
  }
}
svg.push(`<text x="30" y="${height-15}" font-size="13">Each period is the first return of the complete state; these are stationary oscillators, not gliders.</text>`, '</g></svg>');
fs.writeFileSync(output, svg.join('\n')+'\n');
console.log(output);
