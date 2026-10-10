'use strict';
const assert = require('assert');
const Core = require('./core.js');

const BIAS = 1 << 20;
const BASE = 2 ** 21;
const pointKey = (qx, qy) => (qx + BIAS) * BASE + (qy + BIAS);
const pairKey = (a, b, n) => (a < b ? a * n + b : b * n + a);

function quantize(x, y) {
  return [Math.round(x * 4), Math.round((y / Core.HALF_SQRT3) * 2)];
}

function graphPairSet(graph, n) {
  const out = new Set();
  for (let i = 0; i < n; i++) {
    const seen = new Set();
    for (let k = graph.offsets[i]; k < graph.offsets[i + 1]; k++) {
      const j = graph.neighbors[k];
      assert(j >= 0 && j < n, `neighbour out of range ${i}->${j}`);
      assert(j !== i, `self-loop at ${i}`);
      assert(!seen.has(j), `duplicate neighbour ${i}->${j}`);
      seen.add(j);
      if (i < j) out.add(i * n + j);
    }
    assert.strictEqual(seen.size, graph.degree[i], `degree mismatch at ${i}`);
  }
  assert.strictEqual(out.size, graph.edgeCount, 'edgeCount mismatch');
  assert.strictEqual(graph.neighbors.length, graph.edgeCount * 2, 'CSR size mismatch');
  for (let i = 0; i < n; i++) {
    for (let k = graph.offsets[i]; k < graph.offsets[i + 1]; k++) {
      const j = graph.neighbors[k];
      let found = false;
      for (let q = graph.offsets[j]; q < graph.offsets[j + 1]; q++) {
        if (graph.neighbors[q] === i) { found = true; break; }
      }
      assert(found, `asymmetric edge ${i}-${j}`);
    }
  }
  return out;
}

function connectedCount(graph, n) {
  if (!n) return 0;
  const seen = new Uint8Array(n);
  const q = new Uint32Array(n);
  let head = 0, tail = 1;
  q[0] = 0; seen[0] = 1;
  while (head < tail) {
    const i = q[head++];
    for (let k = graph.offsets[i]; k < graph.offsets[i + 1]; k++) {
      const j = graph.neighbors[k];
      if (!seen[j]) { seen[j] = 1; q[tail++] = j; }
    }
  }
  return tail;
}

