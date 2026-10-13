'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const V=require('../../aperiodic-reference.js');
const file=process.argv[2]||'B-core-signal.json',candidate=JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8'));
const patch=V.Core.buildPatch('hat',5),graph=patch.touchGraph;
const table=candidate.preset==='D'?{states:3,default:0,rows:[{state:0,atLeast:{1:2},next:0},{state:0,atLeast:{2:1},next:1},{state:1,atLeast:{2:1},next:2}]}:V.PUBLISHED_TABLES['hat'+candidate.preset];
const seedCenter=V.measure(patch,graph,candidate.cellStates).centroid;
function distance(cell){return Math.hypot(patch.centers[2*cell]-seedCenter[0],patch.centers[2*cell+1]-seedCenter[1]);}
function run(initial,limit=240){const m=new V.PriorityReference(graph,table,initial),trace=[];let minBoundary=Infinity;for(let t=0;t<=limit;t++){const p=m.entries();trace.push(p);for(const [c]of p)minBoundary=Math.min(minBoundary,graph.boundaryDistance[c]);if(minBoundary<6)break;if(t<limit)m.step();}return{trace,minBoundary};}
const whole=run(candidate.cellStates);for(const cp of candidate.checkpoints)assert.deepStrictEqual(whole.trace[cp.generation],cp.cells);
const out={candidate,table,seedCenter,firstBoundaryBufferGeneration:whole.trace.length-1,checks:[],wholePhases:whole.trace};
const initialMetrics=V.measure(patch,graph,candidate.cellStates);console.log('seed',initialMetrics,'recorded',whole.trace.length-1);
const periods=candidate.localPeriod?[candidate.localPeriod,2*candidate.localPeriod,3*candidate.localPeriod]:[20,36];
for(const period of periods)for(const radius of [6,8,10,12,14,16,18,20,22,24,26,28,30,34,38,42,46,50,54,58]){
 let latest=null;
 for(let t=30;t+2*period<whole.trace.length;t++){
  const original=whole.trace[t],core=original.filter(([c])=>distance(c)<radius);if(!core.length)continue;
  const trial=run(core,2*period),phase=trial.trace[period];if(!phase)continue;
  const coreMap=new Map(core);if(!core.every(([c,s])=>new Map(phase).get(c)===s))continue;
  const extras=phase.filter(([c])=>!coreMap.has(c));if(!extras.length||extras.some(([c])=>distance(c)<radius))continue;
  const before=trial.trace.slice(0,period);let coreRegionRepeats=true;
  for(let step=0;step<=period;step++){
   const a=trial.trace[step].filter(([c])=>distance(c)<radius),b=trial.trace[step+period]?.filter(([c])=>distance(c)<radius);
   if(JSON.stringify(a)!==JSON.stringify(b)){coreRegionRepeats=false;break;}
  }
  if(!coreRegionRepeats)continue;
  const separate=run(extras,period);const union=trial.trace[period].concat(separate.trace[period]).sort((a,b)=>a[0]-b[0]);
  const independent=JSON.stringify(union)===JSON.stringify(trial.trace[2*period]);
  if(!independent)continue;
  const sourceMetrics=before.map(p=>V.measure(patch,graph,p.filter(([c])=>distance(c)<radius)));
  latest={generation:t,period,radius,core,emittedAtPeriod:extras,maximumSourceActive:Math.max(...sourceMetrics.map(m=>m.active)),sourceComponentRange:[Math.min(...sourceMetrics.map(m=>m.components)),Math.max(...sourceMetrics.map(m=>m.components))],sourceDisplacements:sourceMetrics.map(m=>Math.hypot(m.centroid[0]-seedCenter[0],m.centroid[1]-seedCenter[1])),completeEmissionIdentity:true,twoCycleEndpointCoincidence:true};
  break;
 }
 if(latest){out.checks.push(latest);console.log(JSON.stringify({...latest,core:latest.core.length,emittedAtPeriod:latest.emittedAtPeriod.length,sourceDisplacements:undefined}));}
}
fs.writeFileSync(path.join(__dirname,file.replace('.json','-source-analysis.json')),JSON.stringify(out,null,2)+'\n');
