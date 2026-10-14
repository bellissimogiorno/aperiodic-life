'use strict';

// Dependency-free browser smoke/regression test for Chromium-compatible browsers.
// It uses Node 22's built-in fetch/WebSocket and the Chrome DevTools Protocol.

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = __dirname;
const STANDALONE = path.join(ROOT, 'aperiodic-life-standalone.html');
const TIMEOUT = 45_000;

class BrowserEnvironmentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BrowserEnvironmentError';
    this.exitCode = 2;
  }
}

function commandPath(names) {
  for (const name of names) {
    try {
      const result = childProcess.execFileSync('sh', ['-c', `command -v ${name}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (result) return result;
    } catch (_) {
      // Try the next name.
    }
  }
  return null;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function mimeType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

async function startServer() {
  const server = http.createServer((request, response) => {
    try {
      const requested = new URL(request.url, 'http://127.0.0.1').pathname;
      const relative = requested === '/' ? 'index.html' : decodeURIComponent(requested.slice(1));
      const resolved = path.resolve(ROOT, relative);
      if (resolved !== ROOT && !resolved.startsWith(`${ROOT}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const data = fs.readFileSync(resolved);
      response.writeHead(200, {
        'Content-Type': mimeType(resolved),
        'Cache-Control': 'no-store',
      });
      response.end(data);
    } catch (_) {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server;
}

class CDP {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.socket = null;
  }

  async open() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out opening DevTools WebSocket')), 10_000);
      this.socket.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.socket.addEventListener('error', (event) => {
        clearTimeout(timer);
        reject(event.error || new Error('DevTools WebSocket error'));
      }, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject, timer } = this.pending.get(message.id);
        clearTimeout(timer);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(`${message.error.message || 'CDP error'} (${message.error.code})`));
        else resolve(message.result || {});
      } else {
        this.events.push(message);
      }
    });
  }

  call(method, params = {}, timeout = 20_000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP ${method} timed out`));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, awaitPromise = true) {
    const result = await this.call('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      const description = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
      throw new Error(description || 'Browser evaluation failed');
    }
    return result.result?.value;
  }

  close() {
    if (this.socket && this.socket.readyState < WebSocket.CLOSING) this.socket.close();
  }
}

async function launchChromium(url) {
  const chromium = process.env.CHROMIUM || commandPath(['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']);
  if (!chromium) throw new Error('Chromium was not found; set CHROMIUM to its executable path');
  const xvfb = commandPath(['xvfb-run']);
  const debugPort = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'aperiodic-life-browser-'));
  const logPath = path.join(profile, 'chromium.log');
  const log = fs.openSync(logPath, 'w');
  const browserArgs = [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-sync',
    '--metrics-recording-only',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--enable-unsafe-swiftshader',
    '--remote-allow-origins=*',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    '--window-size=1440,1000',
    '--lang=en-US',
    url,
  ];
  const executable = xvfb ? xvfb : chromium;
  const args = xvfb ? ['-a', chromium, ...browserArgs] : ['--headless=new', ...browserArgs];
  const processHandle = childProcess.spawn(executable, args, {
    stdio: ['ignore', 'ignore', log],
    detached: process.platform !== 'win32',
    env: { ...process.env, TERM: process.env.TERM || 'dumb' },
  });

  let targets = null;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      fs.closeSync(log);
      throw new Error(`Chromium exited early with status ${processHandle.exitCode}; see ${logPath}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      targets = await response.json();
      const pages = targets.filter((target) => target.type === 'page');
      const page = pages.find((target) => /^(https?|file):/.test(target.url)) || pages[0];
      if (page) {
        const cdp = new CDP(page.webSocketDebuggerUrl);
        await cdp.open();
        await cdp.call('Page.enable');
        await cdp.call('Runtime.enable');
        await cdp.call('Log.enable');
        return { processHandle, profile, log, logPath, cdp };
      }
    } catch (_) {
      // DevTools is not ready yet.
    }
    await delay(100);
  }
  terminateProcess(processHandle, 'SIGKILL');
  fs.closeSync(log);
  throw new Error(`DevTools endpoint did not become ready; see ${logPath}`);
}

function terminateProcess(processHandle, signal) {
  if (!processHandle || processHandle.exitCode !== null) return;
  try {
    if (process.platform !== 'win32' && processHandle.pid) process.kill(-processHandle.pid, signal);
    else processHandle.kill(signal);
  } catch (_) {
    // The browser may already have exited between the state check and signal.
  }
}

async function stopChromium(browser) {
  try {
    await browser.cdp.call('Browser.close', {}, 3_000);
  } catch (_) {
    terminateProcess(browser.processHandle, 'SIGTERM');
  }
  browser.cdp.close();
  await Promise.race([
    new Promise((resolve) => {
      if (browser.processHandle.exitCode !== null) resolve();
      else browser.processHandle.once('exit', resolve);
    }),
    delay(5_000).then(() => terminateProcess(browser.processHandle, 'SIGKILL')),
  ]);
  try { fs.closeSync(browser.log); } catch (_) { /* already closed */ }
}

async function injectStandalone(cdp) {
  const { frameTree } = await cdp.call('Page.getFrameTree');
  const html = fs.readFileSync(STANDALONE, 'utf8');
  await cdp.call('Page.setDocumentContent', {
    frameId: frameTree.frame.id,
    html,
  }, 15_000);
}

async function probe(cdp, expression) {
  return cdp.evaluate(`(() => {
    let value = false;
    try { value = Boolean(${expression}); } catch (_) { /* page is not ready */ }
    return {
      value,
      href: location.href,
      title: document.title || '',
      text: (document.body && document.body.innerText || '').slice(0, 700),
    };
  })()`);
}

function assertBrowserEnvironment(page) {
  const diagnostic = `${page.href}\n${page.title}\n${page.text}`;
  if (
    page.href.startsWith('chrome-error://') ||
    /ERR_BLOCKED_BY_ADMINISTRATOR|URLBlocklist|organization.{0,80}(?:doesn.t allow|blocked)|(?:site|page).{0,40}is blocked/i.test(diagnostic)
  ) {
    throw new BrowserEnvironmentError(
      'Chromium policy blocked the local test page. Run this test in an environment that permits localhost and file URLs.',
    );
  }
}

async function waitFor(cdp, expression, description, timeout = TIMEOUT) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    last = await probe(cdp, expression);
    assertBrowserEnvironment(last);
    if (last.value) return last.value;
    await delay(80);
  }
  throw new Error(`Timed out waiting for ${description}; last page state: ${JSON.stringify(last)}`);
}