function independentTopology(patch) {
  const n = patch.tileCount;
  const m = patch.verticesPerTile;
  const vertexTiles = new Map();
  const tileOriginal = Array.from({length: n}, () => new Array(m));

  // Gather every actual polygon vertex first.
  for (let t = 0; t < n; t++) {
    for (let i = 0; i < m; i++) {
      const o = (t * m + i) * 2;
      const [qx, qy] = quantize(patch.vertices[o], patch.vertices[o + 1]);
      const key = pointKey(qx, qy);
      tileOriginal[t][i] = {qx, qy, key};
      let rec = vertexTiles.get(key);
      if (!rec) vertexTiles.set(key, rec = {qx, qy, tiles: new Set()});
      rec.tiles.add(t);
    }
    let doubledLatticeArea = 0;
    for (let i = 0; i < m; i++) {
      const a = tileOriginal[t][i];
      const b = tileOriginal[t][(i + 1) % m];
      doubledLatticeArea += a.qx * b.qy - a.qy * b.qx;
    }
    assert.strictEqual(
      Math.abs(doubledLatticeArea),
      64,
      `tile ${t} has an unexpected exact lattice area`,
    );
  }

  const allBoundaryPoints = new Map(); // key -> {qx,qy,tiles:Set}
  const segmentOwners = new Map(); // "key:key" -> Set(tile)
  const tileBoundaryKeys = Array.from({length:n}, () => new Set());
  const interiorVerticesByEdgeLength = new Map();
  let maxInteriorVertices = 0;
  let edgeWithUnexpectedInteriorVertex = 0;

  function addBoundaryPoint(p, t) {
    let rec = allBoundaryPoints.get(p.key);
    if (!rec) allBoundaryPoints.set(p.key, rec = {qx:p.qx, qy:p.qy, tiles:new Set()});
    rec.tiles.add(t);
    tileBoundaryKeys[t].add(p.key);
  }

  for (let t = 0; t < n; t++) {
    for (let i = 0; i < m; i++) {
      const a = tileOriginal[t][i];
      const b = tileOriginal[t][(i + 1) % m];
      const minx = Math.min(a.qx, b.qx), maxx = Math.max(a.qx, b.qx);
      const miny = Math.min(a.qy, b.qy), maxy = Math.max(a.qy, b.qy);
      const dx = b.qx - a.qx, dy = b.qy - a.qy;
      const points = [];
      for (let qx = minx; qx <= maxx; qx++) {
        for (let qy = miny; qy <= maxy; qy++) {
          const key = pointKey(qx, qy);
          if (!vertexTiles.has(key)) continue;
          if ((qx - a.qx) * dy === (qy - a.qy) * dx) points.push({qx, qy, key});
        }
      }
      const physDx = dx / 4;
      const physDy = dy * Core.HALF_SQRT3 / 2;
      const l2 = Math.round((physDx*physDx + physDy*physDy) * 1e9) / 1e9;
      // Canonically split the one length-1 side even on the outer boundary,
      // as the implementation does. Actual foreign vertices are discovered above.
      if (Math.abs(l2 - 1) < 1e-6) {
        assert((a.qx + b.qx) % 2 === 0 && (a.qy + b.qy) % 2 === 0, 'non-lattice midpoint');
        const qx = (a.qx + b.qx) / 2, qy = (a.qy + b.qy) / 2;
        points.push({qx, qy, key: pointKey(qx, qy)});
      }
      // sort monotonically along the edge
      if (Math.abs(dx) >= Math.abs(dy)) points.sort((p,q) => dx >= 0 ? p.qx-q.qx : q.qx-p.qx);
      else points.sort((p,q) => dy >= 0 ? p.qy-q.qy : q.qy-p.qy);
      const unique = [];
      for (const p of points) if (!unique.length || unique[unique.length-1].key !== p.key) unique.push(p);
      assert(unique.length >= 2, `edge without endpoints tile=${t} edge=${i}`);
      assert(unique[0].key === a.key && unique[unique.length-1].key === b.key,
        `edge sort/endpoints failed tile=${t} edge=${i}`);
      const interior = unique.length - 2;
      maxInteriorVertices = Math.max(maxInteriorVertices, interior);
      const actualInterior = unique.slice(1, -1).filter(p => vertexTiles.has(p.key)).length;
      interiorVerticesByEdgeLength.set(l2, (interiorVerticesByEdgeLength.get(l2) || 0) + actualInterior);
      if (actualInterior && Math.abs(l2 - 1) > 1e-6) edgeWithUnexpectedInteriorVertex++;

      for (const p of unique) addBoundaryPoint(p, t);
      for (let k = 0; k + 1 < unique.length; k++) {
        const x = unique[k].key < unique[k+1].key ? unique[k].key : unique[k+1].key;
        const y = unique[k].key < unique[k+1].key ? unique[k+1].key : unique[k].key;
        const skey = `${x}:${y}`;
        let owners = segmentOwners.get(skey);
        if (!owners) segmentOwners.set(skey, owners = new Set());
        owners.add(t);
      }
    }
  }

  const edgePairs = new Set();
  const edgeBoundary = new Uint8Array(n);
  const touchBoundary = new Uint8Array(n);
  const boundaryPoints = new Set();
  let boundarySegments = 0;
  let overownedSegments = 0;
  const boundaryVertexDegree = new Map();
  for (const [skey, owners] of segmentOwners) {
    if (owners.size > 2) overownedSegments++;
    const arr = [...owners];
    if (arr.length === 2) edgePairs.add(pairKey(arr[0], arr[1], n));
    if (arr.length === 1) {
      edgeBoundary[arr[0]] = 1;
      boundarySegments++;
      const [ka,kb] = skey.split(':').map(Number);
      boundaryPoints.add(ka);
      boundaryPoints.add(kb);
      boundaryVertexDegree.set(ka, (boundaryVertexDegree.get(ka)||0)+1);
      boundaryVertexDegree.set(kb, (boundaryVertexDegree.get(kb)||0)+1);
    }
  }

  const touchPairs = new Set(edgePairs);
  for (const [key, rec] of allBoundaryPoints) {
    const arr = [...rec.tiles];
    if (boundaryPoints.has(key)) for (const tile of arr) touchBoundary[tile] = 1;
    for (let i=0;i<arr.length;i++) for(let j=i+1;j<arr.length;j++) {
      touchPairs.add(pairKey(arr[i],arr[j],n));
    }
  }

  const boundaryBadDegrees = [...boundaryVertexDegree.values()].filter(d => d !== 2);
  let edgeBoundaryCount = 0;
  let touchBoundaryCount = 0;
  for (const b of edgeBoundary) edgeBoundaryCount += b;
  for (const b of touchBoundary) touchBoundaryCount += b;

  return {
    originalVertexCount: vertexTiles.size,
    pointCount: allBoundaryPoints.size,
    segmentCount: segmentOwners.size,
    edgePairs,
    touchPairs,
    edgeBoundary,
    touchBoundary,
    edgeBoundaryCount,
    touchBoundaryCount,
    boundarySegments,
    overownedSegments,
    boundaryBadDegreeCount: boundaryBadDegrees.length,
    maxInteriorVertices,
    edgeWithUnexpectedInteriorVertex,
    interiorVerticesByEdgeLength: Object.fromEntries([...interiorVerticesByEdgeLength].sort((a,b)=>a[0]-b[0])),
    euler: allBoundaryPoints.size - segmentOwners.size + n,
  };
}

