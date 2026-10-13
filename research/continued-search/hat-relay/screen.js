'use strict';
const path = require('path');
const fs=require('fs');
const Core=require('../../../core.js');
const tables=require('../../exhaustive-search/hat-targeted/priority-rules.json');
const patch=Core.buildPatch('hat',5), graph=patch.touchGraph;
const source=process.argv[2]||path.join(__dirname, 'evolution.jsonl');
let rows=fs.readFileSync(source,'utf8').trim().split('\n').map(x=>JSON.parse(x)).filter(r=>r.kind==='candidate'&&r.displacement>120&&r.maximumRadius<10);
rows.sort((a,b)=>((b.lineage==='random')-(a.lineage==='random'))||b.minimumCruisePopulation-a.minimumCruisePopulation||b.score-a.score);
rows=rows.slice(0,180);
const parents={A:tables.A.rows,B:tables.B.rows,C:tables.C.rows,S:tables.S.rows,SIMPLE:[{own:0,counts:[[1,2]],next:0},{own:0,counts:[[2,1]],next:1},{own:1,counts:[[2,1]],next:2}]};
const permutations=[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]].map(p=>[0,...p]);
function advance(state,rules){const candidates=new Set(state.keys());for(const i of state.keys())for(let p=graph.offsets[i];p<graph.offsets[i+1];p++)candidates.add(graph.neighbors[p]);const next=new Map();for(const i of candidates){let n=[0,0,0,0];for(let p=graph.offsets[i];p<graph.offsets[i+1];p++)n[state.get(graph.neighbors[p])||0]++;const s=state.get(i)||0;const row=rules.find(r=>(r.own===null||r.own===-1||r.own===s)&&r.counts.every(([v,k])=>n[v]>=k));if(row&&row.next)next.set(i,row.next);}return next;}
const key=state=>[...state].sort((a,b)=>a[0]-b[0]).map(([i,s])=>`${i}:${s}`).join(',');
const mapped=(state,p)=>new Map([...state].map(([i,s])=>[i,p[s]]));
const output=[];
for(let j=0;j<rows.length;j++){
 const candidate=rows[j];let state=new Map(candidate.cellStates),comparisons=[];
 for(const [name,rules]of Object.entries(parents))for(const permutation of permutations)comparisons.push({name,permutation,matched:true,firstMismatch:null});
 let endpoint=null,usedRows=new Set(),activeStateCounts=[0,0,0,0];const checkpoints=[];let maxComponents=0;
 for(let t=0;t<=candidate.steps;t++){
  if([0,30,60,100,160,250,candidate.steps].includes(t))checkpoints.push({generation:t,cellStates:[...state]});
  if(t===candidate.steps){endpoint=[...state];break;}
  const next=advance(state,candidate.rows);
  if(t>=60){for(const [i,s]of state)activeStateCounts[s]++;
   for(const c of comparisons){if(!c.matched)continue;if(c.name==='SIMPLE'&&[...state.values()].some(s=>c.permutation[s]===3)){c.matched=false;c.firstMismatch=t;continue;}const replay=advance(mapped(state,c.permutation),parents[c.name]);if(key(replay)!==key(mapped(next,c.permutation))){c.matched=false;c.firstMismatch=t;}}
   const remaining=new Set(state.keys());let n=0;while(remaining.size){n++;const todo=[remaining.values().next().value];remaining.delete(todo[0]);for(let k=0;k<todo.length;k++)for(let q=graph.offsets[todo[k]];q<graph.offsets[todo[k]+1];q++){const cell=graph.neighbors[q];if(remaining.delete(cell))todo.push(cell);}}maxComponents=Math.max(maxComponents,n);
  }
  state=next;
 }
 const known= comparisons.filter(c=>c.matched).map(({name,permutation})=>({name,permutation}));
 const r={...candidate,comparisonStart:60,knownMatureMechanisms:known,comparisonFirstMismatches:comparisons.map(({name,permutation,firstMismatch})=>({name,permutation,firstMismatch})),maxMatureComponents:maxComponents,stateSumsAfter60:activeStateCounts,checkpoints,finalCellStates:endpoint};
 output.push(r);if(!known.length)console.error('distinct active transitions',candidate.evaluation,candidate.lineage,'population',candidate.minimumCruisePopulation,candidate.peakPopulation,'components',maxComponents);
 if(j%20===19)console.error('screened',j+1);
}
fs.writeFileSync(path.join(__dirname, 'screened.json'),JSON.stringify(output,null,2)+'\n');
const selected=output.filter(r=>!r.knownMatureMechanisms.length).sort((a,b)=>((a.maxMatureComponents===1)?-1:1)-((b.maxMatureComponents===1)?-1:1)||((b.lineage==='random')-(a.lineage==='random'))||b.score-a.score);
fs.writeFileSync(path.join(__dirname, 'selected.json'),JSON.stringify(selected,null,2)+'\n');
console.log(JSON.stringify({screened:output.length,differentMatureTransitions:selected.length,connected:selected.filter(x=>x.maxMatureComponents===1).length,lineages:Object.fromEntries([...new Set(selected.map(x=>x.lineage))].map(name=>[name,selected.filter(x=>x.lineage===name).length]))}));
