'use strict';
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const long = process.argv.includes('--long') ? ['--long'] : [];
for (const [script, args] of [
  ['verify-catalogue-links.js', []],
  ['verify-hat-relay.js', long], ['verify-puffer.js', []], ['verify-new-hex-ship.js', []],
  ['verify-hat-six-launcher.js', []], ['verify-hat-emitter.js', []],
]) execFileSync(process.execPath, [path.join(__dirname, script), ...args], { stdio: 'inherit' });
