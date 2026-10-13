'use strict';
const fs = require('node:fs');
const path = require('node:path');
const outputDirectory = path.resolve(process.argv[2] || '.');
fs.mkdirSync(outputDirectory, { recursive: true });
const H = require('../../hex-reference');
const catalogue = require('./mutation-bases.json');
const bases = [];
for (const e of catalogue.filter(e => ['hex-b246s246-c4-p30-gun','hex-b25s34-p20-puffer'].includes(e.id))) {
  let state = H.fromCoordinates(e.coordinateStates,e.generations);
  const rule = H.parseRule(e.rule,e.generations);
  const [, b,s] = /^B(.*)\/S(.*)$/.exec(e.rule);
  const mask = text => [...text].reduce((m,x)=>m|1<<+x,0);
  for(let t=0;t<20;t++) {
    bases.push({id:e.id+'-g'+t,B:mask(b),S:mask(s),C:e.generations,cells:H.toCoordinates(state)});
    state=H.step(state,rule);
  }
}
let random = 0x365e117;
function rand(n){random^=random<<13;random^=random>>>17;random^=random<<5;return (random>>>0)%n;}
const seedPath=path.join(outputDirectory,'emitter-seeds.txt'), out=fs.openSync(seedPath,'w');
let trial=0;
function save(base,state,suffix){const cells=H.toCoordinates(state);fs.writeSync(out,[base.id+'-'+suffix,base.B,base.S,base.C,cells.length,...cells.flat()].join(' ')+'\n');trial++;}
for(const base of bases) {
  for(let q=-8;q<=8;q++)for(let r=-8;r<=8;r++)if(Math.abs(q+r)<=8)for(let value=0;value<base.C;value++) {
    const state=H.fromCoordinates(base.cells,base.C),k=`${q},${r}`;
    if((state.get(k)||0)===value)continue;
    if(value)state.set(k,value);else state.delete(k);
    save(base,state,`single-${q}-${r}-${value}`);
  }
}
const exhaustive=trial;
for(let i=0;i<30000;i++) {
 const base=bases[rand(bases.length)],state=H.fromCoordinates(base.cells,base.C),changes=2+rand(7);
 for(let j=0;j<changes;j++){const [q,r]=base.cells[rand(base.cells.length)],k=`${q+rand(7)-3},${r+rand(7)-3}`,v=rand(base.C);if(v)state.set(k,v);else state.delete(k);}
 save(base,state,'random-'+i);
}
fs.closeSync(out);
fs.writeFileSync(path.join(outputDirectory, 'emitter-generation.json'),JSON.stringify({trials:trial,exhaustiveSingleCellTrials:exhaustive,randomMultiCellTrials:30000,bases:bases.length,sourcePhases:'g0..19 of the existing p30 three-way gun and p20 puffer',singleCellWindow:'All 217 axial sites with hex radius <=8 about origin, substituting every other permitted state',randomMethod:'2..8 state edits within axial ±3 of a source-phase cell',prng:'xorshift32',randomSeed:'0x365e117'},null,2));