function compareSet(a,b,label) {
  if (a.size !== b.size) {
    const onlyA = [...a].filter(x=>!b.has(x)).slice(0,5);
    const onlyB = [...b].filter(x=>!a.has(x)).slice(0,5);
    throw new Error(`${label} size ${a.size} != ${b.size}; onlyA=${onlyA}; onlyB=${onlyB}`);
  }
  for (const x of a) assert(b.has(x), `${label} missing ${x}`);
}

function checkTransforms(patch) {
  const n=patch.tileCount, m=patch.verticesPerTile;
  let detPositive=0, detNegative=0, maxMetricError=0, maxVertexError=0;
  const centers = new Set();
  for(let t=0;t<n;t++) {
    const o=t*6, a=patch.transforms[o], b=patch.transforms[o+1], c=patch.transforms[o+2],
      d=patch.transforms[o+3], e=patch.transforms[o+4], f=patch.transforms[o+5];
    const det=a*e-b*d;
    if(det>0)detPositive++; else if(det<0)detNegative++; else throw new Error(`singular tile ${t}`);
    maxMetricError=Math.max(maxMetricError,Math.abs(a*a+d*d-.25),Math.abs(b*b+e*e-.25),Math.abs(a*b+d*e));
    for(let i=0;i<m;i++) {
      const p=Core.HAT_OUTLINE[i], x=a*p.x+b*p.y+c, y=d*p.x+e*p.y+f;
      const v=(t*m+i)*2;
      maxVertexError=Math.max(maxVertexError,Math.abs(x-patch.vertices[v]),Math.abs(y-patch.vertices[v+1]));
    }
    const ck=`${Math.round(patch.centers[t*2]*1e6)},${Math.round(patch.centers[t*2+1]*1e6)}`;
    assert(!centers.has(ck),`duplicate centre ${t}`); centers.add(ck);
  }
  assert(maxMetricError < 2e-5,`transform metric error ${maxMetricError}`);
  assert(maxVertexError < 5e-5,`vertex transform error ${maxVertexError}`);
  return {detPositive,detNegative,maxMetricError,maxVertexError};
}

function checkBoundaryDistances(boundary, graph, expected, label) {
  const n=boundary.length;
  const d=new Uint16Array(n); d.fill(0xffff);
  const q=new Uint32Array(n); let h=0,t=0;
  for(let i=0;i<n;i++) if(boundary[i]) {d[i]=0;q[t++]=i;}
  while(h<t){const x=q[h++], nd=d[x]+1; for(let k=graph.offsets[x];k<graph.offsets[x+1];k++){const y=graph.neighbors[k];if(d[y]===0xffff){d[y]=nd;q[t++]=y;}}}
  assert.strictEqual(t,n,`${label} boundary BFS did not reach all cells`);
  let maximum=0;
  for(let i=0;i<n;i++) {
    assert.strictEqual(d[i],expected[i],`${label} boundary distance mismatch ${i}`);
    if(d[i]>maximum) maximum=d[i];
  }
  return maximum;
}

