'use strict';
const fs=require('fs');
const assert=require('assert');
const Core=require('../../../core.js');
const {SparseAutomaton}=require('../../lib/sparse-automaton.js');
const Mobility=require('../../search-mobile-patterns.js');
const input=process.argv[2],output=process.argv[3],limit=Number(process.argv[4]||10000);
const raw=fs.readFileSync(input,'utf8').trim();
const values=raw?(raw.startsWith('[')?JSON.parse(raw):raw.split('\n').map(JSON.parse)):[];
const patch=Core.buildPatch('hat',5),spatial=Mobility.makeSpatialIndex(patch),unique=new Map();
for(const e of values){const key=JSON.stringify([e.neighborhood,e.rule,e.generations,e.cellStates]);if(!unique.has(key))unique.set(key,e);}
const results=[];
for(const e of [...unique.values()].slice(0,limit)){
 const graph=patch[e.neighborhood+'Graph'],sim=new SparseAutomaton(patch,graph,e.rule,e.generations);sim.initialize(e.cellStates);
 const seen=new Map();let snapshot=null,returnVerified=null,halo=null,outcome='horizon',generation,maxRadius=0,maxActive=0,minBoundary=999,maxDistance=0,origin=null,cycle=null;const path=[];
 for(generation=0;generation<=10000;generation++){
  if(generation===e.bestAt)assert.deepEqual(sim.entries(),e.endpoint,'C++ saved endpoint parity');
  if(generation===e.from)snapshot={entries:sim.entries()};
  if(generation===e.to&&snapshot){const mapping=Mobility.verifyTranslatedState(snapshot,sim,spatial,...e.translation);returnVerified=!!mapping;if(mapping)halo=Mobility.translatedNeighborhoodRadius(snapshot,sim,spatial,...e.translation,mapping,3);}
  if(!sim.active.length){outcome='extinct';break;}
  let x=0,y=0,radius=0;for(const i of sim.active){x+=patch.centers[2*i];y+=patch.centers[2*i+1];minBoundary=Math.min(minBoundary,graph.boundaryDistance[i]);}x/=sim.active.length;y/=sim.active.length;
  if(!origin)origin=[x,y];for(const i of sim.active)radius=Math.max(radius,Math.hypot(patch.centers[2*i]-x,patch.centers[2*i+1]-y));maxRadius=Math.max(maxRadius,radius);maxDistance=Math.max(maxDistance,Math.hypot(x-origin[0],y-origin[1]));maxActive=Math.max(maxActive,sim.active.length);
  if(generation%16===0)path.push([generation,x,y,radius,sim.active.length]);
  if(minBoundary<4){outcome='boundary';break;}if(maxActive>2000){outcome='population';break;}
  const sig=sim.signature();if(seen.has(sig)){outcome='stationary-cycle';cycle={transient:seen.get(sig),period:generation-seen.get(sig)};break;}seen.set(sig,generation);
  sim.step();
 }
 const r={...e,screen:{outcome,generation,cycle,maxRadius,maxActive,minBoundary,maxDistance,returnVerified,matchedHalo:halo,path}};results.push(r);console.log(JSON.stringify({trial:e.trial,rule:e.rule,C:e.generations,graph:e.neighborhood,outcome,generation,cycle,maxRadius,maxActive,minBoundary,maxDistance,returnVerified,halo}));
}
fs.writeFileSync(output,JSON.stringify(results,null,2)+'\n');
