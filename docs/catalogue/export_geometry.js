#!/usr/bin/env node
'use strict';
/**
 * Exact production geometry and complete-state catalogue illustrations.
 * Installed location: docs/catalogue/export_geometry.js.
 * Run from any directory: node /path/to/repo/docs/catalogue/export_geometry.js
 * Optional arguments: --root /path/to/repo --output /path/to/diagrams.json
 * Requires Node.js only; there are no npm dependencies.
 *
 * Polygon coordinates are the unrounded Float32 values used by the app.
 * All nonzero states are retained. Pale state-0 context is the immediate
 * simulation-graph neighbourhood and is omitted only for fields >1,000 cells.
 * Every shown polygon carries its production tile ID, complete list of graph
 * neighbours, centre, and (where available) integer lattice coordinates.
 * The entire patch/graph is exactly reproducible from core.js and the recorded
 * patch arguments; SHA-256 checksums identify the complete arrays.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');
let root = path.resolve(__dirname, '../..');
let output = path.join(__dirname, 'geometry', 'diagrams.json');
for (let i=2; i<process.argv.length; i+=2) {
  const key=process.argv[i], value=process.argv[i+1];
  assert(value && ['--root','--output'].includes(key),
    'Usage: node export_geometry.js [--root repository] [--output diagrams.json]');
  if (key==='--root') root=path.resolve(value); else output=path.resolve(value);
}
assert(fs.existsSync(path.join(root,'core.js')), 'Repository root must contain core.js');
const Core = require(path.join(root, 'core.js'));
const entries = require(path.join(root, 'discoveries.js'));
const verification = require(path.join(root, 'research/fixtures/catalogue-verification.json')).results;
const out = {
  schema:2,
  packageVersion:fs.readFileSync(path.join(root,'VERSION'),'utf8').trim(),
  generatedBy:'docs/catalogue/export_geometry.js',
  note:'Exact production polygons and complete nonzero state snapshots for every curated preset. State 0 is empty; state 1 is live; higher states must be interpreted according to the recorded rule. Neighbour lists are complete for every shown tile. Zero-state context is optional; every nonzero tile is included. Panels may use distinct frames. Full patch/graph arrays are reproducible from core.js and the recorded patch arguments.',
  sourceSHA256:Object.fromEntries(['core.js','discoveries.js','research/fixtures/catalogue-provenance.json','research/fixtures/catalogue-verification.json'].map(p=>[p,hash(fs.readFileSync(path.join(root,p)))])),
  entries:{}
};
function hash(...buffers) {const h=crypto.createHash('sha256');for(const b of buffers) h.update(b);return h.digest('hex');}
function typedBytes(a) {return Buffer.from(a.buffer,a.byteOffset,a.byteLength);}
function times(e) {
  const special = {
    'hat-b2s1-c3-rotor-p39':[0,13,26],
    'hat-b2s23-c6-rotor-p219':[0,73,146],
    'hex-b24s16-c3-p248-breather':[0,75,124],
    'hex-b245s3-p57-pulsator':[0,36,56],
    'hex-b34s234-p269':[0,134,268],
    'hex-b234s3-p4104':[0,1098,2052],
    'hat-wake-traveller':[0,60,293],
    'hat-edmond-a-six-way-launcher':[0,60,180],
    'hat-edmond-b-periodic-emitter':[0,30,70],
    'penrose-b2-c6-twelve-launcher':[0,90,130],
    'penrose-b2-c5-five-launcher':[0,80,240],
    'penrose-b2-c6-six-launcher':[0,80,200],
    'hex-b245s02-c5-p6-puffer':[0,6,30],
    'hex-b245s02-c5-three-cell-twin-puffer-launcher':[0,30,60],
    'hex-parity-seven-copy':[0,4,8],
    'penrose-brain-field':[0,60,3000],
    'hat-b1-field':[0,60,3000],
    'penrose-conway-methuselah-289':[0,144,289],
    'penrose-b12-p840-field':[0,51,471],
    // Credited/adapted references: show the published mechanism, not only a
    // generic early transient. Still lifes deliberately repeat their state.
    'square-highlife-replicator':[0,6,12],
    'square-r-pentomino':[0,110,1103],
    'square-acorn':[0,500,5206],
    'hex-b2s34-wall-repair':[0,22,44],
    'hex-b246s246-c4-p30-gun':[0,60,120],
    'hex-b25s34-p20-puffer':[0,80,160],
    'hex-b2s34-p2044-billiard':[0,511,1022],
    'hat-edmond-c-triple-launcher':[0,80,160],
  };
  if(special[e.id]) return special[e.id];
  if(e.expectedExtinction) return [0,Math.floor(e.expectedExtinction/2),e.expectedExtinction-1];
  if(e.expectedTravel?.translatedReturn) return [0,e.expectedTravel.translatedReturn.fromGeneration,e.expectedTravel.translatedReturn.toGeneration];
  if(e.expectedPeriod) {
    if(e.moving) return [0,Math.floor(e.expectedPeriod/2),e.expectedPeriod];
    if(e.expectedPeriod<4) return [0,1,2];
    const transient=e.expectedTransient||0;
    return transient ? [0,transient,transient+Math.floor(e.expectedPeriod/2)] : [0,Math.floor(e.expectedPeriod/4),Math.floor(e.expectedPeriod/2)];
  }
  assert(Number.isInteger(e.expectedActivityThrough),`${e.id}: no illustration horizon`);
  return [0,Math.floor(e.expectedActivityThrough/2),e.expectedActivityThrough];
}
function snapshot(e,patch,graph,sim) {
  const ids=[]; let active=0,live=0,minBoundary=null,cx=0,cy=0;
  const stateCounts=Array(e.generations).fill(0);
  for(let id=0;id<patch.tileCount;id++) {
    stateCounts[sim.state[id]]++;
    if(sim.state[id]) {
      ids.push(id);active++;if(sim.state[id]===1)live++;
      cx+=patch.centers[id*2];cy+=patch.centers[id*2+1];
      minBoundary=minBoundary===null?graph.boundaryDistance[id]:Math.min(minBoundary,graph.boundaryDistance[id]);
    }
  }
  const visible = new Set(ids);
  const includeZeroContext=active<=1000;
  if(includeZeroContext) for(const id of ids) for(let i=graph.offsets[id];i<graph.offsets[id+1];i++) visible.add(graph.neighbors[i]);
  const polygons=[...visible].sort((a,b)=>sim.state[a]-sim.state[b]||a-b).map(id=>({
    id,state:sim.state[id],
    vertices:Array.from({length:patch.verticesPerTile},(_,v)=>{const b=(id*patch.verticesPerTile+v)*2;return [patch.vertices[b],patch.vertices[b+1]];}),
    centre:[patch.centers[id*2],patch.centers[id*2+1]],
    ...(patch.coordinates?{coordinates:[patch.coordinates[id*2],patch.coordinates[id*2+1]]}:{}),
    neighbours:Array.from(graph.neighbors.subarray(graph.offsets[id],graph.offsets[id+1])),
    boundaryDistance:graph.boundaryDistance[id]
  }));
  const bounds=[Infinity,Infinity,-Infinity,-Infinity];
  for(const p of polygons) for(const [x,y] of p.vertices) {bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);}
  return {t:sim.generation,active,live,stateCounts,minimumBoundaryDistance:minBoundary,
    nonzeroCentroid:active?[cx/active,cy/active]:null,
    includeZeroContext,completeStateSHA256:hash(typedBytes(sim.state)),bounds:active?bounds:null,polygons};
}
const groups=new Map();
for(const e of entries) {const key=[e.tiling,e.depth,e.penroseSeed||'sun'].join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
for(const [key,group] of groups) {
  const e0=group[0];
  const patch=Core.buildPatch(e0.tiling,e0.depth,{seed:e0.penroseSeed||'sun'});
  const coordinateMap=new Map();
  if(patch.coordinates)for(let i=0;i<patch.tileCount;i++)coordinateMap.set(`${patch.coordinates[2*i]},${patch.coordinates[2*i+1]}`,i);
  const geometryHash=hash(typedBytes(patch.vertices));
  for(const e of group) {
    const graph=e.neighborhood==='touch'?patch.touchGraph:patch.edgeGraph;
    const sim=new Core.Automaton(patch,graph,{rule:e.rule,generations:e.generations,borderRings:e.borderRings});
    const assignments=[...(e.cellStates||[])];
    for(const [q,r,s]of e.coordinateStates||[]){const id=coordinateMap.get(`${q},${r}`);assert(id!==undefined,`${e.id}: absent coordinate ${q},${r}`);assignments.push([id,s]);}
    if(e.randomize)sim.randomize(e.density,e.randomSeed);
    else {for(const [id,s]of assignments){assert(!sim.isLocked(id),`${e.id}: seed intersects locked border`);assert(Number.isInteger(s)&&s>=0&&s<e.generations);sim.state[id]=s;}sim.refreshDerivedState();}
    const initialCellStates=[];for(let i=0;i<patch.tileCount;i++)if(sim.state[i])initialCellStates.push([i,sim.state[i]]);
    const wanted=times(e);assert(wanted.length===3&&new Set(wanted).size===3&&wanted.every(Number.isInteger),`${e.id}: three distinct integer generations required`);
    const result=verification.find(v=>v.id===e.id);assert(result,`${e.id}: missing verification fixture`);
    const record={id:e.id,tiling:e.tiling,depth:e.depth,penroseSeed:e.penroseSeed||null,neighbourhood:e.neighborhood,rule:e.rule,states:e.generations,borderRings:e.borderRings||0,patchTileCount:patch.tileCount,verticesPerTile:patch.verticesPerTile,geometrySHA256:geometryHash,graphSHA256:hash(typedBytes(graph.offsets),typedBytes(graph.neighbors)),initialCellStates,
      exactSeed:e.randomize?{kind:'deterministic-random-field',density:e.density,randomSeed:e.randomSeed,method:'Core.Automaton.randomize(density, randomSeed)'}:e.coordinateStates?{kind:e.tiling==='square'?'integer-square-coordinate-states':'axial-coordinate-states',coordinateStates:e.coordinateStates}:{kind:'tile-id-states',cellStates:e.cellStates},
      verification:result,phases:[],illustratedRun:{throughGeneration:Math.max(...wanted),minimumNonzero:Infinity,maximumNonzero:0,minimumLive:Infinity,maximumLive:0,minimumBoundaryDistance:null,firstBoundaryAdjacentGeneration:null}};
    for(let t=0;t<=Math.max(...wanted);t++) {
      let nonzero=0,live=0,margin=null;
      for(let id=0;id<patch.tileCount;id++) if(sim.state[id]) {
        nonzero++;if(sim.state[id]===1)live++;
        margin=margin===null?graph.boundaryDistance[id]:Math.min(margin,graph.boundaryDistance[id]);
      }
      const run=record.illustratedRun;
      run.minimumNonzero=Math.min(run.minimumNonzero,nonzero);run.maximumNonzero=Math.max(run.maximumNonzero,nonzero);
      run.minimumLive=Math.min(run.minimumLive,live);run.maximumLive=Math.max(run.maximumLive,live);
      if(margin!==null)run.minimumBoundaryDistance=run.minimumBoundaryDistance===null?margin:Math.min(run.minimumBoundaryDistance,margin);
      if(margin!==null&&margin<=Math.max(0,e.borderRings||0)&&run.firstBoundaryAdjacentGeneration===null)run.firstBoundaryAdjacentGeneration=t;
      if(wanted.includes(t))record.phases.push(snapshot(e,patch,graph,sim));
      if(t<Math.max(...wanted))sim.step();
    }
    record.illustratedRun.boundaryInterpretation='First boundary-adjacent generation is the first nonzero support at graph distance no greater than borderRings (or 0 when no locked rings are used). It flags possible finite-board influence; it is not by itself a proof that an update differs from an infinite tiling.';
    for(const phase of record.phases){
      assert(phase.polygons.filter(x=>x.state!==0).length===phase.active,`${e.id}: omitted nonzero polygon`);
      assert(phase.polygons.filter(x=>x.state===1).length===phase.live,`${e.id}: live population mismatch`);
      assert(phase.stateCounts.reduce((a,b)=>a+b,0)===patch.tileCount,`${e.id}: state count mismatch`);
      assert(phase.stateCounts[0]===patch.tileCount-phase.active,`${e.id}: zero state count mismatch`);
      assert(phase.active===0||phase.polygons.every(p=>p.neighbours.every(n=>n!==p.id)),`${e.id}: self-neighbour`);
    }
    out.entries[e.id]=record;
    console.log(e.id,record.phases.map(f=>`g${f.t}:${f.active}`).join(' '));
  }
  console.log(`Completed patch ${key}, ${patch.tileCount} cells`);
  if(global.gc)global.gc();
}
assert(Object.keys(out.entries).length===entries.length);
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(out));
console.log('Wrote',output,'for',Object.keys(out.entries).length,'presets');
