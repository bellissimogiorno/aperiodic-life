'use strict';

// Run from the repository root: node research/verify-hex-published-provenance.js
// This checks pattern identity, not historical priority or source availability.
const assert = require('node:assert/strict');
const catalogue = require('../discoveries.js');
const reference = require('./hex-reference.js');
const fixture = require('./fixtures/hex-published-provenance.json');

function parseRle(body) {
  let x = 0, y = 0, digits = '';
  const cells = [];
  for (const symbol of body) {
    if (/\d/.test(symbol)) { digits += symbol; continue; }
    const count = Number(digits || 1);
    digits = '';
    if (symbol === '$') { y += count; x = 0; }
    else if (symbol === '!') break;
    else if (symbol === 'b' || symbol === '.') x += count;
    else {
      assert(symbol === 'o' || /^[A-X]$/.test(symbol), `Unsupported RLE symbol ${symbol}`);
      const state = symbol === 'o' ? 1 : symbol.charCodeAt(0) - 64;
      for (let index = 0; index < count; index++, x++) cells.push([x, y - x, state]);
    }
  }
  return cells;
}

for (const evidence of fixture.entries) {
  const entry = catalogue.find(candidate => candidate.id === evidence.id);
  assert(entry, evidence.id);
  assert.equal(entry.rule, evidence.rule);
  assert.equal(entry.generations, evidence.generations);
  let published = parseRle(evidence.publishedRle);
  if (evidence.comparison.shift !== undefined) {
    const actual = reference.equivalentOrbits(
      reference.findOrbit(entry, { maxSteps: 30 }),
      reference.findOrbit({ ...entry, coordinateStates: published }, { maxSteps: 30 })
    );
    assert.deepEqual(actual, evidence.comparison, evidence.id);
  } else {
    if (evidence.comparison.publishedComponentCells) {
      published = published.filter(([q]) => q < 10);
      assert.equal(published.length, evidence.comparison.publishedComponentCells);
    }
    const left = reference.normalise(entry.coordinateStates);
    const right = reference.normalise(published);
    assert.equal(left.key, right.key, evidence.id);
    const expected = evidence.comparison.catalogueEqualsPublishedPlusTranslation
      || evidence.comparison.catalogueEqualsPublishedComponentPlusTranslation;
    assert.deepEqual(left.origin.map((value, index) => value - right.origin[index]), expected);
  }
}
console.log(`Verified exact published-pattern identity for ${fixture.entries.length} hexagonal catalogue entries.`);
