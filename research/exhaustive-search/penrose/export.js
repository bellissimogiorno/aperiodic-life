#!/usr/bin/env node
'use strict';
// Export the exact production graph for the reproducible C++ searches.
const fs=require('fs'),path=require('path');
const Core=require('../../../core.js');
if(process.argv.includes('--help')) { console.log('Usage: node research/exhaustive-search/penrose/export.js DEPTH OUTPUT_DIRECTORY'); process.exit(0); }
const depth=Number(process.argv[2]||9),directory=process.argv[3]||'.';
fs.mkdirSync(directory,{recursive:true});
const patch=Core.buildPatch('penrose',depth,{seed:'sun'});
for(const neighbourhood of ['edge','touch']) {
 const g=patch[neighbourhood+'Graph'],rows=[`${patch.tileCount} ${g.neighbors.length}`];
 for(let c=0;c<patch.tileCount;c++) rows.push([patch.centers[2*c],patch.centers[2*c+1],g.boundaryDistance[c],g.degree[c],...g.neighbors.slice(g.offsets[c],g.offsets[c+1])].join(' '));
 fs.writeFileSync(path.join(directory,`penrose-${depth}-${neighbourhood}.graph`),rows.join('\n')+'\n');
}
console.log(JSON.stringify({depth,cells:patch.tileCount}));
