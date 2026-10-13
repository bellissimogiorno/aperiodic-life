'use strict';
const fs=require('fs');
const Core=require('../../../core.js');
const Search=require('../../search-mobile-patterns.js');
const {SparseAutomaton}=require('../../lib/sparse-automaton.js');
const src=Core.buildPatch('penrose',10,{seed:'sun'}),dst=Core.buildPatch('penrose',11,{seed:'sun'}),si=Search.makeSpatialIndex(src),di=Search.makeSpatialIndex(dst);
const records=fs.readFileSync(__dirname+'/sun-connected.jsonl','utf8').trim().split('\n').map(JSON.parse);
const selected=[95542,4435,28186].map(t=>records.find(r=>r.trial===t));
function neighbours(g,c){return g.neighbors.slice(g.offsets[c],g.offsets[c+1]);}
function components(e){const left=new Map(e),parts=[];while(left.size){const first=left.entries().next().value,q=[first[0]],p=[first];left.delete(first[0]);for(let h=0;h<q.length;h++)for(const v of neighbours(dst.touchGraph,q[h]))if(left.has(v)){p.push([v,left.get(v)]);q.push(v);left.delete(v);}parts.push(p.sort((a,b)=>a[0]-b[0]));}return parts;}
const out=[];
for(const r of selected){let required=new Set(r.cellStates.map(([c])=>c));for(let i=0;i<3;i++)for(const c of [...required])for(const v of neighbours(src.touchGraph,c))required.add(v);const anchor=r.cellStates[0][0],placements=[];for(let target=0;target<dst.tileCount;target++){if(di.shapeKeys[target]!==si.shapeKeys[anchor]||dst.touchGraph.boundaryDistance[target]<110)continue;const dx=dst.centers[target*2]-src.centers[anchor*2],dy=dst.centers[target*2+1]-src.centers[anchor*2+1],mapping=new Map();let good=true;for(const c of required){
const x=src.centers[c*2]+dx,y=src.centers[c*2+1]+dy;
const v=di.candidates(x,y).find(v=>si.shapeKeys[c]===di.shapeKeys[v]&&Math.hypot(dst.centers[v*2]-x,dst.centers[v*2+1]-y)<0.0015);if(v===undefined){good=false;break;}mapping.set(c,v);}if(!good)continue;
for(const c of required){const want=[...neighbours(src.touchGraph,c)].filter(v=>required.has(v)).map(v=>mapping.get(v)).sort((a,b)=>a-b),got=[...neighbours(dst.touchGraph,mapping.get(c))].filter(v=>[...mapping.values()].includes(v)).sort((a,b)=>a-b);if(JSON.stringify(want)!==JSON.stringify(got)){good=false;break;}}
if(good)placements.push({dx,dy,cellStates:r.cellStates.map(([c,v])=>[mapping.get(c),v]).sort((a,b)=>a[0]-b[0]),margin:Math.min(...[...mapping.values()].map(c=>dst.touchGraph.boundaryDistance[c]))});}
placements.sort((a,b)=>b.margin-a.margin);console.log('PLACEMENTS',r.trial,placements.length);
for(const p of placements.slice(0,24)){const a=new SparseAutomaton(dst,dst.touchGraph,r.rule,r.generations);a.initialize(p.cellStates);let minBoundary=999,maxActive=0,states130,parts130,outcome='horizon',steps=0;for(let t=0;t<=230;t++){steps=t;const e=a.entries();minBoundary=Math.min(minBoundary,...e.map(([c])=>dst.touchGraph.boundaryDistance[c]));maxActive=Math.max(maxActive,e.length);if(!e.length){outcome='extinct';break;}if(minBoundary<4){outcome='boundary';break;}if(e.length>1800){outcome='spread';break;}if(t===130){states130=e;parts130=components(e);}if(t<230)a.step();}const pp=components(a.entries());const result={sourceTrial:r.trial,depth:11,seed:'sun',rule:r.rule,generations:r.generations,haloRadius:3,sourceHaloTiles:required.size,...p,steps,outcome,minBoundary,maxActive,components130:parts130?.length,componentsFinal:pp.length,states130,finalCellStates:a.entries()};out.push(result);console.log('TRIAL',r.trial,'placement',p.cellStates[0][0],outcome,steps,'parts',parts130?.length,pp.length,'boundary',minBoundary);fs.writeFileSync(__dirname+'/transplants.json',JSON.stringify(out,null,2)+'\n');}
}
