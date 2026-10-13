'use strict';
const fs = require('fs');
const Core = require('../../../core.js');
const depth = Number(process.argv[2] || 5);
const patch = Core.buildPatch('hat', depth);
const classes = new Map();
const shape = Array.from({length:patch.tileCount}, (_, i) => {
  const points=[];
  for(let j=0;j<patch.outline.length;j++) points.push([
    Math.round((patch.vertices[(i*patch.outline.length+j)*2]-patch.centers[i*2])*1000),
    Math.round((patch.vertices[(i*patch.outline.length+j)*2+1]-patch.centers[i*2+1])*1000)
  ]);
  points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const key=JSON.stringify(points);
  if(!classes.has(key)) classes.set(key,classes.size);
  return classes.get(key);
});
for(const kind of ['edge','touch']) {
  const graph=patch[kind+'Graph'];
  const lines=[String(patch.tileCount)];
  for(let i=0;i<patch.tileCount;i++) lines.push([
    patch.centers[2*i],patch.centers[2*i+1],graph.boundaryDistance[i],shape[i],
    graph.offsets[i+1]-graph.offsets[i],...graph.neighbors.slice(graph.offsets[i],graph.offsets[i+1])
  ].join(' '));
  fs.writeFileSync(`${__dirname}/hat-${depth}-${kind}.dat`,lines.join('\n')+'\n');
}
console.log(JSON.stringify({depth,cells:patch.tileCount,shapeClasses:classes.size}));
