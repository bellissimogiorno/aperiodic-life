'use strict';
const path = require('path');
const fs=require('fs'),Core=require('../../../core.js');
const candidate=JSON.parse(fs.readFileSync(path.join(__dirname, 'for-verification.json')))[0];
const patch=Core.buildPatch('hat',5),g=patch.touchGraph;
const key=s=>[...s].sort((a,b)=>a[0]-b[0]).map(p=>p.join(':')).join(',');
function step(state,rows,hits){const candidates=new Set(state.keys());for(const i of state.keys())for(let j=g.offsets[i];j<g.offsets[i+1];j++)candidates.add(g.neighbors[j]);const next=new Map();for(const i of candidates){const counts=[0,0,0,0];for(let j=g.offsets[i];j<g.offsets[i+1];j++)counts[state.get(g.neighbors[j])||0]++;let s=state.get(i)||0;let k=rows.findIndex(r=>(r.own===-1||r.own===null||r.own===s)&&r.counts.every(([v,n])=>counts[v]>=n));if(k>=0){if(hits)hits[k]++;if(rows[k].next)next.set(i,rows[k].next);}}return next;}
let state=new Map(candidate.cellStates),trace=[],phases=[];for(let t=0;t<=candidate.steps;t++){trace.push(key(state));phases.push(state);state=step(state,candidate.rows);}
function firstMismatch(rows,seed=candidate.cellStates,from=0){let state=new Map(seed);for(let t=from;t<trace.length;t++){if(key(state)!==trace[t])return t;state=step(state,rows);}return null;}
let simplified=candidate.rows.slice(),removed=[];for(let k=0;k<simplified.length;){const variant=simplified.filter((_,i)=>i!==k);if(firstMismatch(variant)===null){removed.push(simplified[k]);simplified=variant;}else k++;}
let cruise=simplified.slice(),cruiseRemoved=[];for(let k=0;k<cruise.length;){const variant=cruise.filter((_,i)=>i!==k);if(firstMismatch(variant,[...phases[60]],60)===null){cruiseRemoved.push(cruise[k]);cruise=variant;}else k++;}
const counts=simplified.map(()=>0),cruiseCounts=simplified.map(()=>0);state=new Map(candidate.cellStates);for(let t=0;t<candidate.steps;t++){let hits=simplified.map(()=>0);state=step(state,simplified,hits);hits.forEach((n,k)=>{counts[k]+=n;if(t>=60)cruiseCounts[k]+=n;});}
const ablations=simplified.map((row,i)=>({removedRow:i,firstMismatch:firstMismatch(simplified.filter((_,j)=>i!==j)),firstCruiseMismatch:firstMismatch(simplified.filter((_,j)=>i!==j),[...phases[60]],60)}));
const projections=[];const tables=require('../../exhaustive-search/hat-targeted/priority-rules.json');
for(const name of ['A','B','C','S'])for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){const p=[0,a,b,c];if(new Set(p.slice(1).filter(x=>x)).size<2)continue;const projected=s=>new Map([...s].filter(([i,v])=>p[v]).map(([i,v])=>[i,p[v]]));let mismatch=null;for(let t=60;t<candidate.steps;t++){if(key(step(projected(phases[t]),tables[name].rows))!==key(projected(phases[t+1]))){mismatch=t;break;}}if(mismatch===null)projections.push({parent:name,stateMap:p});}
let seed=candidate.cellStates.slice(),deletions=[];for(let i=0;i<seed.length;){const smaller=seed.filter((_,j)=>j!==i);if(firstMismatch(simplified,smaller,0)===null){deletions.push(seed[i]);seed=smaller;}else i++;}
const result={sourceEvaluation:candidate.evaluation,sourceLineage:candidate.lineage,rows:simplified,default:0,cellStates:candidate.cellStates,completeTraceThrough:candidate.steps,removedWithoutChangingFullTrace:removed,cruiseRows:cruise,cruiseRemoved,fullTraceRuleHits:counts,cruiseRuleHits:cruiseCounts,ablations,knownParentProjections:projections,cruiseSeed:[...phases[60]],finalCellStates:[...phases.at(-1)]};
fs.writeFileSync(path.join(__dirname, 'reduced-candidate.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
