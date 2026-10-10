#!/usr/bin/env node
'use strict';

// Optional maintainer illustration: node tools/render-preview.js > preview.svg
// Render that SVG as preview.png with any SVG renderer, for example Inkscape:
// inkscape preview.svg --export-filename=preview.png
// No browser or additional Node packages are needed to generate the SVG.
const Core = require('../core.js');
const catalogue = require('../discoveries.js');
const entry = catalogue.find(item => item.id === 'penrose-b12-p840-field');
const patch = Core.buildPatch(entry.tiling, entry.depth, { seed: entry.penroseSeed });
const graph = patch.edgeGraph;
const simulation = new Core.Automaton(patch, graph, entry);
simulation.randomize(entry.density, entry.randomSeed);
for (let generation = 0; generation < entry.expectedTransient; generation++) simulation.step();

const width = 1600, height = 1100;
const bounds = patch.bounds;
const scale = Math.min(980 / (bounds.maxX - bounds.minX), 870 / (bounds.maxY - bounds.minY));
const xOffset = 555 - (bounds.minX + bounds.maxX) * scale / 2;
const yOffset = 614 + (bounds.minY + bounds.maxY) * scale / 2;
const polygons = [];
for (let cell = 0; cell < patch.tileCount; cell++) {
  const points = [];
  for (let vertex = 0; vertex < patch.verticesPerTile; vertex++) {
    const index = (cell * patch.verticesPerTile + vertex) * 2;
    points.push(`${(xOffset + patch.vertices[index] * scale).toFixed(3)},${(yOffset - patch.vertices[index + 1] * scale).toFixed(3)}`);
  }
  const fill = simulation.state[cell] === 1 ? '#72e4ff' : patch.tileTypes[cell] === 0 ? '#112d3c' : '#202038';
  polygons.push(`<polygon points="${points.join(' ')}" fill="${fill}"/>`);
}

process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<title>Aperiodic Life: Penrose collective cycle at generation ${simulation.generation}</title>
<desc>Exact tile polygons and cellular states generated from the penrose-b12-p840-field catalogue entry. This is a scientific illustration, not a screenshot of the application.</desc>
<rect width="1600" height="1100" fill="#07111a"/>
<g font-family="DejaVu Sans,Arial,sans-serif">
<text x="64" y="83" fill="#e9f5fa" font-size="50" font-weight="700">Aperiodic Life</text>
<text x="66" y="130" fill="#91a9b8" font-size="23">Penrose collective cycle · rendered from the verified catalogue</text>
<g stroke="#285063" stroke-width="0.55" stroke-linejoin="round">${polygons.join('\n')}</g>
<text x="1142" y="296" fill="#72e4ff" font-size="16" font-weight="700" letter-spacing="2">PENROSE P3</text>
<text x="1140" y="350" fill="#e9f5fa" font-size="34" font-weight="700">Period ${entry.expectedPeriod}</text>
<text x="1142" y="399" fill="#b9ccd6" font-size="22">B12/S · two states</text>
<text x="1142" y="438" fill="#b9ccd6" font-size="22">Shared-edge neighbours</text>
<text x="1142" y="510" fill="#e9f5fa" font-size="26">Generation ${simulation.generation}</text>
<text x="1142" y="549" fill="#91a9b8" font-size="21">${simulation.aliveCount().toLocaleString('en-GB')} live cells</text>
<text x="1142" y="588" fill="#91a9b8" font-size="21">${patch.tileCount.toLocaleString('en-GB')} tiles in the finite patch</text>
<rect x="1142" y="650" width="20" height="20" fill="#72e4ff"/>
<text x="1176" y="668" fill="#b9ccd6" font-size="20">Live cell</text>
<rect x="1142" y="692" width="20" height="20" fill="#112d3c" stroke="#285063"/>
<rect x="1168" y="692" width="20" height="20" fill="#202038" stroke="#285063"/>
<text x="1202" y="710" fill="#b9ccd6" font-size="20">Dead rhombs</text>
<text x="1142" y="795" fill="#91a9b8" font-size="19">Exact cycle after a</text>
<text x="1142" y="825" fill="#91a9b8" font-size="19">${entry.expectedTransient}-generation transient.</text>
<text x="1142" y="886" fill="#91a9b8" font-size="19">${entry.borderRings} outer border rings</text>
<text x="1142" y="916" fill="#91a9b8" font-size="19">held dead.</text>
<text x="64" y="1060" fill="#6f8794" font-size="18">Deterministic seed: ${entry.randomSeed} · initial density ${(entry.density * 100).toFixed(0)}%</text>
</g>
</svg>\n`);
