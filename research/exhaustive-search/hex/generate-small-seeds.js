'use strict';

// Free connected polyhexes: translations, reflections and rotations are
// equivalent. All seed cells are initially live.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const reference = require('../../hex-reference');
const outputDirectory = path.resolve(process.argv[2] || '.');
fs.mkdirSync(outputDirectory, { recursive: true });
let shapes = [[[0, 0, 1]]];
const small = [];
const counts = [];
for (let size = 1; size <= 6; size++) {
  counts.push(shapes.length);
  if (size <= 4) small.push(...shapes);
  else fs.writeFileSync(path.join(outputDirectory, `n${size}-seeds.txt`),
    shapes.map((cells, index) => [`n${size}s${index}`, cells.length, ...cells.flat()].join(' ')).join('\n') + '\n');
  const next = new Map();
  for (const shape of shapes) for (const [q, r] of shape) {
    for (const [dq, dr] of reference.DIRECTIONS) {
      if (shape.some(cell => cell[0] === q + dq && cell[1] === r + dr)) continue;
      const candidate = [...shape, [q + dq, r + dr, 1]];
      const key = reference.canonicalShape(candidate);
      if (!next.has(key)) next.set(key, reference.normalise(candidate).cells);
    }
  }
  shapes = [...next.values()];
}
assert.deepEqual(counts, [1, 1, 3, 7, 22, 82]);
fs.writeFileSync(path.join(outputDirectory, 'small-seeds.txt'),
  small.map((cells, index) => [index, cells.length, ...cells.flat()].join(' ')).join('\n') + '\n');
console.log(JSON.stringify({ seedSizes: [1, 2, 3, 4, 5, 6], counts, total: counts.reduce((a, b) => a + b) }));
