'use strict';

// Generate the browser's offline credit data and the complete readable audit.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const records = JSON.parse(read('research/fixtures/catalogue-provenance.json'));
const entries = require('../discoveries.js');
const labels = {
  published: 'Published example',
  adapted: 'Adapted example',
  'package-found': 'Found by this package; priority unestablished',
  'package-constructed': 'Constructed for this package',
  unresolved: 'Attribution unresolved',
};
const ids = new Set(entries.map((entry) => entry.id));
assert.equal(records.length, ids.size, 'Every example needs exactly one provenance record');
const byId = new Map();
for (const record of records) {
  assert(ids.has(record.id), `Unknown example: ${record.id}`);
  assert(!byId.has(record.id), `Duplicate provenance: ${record.id}`);
  assert(Object.hasOwn(labels, record.status), `Unknown provenance status: ${record.id}`);
  assert(typeof record.credit === 'string' && record.credit.trim(), `Missing credit: ${record.id}`);
  assert(typeof record.note === 'string' && record.note.trim(), `Missing scope note: ${record.id}`);
  assert(Array.isArray(record.sources), `Missing sources array: ${record.id}`);
  assert(Array.isArray(record.evidence) && record.evidence.length, `Missing evidence: ${record.id}`);
  for (const source of record.sources) {
    assert(source.label && /^https?:$/.test(new URL(source.url).protocol), `Invalid source: ${record.id}`);
  }
  for (const evidence of record.evidence) {
    assert(!path.isAbsolute(evidence) && !evidence.split('/').includes('..'), `Invalid evidence path: ${record.id}`);
    assert(fs.statSync(path.join(root, evidence)).isFile(), `Missing evidence: ${evidence}`);
  }
  byId.set(record.id, record);
}
const ordered = entries.map((entry) => byId.get(entry.id));
const embedded = Object.fromEntries(ordered.map(({ id, ...record }) => [id, record]));
const start = '  // BEGIN GENERATED CATALOGUE PROVENANCE';
const end = '  // END GENERATED CATALOGUE PROVENANCE';
const block = `${start}
  // Edit research/fixtures/catalogue-provenance.json, then run:
  // node tools/build_catalogue_credits.js
  const PROVENANCE = ${JSON.stringify(embedded, null, 2).replace(/\n/g, '\n  ')};
  for (const record of Object.values(PROVENANCE)) {
    record.sources.forEach(Object.freeze);
    Object.freeze(record.sources);
    Object.freeze(record.evidence);
    Object.freeze(record);
  }
  Object.freeze(PROVENANCE);
${end}`;
const current = read('discoveries.js');
assert.equal(current.split(start).length, 2, 'Missing or duplicate provenance start marker');
assert.equal(current.split(end).length, 2, 'Missing or duplicate provenance end marker');
const generated = current.slice(0, current.indexOf(start)) + block + current.slice(current.indexOf(end) + end.length);

const lines = [
  '# Catalogue credits and provenance',
  '',
  'Every curated example has an individual record below. This audit distinguishes a published rule or behaviour from a seed selected on this package’s own board. Reproducing a known pattern, changing its orientation or phase, or finding another placement does not establish a new discovery.',
  '',
  '**“Found by this package” records where a configuration came from, not worldwide originality.** Earlier priority remains unestablished unless a published source is identified. “Constructed” describes a demonstration assembled for this package; it does not claim invention of its rule or mechanism. An unsuccessful literature search is not evidence of novelty.',
  '',
  'James Edmond’s [interactive project](https://offlattice.org/monotile/) and [Gliders on Aperiodic Monotilings: Cellular Automata on the Hat and Spectre](https://arxiv.org/abs/2609.22579) are the source of the Hat A/B/C rules, their gliders and the Hat C triple behaviour. The three-state SIMPLE example is a derivative of Hat B. See the individual records for the distinction between these published behaviours and the package’s selected launch positions.',
  '',
  'The review used published papers, author-maintained repositories and pattern collections, original forum posts and the retained search records. Matching rules or periods alone was not treated as identity of patterns. Coverage is limited to the sources recorded here; undocumented independent discoveries and inaccessible material may predate these examples. Please submit earlier sources or attribution corrections with enough information to compare the complete pattern.',
  '',
  'Audit date: 13 October 2026. Generated from [catalogue-provenance.json](../research/fixtures/catalogue-provenance.json) by `node tools/build_catalogue_credits.js`. Source links document credit; local evidence links document the supplied configuration and its verification. Software licences are recorded separately in [third-party notices](../THIRD_PARTY_LICENSES.md).',
  '',
  '| Classification | Examples |',
  '| --- | ---: |',
  ...Object.entries(labels).filter(([status]) => ordered.some((record) => record.status === status))
    .map(([status, label]) => `| ${label} | ${ordered.filter((record) => record.status === status).length} |`),
  '',
];
for (const tiling of ['hat', 'penrose', 'hex', 'square']) {
  lines.push(`## ${{ hat: 'Einstein-hat', penrose: 'Penrose', hex: 'Hexagonal', square: 'Square' }[tiling]} examples`, '');
  for (const entry of entries.filter((item) => item.tiling === tiling)) {
    const record = byId.get(entry.id);
    lines.push(`### ${entry.title}`, '', `\`${entry.id}\` · \`${entry.rule}\` · ${entry.generations} states · ${entry.neighborhood === 'touch' ? 'edge-or-corner' : 'shared-edge'} neighbourhood`, '',
      `**${labels[record.status]}.** ${record.credit}`, '', record.note, '');
    if (record.sources.length) lines.push('Sources: ' + record.sources.map((source) => `[${source.label}](${source.url})`).join('; ') + '.', '');
    lines.push('Local evidence: ' + record.evidence.map((name) => `[${name}](../${name})`).join('; ') + '.', '');
  }
}
const outputs = [['discoveries.js', generated], ['docs/CATALOGUE_CREDITS.md', lines.join('\n')]];
const check = process.argv.includes('--check');
for (const [name, text] of outputs) {
  if (check) assert.equal(read(name), text, `${name} is stale; run node tools/build_catalogue_credits.js`);
  else fs.writeFileSync(path.join(root, name), text);
}
console.log(`${check ? 'Checked' : 'Generated'} credits for ${ordered.length} examples.`);
