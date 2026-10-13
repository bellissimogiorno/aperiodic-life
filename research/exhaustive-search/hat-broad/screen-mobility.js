'use strict';
const fs=require('fs');
const assert=require('assert');
const Core=require('../../../core.js');
const {SparseAutomaton}=require('../../lib/sparse-automaton.js');
const source=process.argv[2];
const kind=process.argv[3]||'edge';
const limit=Number(process.argv[4]||10);
const patch=Core.buildPatch('hat',5),graph=patch[kind+'Graph'];
const records=JSON.parse(fs.readFileSync(source));
const report=[];
for(const entry of records.slice(0,limit)){
 const sim=new SparseAutomaton(patch,graph,entry.rule,entry.generations);
 sim.initialize(entry.cellStates);const trace=[];let minBoundary=999,maxActive=0,maxRadius=0,last;
 const seen=new Map();let outcome='horizon';
 for(let t=0;t<=5000;t++){
  if(t===entry.from)assert.deepEqual(sim.entries(),entry.fromCellStates);
  if(t===entry.to)assert.deepEqual(sim.entries(),entry.toCellStates);
  if(!sim.active.length){outcome='extinct';last=t;break;}
  maxActive=Math.max(maxActive,sim.active.length);
  for(const i of sim.active)minBoundary=Math.min(minBoundary,graph.boundaryDistance[i]);
  if(minBoundary<4){outcome='boundary';last=t;break;}
  if(sim.active.length>2000){outcome='population';last=t;break;}
  const signature=sim.signature();
  if(seen.has(signature)){outcome=`stationary-cycle:${t-seen.get(signature)}`;last=t;break;}
  seen.set(signature,t);
  if(t%8===0){let x=0,y=0,r=0;for(const i of sim.active){x+=patch.centers[2*i];y+=patch.centers[2*i+1];}x/=sim.active.length;y/=sim.active.length;for(const i of sim.active)r=Math.max(r,Math.hypot(patch.centers[2*i]-x,patch.centers[2*i+1]-y));maxRadius=Math.max(maxRadius,r);trace.push([t,sim.active.length,sim.live.length,x,y,r]);}
  sim.step();last=t;
 }
 report.push({trial:entry.trial,rule:entry.rule,generations:entry.generations,endpointParity:true,outcome,last,minBoundary,maxActive,maxRadius,trace});
 console.log(JSON.stringify({trial:entry.trial,rule:entry.rule,generations:entry.generations,outcome,last,minBoundary,maxActive,maxRadius}));
}
fs.writeFileSync(source.replace(/\.json$/,'-replay.json'),JSON.stringify(report,null,2)+'\n');
