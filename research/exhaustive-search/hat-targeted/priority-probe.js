'use strict';
// Independent sparse implementation of the priority tables in Edmond (2026),
// arXiv:2609.22579v1 Tables 4--7. This is NOT Generations B/S semantics.
const fs = require('fs');
const Core = require('../../../core.js');
const depth=Number(process.argv[2]||5), trials=Number(process.argv[3]||600);
const patch=Core.buildPatch('hat',depth), graph=patch.touchGraph, edge=patch.edgeGraph;
const definitions={
 A:{pair:[1,2],next:(s,n)=>s===0&&n[2]>=2?0:n[1]>=3?3:s===2&&n[1]>=1&&n[0]>=1?1:s===1&&n[2]>=1?3:s===0&&n[1]>=1?2:0},
 B:{pair:[3,1],next:(s,n)=>s===0&&n[1]>=2&&n[0]>=1?0:s===0&&n[0]>=2&&n[2]>=2?1:s===0&&n[0]>=2&&n[3]>=1?1:s===1&&n[3]>=1?3:0},
 C:{pair:[2,1],next:(s,n)=>n[2]>=1&&n[1]>=3?3:s===1&&n[2]>=1?2:s===3&&n[3]>=3?3:s===0&&n[3]>=2?1:n[2]>=1?1:0},
 S:{pair:[1,3],next:(s,n)=>s===0&&n[0]>=3&&n[1]>=1?3:s===3&&n[3]>=3?0:s===3&&n[1]>=1?1:0},
};
const state=new Uint8Array(patch.tileCount),nextState=new Uint8Array(patch.tileCount),mark=new Uint8Array(patch.tileCount);
let active=[];
function initialise(seed){for(const i of active)state[i]=0;active=[];for(const [i,s]of seed){state[i]=s;active.push(i);}}
function step(rule){const candidates=[];for(const i of active){if(!mark[i]){mark[i]=1;candidates.push(i);}for(let j=graph.offsets[i];j<graph.offsets[i+1];j++){const k=graph.neighbors[j];if(!mark[k]){mark[k]=1;candidates.push(k);}}}const future=[];for(const i of candidates){const n=[0,0,0,0];for(let j=graph.offsets[i];j<graph.offsets[i+1];j++)n[state[graph.neighbors[j]]]++;const v=rule.next(state[i],n);nextState[i]=v;if(v)future.push(i);}for(const i of active)state[i]=0;for(const i of future)state[i]=nextState[i];for(const i of candidates){nextState[i]=0;mark[i]=0;}active=future;}
function evaluate(seed,name,horizon=3000){initialise(seed);let x0=0,y0=0,x=0,y=0,maxPopulation=0,maxRadius=0,minBoundary=99999,territory=new Set(),trace=[];let outcome='horizon',t=0;for(;t<=horizon;t++){if(!active.length){outcome='extinct';break;}x=0;y=0;for(const i of active){x+=patch.centers[2*i];y+=patch.centers[2*i+1];minBoundary=Math.min(minBoundary,graph.boundaryDistance[i]);territory.add(i);}x/=active.length;y/=active.length;if(t===0){x0=x;y0=y;}let radius=0;for(const i of active)radius=Math.max(radius,Math.hypot(patch.centers[2*i]-x,patch.centers[2*i+1]-y));maxRadius=Math.max(maxRadius,radius);maxPopulation=Math.max(maxPopulation,active.length);if(t%25===0)trace.push({generation:t,population:active.length,centre:[x,y],radius,boundary:minBoundary});if(minBoundary<5){outcome='boundary';break;}if(active.length>100||radius>100){outcome='spread';break;}step(definitions[name]);}return {tiling:'hat',depth,neighborhood:'touch',ruleFamily:'priority-table',preset:name,source:'https://arxiv.org/abs/2609.22579',cellStates:seed,steps:t,outcome,maxPopulation,maxRadius,displacement:Math.hypot(x-x0,y-y0),minimumBoundary:minBoundary,territory:territory.size,finalStates:active.map(i=>[i,state[i]]),trace};}
const ranked=Array.from({length:patch.tileCount},(_,i)=>i).sort((a,b)=>graph.boundaryDistance[b]-graph.boundaryDistance[a]);const random=Core.mulberry32(3651037);let records=[];
if(require.main===module) for(const name of (process.argv[4]||'B').split(',')){let best=-Infinity,kept=[];for(let trial=0;trial<trials;trial++){const a=ranked[trial<Math.min(trials,100)?trial:Math.floor(random()*Math.min(5000,ranked.length))];const nbs=edge.neighbors.slice(edge.offsets[a],edge.offsets[a+1]);const b=nbs[Math.floor(random()*nbs.length)],pair=definitions[name].pair;const seed=trial%2?[[a,pair[1]],[b,pair[0]]]:[[a,pair[0]],[b,pair[1]]];const result=evaluate(seed,name);result.trial=trial;const score=result.outcome==='boundary'?result.displacement/(1+Math.max(0,result.maxRadius-12))*Math.min(1,result.steps/100):0;if(score>best){best=score;records.push(result);console.log(JSON.stringify({...result,kind:'record'}));console.error(name,trial,result.steps,result.outcome,result.maxPopulation,result.maxRadius,result.displacement);}if(result.outcome==='boundary'&&result.maxRadius<12)kept.push(result);if(trial%100===99)console.error('progress',name,trial+1);}console.log(JSON.stringify({kind:'summary',preset:name,trials,cleanSingleCount:kept.length,bestClean:kept.sort((a,b)=>b.steps-a.steps).slice(0,3)}));}

module.exports={patch,graph,edge,definitions,evaluate,initialise,step,snapshot:()=>active.map(i=>[i,state[i]])};