function runDepth(depth) {
  const patch=Core.buildEinsteinPatch(depth);
  const expected=[4,25,169,1156,7921,54289][depth];
  assert.strictEqual(patch.tileCount,expected);
  const edge=graphPairSet(patch.edgeGraph,patch.tileCount);
  const touch=graphPairSet(patch.touchGraph,patch.tileCount);
  assert.strictEqual(connectedCount(patch.edgeGraph,patch.tileCount),patch.tileCount,'edge graph disconnected');
  assert.strictEqual(connectedCount(patch.touchGraph,patch.tileCount),patch.tileCount,'touch graph disconnected');
  for(const x of edge) assert(touch.has(x),'edge graph not subset of touch graph');
  const independent=independentTopology(patch);
  compareSet(edge,independent.edgePairs,`depth ${depth} edge graph`);
  compareSet(touch,independent.touchPairs,`depth ${depth} touch graph`);
  assert.strictEqual(independent.overownedSegments,0,'segment owned by >2 tiles');
  assert.strictEqual(independent.boundaryBadDegreeCount,0,'boundary is not disjoint cycles');
  assert.strictEqual(independent.euler,1,'patch topology is not a disk');
  assert.strictEqual(independent.edgeBoundaryCount,patch.edgeBoundaryCount,'edge boundary cell count mismatch');
  assert.strictEqual(independent.touchBoundaryCount,patch.touchBoundaryCount,'touch boundary cell count mismatch');
  for(let i=0;i<patch.tileCount;i++) {
    assert.strictEqual(independent.edgeBoundary[i],patch.edgeBoundary[i],`edge boundary flag mismatch ${i}`);
    assert.strictEqual(independent.touchBoundary[i],patch.touchBoundary[i],`touch boundary flag mismatch ${i}`);
  }
  assert.strictEqual(independent.pointCount,patch.latticePointCount,'lattice point count mismatch');
  assert.strictEqual(independent.edgeWithUnexpectedInteriorVertex,0,'unexpected T-junction on non-long edge');
  assert(independent.maxInteriorVertices <= 1,'edge has >1 interior vertex');
  const transforms=checkTransforms(patch);
  const maxEdgeBoundaryDistance=checkBoundaryDistances(independent.edgeBoundary,patch.edgeGraph,patch.edgeBoundaryDistance,'edge');
  const maxTouchBoundaryDistance=checkBoundaryDistances(independent.touchBoundary,patch.touchGraph,patch.touchBoundaryDistance,'touch');
  let centersInside=0, exactPicks=0;
  const picking=new Core.PickingIndex(patch);
  const stride=Math.max(1,Math.floor(patch.tileCount/2000));
  for(let i=0;i<patch.tileCount;i+=stride){
    const x=patch.centers[i*2],y=patch.centers[i*2+1];
    if(Core.pointInTile(patch,i,x,y)) centersInside++;
    if(picking.find(x,y)===i) exactPicks++;
  }
  const samples=Math.ceil(patch.tileCount/stride);
  assert.strictEqual(centersInside,samples,'some stored centres are outside their tile');
  assert.strictEqual(exactPicks,samples,'picking a tile centre returned a different tile');
  console.log(JSON.stringify({
    depth,n:patch.tileCount,buildMs:+patch.buildMilliseconds.toFixed(1),
    edgeEdges:edge.size,touchEdges:touch.size,
    edgeBoundaryCells:patch.edgeBoundaryCount,touchBoundaryCells:patch.touchBoundaryCount,
    points:independent.pointCount,segments:independent.segmentCount,boundarySegments:independent.boundarySegments,
    euler:independent.euler,maxInteriorVertices:independent.maxInteriorVertices,
    interiorVerticesByEdgeLength:independent.interiorVerticesByEdgeLength,
    maxEdgeBoundaryDistance,maxTouchBoundaryDistance,transforms,centerSamples:samples
  }));
}

for(const d of [0,1,2,3,4,5]) runDepth(d);
console.log('geometry and graph checks passed');
