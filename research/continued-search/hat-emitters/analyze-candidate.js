'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const V=require('../../aperiodic-reference.js');
const file=process.argv[2]||'C-best-signal.json';
const candidate=JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8'));
const patch=V.Core.buildPatch('hat',5),graph=patch.touchGraph;
const table=candidate.preset==='D'?{states:3,default:0,rows:[{state:0,atLeast:{1:2},next:0},{state:0,atLeast:{2:1},next:1},{state:1,atLeast:{2:1},next:2}]}:V.PUBLISHED_TABLES['hat'+candidate.preset];
const sig=p=>JSON.stringify(p);
function trace(seed,horizon){const sim=new V.PriorityReference(graph,table,seed),phases=[];for(let t=0;t<=horizon;t++){phases.push(sim.entries());if(t<horizon)sim.step();}return phases;}
function clusters(p){const seen=new Set(),out=[];for(let i=0;i<p.length;i++){if(seen.has(i))continue;const todo=[i];seen.add(i);for(let k=0;k<todo.length;k++){const a=p[todo[k]][0];for(let j=0;j<p.length;j++){const b=p[j][0];if(!seen.has(j)&&Math.hypot(patch.centers[2*a]-patch.centers[2*b],patch.centers[2*a+1]-patch.centers[2*b+1])<11){seen.add(j);todo.push(j);}}}out.push(todo.map(j=>p[j]).sort((a,b)=>a[0]-b[0]));}return out;}
const phases=trace(candidate.cellStates,180);
for(const cp of candidate.checkpoints)assert.deepStrictEqual(phases[cp.generation],cp.cells,'C++ and direct table replay');
const splitGeneration=140,parts=clusters(phases[splitGeneration]),traces=parts.map(p=>trace(p,180-splitGeneration));
let independent=true,firstUnionFailure=null;
for(let t=0;t<=180-splitGeneration;t++){const union=traces.flatMap(p=>p[t]).sort((a,b)=>a[0]-b[0]);if(new Set(union.map(([i])=>i)).size!==union.length||JSON.stringify(union)!==JSON.stringify(phases[splitGeneration+t])){independent=false;firstUnionFailure=splitGeneration+t;break;}}
const packets=traces.map((trace,i)=>{const metrics=trace.map(p=>V.measure(patch,graph,p));const displacement=Math.hypot(metrics.at(-1).centroid[0]-metrics[0].centroid[0],metrics.at(-1).centroid[1]-metrics[0].centroid[1]);const seen=new Map();let recurrence=null;for(let t=0;t<trace.length;t++){const s=sig(trace[t]);if(seen.has(s)){recurrence={transient:seen.get(s),period:t-seen.get(s)};break;}seen.set(s,t);}return {index:i,initial:trace[0],final:trace.at(-1),displacement,maximumActive:Math.max(...metrics.map(m=>m.active)),maximumRadius:Math.max(...metrics.map(m=>m.radius)),minimumBoundaryDistance:Math.min(...metrics.map(m=>m.boundaryDistance)),recurrence};});
console.log('packets',JSON.stringify(packets.map(p=>({...p,initial:undefined,final:undefined}))));
const bipartitions=[];let minimumEquivalentSubset=candidate.cellStates;
const subsets=[];
for(let mask=1;mask<(1<<candidate.cellStates.length)-1;mask++){
 const subset=candidate.cellStates.filter((_,i)=>(mask>>i)&1);const branch=trace(subset,180);
 let sameTail=-1;for(let t=0;t<=180;t++)if(sig(branch[t])===sig(phases[t])){sameTail=t;break;}
 if(sameTail>=0&&subset.length<minimumEquivalentSubset.length)minimumEquivalentSubset=subset;
 const groups=clusters(branch[180]);const record={mask,seed:subset,sameTail,finalGroups:groups.length,finalPopulation:branch[180].length};subsets.push(record);
 if(mask&1){const other=candidate.cellStates.filter((_,i)=>!((mask>>i)&1));const second=trace(other,30);let divergesAt=null;for(let t=0;t<=30;t++){const union=branch[t].concat(second[t]).sort((a,b)=>a[0]-b[0]);if(new Set(union.map(([i])=>i)).size!==union.length||sig(union)!==sig(phases[t])){divergesAt=t;break;}}bipartitions.push({mask,firstDivergence:divergesAt});}
}
const result={candidate,ruleTable:table,productionCppAgreesWithDirectTableAt:[100,140,180],isolatedPacketReplay:{splitGeneration,through:180,fullStateUnionAtEveryGeneration:independent,firstUnionFailure,packets},allBipartitionsDivergeBy30:bipartitions.every(p=>p.firstDivergence!==null),bipartitions,minimumEquivalentSubset,subsets,fullTrace:phases};
const out=path.join(__dirname,file.replace('.json','-analysis.json'));fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({output:out,allBipartitionsDivergeBy30:result.allBipartitionsDivergeBy30,minimumEquivalentSubset,subsets:subsets.map(p=>({mask:p.mask,size:p.seed.length,sameTail:p.sameTail,groups:p.finalGroups})).filter(p=>p.groups>=7||p.sameTail>=0)}));
