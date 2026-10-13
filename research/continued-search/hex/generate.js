'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');
const H = require('./hex-reference.js');
const out = __dirname;
let shapes = [[[0, 0, 1]]];
const counts = [], mixed = [];
function save(name, lines) {
  const data = lines.join('\n') + '\n';
  fs.writeFileSync(`${out}/${name}`, data);
  return { file: name, count: lines.length, sha256: crypto.createHash('sha256').update(data).digest('hex') };
}
const files = [];
for (let size = 1; size <= 8; size++) {
  counts.push(shapes.length);
  if (size <= 3) {
    for (let C = 3; C <= 6; C++) {
      const seen = new Set();
      for (const shape of shapes) {
        for (let index = 0; index < (C - 1) ** size; index++) {
          let code = index;
          const cells = shape.map(([q, r]) => { const value = 1 + code % (C - 1); code = Math.floor(code / (C - 1)); return [q, r, value]; });
          if (!cells.some(c => c[2] === 1) || !cells.some(c => c[2] > 1)) continue;
          const key = H.canonicalShape(cells);
          if (seen.has(key)) continue;
          seen.add(key);
          mixed.push([`mixed-n${size}-c${C}-s${seen.size}`, C, cells.length, ...cells.flat()].join(' '));
        }
      }
    }
  }
  if (size === 7) files.push(save('n7-c4-seeds.txt', shapes.map((cells, i) => [`n7c4s${i}`, 4, cells.length, ...cells.flat()].join(' '))));
  if (size === 8) {
    files.push(save('n8-shapes.txt', shapes.map((cells, i) => [`n8s${i}`, cells.length, ...cells.flat()].join(' '))));
    break;
  }
  const next = new Map();
  for (const shape of shapes) for (const [q, r] of shape) for (const [dq, dr] of H.DIRECTIONS) {
    if (shape.some(c => c[0] === q + dq && c[1] === r + dr)) continue;
    const cells = [...shape, [q + dq, r + dr, 1]];
    const key = H.canonicalShape(cells);
    if (!next.has(key)) next.set(key, H.normalise(cells).cells);
  }
  shapes = [...next.values()];
}
files.push(save('mixed-small-seeds.txt', mixed));
fs.writeFileSync(`${out}/seed-generation.json`, JSON.stringify({ freePolyhexCounts: counts, files, mixedScope: 'All connected supports of 1–3 occupied cells, every assignment of nonzero states in C=3..6 containing at least one live and one refractory cell, modulo translations and D6; all-live seeds excluded.' }, null, 2) + '\n');
console.log(JSON.stringify({ counts, files }));
