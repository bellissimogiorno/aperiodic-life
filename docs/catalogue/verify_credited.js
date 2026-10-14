'use strict';
// Independent square sparse model; hex checks reuse the package's independent
// integer-axial reference, which does not call the production updater.
const fs = require('fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../..') + path.sep;
const entries = require(root + 'discoveries.js');
const reference = require(root + 'research/hex-reference.js');
const fixture = require(root + 'research/fixtures/hexagonal-evidence.json');
const results = [];
function norm(s) {
  const ps = [...s].map(k => k.split(',').map(Number));
  const x = Math.min(...ps.map(p => p[0])), y = Math.min(...ps.map(p => p[1]));
  return { x, y, key: ps.map(p => [p[0]-x,p[1]-y].join(',')).sort().join(';') };
}
function squareStep(s, births, limit=Infinity) {
  const counts = new Map();
  for (const key of s) {
    const [x,y] = key.split(',').map(Number);
    for (let dx=-1;dx<=1;dx++) for (let dy=-1;dy<=1;dy++) {
      if (!dx && !dy) continue;
      const k = `${x+dx},${y+dy}`; counts.set(k,(counts.get(k)||0)+1);
    }
  }
  const out = new Set();
  for (const [k,n] of counts) {
    const [x,y] = k.split(',').map(Number);
    if (Math.abs(x)>limit||Math.abs(y)>limit) continue;
    if (s.has(k) ? n===2||n===3 : births.includes(n)) out.add(k);
  }
  return out;
}
for (const e of entries.filter(e=>e.tiling==='square')) {
  const start = new Set(e.coordinateStates.map(([x,y])=>`${x},${y}`));
  let s=start, bounded=start, firstDifferent=null, firstCycle=null, firstExtinct=null;
  const horizon=e.expectedPeriod||e.expectedReplication?.steps||e.expectedExtinction||e.expectedActivityThrough||130;
  const birth=e.rule==='B36/S23'?[3,6]:[3]; const initial=norm(start);
  for(let t=1;t<=horizon;t++) {
    s=squareStep(s,birth); bounded=squareStep(bounded,birth,Math.floor(e.depth/2)-e.borderRings);
    if(!firstDifferent&&(s.size!==bounded.size||[...s].some(k=>!bounded.has(k))))firstDifferent=t;
    if(!s.size&&!firstExtinct)firstExtinct=t;
    if(s.size&&!firstCycle) { const n=norm(s);if(n.key===initial.key)firstCycle={period:t,translation:[n.x-initial.x,n.y-initial.y]}; }
  }
  const r={id:e.id,horizon,firstCycle,firstExtinct,firstFiniteBoardDifference:firstDifferent,infiniteFinalPopulation:s.size,finiteFinalPopulation:bounded.size};
  if(e.expectedPeriod) { assert.equal(firstCycle.period,e.expectedPeriod);assert.deepEqual(firstCycle.translation,e.translation||[0,0]); }
  if(e.id==='square-diehard')assert.equal(firstExtinct,130);
  if(e.id==='square-highlife-replicator') {
    const expected=new Set(e.coordinateStates.flatMap(([x,y])=>[`${x-2},${y-2}`,`${x+2},${y+2}`]));
    assert.deepEqual(s,expected);r.replication={steps:12,translations:[[-2,-2],[2,2]],copies:2};
  }
  results.push(r);
}
for(const e of entries.filter(e=>e.tiling==='hex'&&['published','adapted'].includes(e.provenance.status))) {
  const f=fixture.entries.find(f=>f.id===e.id); assert(f);
  if(f.type==='cycle') {
    const orbit=reference.findOrbit(e,{maxSteps:f.expected.transient+f.expected.period});
    assert.equal(orbit.period,f.expected.period);assert.equal(orbit.transient,f.expected.transient);assert.deepEqual(orbit.translation,f.expected.translation);
    if(f.rotation)assert.deepEqual(reference.rotationReturn(orbit),f.rotation);
    if(f.repair)assert.deepEqual(reference.verifyRepair(e,f.repair),f.expectedRepair);
    results.push({id:e.id,kind:orbit.kind,period:orbit.period,transient:orbit.transient,translation:orbit.translation,liveRange:[orbit.minimumLive,orbit.maximumLive],activeRange:[orbit.minimumActive,orbit.maximumActive],rotation:f.rotation||null,repair:f.expectedRepair||null});
  } else {
    assert.equal(f.type,'emitter');const proof=reference.verifyEmitter(e,f.proof);assert.deepEqual(proof,f.expected);
    results.push({id:e.id,...proof});
  }
}
fs.mkdirSync(path.join(__dirname, 'evidence'), {recursive:true});
fs.writeFileSync(path.join(__dirname, 'evidence/credited-independent-verification.json'),JSON.stringify({date:'2026-10-14',squareMethod:'Independent sparse unbounded Moore-neighbour model and independent fixed-square-boundary control.',hexMethod:'Integer-axial reference; full-state returns, all-phase rotations, wall reunion and emission separation certificates.',results},null,2)+'\n');
console.log(`Verified ${results.length} credited square/hex examples (${entries.filter(e=>e.tiling==='hat'&&['published','adapted'].includes(e.provenance.status)).length} Hat examples covered by retained geometric evidence).`);
