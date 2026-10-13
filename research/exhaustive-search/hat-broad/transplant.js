'use strict';
const fs=require('fs');
const Core=require('../../../core.js');
const {SparseAutomaton}=require('../../lib/sparse-automaton.js');
const {makeSpatialIndex,translatedCell}=require('../../search-mobile-patterns.js');
const depth=5,patch=Core.buildPatch('hat',depth),graph=patch.touchGraph,spatial=makeSpatialIndex(patch);
const source=process.argv[2],prefix=process.argv[3];
const all=fs.readFileSync(source,'utf8').trim().split('\n').map(JSON.parse);
const selected=new Map();for(const e of all)if(!selected.has(e.trial)||e.from>selected.get(e.trial).from)selected.set(e.trial,e);
let trials=0,steps=0,sites=0;const outcomes={},best=[];const start=Date.now();
function geometry(sim){let x=0,y=0,r=0,bd=999;for(const i of sim.active){x+=patch.centers[2*i];y+=patch.centers[2*i+1];bd=Math.min(bd,graph.boundaryDistance[i]);}x/=sim.active.length;y/=sim.active.length;for(const i of sim.active)r=Math.max(r,Math.hypot(patch.centers[2*i]-x,patch.centers[2*i+1]-y));return {x,y,r,bd};}
for(const seed of selected.values()){
 const original=new SparseAutomaton(patch,graph,seed.rule,seed.generations);original.initialize(seed.cellStates);for(let t=0;t<seed.from;t++)original.step();
 const phase=original.entries(),anchor=phase[0][0],minC=Math.max(...phase.map(e=>e[1]))+1;
 let found=0;
 for(let cell=0;cell<patch.tileCount;cell++){
  if(graph.boundaryDistance[cell]<18||spatial.shapeKeys[cell]!==spatial.shapeKeys[anchor])continue;
  const dx=patch.centers[2*cell]-patch.centers[2*anchor],dy=patch.centers[2*cell+1]-patch.centers[2*anchor+1],mapped=[];
  for(const [i,s] of phase){const target=translatedCell(patch,spatial,i,dx,dy);if(target<0)break;mapped.push([target,s]);}
  if(mapped.length!==phase.length)continue;sites++;found++;
  for(const rule of [...new Set([seed.rule,'B2/S25','B2/S256','B23/S25','B2/S2','B2/S23','B2/S125','B2/S245','B2/S235'])]){
   for(let generations=minC;generations<=16;generations++){
    const sim=new SparseAutomaton(patch,graph,rule,generations);sim.initialize(mapped);const origin=geometry(sim),seen=new Map();let maxR=0,maxN=0,bound=999,outcome='horizon',record=null;
    for(let t=0;t<=1200;t++){
     steps++;if(!sim.active.length){outcome='extinct';break;}if(sim.active.length>200){outcome='population';break;}
     const p=geometry(sim);maxR=Math.max(maxR,p.r);maxN=Math.max(maxN,sim.active.length);bound=Math.min(bound,p.bd);
     if(bound<5){outcome='boundary';break;}if(maxR>25){outcome='radius';break;}
     const sig=sim.signature();if(seen.has(sig)){outcome='stationary-cycle';break;}seen.set(sig,t);
     const distance=Math.hypot(p.x-origin.x,p.y-origin.y),score=distance/(2*maxR+4);
     if(t>=24&&sim.live.length>=2&&score>=1&&(!record||score>record.score))record={tiling:'hat',depth,neighborhood:'touch',rule,generations,sourceTrial:seed.trial,sourcePhase:seed.from,anchorTarget:cell,to:t,score,distance,maxRadius:maxR,maxActive:maxN,minBoundary:bound,cellStates:mapped,toCellStates:sim.entries()};
     sim.step();
    }
    if(record){record.outcome=outcome;if(best.length<50||record.score>best[best.length-1].score){best.push(record);best.sort((a,b)=>b.score-a.score);if(best.length>50)best.pop();}}
    trials++;outcomes[outcome]=(outcomes[outcome]||0)+1;
   }
  }
 }
 console.log(JSON.stringify({sourceTrial:seed.trial,sites:found,trials,steps,best:best[0]?.score,seconds:(Date.now()-start)/1000}));
 fs.writeFileSync(prefix+'-best.json',JSON.stringify(best,null,2)+'\n');
 fs.writeFileSync(prefix+'-campaign.json',JSON.stringify({sourceTrials:[...selected.keys()],sites,trials,steps,outcomes,maximumGenerations:16,horizon:1200,maxActive:200,maxRadius:25,seconds:(Date.now()-start)/1000},null,2)+'\n');
}
