'use strict';
const fs=require('fs');
const P=require('./priority-probe.js');
const {patch,graph,edge,definitions,initialise,step,snapshot}=P;
const rand=require('../../../core.js').mulberry32(3651039);
const starts=Array.from({length:patch.tileCount},(_,i)=>i).filter(i=>graph.boundaryDistance[i]>=50);
const variants={compressed:{next:(s,n)=>s===0&&n[1]<2&&n[2]>=1&&n[0]>=2?1:s===1&&n[2]>=1?2:0}, simplified:{next:(s,n)=>s===0&&n[1]<2&&n[2]>=1?1:s===1&&n[2]>=1?2:0}};
const result={seed:3651039,trials:2000,horizon:500,comparisons:{compressed:{states:0,matches:0,differences:0},simplified:{states:0,matches:0,differences:0}},firstDifferences:[]};
const canon=a=>a.sort((x,y)=>x[0]-y[0]).map(x=>x.join(':')).join(',');
for(let trial=0;trial<result.trials;trial++){
 const a=starts[Math.floor(rand()*starts.length)],nb=edge.neighbors.slice(edge.offsets[a],edge.offsets[a+1]),b=nb[Math.floor(rand()*nb.length)],seed=trial%2?[[a,1],[b,3]]:[[a,3],[b,1]];
 initialise(seed);const trace=[];for(let t=0;t<=result.horizon;t++){const cells=snapshot();if(cells.some(([i])=>graph.boundaryDistance[i]<5))break;trace.push(canon(cells.map(([i,s])=>[i,s===3?2:s])));if(!cells.length)break;step(definitions.B);}
 for(const [name,variant]of Object.entries(variants)){initialise(seed.map(([i,s])=>[i,s===3?2:s]));let mismatch=false;for(let t=0;t<trace.length;t++){const sig=canon(snapshot());result.comparisons[name].states++;if(sig!==trace[t]){mismatch=true;result.comparisons[name].differences++;if(result.firstDifferences.length<8)result.firstDifferences.push({name,trial,generation:t,cellStates:seed});break;}step(variant);}if(!mismatch)result.comparisons[name].matches++;}
 if(trial%500===499)console.error('compared',trial+1,result.comparisons);
}
console.log(JSON.stringify(result));
