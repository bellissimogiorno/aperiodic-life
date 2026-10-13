'use strict';
const fs=require('fs');
const Core=require('../../../core.js');
const {SparseAutomaton}=require('../../lib/sparse-automaton.js');
const source=process.argv[2],kind=process.argv[3]||'edge';
const p=Core.buildPatch('hat',5),graph=p[kind+'Graph'];
const raw=fs.readFileSync(source,'utf8').trim();const all=raw?raw.split('\n').map(JSON.parse):[];
const selected=new Map();for(const e of all)if(!selected.has(e.trial))selected.set(e.trial,e);
const report=[];
function spatial(a){let x=0,y=0,r=0,bd=999;for(const i of a.active){x+=p.centers[2*i];y+=p.centers[2*i+1];bd=Math.min(bd,graph.boundaryDistance[i]);}x/=a.active.length;y/=a.active.length;for(const i of a.active)r=Math.max(r,Math.hypot(p.centers[2*i]-x,p.centers[2*i+1]-y));return {x,y,r,bd};}
for(const e of selected.values()){
 const a=new SparseAutomaton(p,graph,e.rule,e.generations);a.initialize(e.cellStates);for(let t=0;t<e.from;t++)a.step();
 const phase=a.entries(),origin=spatial(a),seen=new Map();let maxN=0,maxR=0,maxDist=0,minBD=999,t,outcome='horizon',maxLive=0,period=null;
 for(t=0;t<=5000;t++){
  if(!a.active.length){outcome='extinct';break;}const geo=spatial(a);maxN=Math.max(maxN,a.active.length);maxR=Math.max(maxR,geo.r);maxLive=Math.max(maxLive,a.live.length);minBD=Math.min(minBD,geo.bd);maxDist=Math.max(maxDist,Math.hypot(geo.x-origin.x,geo.y-origin.y));
  if(a.active.length>1500){outcome='population';break;}if(minBD<4){outcome='boundary';break;}
  const sig=a.signature();if(seen.has(sig)){period=t-seen.get(sig);outcome='stationary-cycle';break;}seen.set(sig,t);a.step();
 }
 const item={tiling:'hat',depth:5,neighborhood:kind,trial:e.trial,rule:e.rule,generations:e.generations,sourcePhase:e.from,claimedPeriod:e.to-e.from,claimedTranslation:e.translation,initialEntries:phase,outcome,steps:t,period,maxN,maxLive,maxRadius:maxR,maxDistance:maxDist,minBoundary:minBD};report.push(item);
 console.log(JSON.stringify({...item,initialEntries:undefined}));
}
fs.writeFileSync(source.replace(/\.jsonl$/,'-classified.json'),JSON.stringify(report,null,2)+'\n');
