'use strict';
// Independent dense absolute-state replay. Boundary tiles are held at the
// uniform background; retained defects must stay clear of that collar.
const fs=require('fs');
const path=require('path');
const assert=require('node:assert/strict');
function graph(file){
 const lines=fs.readFileSync(file,'utf8').trim().split('\n');
 const n=Number(lines[0]);const rows=lines.slice(1).map(s=>s.trim().split(/\s+/).map(Number));
 assert.equal(rows.length,n);
 return {n,rows};
}
const graphDirectory=process.argv[2];
if(!graphDirectory)throw new Error('Usage: node verify.js GRAPH_DIRECTORY');
const outputs=[];
for(const kind of ['touch','edge']){
 const file=path.join(__dirname,kind+'-candidates.jsonl');
 if(!fs.existsSync(file))continue;
 const cases=fs.readFileSync(file,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
 const unique=new Map(cases.map(c=>[c.trial,c]));
 const g=graph(path.resolve(graphDirectory,'hat-5-'+kind+'.dat'));
 for(const c of unique.values()){
  const [,birth,survival]=/^B([0-9]*)\/S([0-9]*)$/.exec(c.rule);
  const B=new Set([...birth].map(Number)),S=new Set([...survival].map(Number));
  let state=new Uint8Array(g.n),next=new Uint8Array(g.n),seen=new Map(),outcome=null,maximumPopulation=0,minimumBoundary=999,maximumRadius=0;
  for(const [i] of c.initialDefects)state[i]=1;
  let checked=0;
  for(let gen=0;gen<=2000;gen++){
   const bg=gen%2,defects=[];
   for(let i=0;i<g.n;i++)if(state[i]!==bg)defects.push([i,1]);
   maximumPopulation=Math.max(maximumPopulation,defects.length);
   let x=0,y=0;
   for(const [i]of defects){x+=g.rows[i][0];y+=g.rows[i][1];minimumBoundary=Math.min(minimumBoundary,g.rows[i][2]);}
   if(defects.length){x/=defects.length;y/=defects.length;for(const [i]of defects)maximumRadius=Math.max(maximumRadius,Math.hypot(g.rows[i][0]-x,g.rows[i][1]-y));}
   if(gen===c.generation){assert.deepEqual(defects,c.finalDefects,'C++ candidate snapshot differs from dense absolute replay');checked++;}
   if(!defects.length){outcome={kind:'defect extinction',generation:gen};break;}
   if(minimumBoundary<6){outcome={kind:'boundary buffer',generation:gen};break;}
   if(defects.length>1500){outcome={kind:'population cap',generation:gen};break;}
   const key=bg+':'+defects.map(c=>c[0]).join(',');
   if(seen.has(key)){outcome={kind:'stationary exact defect cycle',transient:seen.get(key),period:gen-seen.get(key)};break;}
   seen.set(key,gen);
   if(gen===2000){outcome={kind:'horizon',generation:gen};break;}
   for(let i=0;i<g.n;i++){
    const row=g.rows[i];
    if(row[2]<2){next[i]=1-bg;continue;}
    let live=0;for(let k=5;k<row.length;k++)live+=state[row[k]];
    next[i]=Number((state[i]?S:B).has(live));
   }
   [state,next]=[next,state];
  }
  assert.equal(checked,1,'replay stopped before candidate snapshot');
  outputs.push({graph:kind,trial:c.trial,rule:c.rule,denseSnapshotParity:true,maximumPopulation,minimumBoundary,maximumRadius,outcome});
  console.log(JSON.stringify(outputs.at(-1)));
 }
}
fs.writeFileSync(path.join(__dirname,'independent-replay.json'),JSON.stringify(outputs,null,2)+'\n');
