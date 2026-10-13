'use strict';
const fs=require('fs');
const Core=require('../../../core.js');
const depth=Number(process.argv[2]||10),output=process.argv[3]||`${__dirname}/penrose-${depth}-touch.graph`;
const patch=Core.buildPatch('penrose',depth,{seed:'sun'}),g=patch.touchGraph;
const rows=[`${patch.tileCount} ${g.neighbors.length}`];
for(let c=0;c<patch.tileCount;c++)rows.push([patch.centers[c*2],patch.centers[c*2+1],g.boundaryDistance[c],g.degree[c],...g.neighbors.slice(g.offsets[c],g.offsets[c+1])].join(' '));
fs.writeFileSync(output,rows.join('\n')+'\n');console.log(JSON.stringify({depth,cells:patch.tileCount,output}));
