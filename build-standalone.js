'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const outputPath = path.join(root, 'aperiodic-life-standalone.html');

const licenseComment = `<!--
Aperiodic Life standalone build.

MIT License

Copyright (c) 2026 Aperiodic Life contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Hat substitution geometry is adapted from Craig S. Kaplan's hatviz,
Copyright (c) 2023, Craig S. Kaplan.

BSD 3-Clause License

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
-->`;

function read(name) {
  return fs.readFileSync(path.join(root, name), 'utf8').replace(/\s+$/, '');
}

function replaceOnce(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`Could not find ${label}`);
  if (source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`Found ${label} more than once`);
  }
  // A function replacement is essential: a plain replacement string treats
  // $&, $`, and $' in embedded source as special expansion tokens.
  return source.replace(needle, () => replacement);
}

function hasRawEndTag(source, elementName) {
  // In HTML raw-text elements the end-tag name is ASCII-case-insensitive and
  // may be followed by whitespace, a slash, or `>`. Checking only the literal
  // lowercase spelling would allow otherwise harmless source text to truncate
  // the inline script or style when parsed by a browser.
  const pattern = new RegExp(`<\\/${elementName}(?=[\\t\\n\\f\\r />])`, 'i');
  return pattern.test(source);
}

function build() {
  const version = read('VERSION');
  if (!/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(version)) {
    throw new Error('VERSION must contain major.minor.patch');
  }
  const css = read('styles.css');
  const core = read('core.js');
  const discoveries = read('discoveries.js');
  const app = read('app.js');
  let html = read('index.html');

  if ([core, discoveries, app].some((source) => hasRawEndTag(source, 'script'))) {
    throw new Error('Inline JavaScript contains a closing script tag');
  }
  if (hasRawEndTag(css, 'style')) {
    throw new Error('Inline CSS contains a closing style tag');
  }
  if (!html.startsWith('<!doctype html>')) {
    throw new Error('index.html must start with <!doctype html>');
  }

  html = replaceOnce(
    html,
    `  <link rel="stylesheet" href="styles.css?v=${version}">`,
    `  <style>
${css}
  </style>`,
    'the stylesheet link',
  );
  html = replaceOnce(
    html,
    `  <script src="core.js?v=${version}"></script>
  <script src="discoveries.js?v=${version}"></script>
  <script src="app.js?v=${version}"></script>`,
    `  <script>
${core}
  </script>
  <script>
${discoveries}
  </script>
  <script>
${app}
  </script>`,
    'the runtime script block',
  );

  if (/href="styles\.css(?:\?[^"]*)?"|src="(?:core|discoveries|app)\.js(?:\?[^"]*)?"/.test(html)) {
    throw new Error('Failed to inline one or more source assets');
  }

  return replaceOnce(html, '<!doctype html>', `<!doctype html>\n${licenseComment}`, 'the doctype') + '\n';
}

if (require.main === module) {
  const generated = build();
  if (process.argv.includes('--check')) {
    const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
    if (current !== generated) {
      console.error(`${path.basename(outputPath)} is out of date; run node build-standalone.js`);
      process.exitCode = 1;
    } else {
      console.log('standalone bundle is up to date');
    }
  } else {
    fs.writeFileSync(outputPath, generated);
    console.log(`wrote ${path.basename(outputPath)} (${Buffer.byteLength(generated)} bytes)`);
  }
}

module.exports = Object.freeze({ build, hasRawEndTag });