async function setAndChange(cdp, id, value) {
  await cdp.evaluate(`(() => {
    const element = document.getElementById(${JSON.stringify(id)});
    element.value = ${JSON.stringify(String(value))};
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
}

async function click(cdp, id) {
  await cdp.evaluate(`document.getElementById(${JSON.stringify(id)}).click(); true`);
}

async function touchButton(cdp, id) {
  const target = await cdp.evaluate(`(() => {
    const button = document.getElementById(${JSON.stringify(id)});
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    return {
      x, y,
      visible: rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight,
      reachable: button.contains(document.elementFromPoint(x, y)),
      disabled: button.disabled,
    };
  })()`);
  assert.strictEqual(target.visible, true, `${id}: fully inside the viewport`);
  assert.strictEqual(target.reachable, true, `${id}: must not be covered by the drawer or another control`);
  assert.strictEqual(target.disabled, false, `${id}: enabled`);
  await cdp.call('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: target.x, y: target.y }],
  });
  await cdp.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function assertPlaybackState(cdp, running) {
  await waitFor(cdp, `
    document.getElementById('runButton').textContent === ${JSON.stringify(running ? 'Pause' : 'Run')} &&
    document.getElementById('viewportRunButton').textContent === ${JSON.stringify(running ? 'Pause' : 'Play')}
  `, `synchronised ${running ? 'running' : 'paused'} buttons`, 5_000);
  if (!running) {
    const generation = await cdp.evaluate("document.getElementById('generationStat').textContent");
    await delay(150);
    assert.strictEqual(await cdp.evaluate("document.getElementById('generationStat').textContent"), generation,
      'Pause must stop generation updates');
  }
}

async function checkPlaybackControls(cdp) {
  console.error('[browser] testing prominent configurations and persistent playback controls');
  assert.strictEqual(await cdp.evaluate(`(() => {
    const controls = document.getElementById('controls');
    const firstSection = controls.querySelector('section');
    return firstSection.contains(document.getElementById('discoverySelect')) &&
      firstSection.contains(document.getElementById('loadDiscoveryButton')) &&
      firstSection.contains(document.getElementById('loadRunDiscoveryButton')) &&
      !controls.contains(document.getElementById('viewportRunButton'));
  })()`), true, 'curated configurations must be first and viewport playback must be outside the drawer');

  await loadDiscovery(cdp, 'square-glider', '2,601');
  await assertPlaybackState(cdp, false);
  await click(cdp, 'viewportRunButton');
  await assertPlaybackState(cdp, true);
  await waitFor(cdp, "Number(document.getElementById('generationStat').textContent) > 0", 'viewport Play advances generations', 5_000);
  await click(cdp, 'runButton');
  await assertPlaybackState(cdp, false);

  await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  try {
    for (const [width, height] of [[390, 844], [740, 360]]) {
      await cdp.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await delay(250);
      assert.strictEqual(await cdp.evaluate("document.getElementById('controls').classList.contains('open')"), false);
      const geometry = await cdp.evaluate(`(() => {
        const play = document.getElementById('viewportRunButton').getBoundingClientRect();
        const menu = document.getElementById('openControls').getBoundingClientRect();
        return {
          largeTarget: play.width >= 44 && play.height >= 44,
          separate: play.right <= menu.left || play.left >= menu.right || play.bottom <= menu.top || play.top >= menu.bottom,
        };
      })()`);
      assert.strictEqual(geometry.largeTarget, true, `${width}×${height}: playback touch target`);
      assert.strictEqual(geometry.separate, true, `${width}×${height}: playback must not overlap Controls`);

      await touchButton(cdp, 'viewportRunButton');
      await assertPlaybackState(cdp, true);
      await touchButton(cdp, 'viewportRunButton');
      await assertPlaybackState(cdp, false);
      await touchButton(cdp, 'openControls');
      await waitFor(cdp, "document.getElementById('controls').classList.contains('open')", 'mobile controls drawer');
      await delay(250);

      await loadDiscovery(cdp, 'square-glider', '2,601', true);
      await assertPlaybackState(cdp, true);
      await waitFor(cdp, "!document.getElementById('controls').classList.contains('open')", 'Load and run closes mobile drawer');
      await delay(250);
      await touchButton(cdp, 'openControls');
      await waitFor(cdp, "document.getElementById('controls').classList.contains('open')", 'reopened mobile controls drawer');
      await delay(250);
      await cdp.evaluate("document.getElementById('controls').scrollTop = 10000; true");
      await touchButton(cdp, 'viewportRunButton');
      await assertPlaybackState(cdp, false);
      await touchButton(cdp, 'viewportRunButton');
      await assertPlaybackState(cdp, true);
      await cdp.evaluate("document.getElementById('aboutButton').scrollIntoView({ block: 'end' }); true");
      await touchButton(cdp, 'aboutButton');
      await waitFor(cdp, "document.getElementById('aboutDialog').open", 'mobile About dialog');
      const aboutGeometry = await cdp.evaluate(`(() => {
        const dialog = document.getElementById('aboutDialog');
        const rect = dialog.getBoundingClientRect();
        const form = dialog.querySelector('form');
        return {
          insideViewport: rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight,
          scrollable: form.scrollHeight <= form.clientHeight || ['auto', 'scroll'].includes(getComputedStyle(form).overflowY),
          activeInside: dialog.contains(document.activeElement),
        };
      })()`);
      assert.deepStrictEqual(aboutGeometry, { insideViewport: true, scrollable: true, activeInside: true }, `${width}×${height}: About must fit and scroll`);
      await cdp.evaluate("document.getElementById('cataloguePdfLink').scrollIntoView({ block: 'center' }); true");
      assert.strictEqual(await cdp.evaluate(`(() => {
        const link = document.getElementById('cataloguePdfLink');
        const rect = link.getBoundingClientRect();
        return link.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
      })()`), true, `${width}×${height}: catalogue link must be reachable`);
      await cdp.evaluate("document.getElementById('aboutCloseButton').scrollIntoView({ block: 'start' }); true");
      await touchButton(cdp, 'aboutCloseButton');
      await waitFor(cdp, "!document.getElementById('aboutDialog').open", 'mobile About closes');
      assert.strictEqual(await cdp.evaluate("document.activeElement.id"), 'aboutButton', 'closing About returns focus to its trigger');
      assert.strictEqual(await cdp.evaluate("document.getElementById('controls').classList.contains('open')"), true, 'closing About keeps the mobile controls open');
      await cdp.evaluate("document.getElementById('controls').scrollTop = 0; true");
      await touchButton(cdp, 'closeControls');
      await waitFor(cdp, "!document.getElementById('controls').classList.contains('open')", 'closed mobile drawer');
      await delay(250);
      await loadDiscovery(cdp, 'square-glider', '2,601');
      await assertPlaybackState(cdp, false);
    }
  } finally {
    await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.call('Emulation.clearDeviceMetricsOverride');
    await delay(250);
  }
}

async function checkMobilePinch(cdp) {
  console.error('[browser] testing mobile pinch, two-finger pan and touch painting');
  const touch = (type, points) => cdp.call('Input.dispatchTouchEvent', {
    type,
    touchPoints: points.map((point) => ({ ...point, radiusX: 1, radiusY: 1, force: 1 })),
  });
  const close = (actual, expected, tolerance, label) => {
    assert(Math.abs(actual - expected) <= tolerance,
      `${label}: expected ${expected}, received ${actual}`);
  };
  await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  try {
    for (const [width, height] of [[390, 844], [740, 360]]) {
      await cdp.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await delay(250);
      for (const tool of ['pan', 'paint']) {
        const label = `${width}×${height} ${tool}`;
        await loadDiscovery(cdp, 'square-glider', '2,601');
        await click(cdp, 'clearButton');
        await click(cdp, 'fitButton');
        await setAndChange(cdp, 'toolSelect', tool);
        await delay(100);
        const rect = await cdp.evaluate(`(() => {
          const rect = document.getElementById('lifeCanvas').getBoundingClientRect();
          return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        })()`);
        const midpoint = {
          x: rect.left + rect.width / 2 + 24,
          y: rect.top + rect.height / 2 + 30,
        };
        const worldAt = (view, point) => [
          view.center[0] + (point.x - rect.left - rect.width / 2) / view.zoom,
          view.center[1] - (point.y - rect.top - rect.height / 2) / view.zoom,
        ];
        const before = await cameraView(cdp);
        const anchor = worldAt(before, midpoint);
        let first = { id: 1, x: midpoint.x - 25, y: midpoint.y };
        let second = { id: 2, x: midpoint.x + 25, y: midpoint.y };
        await touch('touchStart', [first, second]);
        for (const halfSpan of [30, 35, 40, 45, 50]) {
          first = { ...first, x: midpoint.x - halfSpan };
          second = { ...second, x: midpoint.x + halfSpan };
          await touch('touchMove', [first, second]);
        }
        await delay(100);
        const zoomed = await cameraView(cdp);
        close(zoomed.zoom / before.zoom, 2, 0.002, `${label}: pinch scale`);
        const zoomedAnchor = worldAt(zoomed, midpoint);
        close(zoomedAnchor[0], anchor[0], 0.2 / zoomed.zoom, `${label}: horizontal pinch anchor`);
        close(zoomedAnchor[1], anchor[1], 0.2 / zoomed.zoom, `${label}: vertical pinch anchor`);

        first = { ...first, x: first.x + 20, y: first.y + 15 };
        second = { ...second, x: second.x + 20, y: second.y + 15 };
        await touch('touchMove', [first, second]);
        await delay(100);
        const panned = await cameraView(cdp);
        close(panned.zoom / zoomed.zoom, 1, 0.002, `${label}: two-finger pan preserves zoom`);
        close(panned.center[0], zoomed.center[0] - 20 / zoomed.zoom, 0.2 / zoomed.zoom, `${label}: two-finger horizontal pan`);
        close(panned.center[1], zoomed.center[1] + 15 / zoomed.zoom, 0.2 / zoomed.zoom, `${label}: two-finger vertical pan`);

        // Empty touchEnd/touchCancel point lists work across Chromium versions.
        // Lifting one finger and continuing with the other is covered by the
        // pointer interaction tests; CDP's selective-lift protocol varies.
        await touch('touchEnd', []);
        assert.strictEqual(await cdp.evaluate("document.getElementById('aliveStat').textContent.startsWith('0 ')"), true,
          `${label}: pinch and two-finger pan must not paint`);
        assert.strictEqual(await cdp.evaluate("document.getElementById('lifeCanvas').classList.contains('dragging')"), false,
          `${label}: lifting all fingers ends the gesture`);

        if (tool === 'paint') {
          await click(cdp, 'fitButton');
          await delay(100);
          const tap = { id: 3, ...await canvasPoint(cdp) };
          await touch('touchStart', [tap]);
          await touch('touchCancel', []);
          assert.strictEqual(await cdp.evaluate("document.getElementById('aliveStat').textContent.startsWith('0 ')"), true,
            `${label}: cancelled tap must not paint`);
          await touch('touchStart', [tap]);
          await touch('touchEnd', []);
          await waitFor(cdp, "document.getElementById('aliveStat').textContent.startsWith('1 ')",
            `${label}: a new single-finger tap paints after pinch and cancellation`, 5_000);
        }
      }
    }
  } finally {
    await touch('touchCancel', []).catch(() => {});
    await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.call('Emulation.clearDeviceMetricsOverride');
    await delay(250);
  }
}

async function setTilingAndDepth(cdp, tiling, depth) {
  await cdp.evaluate(`(() => {
    const tilingSelect = document.getElementById('tilingSelect');
    tilingSelect.value = ${JSON.stringify(tiling)};
    tilingSelect.dispatchEvent(new Event('change', { bubbles: true }));
    const depthSelect = document.getElementById('depthSelect');
    depthSelect.value = ${JSON.stringify(String(depth))};
    depthSelect.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
}

async function loadDiscovery(cdp, id, expectedCells, runAfterLoad = false) {
  const buttonId = runAfterLoad ? 'loadRunDiscoveryButton' : 'loadDiscoveryButton';
  const selected = await cdp.evaluate(`(() => {
    const select = document.getElementById('discoverySelect');
    select.value = ${JSON.stringify(id)};
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      value: select.value,
      hasOption: [...select.options].some((option) => option.value === ${JSON.stringify(id)}),
      disabled: document.getElementById(${JSON.stringify(buttonId)}).disabled,
      optionCount: select.options.length,
      globalType: typeof window.AperiodicLifeDiscoveries,
      globalArray: Array.isArray(window.AperiodicLifeDiscoveries),
      globalLength: Array.isArray(window.AperiodicLifeDiscoveries) ? window.AperiodicLifeDiscoveries.length : null,
      moduleType: typeof module,
    };
  })()`);
  assert.strictEqual(selected.value, id, `${id}: selected value; diagnostics ${JSON.stringify(selected)}`);
  assert.strictEqual(selected.hasOption, true, `${id}: option exists; diagnostics ${JSON.stringify(selected)}`);
  assert.strictEqual(selected.disabled, false, `${id}: action enabled; diagnostics ${JSON.stringify(selected)}`);
  await click(cdp, buttonId);
  await waitFor(
    cdp,
    `document.getElementById('busy').hidden && document.getElementById('cellsStat').textContent === ${JSON.stringify(expectedCells)}`,
    `discovery ${id}`,
  );
}

async function pressSpace(cdp) {
  const common = { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 };
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', text: ' ', ...common });
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', ...common });
}

async function canvasPoint(cdp) {
  return cdp.evaluate(`(() => {
    const rect = document.getElementById('lifeCanvas').getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
}

async function cameraCenter(cdp) {
  return cdp.evaluate(`(() => {
    const gl = document.getElementById('lifeCanvas').getContext('webgl2');
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    const location = program && gl.getUniformLocation(program, 'u_center');
    const value = location && gl.getUniform(program, location);
    if (!value || value.length !== 2) throw new Error('Could not inspect the rendered camera centre');
    return Array.from(value);
  })()`);
}

async function cameraView(cdp) {
  return cdp.evaluate(`(() => {
    const canvas = document.getElementById('lifeCanvas');
    const gl = canvas.getContext('webgl2');
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    const centerLocation = program && gl.getUniformLocation(program, 'u_center');
    const zoomLocation = program && gl.getUniformLocation(program, 'u_zoom');
    const center = centerLocation && gl.getUniform(program, centerLocation);
    const deviceZoom = zoomLocation && gl.getUniform(program, zoomLocation);
    if (!center || center.length !== 2 || !Number.isFinite(deviceZoom)) {
      throw new Error('Could not inspect the rendered camera view');
    }
    const rect = canvas.getBoundingClientRect();
    return {
      center: Array.from(center),
      zoom: deviceZoom / (window.devicePixelRatio || 1),
      width: rect.width,
      height: rect.height,
    };
  })()`);
}

function assertTrajectoryFraming(view, bounds, padding, id) {
  const expectedCenter = [
    (bounds[0] + bounds[2]) / 2,
    (bounds[1] + bounds[3]) / 2,
  ];
  assert(Math.abs(view.center[0] - expectedCenter[0]) < 1e-3, `${id}: horizontal framing`);
  assert(Math.abs(view.center[1] - expectedCenter[1]) < 1e-3, `${id}: vertical framing`);
  const halfWidth = view.width / (2 * view.zoom);
  const halfHeight = view.height / (2 * view.zoom);
  assert(view.center[0] - halfWidth <= bounds[0] - padding + 1e-3, `${id}: left corridor framing`);
  assert(view.center[0] + halfWidth >= bounds[2] + padding - 1e-3, `${id}: right corridor framing`);
  assert(view.center[1] - halfHeight <= bounds[1] - padding + 1e-3, `${id}: bottom corridor framing`);
  assert(view.center[1] + halfHeight >= bounds[3] + padding - 1e-3, `${id}: top corridor framing`);
}

async function checkDiscoveryPresentation(cdp, expected) {
  await loadDiscovery(cdp, expected.id, expected.cells);
  await delay(100);
  const controls = await cdp.evaluate(`(() => ({
    discovery: document.getElementById('discoverySelect').value,
    tiling: document.getElementById('tilingSelect').value,
    depth: document.getElementById('depthSelect').value,
    neighborhood: document.getElementById('neighborhoodSelect').value,
    rule: document.getElementById('ruleInput').value,
    generations: document.getElementById('generationsInput').value,
    speed: document.getElementById('speedInput').value,
    speedLabel: document.getElementById('speedOutput').value,
    generation: document.getElementById('generationStat').textContent,
  }))()`);
  assert.deepStrictEqual(controls, {
    discovery: expected.id,
    tiling: expected.tiling,
    depth: String(expected.depth),
    neighborhood: expected.neighborhood,
    rule: expected.rule,
    generations: String(expected.generations),
    speed: String(expected.speed),
    speedLabel: `${expected.speed} steps/s`,
    generation: '0',
  }, `${expected.id}: loaded controls`);
  assertTrajectoryFraming(await cameraView(cdp), expected.bounds, expected.padding ?? 4, expected.id);
}

async function mouseDrag(cdp, start, dx, dy, modifiers = 0) {
  await cdp.call('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: start.x, y: start.y, button: 'left', buttons: 1, clickCount: 1, modifiers,
  });
  await cdp.call('Input.dispatchMouseEvent', {
    type: 'mouseMoved', x: start.x + dx, y: start.y + dy, button: 'left', buttons: 1, modifiers,
  });
  await cdp.call('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: start.x + dx, y: start.y + dy, button: 'left', buttons: 0, clickCount: 1, modifiers,
  });
}

function assertPan(before, after, message) {
  assert(
    after[0] < before[0] && after[1] > before[1],
    `${message}: expected a right/down drag to move the camera left/up in world coordinates; ${JSON.stringify({ before, after })}`,
  );
}

async function checkPage(cdp) {
  console.error('[browser] waiting for default patch');
  await waitFor(
    cdp,
    "document.readyState === 'complete' && document.getElementById('busy')?.hidden && document.getElementById('cellsStat')?.textContent === '7,921'",
    'the default patch',
  );
  console.error('[browser] default patch ready');
  const startupExceptions = cdp.events.filter((event) => event.method === 'Runtime.exceptionThrown');
  assert.strictEqual(startupExceptions.length, 0, `startup exceptions: ${JSON.stringify(startupExceptions.slice(0, 2))}`);
  const initial = await cdp.evaluate(`(() => {
    const canvas = document.getElementById('lifeCanvas');
    const gl = canvas.getContext('webgl2');
    return {
      webgl2: Boolean(gl),
      glError: gl ? gl.getError() : -1,
      cells: document.getElementById('cellsStat').textContent,
      generation: document.getElementById('generationStat').textContent,
    };
  })()`);
  console.error('[browser] testing discovery search');
  const catalogueTotal = await cdp.evaluate("document.getElementById('discoverySelect').options.length - 1");
  assert.strictEqual(await cdp.evaluate("Number(document.getElementById('catalogueCount').textContent)"), catalogueTotal);
  await cdp.evaluate(`(() => {
    const search = document.getElementById('discoverySearch');
    search.value = 'PENROSE traveller';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  const filtered = await cdp.evaluate("[...document.getElementById('discoverySelect').options].map(option => option.value).filter(Boolean)");
  assert(filtered.length >= 3 && filtered.length < catalogueTotal);
  assert(filtered.every((id) => id.startsWith('penrose')));
  await cdp.evaluate(`(() => {
    const search = document.getElementById('discoverySearch');
    search.value = 'no-such-pattern'; search.dispatchEvent(new Event('input'));
    return true;
  })()`);
  assert.strictEqual(await cdp.evaluate("document.getElementById('loadDiscoveryButton').disabled"), true);
  assert.strictEqual(await cdp.evaluate("document.getElementById('discoverySelect').options.length"), 1);
  await cdp.evaluate(`(() => {
    const search = document.getElementById('discoverySearch');
    search.value = ''; search.dispatchEvent(new Event('input'));
    return true;
  })()`);
  assert.strictEqual(await cdp.evaluate("document.getElementById('discoverySelect').options.length - 1"), catalogueTotal);
  assert.deepStrictEqual(initial, { webgl2: true, glError: 0, cells: '7,921', generation: '0' });

  // Native Space activation must reach the focused button instead of being
  // stolen by the application's global run/pause shortcut.
  console.error('[browser] testing keyboard');
  await cdp.evaluate("document.getElementById('stepButton').focus(); true");
  await pressSpace(cdp);
  await waitFor(cdp, "document.getElementById('generationStat').textContent === '1'", 'Space activation of Step', 5_000);
  assert.strictEqual(await cdp.evaluate("document.getElementById('runButton').textContent"), 'Run');

  await cdp.evaluate("document.getElementById('aboutButton').focus(); true");
  await pressSpace(cdp);
  await waitFor(cdp, "document.getElementById('aboutDialog').open", 'Space activation of About', 5_000);
  assert.strictEqual(await cdp.evaluate("document.getElementById('runButton').textContent"), 'Run');
  const about = await cdp.evaluate(`(() => {
    const dialog = document.getElementById('aboutDialog');
    return {
      activeInside: dialog.contains(document.activeElement),
      labelledBy: dialog.getAttribute('aria-labelledby'),
      credit: document.getElementById('aboutCredit').textContent,
      version: document.getElementById('aboutVersion').textContent,
      pdf: document.getElementById('cataloguePdfLink').getAttribute('href'),
      source: document.getElementById('catalogueSourceLink').getAttribute('href'),
      bottomOfControls: document.getElementById('controls').lastElementChild.id,
    };
  })()`);
  assert.deepStrictEqual(about, {
    activeInside: true,
    labelledBy: 'aboutDialogTitle',
    credit: 'Aperiodic life package, vibe-coded by Murdoch J. Gabbay',
    version: fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim(),
    pdf: 'docs/catalogue/aperiodic-life-catalogue.pdf',
    source: 'docs/catalogue/catalogue.md',
    bottomOfControls: 'aboutButton',
  });
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await waitFor(cdp, "!document.getElementById('aboutDialog').open", 'Escape closes About', 5_000);
  assert.strictEqual(await cdp.evaluate("document.activeElement.id"), 'aboutButton');

  await cdp.evaluate("document.getElementById('ruleInfoButton').focus(); true");
  await pressSpace(cdp);
  await waitFor(cdp, "document.getElementById('rulesDialog').open", 'Space activation of rule help', 5_000);
  const ruleHelp = await cdp.evaluate(`(() => {
    const dialog = document.getElementById('rulesDialog');
    return {
      activeInside: dialog.contains(document.activeElement),
      labelledBy: dialog.getAttribute('aria-labelledby'),
      text: dialog.textContent,
    };
  })()`);
  assert.strictEqual(ruleHelp.activeInside, true, 'opening rule help must move focus into the modal');
  assert.strictEqual(ruleHelp.labelledBy, 'rulesDialogTitle');
  for (const phrase of ['all cells update together', 'B2/S', 'States 2 and 3', 'dead border ring']) {
    assert(ruleHelp.text.includes(phrase), `rule help is missing ${JSON.stringify(phrase)}`);
  }
  await cdp.evaluate("document.getElementById('rulesDialog').close(); document.getElementById('neighborhoodInfoButton').click(); true");
  await waitFor(cdp, "document.getElementById('rulesDialog').open", 'neighbourhood help trigger', 5_000);
  await cdp.evaluate("document.getElementById('rulesDialog').close(); true");

  // Global shortcuts still work away from interactive controls, while common
  // browser modifier combinations are ignored.
  await cdp.evaluate("document.body.tabIndex = -1; document.body.focus(); true");
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'n', code: 'KeyN', text: 'n', windowsVirtualKeyCode: 78 });
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'n', code: 'KeyN', windowsVirtualKeyCode: 78 });
  await waitFor(cdp, "document.getElementById('generationStat').textContent === '2'", 'N shortcut', 5_000);
  await cdp.evaluate("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true, bubbles: true })); true");
  assert.strictEqual(await cdp.evaluate("document.getElementById('generationStat').textContent"), '2');

  // Native pointer events must actually move the rendered camera. Pan is the
  // safe default for inspecting discoveries; Paint remains an explicit tool,
  // and its Shift-drag override must pan without changing cells.
  console.error('[browser] testing painting and viewport panning');
  assert.strictEqual(await cdp.evaluate("document.getElementById('toolSelect').value"), 'pan');
  const point = await canvasPoint(cdp);
  const defaultPanBefore = await cameraCenter(cdp);
  await mouseDrag(cdp, point, 96, 48);
  await delay(100);
  assertPan(defaultPanBefore, await cameraCenter(cdp), 'default Pan tool');

  await click(cdp, 'clearButton');
  await click(cdp, 'fitButton');
  await delay(100);
  await setAndChange(cdp, 'toolSelect', 'paint');
  const paintPoint = await canvasPoint(cdp);
  await mouseDrag(cdp, paintPoint, 0, 0);
  await waitFor(cdp, "document.getElementById('aliveStat').textContent.startsWith('1 ')", 'single-cell painting', 5_000);
  const shiftPanBefore = await cameraCenter(cdp);
  await mouseDrag(cdp, paintPoint, 80, 40, 8); // CDP modifier bit 8 is Shift.
  await delay(100);
  assertPan(shiftPanBefore, await cameraCenter(cdp), 'Shift-drag while Paint is selected');
  assert.strictEqual(
    await cdp.evaluate("document.getElementById('aliveStat').textContent.startsWith('1 ')"),
    true,
    'Shift-drag panning must not paint additional cells',
  );

  // Independent boundary semantics: the broader graph must seed its distance
  // field from point-contact boundary tiles as well as exposed-edge owners.
  console.error('[browser] testing boundary counts');
  await setAndChange(cdp, 'neighborhoodSelect', 'edge');
  await setAndChange(cdp, 'borderInput', '2');
  await setAndChange(cdp, 'densityInput', '1');
  await click(cdp, 'randomizeButton');
  await waitFor(cdp, "document.getElementById('aliveStat').textContent.startsWith('6,346 ')", 'edge border count', 5_000);
  await setAndChange(cdp, 'neighborhoodSelect', 'touch');
  await waitFor(cdp, "document.getElementById('aliveStat').textContent.startsWith('6,188 ')", 'touch border count', 5_000);

  // Traditional reference boards use exact, independently generated graphs.
  console.error('[browser] testing square and hexagonal boards');
  await setTilingAndDepth(cdp, 'square', 25);
  await waitFor(
    cdp,
    "document.getElementById('busy').hidden && document.getElementById('cellsStat').textContent === '625'",
    '25 by 25 square board',
  );
  await setAndChange(cdp, 'borderInput', '1');
  await setAndChange(cdp, 'densityInput', '1');
  await setAndChange(cdp, 'neighborhoodSelect', 'edge');
  await click(cdp, 'randomizeButton');
  await waitFor(cdp, "document.getElementById('aliveStat').textContent.startsWith('529 ')", 'square border count', 5_000);
  assert.deepStrictEqual(await cdp.evaluate(`(() => ({
    tiling: document.getElementById('tilingStat').textContent,
    types: document.getElementById('tileTypesStat').textContent,
    degree: document.getElementById('degreeStat').textContent,
    help: document.getElementById('neighborhoodHelp').textContent,
  }))()`), {
    tiling: 'Square grid',
    types: '625 squares',
    degree: '3.84 avg · 4 max',
    help: 'Shared edge is the four-neighbour von Neumann graph; edge or corner is the eight-neighbour Moore graph.',
  });
  await setAndChange(cdp, 'neighborhoodSelect', 'touch');
  assert.strictEqual(await cdp.evaluate("document.getElementById('degreeStat').textContent"), '7.53 avg · 8 max');

  await loadDiscovery(cdp, 'square-glider', '2,601');
  await waitFor(cdp, "document.getElementById('aliveStat').textContent.startsWith('5 ')", 'square glider population', 5_000);
  for (let step = 0; step < 4; step++) await click(cdp, 'stepButton');
  assert.strictEqual(await cdp.evaluate("document.getElementById('generationStat').textContent"), '4');
  assert.strictEqual(await cdp.evaluate("document.getElementById('aliveStat').textContent.startsWith('5 ')"), true);

  console.error('[browser] testing saved experiment files');
  const savedState = await cdp.evaluate(`(async () => {
    let savedBlob;
    const createURL = URL.createObjectURL;
    const clickAnchor = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = (blob) => { savedBlob = blob; return createURL(blob); };
    HTMLAnchorElement.prototype.click = function () {};
    try { document.getElementById('saveSnapshotButton').click(); }
    finally { URL.createObjectURL = createURL; HTMLAnchorElement.prototype.click = clickAnchor; }
    return JSON.parse(await savedBlob.text());
  })()`);
  assert.strictEqual(savedState.format, 'aperiodic-life-state');
  assert.strictEqual(savedState.generation, 4);
  assert.strictEqual(savedState.cellStates.length, 5);
  await click(cdp, 'clearButton');
  await cdp.evaluate(`(() => {
    const files = new DataTransfer();
    files.items.add(new File([${JSON.stringify(JSON.stringify(savedState))}], 'saved.json', { type: 'application/json' }));
    const input = document.getElementById('snapshotFileInput');
    input.files = files.files; input.dispatchEvent(new Event('change'));
    return true;
  })()`);
  await waitFor(cdp, "document.getElementById('snapshotStatus').textContent.startsWith('Loaded generation 4')", 'saved-state restore', 10_000);
  assert.strictEqual(await cdp.evaluate("document.getElementById('generationStat').textContent"), '4');
  assert.strictEqual(await cdp.evaluate("document.getElementById('aliveStat').textContent.startsWith('5 ')"), true);
  assert.strictEqual(await cdp.evaluate("document.getElementById('runButton').textContent"), 'Run');
  await cdp.evaluate(`(() => {
    const files = new DataTransfer();
    files.items.add(new File(['{"format":"wrong"}'], 'invalid.json', { type: 'application/json' }));
    const input = document.getElementById('snapshotFileInput');
    input.files = files.files; input.dispatchEvent(new Event('change'));
    return true;
  })()`);
  await waitFor(cdp, "document.getElementById('snapshotStatus').classList.contains('error')", 'invalid-state rejection', 5_000);
  assert.strictEqual(await cdp.evaluate("document.getElementById('generationStat').textContent"), '4');
  assert.strictEqual(await cdp.evaluate("document.getElementById('aliveStat').textContent.startsWith('5 ')"), true);

  await setTilingAndDepth(cdp, 'hex', 8);
  await waitFor(
    cdp,
    "document.getElementById('busy').hidden && document.getElementById('cellsStat').textContent === '217'",
    'radius-8 hexagonal board',
  );
  await setAndChange(cdp, 'borderInput', '1');
  await setAndChange(cdp, 'densityInput', '1');
  await setAndChange(cdp, 'neighborhoodSelect', 'edge');
  await click(cdp, 'randomizeButton');
  await waitFor(cdp, "document.getElementById('aliveStat').textContent.startsWith('169 ')", 'hex border count', 5_000);
  const hexEdgeDegree = await cdp.evaluate("document.getElementById('degreeStat').textContent");
  await setAndChange(cdp, 'neighborhoodSelect', 'touch');
  const hexTouchDegree = await cdp.evaluate("document.getElementById('degreeStat').textContent");
  assert.strictEqual(hexEdgeDegree, '5.53 avg · 6 max');
  assert.strictEqual(hexTouchDegree, hexEdgeDegree);
  assert.strictEqual(await cdp.evaluate("document.getElementById('tileTypesStat').textContent"), '217 hexagons');

  await loadDiscovery(cdp, 'hex-conway-p2', '3,169');
  await click(cdp, 'stepButton');
  await click(cdp, 'stepButton');
  await waitFor(cdp, "document.getElementById('cycleStat').textContent.startsWith('period 2')", 'hex cycle detector', 5_000);

  console.error('[browser] testing curated hexagonal traveller presentation');
  for (const expected of [
    {
      id: 'hex-b245s3-p10-traveller', cells: '12,481', tiling: 'hex', depth: 64,
      neighborhood: 'edge', rule: 'B245/S3', generations: 2, speed: 5,
      bounds: [-4.330127239227295, -8.5, 40.70319366455078, 8.5],
    },
    {
      id: 'hex-b235s146-c4-launcher-traveller', cells: '49,537', tiling: 'hex', depth: 128,
      neighborhood: 'edge', rule: 'B235/S146', generations: 4, speed: 6,
      bounds: [-171.4730224609375, -13, 10.392304420471191, 13],
    },
    {
      id: 'hex-b235s134-c5-launcher-traveller', cells: '49,537', tiling: 'hex', depth: 128,
      neighborhood: 'edge', rule: 'B235/S134', generations: 5, speed: 6,
      bounds: [-11.258330345153809, -14.5, 135.9659881591797, 14.5],
    },
  ]) {
    await checkDiscoveryPresentation(cdp, expected);
  }

  // Switch to the Penrose backend at the equivalent UI tier. Verify its
  // topology-specific statistics, graph-specific boundary masks, mirrored
  // seed rebuild, type rendering, and degree-aware preset expansion.
  console.error('[browser] testing Penrose integration');
  await setTilingAndDepth(cdp, 'penrose', 8);
  await waitFor(
    cdp,
    "document.getElementById('busy').hidden && document.getElementById('cellsStat').textContent === '7,920'",
    'Penrose depth-8 patch',
  );
  await setAndChange(cdp, 'borderInput', '2');
  await setAndChange(cdp, 'densityInput', '1');
  await setAndChange(cdp, 'neighborhoodSelect', 'touch');
  await click(cdp, 'randomizeButton');
  await waitFor(cdp, "document.getElementById('aliveStat').textContent.startsWith('7,015 ')", 'Penrose initial population', 5_000);
  const penroseInitial = await cdp.evaluate(`(() => ({
    tiling: document.getElementById('tilingStat').textContent,
    types: document.getElementById('tileTypesStat').textContent,
    degree: document.getElementById('degreeStat').textContent,
    alive: document.getElementById('aliveStat').textContent,
    typeEnabled: !document.getElementById('typeCheckbox').disabled,
    glError: document.getElementById('lifeCanvas').getContext('webgl2').getError(),
  }))()`);
  assert.deepStrictEqual(penroseInitial, {
    tiling: 'Penrose P3 rhombs',
    types: '3,030 thin · 4,890 thick',
    degree: '9.31 avg · 11 max',
    alive: '7,015 (88.6%)',
    typeEnabled: true,
    glError: 0,
  });

  if (process.env.APERIODIC_PREVIEW_PATH) {
    await setAndChange(cdp, 'densityInput', '0.22');
    await click(cdp, 'randomizeButton');
    await click(cdp, 'fitButton');
    await cdp.evaluate(`(() => {
      document.getElementById('controls').scrollTop = 0;
      document.getElementById('toast').hidden = true;
      return true;
    })()`);
    await delay(250);
    const { data } = await cdp.call('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    }, 15_000);
    fs.writeFileSync(process.env.APERIODIC_PREVIEW_PATH, Buffer.from(data, 'base64'));
    await setAndChange(cdp, 'densityInput', '1');
    await click(cdp, 'randomizeButton');
    await waitFor(cdp, "document.getElementById('aliveStat').textContent.startsWith('7,015 ')", 'preview state restoration', 5_000);
  }

  await setAndChange(cdp, 'neighborhoodSelect', 'edge');
  await click(cdp, 'randomizeButton');
  await waitFor(cdp, "document.getElementById('aliveStat').textContent.startsWith('7,395 ')", 'Penrose edge border count', 5_000);
  await setAndChange(cdp, 'neighborhoodSelect', 'touch');
  await click(cdp, 'randomizeButton');
  await waitFor(cdp, "document.getElementById('aliveStat').textContent.startsWith('7,015 ')", 'Penrose touch border count', 5_000);

  await setAndChange(cdp, 'presetSelect', 'lwd');
  assert.strictEqual(
    await cdp.evaluate("document.getElementById('ruleInput').value"),
    'B3/S[0,1,2,3,4,5,6,7,8,9,10,11]',
  );
  await setAndChange(cdp, 'neighborhoodSelect', 'edge');
  assert.strictEqual(await cdp.evaluate("document.getElementById('ruleInput').value"), 'B3/S01234');
  await setAndChange(cdp, 'neighborhoodSelect', 'touch');
  assert.strictEqual(
    await cdp.evaluate("document.getElementById('ruleInput').value"),
    'B3/S[0,1,2,3,4,5,6,7,8,9,10,11]',
  );

  await setAndChange(cdp, 'penroseSeedSelect', 'sun-mirror');
  await waitFor(
    cdp,
    "document.getElementById('busy').hidden && document.getElementById('cellsStat').textContent === '7,920'",
    'mirrored Penrose patch',
  );
  await click(cdp, 'typeCheckbox');
  await click(cdp, 'typeCheckbox');
  assert.strictEqual(
    await cdp.evaluate("document.getElementById('lifeCanvas').getContext('webgl2').getError()"),
    0,
  );

  console.error('[browser] testing traveller framing and post-horizon following');
  await loadDiscovery(cdp, 'penrose-b2-c4-compact-traveller', '54,560');
  await delay(100);
  assert.strictEqual(await cdp.evaluate("document.getElementById('speedInput').value"), '10');
  const travellerView = await cameraView(cdp);
  const travellerBounds = [-103.93494415283203, 13.20820426940918, 92.43650817871094, 17.135255813598633];
  const expectedTravellerCenter = [
    (travellerBounds[0] + travellerBounds[2]) / 2,
    (travellerBounds[1] + travellerBounds[3]) / 2,
  ];
  assert(Math.abs(travellerView.center[0] - expectedTravellerCenter[0]) < 1e-3);
  assert(Math.abs(travellerView.center[1] - expectedTravellerCenter[1]) < 1e-3);
  const halfWidth = travellerView.width / (2 * travellerView.zoom);
  const halfHeight = travellerView.height / (2 * travellerView.zoom);
  assert(travellerView.center[0] - halfWidth <= travellerBounds[0] - 4 + 1e-3);
  assert(travellerView.center[0] + halfWidth >= travellerBounds[2] + 4 - 1e-3);
  assert(travellerView.center[1] - halfHeight <= travellerBounds[1] - 4 + 1e-3);
  assert(travellerView.center[1] + halfHeight >= travellerBounds[3] + 4 - 1e-3);

  await cdp.evaluate(`(() => {
    const step = document.getElementById('stepButton');
    for (let generation = 0; generation < 220; generation++) step.click();
    return true;
  })()`);
  await delay(100);
  const horizonCenter = await cameraCenter(cdp);
  assert(Math.abs(horizonCenter[0] - expectedTravellerCenter[0]) < 1e-3);
  assert(Math.abs(horizonCenter[1] - expectedTravellerCenter[1]) < 1e-3);
  await cdp.evaluate(`(() => {
    const step = document.getElementById('stepButton');
    for (let generation = 0; generation < 6; generation++) step.click();
    return true;
  })()`);
  await delay(100);
  const followedCenter = await cameraCenter(cdp);
  assert(
    followedCenter[0] < horizonCenter[0] - 0.1,
    `post-horizon traveller camera did not follow left: ${JSON.stringify({ horizonCenter, followedCenter })}`,
  );

  for (const [id, bounds] of [
    ['penrose-b2-c5-compact-traveller', [-35.670875549316406, -95.5754623413086, 27.61339569091797, 91.64840698242188]],
    ['penrose-b2-c6-compact-traveller', [-97.41630554199219, -31.652475357055664, 99.90620422363281, -27.725425720214844]],
  ]) {
    await loadDiscovery(cdp, id, '54,560');
    await delay(100);
    assert.strictEqual(await cdp.evaluate("document.getElementById('speedInput').value"), '8');
    const view = await cameraView(cdp);
    const center = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
    assert(Math.abs(view.center[0] - center[0]) < 1e-3, `${id}: horizontal framing`);
    assert(Math.abs(view.center[1] - center[1]) < 1e-3, `${id}: vertical framing`);
    const viewHalfWidth = view.width / (2 * view.zoom);
    const viewHalfHeight = view.height / (2 * view.zoom);
    assert(view.center[0] - viewHalfWidth <= bounds[0] - 4 + 1e-3, `${id}: left framing`);
    assert(view.center[0] + viewHalfWidth >= bounds[2] + 4 - 1e-3, `${id}: right framing`);
    assert(view.center[1] - viewHalfHeight <= bounds[1] - 4 + 1e-3, `${id}: bottom framing`);
    assert(view.center[1] + viewHalfHeight >= bounds[3] + 4 - 1e-3, `${id}: top framing`);
  }

  console.error('[browser] testing curated Penrose launcher presentation');
  for (const expected of [
    {
      id: 'penrose-b2s4-c5-survival-launcher', cells: '54,560', tiling: 'penrose', depth: 10,
      neighborhood: 'touch', rule: 'B2/S4', generations: 5, speed: 5,
      bounds: [-71.34175109863281, -57.56888198852539, 74.78270721435547, 48.59674835205078],
    },
    {
      id: 'penrose-b26s-c4-birth-launcher', cells: '54,560', tiling: 'penrose', depth: 10,
      neighborhood: 'touch', rule: 'B26/S', generations: 4, speed: 6,
      bounds: [-56.1778450012207, -96.5754623413086, 6.5186381340026855, 75.20413970947266],
    },
    {
      id: 'penrose-b27s4-c4-dual-clause-launcher', cells: '54,560', tiling: 'penrose', depth: 10,
      neighborhood: 'touch', rule: 'B27/S4', generations: 4, speed: 5,
      bounds: [-8.057479858398438, -94.76644134521484, 53.687950134277344, 80.24922180175781],
    },
  ]) {
    await checkDiscoveryPresentation(cdp, expected);
  }

  console.error('[browser] testing curated aperiodic oscillators and cycle detection');
  await loadDiscovery(cdp, 'penrose-conway-p5', '7,920', true);
  await waitFor(cdp, "document.getElementById('runButton').textContent === 'Pause' && Number(document.getElementById('generationStat').textContent.replace(/,/g, '')) > 0", 'Load and run discovery', 5_000);
  await click(cdp, 'runButton');
  assert.strictEqual(await cdp.evaluate("document.getElementById('runButton').textContent"), 'Run');

  await loadDiscovery(cdp, 'penrose-conway-p12', '7,920');
  assert.strictEqual(await cdp.evaluate("document.getElementById('runButton').textContent"), 'Run');
  for (let step = 0; step < 12; step++) await click(cdp, 'stepButton');
  await waitFor(cdp, "document.getElementById('cycleStat').textContent.startsWith('period 12')", 'Penrose period-12 detection', 5_000);
  await loadDiscovery(cdp, 'penrose-b12-p840-field', '7,920');
  await cdp.evaluate(`(() => {
    const step = document.getElementById('stepButton');
    for (let generation = 0; generation < 891; generation++) step.click();
    return true;
  })()`);
  await waitFor(cdp, "document.getElementById('cycleStat').textContent.startsWith('period 840')", 'Penrose period-840 detection', 10_000);
  await setAndChange(cdp, 'ruleInput', 'B3/S23');
  assert.strictEqual(
    await cdp.evaluate("document.getElementById('cycleStat').textContent"),
    '—',
    'a late rule change must clear the visible cycle claim and start a fresh observation window',
  );
  await loadDiscovery(cdp, 'hat-conway-p26', '7,921');
  for (let step = 0; step < 26; step++) await click(cdp, 'stepButton');
  await waitFor(cdp, "document.getElementById('cycleStat').textContent.startsWith('period 26')", 'hat period-26 detection', 5_000);

  // Return to the default hat tier before exercising rapid rebuild coalescing.
  await setTilingAndDepth(cdp, 'hat', 4);
  await waitFor(
    cdp,
    "document.getElementById('busy').hidden && document.getElementById('cellsStat').textContent === '7,921'",
    'return to hat patch',
  );

  // Coalesce rapid patch changes. Only the latest selection should build, and
  // the run state from before the rebuild sequence should be restored.
  console.error('[browser] testing rebuild coalescing');
  await click(cdp, 'runButton');
  assert.strictEqual(await cdp.evaluate("document.getElementById('runButton').textContent"), 'Pause');
  await cdp.evaluate(`(() => {
    const depth = document.getElementById('depthSelect');
    depth.value = '5'; depth.dispatchEvent(new Event('change', { bubbles: true }));
    depth.value = '3'; depth.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await waitFor(
    cdp,
    "document.getElementById('busy').hidden && document.getElementById('cellsStat').textContent === '1,156'",
    'coalesced depth rebuild',
  );
  assert.strictEqual(await cdp.evaluate("document.getElementById('runButton').textContent"), 'Pause');
  await click(cdp, 'runButton');

  await checkPlaybackControls(cdp);
  await checkMobilePinch(cdp);

  const errors = cdp.events.filter((event) => {
    if (event.method === 'Runtime.exceptionThrown') return true;
    if (event.method !== 'Log.entryAdded') return false;
    const entry = event.params?.entry || {};
    if (!['error', 'warning'].includes(entry.level)) return false;
    return !/Automatic fallback to software WebGL|WebGL/i.test(entry.text || '');
  });
  assert.strictEqual(errors.length, 0, `browser errors: ${JSON.stringify(errors.slice(0, 2))}`);

  return {
    webgl2: initial.webgl2,
    edgeBorderTwoAlive: 6346,
    touchBorderTwoAlive: 6188,
    keyboardButtons: 'passed',
    shortcutModifiers: 'passed',
    paintAndPan: 'passed',
    squareBoard: 'passed',
    squareGlider: 'passed',
    catalogueSearch: 'passed',
    savedStateFiles: 'passed',
    hexBoard: 'passed',
    hexOscillator: 'passed',
    penroseDepth8: 7920,
    penroseEdgeBorderTwoAlive: 7395,
    penroseTouchBorderTwoAlive: 7015,
    penrosePresetDegrees: 'passed',
    penroseMirrorAndTypes: 'passed',
    travellerFraming: 'passed',
    loadAndRunDiscovery: 'passed',
    penrosePeriod12: 'passed',
    penrosePeriod840: 'passed',
    hatPeriod26: 'passed',
    coalescedRebuild: 'passed',
    mobilePlayback: 'passed',
    mobilePinch: 'passed',
  };
}

async function main() {
  assert(fs.existsSync(STANDALONE), 'standalone bundle is missing');
  let server = null;
  let browser = null;
  let mode = 'http-and-file';
  try {
    console.error('[browser] starting server');
    server = await startServer();
    const port = server.address().port;
    console.error('[browser] launching Chromium');
    browser = await launchChromium(`http://127.0.0.1:${port}/index.html`);
    console.error('[browser] Chromium connected');

    let httpResult;
    try {
      httpResult = await checkPage(browser.cdp);
      console.error('[browser] HTTP checks passed; navigating standalone');
    } catch (error) {
      if (!(error instanceof BrowserEnvironmentError)) throw error;
      console.error(`[browser] ${error.message}`);
      console.error('[browser] falling back to DevTools document injection of the exact standalone');
      await stopChromium(browser);
      browser = await launchChromium('about:blank');
      await injectStandalone(browser.cdp);
      mode = 'injected-standalone';
      httpResult = await checkPage(browser.cdp);
      console.error('[browser] injected standalone interaction checks passed');
    }

    if (mode === 'http-and-file') {
      const fileUrl = pathToFileURL(STANDALONE).href;
      await browser.cdp.call('Page.navigate', { url: fileUrl });
      await waitFor(
        browser.cdp,
        "document.readyState === 'complete' && document.getElementById('busy')?.hidden && document.getElementById('cellsStat')?.textContent === '7,921'",
        'standalone file patch',
      );
      await checkMobilePinch(browser.cdp);
    }

    const standalone = await browser.cdp.evaluate(`(() => {
      const gl = document.getElementById('lifeCanvas').getContext('webgl2');
      return {
        webgl2: Boolean(gl),
        glError: gl ? gl.getError() : -1,
        externalResources: performance.getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((name) => /^https?:/.test(name)),
      };
    })()`);
    assert.strictEqual(standalone.webgl2, true);
    assert.strictEqual(standalone.glError, 0);
    assert.deepStrictEqual(standalone.externalResources, []);
    standalone.mobilePinch = 'passed';

    console.error('[browser] standalone checks passed');
    console.log(JSON.stringify({ mode, interactions: httpResult, standalone }, null, 2));
  } finally {
    if (browser) {
      console.error('[browser] stopping Chromium');
      await stopChromium(browser);
    }
    if (server) {
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = error.exitCode || 1;
});
