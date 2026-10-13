'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const H = require('./hex-reference');
const catalogue = require('./catalogue-baseline.json');
const baseline = catalogue.filter(e => e.moving || e.expectedTravel).map(entry => ({ id: entry.id, orbit: H.findOrbit(entry, { maxSteps: 500 }) }));
const buckets = new Map();
const key = orbit => `${orbit.period}:${orbit.canonicalOrbit}`;
for (const item of baseline) {
  if (!buckets.has(key(item.orbit))) buckets.set(key(item.orbit), []);
  buckets.get(key(item.orbit)).push(item);
}
let raw = 0, duplicates = 0;
const novel = [];
for (const campaign of ['mixed', 'n7', 'n8', 'mutations']) {
  const lines = fs.readFileSync(`${__dirname}/${campaign}-candidates.jsonl`, 'utf8').trim().split('\n').filter(Boolean);
  for (const line of lines) {
    const candidate = JSON.parse(line);
    raw++;
    const orbit = H.findOrbit(candidate, { maxSteps: candidate.period });
    assert.equal(orbit.kind, 'spaceship');
    assert.equal(orbit.transient, 0);
    assert.equal(orbit.period, candidate.period);
    assert.deepEqual(orbit.translation, candidate.translation);
    const bucket = buckets.get(key(orbit)) || [];
    if (bucket.some(item => H.equivalentOrbits(orbit, item.orbit))) { duplicates++; continue; }
    const record = { ...candidate, campaign, evidence: H.serialisableOrbit(orbit) };
    novel.push(record);
    bucket.push({ id: `${campaign}:${candidate.seedId}:${candidate.rule}:${candidate.generations}`, orbit });
    buckets.set(key(orbit), bucket);
  }
}
novel.sort((a, b) => b.period - a.period || a.initial.length - b.initial.length);
fs.writeFileSync(`${__dirname}/distinct-movers.json`, JSON.stringify(novel, null, 2) + '\n');
const report = { rawRecords: raw, knownOrNewOrbitDuplicates: duplicates, distinctCompleteOrbitsAbsentFromCatalogue: novel.length, caveat: 'These are complete-orbit distinctions from the frozen 33-entry catalogue and one another, not publication-priority claims. Refractory-tail variants and independent convoys may remain qualitatively redundant.', longest: novel.slice(0, 12).map(c => ({ rule: c.rule, generations: c.generations, period: c.period, translation: c.translation, initial: c.initial.length, transient: c.transient })) };
fs.writeFileSync(`${__dirname}/mover-analysis.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
