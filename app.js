/* Aperiodic Life browser UI and WebGL2 renderer. */
(function () {
  'use strict';

  const Core = window.AperiodicLifeCore;
  const DISCOVERIES = Array.isArray(window.AperiodicLifeDiscoveries)
    ? window.AperiodicLifeDiscoveries
    : [];
  if (!Core) throw new Error('core.js did not load');

  const numberFormat = new Intl.NumberFormat();
  const MIN_TRAJECTORY_ZOOM = 3;
  const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024;
  const PALETTES = {
    cyan: {
      background: '#07111a',
      dead: '#0d1d27',
      alive: '#72e4ff',
      refractoryA: '#ffc96b',
      refractoryB: '#6d3558',
      grid: '#1c3a48',
      typeThin: '#17445a',
      typeThick: '#392044',
    },
    ember: {
      background: '#120c0a',
      dead: '#211512',
      alive: '#ffb04a',
      refractoryA: '#ff5f58',
      refractoryB: '#6a284d',
      grid: '#4b2920',
      typeThin: '#60351d',
      typeThick: '#54233e',
    },
    paper: {
      background: '#f1ede3',
      dead: '#e4ddcf',
      alive: '#155a75',
      refractoryA: '#d07a2c',
      refractoryB: '#925071',
      grid: '#b9aea0',
      typeThin: '#b8d4dc',
      typeThick: '#d9c4d2',
    },
  };

  const PRESETS = {
    conway: { rule: 'B3/S23', generations: 2 },
    highlife: { rule: 'B36/S23', generations: 2 },
    seeds: { rule: 'B2/S', generations: 2 },
    brain: { rule: 'B2/S', generations: 3 },
    starwars: { rule: 'B2/S345', generations: 4 },
    lwd: { birth: [3], surviveAll: true, generations: 2 },
    hata: { rule: 'TABLE:HAT-A', generations: 4 },
    hatb: { rule: 'TABLE:HAT-B', generations: 4 },
    hatc: { rule: 'TABLE:HAT-C', generations: 4 },
    hatsimple: { rule: 'TABLE:HAT-SIMPLE', generations: 3 },
    hatwake: { rule: 'TABLE:HAT-WAKE', generations: 4 },
    hatrelay: { rule: 'TABLE:HAT-RELAY', generations: 3 },
  };

  function resolvePresetRule(preset, maxDegree) {
    if (!preset.surviveAll) return preset.rule;
    const birth = preset.birth || [];
    const survive = Array.from({ length: maxDegree + 1 }, (_, count) => count);
    return Core.formatRule(birth, survive);
  }

  function discoveryMatches(entry, query) {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const provenance = entry.provenance || {};
    const sourceLabels = Array.isArray(provenance.sources)
      ? provenance.sources.map((source) => source.label).join(' ')
      : '';
    const text = [entry.title, entry.summary, entry.category, entry.tiling,
      entry.tiling === 'hat' ? 'Einstein' : '', entry.neighborhood, entry.rule,
      `${entry.generations} states`, provenance.credit, sourceLabels].join(' ').toLowerCase();
    return terms.every((term) => text.includes(term));
  }

  // Detect incompatible cell indexing/graphs before applying sparse cell IDs.
  // Two independent 32-bit checksums are an accidental-drift guard, not a
  // security signature. Integer graph data avoids floating-point differences.
  function graphFingerprint(patch, graph) {
    let first = 2166136261 >>> 0;
    let second = 0x9e3779b9 >>> 0;
    for (const values of [graph.offsets, graph.neighbors, graph.boundaryDistance, patch.tileTypes]) {
      for (let index = -1; index < values.length; index++) {
        const value = index < 0 ? values.length : values[index];
        first = Math.imul(first ^ value, 16777619) >>> 0;
        second = Math.imul(second ^ value ^ (second >>> 16), 2246822519) >>> 0;
      }
    }
    return `${first.toString(16).padStart(8, '0')}-${second.toString(16).padStart(8, '0')}`;
  }

  function validateSnapshot(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
      data.format !== 'aperiodic-life-state' || data.version !== 1) {
      throw new Error('Choose an Aperiodic Life state file (format version 1).');
    }
    const choices = Object.prototype.hasOwnProperty.call(Core.PATCH_OPTIONS, data.tiling)
      ? Core.PATCH_OPTIONS[data.tiling] : null;
    const option = choices && choices.find((item) => item.depth === data.patchDepth);
    if (!option || data.tileCount !== option.tileCount) throw new Error('Unsupported or mismatched tiling size.');
    if (!['edge', 'touch'].includes(data.neighborhood)) throw new Error('Invalid neighbourhood.');
    if (data.tiling === 'penrose' && !['sun', 'sun-mirror'].includes(data.penroseSeed)) {
      throw new Error('Invalid Penrose seed.');
    }
    for (const [name, minimum, maximum] of [
      ['generations', 2, 32], ['deadBorderRings', 0, 12],
      ['generation', 0, Number.MAX_SAFE_INTEGER - 1], ['stepsPerSecond', 1, 240],
    ]) {
      if (!Number.isSafeInteger(data[name]) || data[name] < minimum || data[name] > maximum) {
        throw new Error(`Invalid ${name}.`);
      }
    }
    if (typeof data.rule !== 'string' || data.rule.length > 4096) throw new Error('Invalid rule.');
    const parsedRule = Core.parseRule(data.rule);
    if (parsedRule.kind === 'priority' && data.generations !== parsedRule.states) {
      throw new Error('The state count does not match the selected priority-table rule.');
    }
    if (typeof data.graphFingerprint !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{8}$/.test(data.graphFingerprint)) {
      throw new Error('The state file has no valid graph fingerprint.');
    }
    if (!Object.prototype.hasOwnProperty.call(PALETTES, data.palette) ||
      typeof data.drawGrid !== 'boolean' || typeof data.showTileTypes !== 'boolean') {
      throw new Error('Invalid display settings.');
    }
    const view = data.view;
    if (!view || ![view.x, view.y, view.zoom].every(Number.isFinite) || view.zoom < 0.02 || view.zoom > 500) {
      throw new Error('Invalid saved view.');
    }
    if (!Array.isArray(data.cellStates) || data.cellStates.length > data.tileCount) {
      throw new Error('Invalid cell-state list.');
    }
    const seen = new Set();
    for (const pair of data.cellStates) {
      if (!Array.isArray(pair) || pair.length !== 2 || !Number.isInteger(pair[0]) ||
        pair[0] < 0 || pair[0] >= data.tileCount || !Number.isInteger(pair[1]) ||
        pair[1] < 1 || pair[1] >= data.generations || seen.has(pair[0])) {
        throw new Error('Cell states must contain unique valid cell IDs and nonzero states.');
      }
      seen.add(pair[0]);
    }
    return data;
  }

  function prepareSnapshot(data) {
    validateSnapshot(data);
    const patch = Core.buildPatch(data.tiling, data.patchDepth, { seed: data.penroseSeed });
    const graph = data.neighborhood === 'touch' ? patch.touchGraph : patch.edgeGraph;
    if (patch.tileCount !== data.tileCount || graphFingerprint(patch, graph) !== data.graphFingerprint) {
      throw new Error('This state file uses different cell indexing or a different contact graph.');
    }
    const simulation = new Core.Automaton(patch, graph, {
      rule: data.rule, generations: data.generations, borderRings: data.deadBorderRings,
    });
    for (const [cell, state] of data.cellStates) {
      if (simulation.isLocked(cell)) throw new Error(`Cell ${cell} is inside the locked dead border.`);
      simulation.state[cell] = state;
    }
    simulation.generation = data.generation;
    simulation.refreshDerivedState();
    return { patch, simulation };
  }

  function hexToRGBA(hex) {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    return [r, g, b, 1];
  }

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation failure';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    const program = gl.createProgram();
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || 'Unknown shader link failure';
      gl.deleteProgram(program);
      throw new Error(message);
    }
    return program;
  }

  function polygonArea(points) {
    let area = 0;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      area += points[j].x * points[i].y - points[i].x * points[j].y;
    }
    return area / 2;
  }

  function cross(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  function pointInTriangle(p, a, b, c) {
    const c1 = cross(a, b, p);
    const c2 = cross(b, c, p);
    const c3 = cross(c, a, p);
    const hasNegative = c1 < -1e-10 || c2 < -1e-10 || c3 < -1e-10;
    const hasPositive = c1 > 1e-10 || c2 > 1e-10 || c3 > 1e-10;
    return !(hasNegative && hasPositive);
  }

  function triangulate(points) {
    const remaining = [...points.keys()];
    if (polygonArea(points) < 0) remaining.reverse();
    const triangles = [];
    let guard = points.length * points.length;

    while (remaining.length > 3 && guard-- > 0) {
      let clipped = false;
      for (let i = 0; i < remaining.length; i++) {
        const previous = remaining[(i + remaining.length - 1) % remaining.length];
        const current = remaining[i];
        const next = remaining[(i + 1) % remaining.length];
        const a = points[previous];
        const b = points[current];
        const c = points[next];
        if (cross(a, b, c) <= 1e-10) continue;

        let containsPoint = false;
        for (const candidate of remaining) {
          if (candidate === previous || candidate === current || candidate === next) continue;
          if (pointInTriangle(points[candidate], a, b, c)) {
            containsPoint = true;
            break;
          }
        }
        if (containsPoint) continue;

        triangles.push(previous, current, next);
        remaining.splice(i, 1);
        clipped = true;
        break;
      }
      if (!clipped) throw new Error('Could not triangulate the tile polygon');
    }

    if (remaining.length === 3) triangles.push(...remaining);
    return new Uint16Array(triangles);
  }

  class WebGLRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl2', {
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      if (!this.gl) throw new Error('WebGL2 is required for the fast renderer');

      this.patch = null;
      this.camera = { x: 0, y: 0, zoom: 20 };
      this.palette = PALETTES.cyan;
      this.devicePixelRatio = 1;
      this.transformBuffer = this.gl.createBuffer();
      this.stateBuffer = this.gl.createBuffer();
      this.typeBuffer = this.gl.createBuffer();
      this.fillPositionBuffer = this.gl.createBuffer();
      this.linePositionBuffer = this.gl.createBuffer();
      this.indexBuffer = this.gl.createBuffer();
      this.fillVAO = this.gl.createVertexArray();
      this.lineVAO = this.gl.createVertexArray();
      this.indexCount = 0;
      this.lineVertexCount = 0;
      this.geometryKey = '';
      this.createPipeline();
      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.disable(this.gl.CULL_FACE);
      this.gl.disable(this.gl.BLEND);
    }

    createPipeline() {
      const gl = this.gl;
      const vertexSource = `#version 300 es
        precision highp float;
        layout(location = 0) in vec2 a_position;
        layout(location = 1) in vec3 i_row0;
        layout(location = 2) in vec3 i_row1;
        layout(location = 3) in float i_state;
        layout(location = 4) in float i_type;
        uniform vec2 u_center;
        uniform vec2 u_viewport;
        uniform float u_zoom;
        out float v_state;
        out float v_type;
        void main() {
          vec3 local = vec3(a_position, 1.0);
          vec2 world = vec2(dot(i_row0, local), dot(i_row1, local));
          vec2 delta = (world - u_center) * u_zoom;
          vec2 clip = vec2(
            delta.x * 2.0 / u_viewport.x,
            delta.y * 2.0 / u_viewport.y
          );
          gl_Position = vec4(clip, 0.0, 1.0);
          v_state = i_state;
          v_type = i_type;
        }
      `;
      const fragmentSource = `#version 300 es
        precision highp float;
        in float v_state;
        in float v_type;
        uniform int u_pass;
        uniform int u_show_types;
        uniform float u_generations;
        uniform vec4 u_dead;
        uniform vec4 u_alive;
        uniform vec4 u_refractory_a;
        uniform vec4 u_refractory_b;
        uniform vec4 u_grid;
        uniform vec4 u_type_thin;
        uniform vec4 u_type_thick;
        out vec4 out_color;
        void main() {
          if (u_pass == 1) {
            out_color = u_grid;
          } else if (v_state < 0.5) {
            if (u_show_types == 1) {
              vec4 type_color = v_type < 0.5 ? u_type_thin : u_type_thick;
              out_color = mix(u_dead, type_color, 0.42);
            } else {
              out_color = u_dead;
            }
          } else if (v_state < 1.5) {
            out_color = u_alive;
          } else {
            float denominator = max(1.0, u_generations - 3.0);
            float t = clamp((v_state - 2.0) / denominator, 0.0, 1.0);
            out_color = mix(u_refractory_a, u_refractory_b, t);
          }
        }
      `;
      this.program = createProgram(gl, vertexSource, fragmentSource);
      this.uniforms = {
        center: gl.getUniformLocation(this.program, 'u_center'),
        viewport: gl.getUniformLocation(this.program, 'u_viewport'),
        zoom: gl.getUniformLocation(this.program, 'u_zoom'),
        pass: gl.getUniformLocation(this.program, 'u_pass'),
        showTypes: gl.getUniformLocation(this.program, 'u_show_types'),
        generations: gl.getUniformLocation(this.program, 'u_generations'),
        dead: gl.getUniformLocation(this.program, 'u_dead'),
        alive: gl.getUniformLocation(this.program, 'u_alive'),
        refractoryA: gl.getUniformLocation(this.program, 'u_refractory_a'),
        refractoryB: gl.getUniformLocation(this.program, 'u_refractory_b'),
        grid: gl.getUniformLocation(this.program, 'u_grid'),
        typeThin: gl.getUniformLocation(this.program, 'u_type_thin'),
        typeThick: gl.getUniformLocation(this.program, 'u_type_thick'),
      };
    }

    bindInstanceAttributes(vao, positionBuffer, positionCount, indexBuffer = null) {
      const gl = this.gl;
      gl.bindVertexArray(vao);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.transformBuffer);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 0);
      gl.vertexAttribDivisor(1, 1);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 24, 12);
      gl.vertexAttribDivisor(2, 1);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.stateBuffer);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 1, gl.UNSIGNED_BYTE, false, 1, 0);
      gl.vertexAttribDivisor(3, 1);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.typeBuffer);
      gl.enableVertexAttribArray(4);
      gl.vertexAttribPointer(4, 1, gl.UNSIGNED_BYTE, false, 1, 0);
      gl.vertexAttribDivisor(4, 1);

      if (indexBuffer) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bindVertexArray(null);
      return positionCount;
    }

    createGeometry(outline) {
      const gl = this.gl;
      const geometryKey = outline.map((point) => `${point.x},${point.y}`).join(';');
      if (geometryKey === this.geometryKey) return;
      this.geometryKey = geometryKey;
      const fillPositions = new Float32Array(outline.length * 2);
      for (let i = 0; i < outline.length; i++) {
        fillPositions[i * 2] = outline[i].x;
        fillPositions[i * 2 + 1] = outline[i].y;
      }
      const linePositions = new Float32Array((outline.length + 1) * 2);
      linePositions.set(fillPositions);
      linePositions[linePositions.length - 2] = outline[0].x;
      linePositions[linePositions.length - 1] = outline[0].y;
      const indices = triangulate(outline);
      this.indexCount = indices.length;
      this.lineVertexCount = outline.length + 1;

      gl.bindBuffer(gl.ARRAY_BUFFER, this.fillPositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, fillPositions, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.linePositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, linePositions, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

      this.bindInstanceAttributes(this.fillVAO, this.fillPositionBuffer, outline.length, this.indexBuffer);
      this.bindInstanceAttributes(this.lineVAO, this.linePositionBuffer, outline.length + 1);
    }

    setPatch(patch, state) {
      const gl = this.gl;
      this.patch = patch;
      this.createGeometry(patch.outline || Core.HAT_OUTLINE);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.transformBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, patch.transforms, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.stateBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, state, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.typeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, patch.tileTypes || new Uint8Array(patch.tileCount), gl.STATIC_DRAW);
    }

    updateState(state) {
      if (!this.patch) return;
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.stateBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, state);
    }

    setPalette(name) {
      this.palette = PALETTES[name] || PALETTES.cyan;
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      this.devicePixelRatio = dpr;
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
        return true;
      }
      return false;
    }

    fit() {
      if (!this.patch) return;
      const rect = this.canvas.getBoundingClientRect();
      const bounds = this.patch.bounds;
      const width = Math.max(1e-6, bounds.maxX - bounds.minX);
      const height = Math.max(1e-6, bounds.maxY - bounds.minY);
      this.camera.x = (bounds.minX + bounds.maxX) / 2;
      this.camera.y = (bounds.minY + bounds.maxY) / 2;
      this.camera.zoom = Math.max(0.02, Math.min(rect.width / (width * 1.08), rect.height / (height * 1.08)));
    }

    focusBounds(bounds, padding = 0) {
      if (
        !Array.isArray(bounds) ||
        bounds.length !== 4 ||
        bounds.some((value) => !Number.isFinite(value)) ||
        bounds[2] < bounds[0] ||
        bounds[3] < bounds[1] ||
        !Number.isFinite(padding) ||
        padding < 0
      ) {
        throw new RangeError('View bounds must be four ordered finite values with nonnegative padding');
      }
      const rect = this.canvas.getBoundingClientRect();
      const width = Math.max(1e-6, bounds[2] - bounds[0] + padding * 2);
      const height = Math.max(1e-6, bounds[3] - bounds[1] + padding * 2);
      this.camera.x = (bounds[0] + bounds[2]) / 2;
      this.camera.y = (bounds[1] + bounds[3]) / 2;
      this.camera.zoom = Math.max(0.02, Math.min(500, rect.width / width, rect.height / height));
    }

    stateBounds(state) {
      if (!this.patch || !state || state.length !== this.patch.tileCount) return null;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let cell = 0; cell < state.length; cell++) {
        if (!state[cell]) continue;
        const offset = cell * 4;
        minX = Math.min(minX, this.patch.bboxes[offset]);
        minY = Math.min(minY, this.patch.bboxes[offset + 1]);
        maxX = Math.max(maxX, this.patch.bboxes[offset + 2]);
        maxY = Math.max(maxY, this.patch.bboxes[offset + 3]);
      }
      return Number.isFinite(minX) ? [minX, minY, maxX, maxY] : null;
    }

    focusState(state, padding = 4) {
      const bounds = this.stateBounds(state);
      if (bounds) this.focusBounds(bounds, padding);
      else this.fit();
    }

    containState(state, padding = 4) {
      const bounds = this.stateBounds(state);
      if (!bounds) return false;
      const rect = this.canvas.getBoundingClientRect();
      const halfWidth = rect.width / (2 * this.camera.zoom);
      const halfHeight = rect.height / (2 * this.camera.zoom);
      const visible = [
        this.camera.x - halfWidth,
        this.camera.y - halfHeight,
        this.camera.x + halfWidth,
        this.camera.y + halfHeight,
      ];
      if (
        bounds[0] - padding >= visible[0] &&
        bounds[1] - padding >= visible[1] &&
        bounds[2] + padding <= visible[2] &&
        bounds[3] + padding <= visible[3]
      ) return false;

      const desired = [
        bounds[0] - padding,
        bounds[1] - padding,
        bounds[2] + padding,
        bounds[3] + padding,
      ];
      const width = Math.max(1e-6, desired[2] - desired[0]);
      const height = Math.max(1e-6, desired[3] - desired[1]);
      const requiredZoom = Math.max(0.02, Math.min(500, rect.width / width, rect.height / height));
      this.camera.zoom = Math.min(this.camera.zoom, requiredZoom);

      const nextHalfWidth = rect.width / (2 * this.camera.zoom);
      const nextHalfHeight = rect.height / (2 * this.camera.zoom);
      if (width > nextHalfWidth * 2) {
        this.camera.x = (desired[0] + desired[2]) / 2;
      } else if (desired[0] < this.camera.x - nextHalfWidth) {
        this.camera.x = desired[0] + nextHalfWidth;
      } else if (desired[2] > this.camera.x + nextHalfWidth) {
        this.camera.x = desired[2] - nextHalfWidth;
      }
      if (height > nextHalfHeight * 2) {
        this.camera.y = (desired[1] + desired[3]) / 2;
      } else if (desired[1] < this.camera.y - nextHalfHeight) {
        this.camera.y = desired[1] + nextHalfHeight;
      } else if (desired[3] > this.camera.y + nextHalfHeight) {
        this.camera.y = desired[3] - nextHalfHeight;
      }
      return true;
    }

    screenToWorld(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const dx = clientX - rect.left - rect.width / 2;
      const dy = clientY - rect.top - rect.height / 2;
      return {
        x: this.camera.x + dx / this.camera.zoom,
        y: this.camera.y - dy / this.camera.zoom,
      };
    }

    zoomAt(clientX, clientY, factor) {
      const before = this.screenToWorld(clientX, clientY);
      const rect = this.canvas.getBoundingClientRect();
      const dx = clientX - rect.left - rect.width / 2;
      const dy = clientY - rect.top - rect.height / 2;
      this.camera.zoom = Math.max(0.02, Math.min(500, this.camera.zoom * factor));
      this.camera.x = before.x - dx / this.camera.zoom;
      this.camera.y = before.y + dy / this.camera.zoom;
    }

    panPixels(dx, dy) {
      this.camera.x -= dx / this.camera.zoom;
      this.camera.y += dy / this.camera.zoom;
    }

    render(showGrid, generations, showTileTypes = false) {
      const gl = this.gl;
      this.resize();
      const palette = this.palette;
      const background = hexToRGBA(palette.background);
      gl.clearColor(background[0], background[1], background[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!this.patch) return;

      gl.useProgram(this.program);
      gl.uniform2f(this.uniforms.center, this.camera.x, this.camera.y);
      gl.uniform2f(this.uniforms.viewport, this.canvas.width, this.canvas.height);
      gl.uniform1f(this.uniforms.zoom, this.camera.zoom * this.devicePixelRatio);
      gl.uniform1f(this.uniforms.generations, generations);
      gl.uniform1i(this.uniforms.showTypes, showTileTypes && this.patch.tiling === 'penrose' ? 1 : 0);
      gl.uniform4fv(this.uniforms.dead, hexToRGBA(palette.dead));
      gl.uniform4fv(this.uniforms.alive, hexToRGBA(palette.alive));
      gl.uniform4fv(this.uniforms.refractoryA, hexToRGBA(palette.refractoryA));
      gl.uniform4fv(this.uniforms.refractoryB, hexToRGBA(palette.refractoryB));
      gl.uniform4fv(this.uniforms.grid, hexToRGBA(palette.grid));
      gl.uniform4fv(this.uniforms.typeThin, hexToRGBA(palette.typeThin));
      gl.uniform4fv(this.uniforms.typeThick, hexToRGBA(palette.typeThick));

      gl.uniform1i(this.uniforms.pass, 0);
      gl.bindVertexArray(this.fillVAO);
      gl.drawElementsInstanced(
        gl.TRIANGLES,
        this.indexCount,
        gl.UNSIGNED_SHORT,
        0,
        this.patch.tileCount,
      );

      if (showGrid && this.camera.zoom > 0.7) {
        gl.uniform1i(this.uniforms.pass, 1);
        gl.bindVertexArray(this.lineVAO);
        gl.drawArraysInstanced(gl.LINE_STRIP, 0, this.lineVertexCount, this.patch.tileCount);
      }
      gl.bindVertexArray(null);
    }
  }

  class AperiodicLifeApp {
    constructor() {
      this.canvas = document.getElementById('lifeCanvas');
      this.controls = document.getElementById('controls');
      this.busy = document.getElementById('busy');
      this.busyTitle = document.getElementById('busyTitle');
      this.busyDetail = document.getElementById('busyDetail');
      this.toast = document.getElementById('toast');
      this.renderer = new WebGLRenderer(this.canvas);
      this.patch = null;
      this.simulation = null;
      this.picking = null;
      this.running = false;
      this.busyState = false;
      this.accumulator = 0;
      this.lastFrame = performance.now();
      this.lastStats = 0;
      this.dirty = true;
      this.pointerAction = null;
      this.activePointerId = null;
      this.lastPointer = null;
      this.touchPointers = new Map();
      this.lastPinch = null;
      this.pendingTouchPaint = null;
      this.lastPaintedCell = -1;
      this.paintValue = null;
      this.toastTimer = 0;
      this.rebuildRequestId = 0;
      this.resumeAfterRebuild = false;
      this.maxCycleHistory = 192;
      this.cycleMemoryBudget = 16 * 1024 * 1024;
      this.cycleHistory = new Map();
      this.cycleOrder = [];
      this.cycleSnapshotPool = [];
      this.cycleSnapshotLength = 0;
      this.cycleWindowComplete = false;
      this.detectedCycle = null;
      this.activeDiscovery = null;
      this.automaticDiscoveryView = false;
      this.discoveryViewManaged = false;
      this.discoveryById = new Map(DISCOVERIES.map((entry) => [entry.id, entry]));
      this.elements = this.collectElements();
      this.populateDiscoveries();
      this.syncTilingControls(true);
      this.bindEvents();
      this.updateRangeLabels();
      this.updateToolCursor();
      this.renderer.setPalette(this.elements.paletteSelect.value);
      requestAnimationFrame((time) => this.frame(time));
      this.rebuildPatch();
    }

    collectElements() {
      const ids = [
        'runButton', 'viewportRunButton', 'stepButton', 'randomizeButton', 'clearButton', 'tilingSelect',
        'depthSelect', 'penroseSeedField', 'penroseSeedSelect',
        'neighborhoodSelect', 'neighborhoodHelp', 'neighborhoodInfoButton', 'borderInput', 'presetSelect',
        'ruleInput', 'ruleHelp', 'ruleMeaningHelp', 'statesHelp', 'ruleInfoButton', 'rulesDialog', 'randomRuleButton', 'generationsInput',
        'discoverySelect', 'discoverySearch', 'discoveryCount', 'catalogueCount',
        'loadDiscoveryButton', 'loadRunDiscoveryButton', 'discoveryDescription', 'discoveryProvenance',
        'saveSnapshotButton', 'loadSnapshotButton', 'snapshotFileInput', 'snapshotStatus',
        'densityInput', 'densityOutput', 'seedInput', 'newSeedButton', 'speedInput',
        'speedOutput', 'toolSelect', 'gridCheckbox', 'typeCheckbox', 'paletteSelect',
        'fitButton', 'saveButton', 'copyButton', 'aboutButton', 'aboutDialog',
        'tilingStat', 'generationStat', 'aliveStat', 'cellsStat', 'degreeStat',
        'changedStat', 'cycleStat', 'stepStat', 'buildStat', 'tileTypesStat',
        'openControls', 'closeControls',
      ];
      const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
      for (const [id, element] of Object.entries(elements)) {
        if (!element) throw new Error(`Required interface element #${id} is missing`);
      }
      return elements;
    }

    populateDiscoveries() {
      const select = this.elements.discoverySelect;
      const selected = select.value;
      const placeholder = select.querySelector('option[value=""]') || new Option('Choose a verified example…', '');
      const groups = new Map();
      let count = 0;
      for (const entry of DISCOVERIES) {
        if (!discoveryMatches(entry, this.elements.discoverySearch.value)) continue;
        count++;
        let group = groups.get(entry.category);
        if (!group) {
          group = document.createElement('optgroup');
          group.label = entry.category;
          groups.set(entry.category, group);
        }
        const option = document.createElement('option');
        option.value = entry.id;
        option.textContent = entry.title;
        group.appendChild(option);
      }
      placeholder.textContent = count ? 'Choose a verified example…' : 'No matching examples';
      select.replaceChildren(placeholder, ...groups.values());
      select.value = [...select.options].some((option) => option.value === selected) ? selected : '';
      this.elements.discoveryCount.textContent = `${count} of ${DISCOVERIES.length} examples`;
      this.elements.catalogueCount.textContent = String(DISCOVERIES.length);
      this.updateDiscoveryDescription();
    }

    bindEvents() {
      const e = this.elements;
      e.runButton.addEventListener('click', () => this.setRunning(!this.running));
      e.viewportRunButton.addEventListener('click', () => this.setRunning(!this.running));
      e.stepButton.addEventListener('click', () => this.stepOnce());
      e.randomizeButton.addEventListener('click', () => this.randomize());
      e.clearButton.addEventListener('click', () => this.clear());
      e.tilingSelect.addEventListener('change', () => this.changeTiling());
      e.depthSelect.addEventListener('change', () => {
        this.clearActiveDiscovery();
        this.rebuildPatch();
      });
      e.penroseSeedSelect.addEventListener('change', () => {
        this.clearActiveDiscovery();
        this.rebuildPatch();
      });
      e.neighborhoodSelect.addEventListener('change', () => this.changeNeighborhood());
      e.borderInput.addEventListener('change', () => this.changeBorder());
      e.presetSelect.addEventListener('change', () => this.applyPreset());
      e.ruleInput.addEventListener('change', () => this.applyRule(true));
      e.ruleInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.applyRule(true);
          event.currentTarget.blur();
        }
      });
      e.randomRuleButton.addEventListener('click', () => this.randomRule());
      e.generationsInput.addEventListener('change', () => this.changeGenerations());
      e.discoverySearch.addEventListener('input', () => this.populateDiscoveries());
      e.discoverySelect.addEventListener('change', () => this.updateDiscoveryDescription());
      e.loadDiscoveryButton.addEventListener('click', () => this.loadDiscovery(false));
      e.loadRunDiscoveryButton.addEventListener('click', () => this.loadDiscovery(true));
      e.saveSnapshotButton.addEventListener('click', () => this.saveSnapshot());
      e.loadSnapshotButton.addEventListener('click', () => e.snapshotFileInput.click());
      e.snapshotFileInput.addEventListener('change', () => this.loadSnapshotFile());
      e.densityInput.addEventListener('input', () => {
        this.updateRangeLabels();
        this.clearActiveDiscovery(false);
      });
      e.speedInput.addEventListener('input', () => this.updateRangeLabels());
      e.seedInput.addEventListener('change', () => this.clearActiveDiscovery(false));
      e.newSeedButton.addEventListener('click', () => this.newSeed());
      e.toolSelect.addEventListener('change', () => this.updateToolCursor());
      e.gridCheckbox.addEventListener('change', () => { this.dirty = true; });
      e.typeCheckbox.addEventListener('change', () => { this.dirty = true; });
      e.paletteSelect.addEventListener('change', () => {
        this.renderer.setPalette(e.paletteSelect.value);
        this.dirty = true;
      });
      e.fitButton.addEventListener('click', () => this.fit());
      e.saveButton.addEventListener('click', () => this.savePNG());
      e.copyButton.addEventListener('click', () => this.copyConfig());
      e.aboutButton.addEventListener('click', () => e.aboutDialog.showModal());
      e.neighborhoodInfoButton.addEventListener('click', () => e.rulesDialog.showModal());
      e.ruleInfoButton.addEventListener('click', () => e.rulesDialog.showModal());
      e.openControls.addEventListener('click', () => {
        this.controls.classList.add('open');
        e.openControls.setAttribute('aria-expanded', 'true');
        e.closeControls.focus();
      });
      e.closeControls.addEventListener('click', () => this.closeControls());

      this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
      this.canvas.addEventListener('pointerdown', (event) => this.pointerDown(event));
      // Window-level continuation is a fallback for browsers or embedders that
      // reject pointer capture when a drag begins. Captured
      // events bubble here too, so there is still exactly one move per event.
      window.addEventListener('pointermove', (event) => this.pointerMove(event));
      window.addEventListener('pointerup', (event) => this.pointerUp(event));
      window.addEventListener('pointercancel', (event) => this.pointerCancel(event));
      window.addEventListener('blur', () => this.finishPointer());
      this.canvas.addEventListener('lostpointercapture', (event) => this.pointerCaptureLost(event));
      this.canvas.addEventListener('wheel', (event) => this.wheel(event), { passive: false });
      this.canvas.addEventListener('dblclick', () => this.fit());
      window.addEventListener('keydown', (event) => this.keyDown(event));
      window.addEventListener('resize', () => this.resizeViewport());
    }

    updateNeighborhoodHelp() {
      const tiling = this.elements.tilingSelect.value;
      if (tiling === 'square') {
        this.elements.neighborhoodHelp.textContent = 'Shared edge is the four-neighbour von Neumann graph; edge or corner is the eight-neighbour Moore graph.';
      } else if (tiling === 'hex') {
        this.elements.neighborhoodHelp.textContent = 'On the regular honeycomb, any two hexagons meeting at a vertex also share an edge, so both choices give six neighbours.';
      } else {
        this.elements.neighborhoodHelp.textContent = 'The two exact contact graphs can have different degrees and finite-patch boundaries.';
      }
    }

    closeControls() {
      if (!this.controls.classList.contains('open')) return;
      this.controls.classList.remove('open');
      this.elements.openControls.setAttribute('aria-expanded', 'false');
      this.elements.openControls.focus();
    }

    syncTilingControls(preserveIndex = true) {
      const e = this.elements;
      const tiling = e.tilingSelect.value in Core.PATCH_OPTIONS ? e.tilingSelect.value : 'hat';
      const previousIndex = preserveIndex ? Math.max(0, e.depthSelect.selectedIndex) : 3;
      const options = Core.PATCH_OPTIONS[tiling];
      e.depthSelect.replaceChildren(...options.map((entry) => {
        const option = document.createElement('option');
        option.value = String(entry.depth);
        option.dataset.cells = String(entry.tileCount);
        option.textContent = entry.label || `${numberFormat.format(entry.tileCount)} cells`;
        return option;
      }));
      e.depthSelect.selectedIndex = Math.min(previousIndex, options.length - 1);
      const penrose = tiling === 'penrose';
      e.penroseSeedField.hidden = !penrose;
      e.penroseSeedSelect.disabled = !penrose;
      e.typeCheckbox.disabled = !penrose;
      this.updateNeighborhoodHelp();
    }

    changeTiling() {
      this.clearActiveDiscovery();
      this.syncTilingControls(true);
      this.rebuildPatch();
    }

    async nextPaint() {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    setBusy(active, title = 'Building tiling', detail = 'Generating geometry and adjacency…') {
      if (active) this.finishPointer();
      this.busyState = active;
      this.busy.hidden = !active;
      this.busyTitle.textContent = title;
      this.busyDetail.textContent = detail;
      for (const button of [
        this.elements.stepButton,
        this.elements.randomizeButton,
        this.elements.clearButton,
      ]) button.disabled = active;
      for (const button of [this.elements.runButton, this.elements.viewportRunButton]) {
        button.disabled = active || !this.simulation;
      }
      this.elements.saveSnapshotButton.disabled = active || !this.simulation;
      this.elements.loadSnapshotButton.disabled = active;
      this.elements.loadDiscoveryButton.disabled = active || !this.elements.discoverySelect.value;
      this.elements.loadRunDiscoveryButton.disabled = active || !this.elements.discoverySelect.value;
    }

    buildDescription(tiling) {
      if (tiling === 'square') return ['square board', 'square cells'];
      if (tiling === 'hex') return ['hexagonal board', 'hexagons'];
      if (tiling === 'penrose') return ['Penrose patch', 'rhomb cells'];
      return ['Einstein patch', 'hat cells'];
    }

    async rebuildPatch(options = {}) {
      const requestId = ++this.rebuildRequestId;
      const shouldRandomize = options.randomize !== false;
      const shouldFit = options.fit !== false;
      const shouldToast = options.toast !== false;
      if (!this.busyState) this.resumeAfterRebuild = this.running;
      const resume = this.resumeAfterRebuild;
      this.setRunning(false);
      const tiling = this.elements.tilingSelect.value;
      const depth = Number(this.elements.depthSelect.value);
      const expected = Number(this.elements.depthSelect.selectedOptions[0]?.dataset.cells) || 0;
      const [label, cellLabel] = this.buildDescription(tiling);
      this.setBusy(true, `Building ${label}`, `Preparing ${numberFormat.format(expected)} ${cellLabel}…`);
      await this.nextPaint();
      if (requestId !== this.rebuildRequestId) return false;

      try {
        const patch = Core.buildPatch(tiling, depth, {
          seed: this.elements.penroseSeedSelect.value,
        });
        const graph = this.elements.neighborhoodSelect.value === 'touch' ? patch.touchGraph : patch.edgeGraph;
        const selectedPreset = PRESETS[this.elements.presetSelect.value];
        let ruleText = selectedPreset
          ? resolvePresetRule(selectedPreset, graph.maxDegree)
          : this.elements.ruleInput.value;
        try {
          Core.parseRule(ruleText, graph.maxDegree);
        } catch (_) {
          ruleText = this.simulation ? this.simulation.rule.text : 'B3/S23';
          this.elements.presetSelect.value = 'custom';
          this.elements.ruleInput.classList.remove('invalid');
          this.elements.ruleInput.setAttribute('aria-invalid', 'false');
        }
        this.elements.ruleInput.value = ruleText;
        const simulation = new Core.Automaton(patch, graph, {
          rule: ruleText,
          generations: Number(this.elements.generationsInput.value),
          borderRings: Number(this.elements.borderInput.value),
        });
        this.patch = patch;
        this.simulation = simulation;
        this.elements.generationsInput.value = simulation.generations;
        this.elements.borderInput.value = simulation.borderRings;
        this.picking = new Core.PickingIndex(patch, patch.pickingCellSize || 2);
        this.renderer.setPatch(patch, simulation.state);
        this.applyRule(false, false);
        if (shouldRandomize) {
          simulation.randomize(Number(this.elements.densityInput.value), this.elements.seedInput.value);
        } else {
          simulation.clear();
        }
        this.renderer.updateState(simulation.state);
        if (shouldFit) this.renderer.fit();
        this.resetCycleDetector();
        this.dirty = true;
        this.updateStats(true);
        if (shouldToast) {
          this.showToast(`${numberFormat.format(patch.tileCount)} ${patch.tilingLabel} cells built in ${patch.buildMilliseconds.toFixed(0)} ms`);
        }
      } catch (error) {
        console.error(error);
        this.setBusy(false);
        this.resumeAfterRebuild = false;
        if (this.simulation) this.syncSimulationControls();
        this.showToast(`Could not build the patch: ${error.message || String(error)}`);
        return false;
      }

      if (requestId !== this.rebuildRequestId) return false;
      this.setBusy(false);
      this.resumeAfterRebuild = false;
      if (resume && options.resume !== false) this.setRunning(true);
      return true;
    }

    currentGraph() {
      if (!this.patch) return null;
      return this.elements.neighborhoodSelect.value === 'touch' ? this.patch.touchGraph : this.patch.edgeGraph;
    }

    changeNeighborhood() {
      this.updateNeighborhoodHelp();
      if (!this.simulation) return;
      this.clearActiveDiscovery();
      this.simulation.setGraph(this.currentGraph());
      const preset = PRESETS[this.elements.presetSelect.value];
      if (preset) this.elements.ruleInput.value = resolvePresetRule(preset, this.simulation.graph.maxDegree);
      this.applyRule(false, false);
      this.renderer.updateState(this.simulation.state);
      this.resetCycleDetector();
      this.updateStats(true);
      this.dirty = true;
    }

    changeBorder() {
      if (!this.simulation) return;
      this.clearActiveDiscovery();
      const numeric = Number(this.elements.borderInput.value);
      const value = Math.max(0, Math.min(12, Number.isFinite(numeric) ? Math.trunc(numeric) : 0));
      this.elements.borderInput.value = value;
      this.simulation.setBorderRings(value);
      this.renderer.updateState(this.simulation.state);
      this.resetCycleDetector();
      this.updateStats(true);
      this.dirty = true;
    }

    applyPreset() {
      const preset = PRESETS[this.elements.presetSelect.value];
      if (!preset) return;
      this.clearActiveDiscovery();
      const maxDegree = this.simulation ? this.simulation.graph.maxDegree : 11;
      this.elements.ruleInput.value = resolvePresetRule(preset, maxDegree);
      this.elements.generationsInput.value = preset.generations;
      if (this.simulation) {
        this.applyRule(false, false);
        this.simulation.setGenerations(preset.generations);
        this.elements.generationsInput.value = this.simulation.generations;
        this.renderer.updateState(this.simulation.state);
        this.resetCycleDetector();
        this.updateStats(true);
        this.dirty = true;
      }
    }

    applyRule(markCustom, resetCycle = true) {
      if (!this.simulation) return false;
      const input = this.elements.ruleInput;
      try {
        const previousStateCount = this.simulation.generations;
        const rule = this.simulation.setRule(input.value);
        input.classList.remove('invalid');
        input.setAttribute('aria-invalid', 'false');
        input.value = rule.text;
        const priority = rule.kind === 'priority';
        this.elements.generationsInput.disabled = priority;
        this.elements.generationsInput.value = this.simulation.generations;
        this.elements.ruleMeaningHelp.textContent = priority
          ? 'Ordered rules count neighbours in every state, including 0. The first matching rule wins; otherwise the cell becomes 0.'
          : 'B lists birth counts; S lists survival counts. Only state-1 neighbours count.';
        this.elements.statesHelp.textContent = priority
          ? `${rule.states} states fixed by this table. Higher states are signals that influence neighbouring cells.`
          : 'Includes state 0 (dead) and state 1 (live); any higher states are refractory.';
        if (priority) {
          this.elements.ruleHelp.textContent = `${rule.name || rule.text}. Use Edge or corner on the Hat tiling for the curated gliders. See ? for the rule model and evidence limits.`;
        } else if (rule.ignored.length) {
          this.elements.ruleHelp.textContent = `Counts ${rule.ignored.join(', ')} exceed this graph’s maximum degree ${this.simulation.graph.maxDegree} and are ignored.`;
        } else {
          this.elements.ruleHelp.textContent = `Valid for degrees 0–${this.simulation.graph.maxDegree}. Use compact digits, comma-separated counts, or brackets for multi-digit counts.`;
        }
        if (markCustom) {
          this.elements.presetSelect.value = 'custom';
          this.clearActiveDiscovery();
        }
        if (previousStateCount !== this.simulation.generations) {
          this.renderer.updateState(this.simulation.state);
          this.dirty = true;
        }
        if (resetCycle) {
          this.resetCycleDetector();
          this.updateStats(true);
        }
        return true;
      } catch (error) {
        input.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
        this.elements.ruleHelp.textContent = error.message;
        return false;
      }
    }

    changeGenerations() {
      if (!this.simulation) return;
      if (this.simulation.rule.kind === 'priority') {
        this.elements.generationsInput.value = this.simulation.generations;
        return;
      }
      this.clearActiveDiscovery();
      const numeric = Number(this.elements.generationsInput.value);
      const value = Math.max(2, Math.min(32, Number.isFinite(numeric) ? Math.trunc(numeric) : 2));
      this.elements.generationsInput.value = value;
      this.elements.presetSelect.value = 'custom';
      this.simulation.setGenerations(value);
      this.renderer.updateState(this.simulation.state);
      this.resetCycleDetector();
      this.updateStats(true);
      this.dirty = true;
    }

    randomRule() {
      if (!this.simulation) return;
      this.clearActiveDiscovery();
      const max = this.simulation.graph.maxDegree;
      const bytes = new Uint32Array(1);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
      else bytes[0] = Math.floor(Math.random() * 0xffffffff);
      const random = Core.mulberry32(bytes[0]);
      const birth = [];
      const survive = [];
      for (let count = 1; count <= max; count++) if (random() < 0.28) birth.push(count);
      for (let count = 0; count <= max; count++) if (random() < 0.38) survive.push(count);
      if (!birth.length) birth.push(1 + Math.floor(random() * Math.max(1, max)));
      this.elements.ruleInput.value = Core.formatRule(birth, survive);
      this.elements.presetSelect.value = 'custom';
      this.applyRule(false);
    }

    setRunning(value) {
      const wasRunning = this.running;
      this.running = Boolean(value) && !this.busyState && Boolean(this.simulation);
      for (const [button, idleLabel] of [
        [this.elements.runButton, 'Run'],
        [this.elements.viewportRunButton, 'Play'],
      ]) {
        const label = this.running ? 'Pause' : idleLabel;
        button.textContent = label;
        button.setAttribute('aria-label', `${label} simulation`);
        button.title = `${label} simulation (Space)`;
        button.classList.toggle('running', this.running);
        button.classList.toggle('primary', !this.running);
      }
      if (!this.running) {
        this.accumulator = 0;
        if (wasRunning) this.updateStats(true);
      }
    }

    statesEqual(left, right) {
      if (left.length !== right.length) return false;
      for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return false;
      return true;
    }

    resetCycleDetector() {
      const snapshotLength = this.simulation ? this.simulation.state.length : 0;
      if (snapshotLength !== this.cycleSnapshotLength) {
        this.cycleSnapshotPool.length = 0;
        this.cycleSnapshotLength = snapshotLength;
      } else {
        for (const entry of this.cycleOrder) this.cycleSnapshotPool.push(entry.state);
      }
      this.cycleHistory.clear();
      this.cycleOrder.length = 0;
      this.cycleWindowComplete = false;
      this.detectedCycle = null;
      if (this.simulation) {
        this.maxCycleHistory = Math.max(
          64,
          Math.min(1024, Math.floor(this.cycleMemoryBudget / Math.max(1, this.simulation.state.length))),
        );
        this.observeCycle();
      }
    }

    observeCycle() {
      if (!this.simulation || this.detectedCycle) return this.detectedCycle;
      const simulation = this.simulation;
      const [hashA, hashB] = simulation.ensureStateHash();
      const key = `${hashA.toString(16)}:${hashB.toString(16)}:${simulation.aliveCount()}`;
      const bucket = this.cycleHistory.get(key);
      if (bucket) {
        for (let index = bucket.length - 1; index >= 0; index--) {
          const previous = bucket[index];
          const period = simulation.generation - previous.generation;
          if (period > 0 && this.statesEqual(previous.state, simulation.state)) {
            this.detectedCycle = {
              period,
              firstGeneration: previous.generation,
              confirmedGeneration: simulation.generation,
            };
            return this.detectedCycle;
          }
        }
      }

      const snapshot = this.cycleSnapshotPool.pop() || new Uint8Array(simulation.state.length);
      snapshot.set(simulation.state);
      const entry = {
        key,
        generation: simulation.generation,
        state: snapshot,
      };
      if (bucket) bucket.push(entry);
      else this.cycleHistory.set(key, [entry]);
      this.cycleOrder.push(entry);
      while (this.cycleOrder.length > this.maxCycleHistory) {
        this.cycleWindowComplete = true;
        const oldest = this.cycleOrder.shift();
        const oldBucket = this.cycleHistory.get(oldest.key);
        const position = oldBucket ? oldBucket.indexOf(oldest) : -1;
        if (position >= 0) oldBucket.splice(position, 1);
        if (oldBucket && oldBucket.length === 0) this.cycleHistory.delete(oldest.key);
        this.cycleSnapshotPool.push(oldest.state);
      }
      return null;
    }

    stepOnce() {
      if (!this.simulation || this.busyState) return;
      this.simulation.step();
      this.observeCycle();
      this.renderer.updateState(this.simulation.state);
      this.updateManagedDiscoveryView();
      this.updateStats(true);
      this.dirty = true;
    }

    randomize(showMessage = true) {
      if (!this.simulation || this.busyState) return;
      this.clearActiveDiscovery(false);
      this.simulation.randomize(Number(this.elements.densityInput.value), this.elements.seedInput.value);
      this.renderer.updateState(this.simulation.state);
      this.resetCycleDetector();
      this.updateStats(true);
      this.dirty = true;
      if (showMessage) this.showToast(`Seeded from “${this.elements.seedInput.value}”`);
    }

    clear() {
      if (!this.simulation || this.busyState) return;
      this.clearActiveDiscovery();
      this.simulation.clear();
      this.renderer.updateState(this.simulation.state);
      this.resetCycleDetector();
      this.updateStats(true);
      this.dirty = true;
    }

    newSeed() {
      const words = new Uint32Array(2);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(words);
      else {
        words[0] = Math.floor(Math.random() * 0xffffffff);
        words[1] = Date.now() >>> 0;
      }
      this.elements.seedInput.value = `${words[0].toString(36)}-${words[1].toString(36)}`;
      this.clearActiveDiscovery(false);
    }

    updateRangeLabels() {
      this.elements.densityOutput.value = `${Math.round(Number(this.elements.densityInput.value) * 100)}%`;
      this.elements.speedOutput.value = `${this.elements.speedInput.value} steps/s`;
    }

    updateToolCursor() {
      const pan = this.elements.toolSelect.value === 'pan';
      this.canvas.classList.toggle('pan-tool', pan);
    }

    fit() {
      this.automaticDiscoveryView = false;
      this.discoveryViewManaged = false;
      this.renderer.fit();
      this.dirty = true;
    }

    paintAt(clientX, clientY) {
      if (!this.picking || !this.simulation) return;
      const world = this.renderer.screenToWorld(clientX, clientY);
      const cell = this.picking.find(world.x, world.y);
      if (cell < 0 || cell === this.lastPaintedCell) return;
      this.lastPaintedCell = cell;
      if (this.paintValue === null) this.paintValue = this.simulation.state[cell] === 1 ? 0 : 1;
      if (this.simulation.setCell(cell, this.paintValue)) {
        this.clearActiveDiscovery();
        this.renderer.updateState(this.simulation.state);
        this.resetCycleDetector();
        this.updateStats(true);
        this.dirty = true;
      }
    }

    pointerDown(event) {
      if (!this.simulation || this.busyState) return;
      const touch = event.pointerType === 'touch';
      if (touch) {
        // Do not mix a mouse/stylus drag with a separate touch gesture.
        if (this.activePointerId !== null && this.touchPointers.size === 0) return;
        if (this.touchPointers.has(event.pointerId)) return;
        this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      } else if (this.activePointerId !== null) {
        return;
      }
      try {
        this.canvas.setPointerCapture(event.pointerId);
      } catch (_) {
        // Window listeners continue the gesture when capture is unavailable.
        // The canvas's touch-action:none leaves camera gestures to the app.
      }
      if (touch && this.touchPointers.size > 1) {
        this.pointerAction = 'pinch';
        this.lastPinch = this.pinchGeometry();
        this.pendingTouchPaint = null;
        this.lastPaintedCell = -1;
        this.paintValue = null;
        event.preventDefault();
        return;
      }
      const shouldPan =
        this.elements.toolSelect.value === 'pan' ||
        event.button !== 0 ||
        event.shiftKey ||
        event.altKey;
      this.pointerAction = shouldPan ? 'pan' : 'paint';
      this.activePointerId = event.pointerId;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      this.lastPinch = null;
      this.pendingTouchPaint = null;
      this.lastPaintedCell = -1;
      this.paintValue = null;
      this.canvas.classList.add('dragging');
      if (this.pointerAction === 'paint') {
        // A second finger may be about to start a pinch. Commit a touch tap
        // on release, or begin a stroke after a small intentional movement.
        // Mouse and stylus painting retain their immediate response.
        if (touch) this.pendingTouchPaint = this.lastPointer;
        else this.paintAt(event.clientX, event.clientY);
      }
      event.preventDefault();
    }

    pinchGeometry() {
      const [first, second] = this.touchPointers.values();
      if (!first || !second) return null;
      return {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
        distance: Math.hypot(second.x - first.x, second.y - first.y),
      };
    }

    pointerMove(event) {
      if (this.touchPointers.has(event.pointerId)) {
        this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.pointerAction === 'pinch') {
          const next = this.pinchGeometry();
          const before = this.lastPinch;
          if (before && next) {
            // Zoom around the old midpoint, then carry that world point to
            // the new midpoint. This combines zoom and two-finger panning.
            const factor = before.distance >= 1 && next.distance >= 1
              ? next.distance / before.distance : 1;
            const dx = next.x - before.x;
            const dy = next.y - before.y;
            if (factor !== 1 || dx || dy) {
              this.automaticDiscoveryView = false;
              this.discoveryViewManaged = false;
              this.renderer.zoomAt(before.x, before.y, factor);
              this.renderer.panPixels(dx, dy);
              this.dirty = true;
            }
          }
          this.lastPinch = next;
          event.preventDefault();
          return;
        }
      }
      if (event.pointerId !== this.activePointerId || !this.pointerAction || !this.lastPointer) return;
      // If capture was rejected and the pointer was released outside this
      // window, the first mouse/pen move back arrives without a pressed
      // button. Treat it as the missing pointerup instead of ghost-dragging.
      if (event.buttons === 0 && event.pointerType !== 'touch') {
        this.finishPointer();
        return;
      }
      if (this.pointerAction === 'pan') {
        const dx = event.clientX - this.lastPointer.x;
        const dy = event.clientY - this.lastPointer.y;
        if (dx || dy) {
          this.automaticDiscoveryView = false;
          this.discoveryViewManaged = false;
          this.renderer.panPixels(dx, dy);
        }
        this.lastPointer = { x: event.clientX, y: event.clientY };
        this.dirty = true;
      } else {
        if (this.pendingTouchPaint) {
          const start = this.pendingTouchPaint;
          if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 4) {
            event.preventDefault();
            return;
          }
          this.pendingTouchPaint = null;
          this.paintAt(start.x, start.y);
        }
        this.paintAt(event.clientX, event.clientY);
      }
      event.preventDefault();
    }

    pointerUp(event) {
      if (this.touchPointers.has(event.pointerId)) {
        if (this.touchPointers.size === 1 && this.pendingTouchPaint) {
          this.paintAt(this.pendingTouchPaint.x, this.pendingTouchPaint.y);
        }
        this.touchPointers.delete(event.pointerId);
        this.pendingTouchPaint = null;
        if (this.touchPointers.size) {
          const [pointerId, point] = this.touchPointers.entries().next().value;
          this.activePointerId = pointerId;
          this.lastPointer = point;
          // The remaining finger continues navigation, even in Paint mode.
          // Painting needs a fresh touch after every finger has been lifted.
          this.pointerAction = this.touchPointers.size > 1 ? 'pinch' : 'pan';
          this.lastPinch = this.pinchGeometry();
          this.releasePointer(event.pointerId);
        } else {
          this.finishPointer();
        }
        event.preventDefault();
        return;
      }
      if (event.pointerId !== this.activePointerId) return;
      this.finishPointer();
    }

    pointerCancel(event) {
      if (event.pointerId === this.activePointerId || this.touchPointers.has(event.pointerId)) {
        this.finishPointer();
      }
    }

    finishPointer() {
      if (this.activePointerId === null) return;
      const pointers = new Set([this.activePointerId, ...this.touchPointers.keys()]);
      this.pointerAction = null;
      this.activePointerId = null;
      this.lastPointer = null;
      this.touchPointers.clear();
      this.lastPinch = null;
      this.pendingTouchPaint = null;
      this.lastPaintedCell = -1;
      this.paintValue = null;
      this.canvas.classList.remove('dragging');
      // Clear the gesture before releasing capture: lostpointercapture may
      // arrive while another finger is still down.
      for (const pointerId of pointers) this.releasePointer(pointerId);
    }

    releasePointer(pointerId) {
      if (
        typeof this.canvas.hasPointerCapture === 'function' &&
        this.canvas.hasPointerCapture(pointerId) &&
        typeof this.canvas.releasePointerCapture === 'function'
      ) {
        try {
          this.canvas.releasePointerCapture(pointerId);
        } catch (_) {
          // Capture may already have been revoked by a blur or cancellation.
        }
      }
    }

    pointerCaptureLost(event) {
      this.pointerCancel(event);
    }

    wheel(event) {
      if (!this.patch) return;
      this.automaticDiscoveryView = false;
      this.discoveryViewManaged = false;
      const factor = Math.exp(-event.deltaY * 0.0014);
      this.renderer.zoomAt(event.clientX, event.clientY, factor);
      this.dirty = true;
      event.preventDefault();
    }

    keyDown(event) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      // Leave all keys, including Escape, to the browser while a native modal
      // is open. On mobile the controls drawer can still be open behind the
      // dialog; closing it here would make one Escape press dismiss two layers.
      if (this.elements.aboutDialog.open || this.elements.rulesDialog.open) return;
      if (event.key === 'Escape' && this.controls.classList.contains('open')) {
        this.closeControls();
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(target.tagName))
      ) return;
      const key = event.key.toLowerCase();
      if (key === ' ') {
        event.preventDefault();
        this.setRunning(!this.running);
      } else if (key === 'n') {
        this.stepOnce();
      } else if (key === 'r') {
        this.randomize();
      } else if (key === 'c') {
        this.clear();
      } else if (key === 'f') {
        this.fit();
      }
    }

    clearActiveDiscovery(clearSelection = true) {
      this.activeDiscovery = null;
      this.automaticDiscoveryView = false;
      this.discoveryViewManaged = false;
      if (clearSelection && this.elements.discoverySelect.value) {
        this.elements.discoverySelect.value = '';
        this.updateDiscoveryDescription();
      }
    }

    updateDiscoveryDescription() {
      const entry = this.discoveryById.get(this.elements.discoverySelect.value);
      this.elements.loadDiscoveryButton.disabled = this.busyState || !entry;
      this.elements.loadRunDiscoveryButton.disabled = this.busyState || !entry;
      this.elements.discoveryDescription.textContent = entry
        ? entry.summary
        : 'Includes classic reference patterns, high-period aperiodic oscillators, and evolving fields.';
      const container = this.elements.discoveryProvenance;
      const provenance = entry && entry.provenance;
      container.replaceChildren();
      container.hidden = !provenance;
      if (!provenance) return;

      const statusLabels = {
        published: 'Published example',
        adapted: 'Adapted example',
        'package-found': 'Found in package searches',
        'package-constructed': 'Package demonstration',
        unresolved: 'Attribution unresolved',
      };
      const status = document.createElement('strong');
      status.textContent = `${statusLabels[provenance.status] || 'Provenance'}: `;
      const credit = document.createElement('span');
      credit.textContent = provenance.credit;
      container.appendChild(status);
      container.appendChild(credit);

      const sources = document.createElement('span');
      sources.className = 'discovery-source-links';
      let linkCount = 0;
      for (const source of provenance.sources || []) {
        let url;
        try { url = new URL(source.url); } catch (_) { continue; }
        if (!['https:', 'http:'].includes(url.protocol)) continue;
        if (linkCount) sources.appendChild(document.createTextNode(' · '));
        const link = document.createElement('a');
        link.href = url.href;
        link.textContent = source.label;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        sources.appendChild(link);
        if (++linkCount === 3) break;
      }
      if (linkCount) container.appendChild(sources);
    }

    coordinateMap() {
      if (!this.patch || !this.patch.coordinates) return null;
      const map = new Map();
      for (let cell = 0; cell < this.patch.tileCount; cell++) {
        map.set(`${this.patch.coordinates[cell * 2]},${this.patch.coordinates[cell * 2 + 1]}`, cell);
      }
      return map;
    }

    applyDiscoveryView(entry) {
      const view = entry.view;
      if (!view || view.mode === 'initial') {
        this.renderer.focusState(this.simulation.state, view ? view.padding : 4);
        this.automaticDiscoveryView = false;
      } else if (view.mode === 'trajectory') {
        this.focusTrajectoryView(view);
      } else if (view.mode === 'contain') {
        this.renderer.focusState(this.simulation.state, view.padding);
        this.automaticDiscoveryView = true;
      } else {
        throw new RangeError(`Discovery ${entry.id} has unknown view mode ${view.mode}`);
      }
      this.discoveryViewManaged = true;
    }

    focusTrajectoryView(view) {
      this.renderer.focusBounds(view.bounds, view.padding);
      this.automaticDiscoveryView = this.renderer.camera.zoom < MIN_TRAJECTORY_ZOOM;
      if (this.automaticDiscoveryView) this.renderer.focusState(this.simulation.state, view.padding);
    }

    updateManagedDiscoveryView() {
      if (!this.discoveryViewManaged || !this.activeDiscovery || !this.simulation) return;
      const entry = this.discoveryById.get(this.activeDiscovery);
      if (!entry || !entry.view) {
        this.automaticDiscoveryView = false;
        this.discoveryViewManaged = false;
        return;
      }
      const view = entry.view;
      if (view.mode === 'initial') this.automaticDiscoveryView = false;
      const shouldContain =
        (view.mode === 'contain' && this.automaticDiscoveryView) ||
        (view.mode === 'trajectory' && (
          this.automaticDiscoveryView || this.simulation.generation > view.steps
        ));
      if (!shouldContain) return;
      if (this.renderer.containState(this.simulation.state, view.padding)) this.dirty = true;
    }

    resizeViewport() {
      this.dirty = true;
      if (!this.discoveryViewManaged || !this.activeDiscovery || !this.simulation) return;
      const entry = this.discoveryById.get(this.activeDiscovery);
      const view = entry && entry.view;
      if (!view || view.mode === 'initial') {
        this.renderer.focusState(this.simulation.state, view ? view.padding : 4);
      } else if (view.mode === 'trajectory' && this.simulation.generation <= view.steps) {
        this.focusTrajectoryView(view);
      } else if (view.mode === 'trajectory') {
        this.renderer.containState(this.simulation.state, view.padding);
      } else if (view.mode === 'contain' && this.automaticDiscoveryView) {
        this.renderer.containState(this.simulation.state, view.padding);
      }
    }

    async loadDiscovery(runAfterLoad = false) {
      const entry = this.discoveryById.get(this.elements.discoverySelect.value);
      if (!entry || this.busyState) return;
      try {
        this.setRunning(false);
        this.automaticDiscoveryView = false;
        this.discoveryViewManaged = false;
        this.activeDiscovery = entry.id;
        this.elements.tilingSelect.value = entry.tiling;
        this.syncTilingControls(false);
        const depthOption = [...this.elements.depthSelect.options]
          .find((option) => Number(option.value) === entry.depth);
        if (!depthOption) throw new Error(`The requested ${entry.tiling} patch size is unavailable`);
        this.elements.depthSelect.value = String(entry.depth);
        if (entry.penroseSeed) this.elements.penroseSeedSelect.value = entry.penroseSeed;
        this.elements.neighborhoodSelect.value = entry.neighborhood;
        this.elements.presetSelect.value = 'custom';
        this.elements.ruleInput.value = entry.rule;
        this.elements.generationsInput.value = entry.generations;
        this.elements.borderInput.value = entry.borderRings;
        if (entry.density !== undefined) this.elements.densityInput.value = String(entry.density);
        if (entry.randomSeed !== undefined) this.elements.seedInput.value = entry.randomSeed;
        if (entry.speed !== undefined) this.elements.speedInput.value = String(entry.speed);
        this.updateRangeLabels();
        this.updateNeighborhoodHelp();

        const built = await this.rebuildPatch({ randomize: false, fit: false, toast: false, resume: false });
        if (!built || !this.simulation || !this.patch) {
          this.activeDiscovery = null;
          return;
        }
        if (entry.randomize) {
          this.simulation.randomize(Number(this.elements.densityInput.value), this.elements.seedInput.value);
        } else {
          this.simulation.clear();
          const assignments = [];
          if (entry.coordinateStates) {
            const byCoordinate = this.coordinateMap();
            for (const [first, second, state] of entry.coordinateStates) {
              const cell = byCoordinate ? byCoordinate.get(`${first},${second}`) : undefined;
              if (cell === undefined) throw new Error(`Discovery ${entry.id} refers to absent coordinate ${first},${second}`);
              assignments.push([cell, state]);
            }
          }
          if (entry.cellStates) assignments.push(...entry.cellStates);
          for (const [cell, state] of assignments) {
            if (!Number.isInteger(cell) || cell < 0 || cell >= this.patch.tileCount) {
              throw new Error(`Discovery ${entry.id} refers to invalid cell ${cell}`);
            }
            if (this.simulation.isLocked(cell)) {
              throw new Error(`Discovery ${entry.id} refers to border-locked cell ${cell}`);
            }
            this.simulation.state[cell] = Math.max(
              0,
              Math.min(this.simulation.generations - 1, Math.trunc(state)),
            );
          }
          this.simulation.refreshDerivedState();
        }
        this.renderer.updateState(this.simulation.state);
        this.resetCycleDetector();
        this.applyDiscoveryView(entry);
        this.activeDiscovery = entry.id;
        this.updateStats(true);
        this.dirty = true;
        this.closeControls();
        if (runAfterLoad) this.setRunning(true);
        this.showToast(runAfterLoad ? `Loaded and running ${entry.title}` : `Loaded ${entry.title}`);
      } catch (error) {
        console.error(error);
        this.activeDiscovery = null;
        this.automaticDiscoveryView = false;
        this.discoveryViewManaged = false;
        this.updateDiscoveryDescription();
        this.showToast(`Could not load ${entry.title}: ${error.message || String(error)}`);
      }
    }

    updateStats(force = false) {
      const now = performance.now();
      if (!force && now - this.lastStats < 180) return;
      this.lastStats = now;
      if (!this.simulation || !this.patch) return;
      const alive = this.simulation.aliveCount();
      const percentage = this.patch.tileCount ? (alive / this.patch.tileCount) * 100 : 0;
      this.elements.tilingStat.textContent = this.patch.tilingLabel;
      this.elements.generationStat.textContent = numberFormat.format(this.simulation.generation);
      this.elements.aliveStat.textContent = `${numberFormat.format(alive)} (${percentage.toFixed(1)}%)`;
      this.elements.cellsStat.textContent = numberFormat.format(this.patch.tileCount);
      this.elements.degreeStat.textContent = `${this.simulation.graph.averageDegree.toFixed(2)} avg · ${this.simulation.graph.maxDegree} max`;
      this.elements.changedStat.textContent = numberFormat.format(this.simulation.lastChangedCount);
      if (this.detectedCycle) {
        this.elements.cycleStat.textContent = this.detectedCycle.period === 1
          ? `steady · from g${numberFormat.format(this.detectedCycle.firstGeneration)}`
          : `period ${numberFormat.format(this.detectedCycle.period)} · from g${numberFormat.format(this.detectedCycle.firstGeneration)}`;
      } else if (this.cycleWindowComplete) {
        this.elements.cycleStat.textContent = `none in last ${this.maxCycleHistory}`;
      } else {
        this.elements.cycleStat.textContent = '—';
      }
      this.elements.stepStat.textContent = this.simulation.generation
        ? `${this.simulation.smoothedStepMilliseconds.toFixed(3)} ms`
        : '—';
      this.elements.buildStat.textContent = `${this.patch.buildMilliseconds.toFixed(0)} ms`;
      if (this.patch.tiling === 'penrose') {
        this.elements.tileTypesStat.textContent = `${numberFormat.format(this.patch.typeCounts.thin)} thin · ${numberFormat.format(this.patch.typeCounts.thick)} thick`;
      } else if (this.patch.tiling === 'hat') {
        this.elements.tileTypesStat.textContent = `${numberFormat.format(this.patch.tileCount)} hats`;
      } else if (this.patch.tiling === 'square') {
        this.elements.tileTypesStat.textContent = `${numberFormat.format(this.patch.tileCount)} squares`;
      } else {
        this.elements.tileTypesStat.textContent = `${numberFormat.format(this.patch.tileCount)} hexagons`;
      }
    }

    frame(now) {
      const elapsed = Math.min(0.25, Math.max(0, (now - this.lastFrame) / 1000));
      this.lastFrame = now;
      if (this.running && this.simulation) {
        this.accumulator = Math.min(32, this.accumulator + elapsed * Number(this.elements.speedInput.value));
        let steps = Math.floor(this.accumulator);
        if (steps > 0) {
          this.accumulator -= steps;
          while (steps-- > 0) {
            this.simulation.step();
            this.observeCycle();
          }
          this.renderer.updateState(this.simulation.state);
          this.updateManagedDiscoveryView();
          this.dirty = true;
          this.updateStats(false);
        }
      }

      if (this.dirty) {
        this.renderer.render(
          this.elements.gridCheckbox.checked,
          this.simulation ? this.simulation.generations : 2,
          this.elements.typeCheckbox.checked,
        );
        this.dirty = false;
      }
      requestAnimationFrame((time) => this.frame(time));
    }

    savePNG() {
      if (!this.patch) return;
      this.renderer.render(
        this.elements.gridCheckbox.checked,
        this.simulation.generations,
        this.elements.typeCheckbox.checked,
      );
      this.canvas.toBlob((blob) => {
        if (!blob) {
          this.showToast('The browser could not create the PNG.');
          return;
        }
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aperiodic-life-${this.patch.tiling}-g${this.simulation.generation}.png`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }, 'image/png');
    }

    syncSimulationControls() {
      const e = this.elements;
      e.tilingSelect.value = this.patch.tiling;
      this.syncTilingControls(false);
      e.depthSelect.value = String(this.patch.depth);
      if (this.patch.tiling === 'penrose') e.penroseSeedSelect.value = this.patch.seed;
      e.neighborhoodSelect.value = this.simulation.graph === this.patch.touchGraph ? 'touch' : 'edge';
      e.presetSelect.value = 'custom';
      e.ruleInput.value = this.simulation.rule.text;
      e.generationsInput.value = String(this.simulation.generations);
      e.borderInput.value = String(this.simulation.borderRings);
      this.applyRule(false, false);
      this.updateNeighborhoodHelp();
    }

    createSnapshot() {
      if (!this.patch || !this.simulation) throw new Error('Build a patch before saving a state.');
      const e = this.elements;
      const cellStates = [];
      for (let cell = 0; cell < this.simulation.state.length; cell++) {
        if (this.simulation.state[cell]) cellStates.push([cell, this.simulation.state[cell]]);
      }
      return {
        format: 'aperiodic-life-state', version: 1,
        tiling: this.patch.tiling, patchDepth: this.patch.depth,
        penroseSeed: this.patch.tiling === 'penrose' ? this.patch.seed : null,
        tileCount: this.patch.tileCount,
        neighborhood: this.simulation.graph === this.patch.touchGraph ? 'touch' : 'edge',
        graphFingerprint: graphFingerprint(this.patch, this.simulation.graph),
        rule: this.simulation.rule.text, generations: this.simulation.generations,
        deadBorderRings: this.simulation.borderRings, generation: this.simulation.generation,
        cellStates, view: { ...this.renderer.camera },
        stepsPerSecond: Number(e.speedInput.value), palette: e.paletteSelect.value,
        drawGrid: e.gridCheckbox.checked, showTileTypes: e.typeCheckbox.checked,
      };
    }

    snapshotMessage(message, error = false) {
      this.elements.snapshotStatus.textContent = message;
      this.elements.snapshotStatus.classList.toggle('error', error);
    }

    saveSnapshot() {
      if (this.busyState || !this.simulation) return;
      try {
        const snapshot = this.createSnapshot();
        const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' });
        if (blob.size > MAX_SNAPSHOT_BYTES) throw new Error('State files are limited to 8 MiB.');
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `aperiodic-life-${snapshot.tiling}-g${snapshot.generation}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.snapshotMessage(`Saved generation ${numberFormat.format(snapshot.generation)} with ${numberFormat.format(snapshot.cellStates.length)} nonzero cells.`);
      } catch (error) {
        this.snapshotMessage(`Could not save state: ${error.message || String(error)}`, true);
      }
    }

    async loadSnapshotFile() {
      const input = this.elements.snapshotFileInput;
      const file = input.files && input.files[0];
      input.value = '';
      if (!file || this.busyState) return;
      try {
        if (file.size > MAX_SNAPSHOT_BYTES) throw new Error('State files are limited to 8 MiB.');
        const data = JSON.parse(await file.text());
        await this.restoreSnapshot(data);
      } catch (error) {
        this.snapshotMessage(`Could not load state: ${error.message || String(error)}`, true);
      }
    }

    async restoreSnapshot(data) {
      if (this.busyState) return false;
      // Validate before pausing or touching the current experiment. Rebuild and
      // border checks below also happen on separate objects before committing.
      validateSnapshot(data);
      const wasRunning = this.running;
      const requestId = ++this.rebuildRequestId;
      this.setRunning(false);
      this.setBusy(true, 'Loading saved state', 'Checking tiling, contact graph, and cell states…');
      let loaded = false;
      try {
        await this.nextPaint();
        if (requestId !== this.rebuildRequestId) return false;
        const { patch, simulation } = prepareSnapshot(data);
        const picking = new Core.PickingIndex(patch, patch.pickingCellSize || 2);
        this.renderer.setPatch(patch, simulation.state);
        this.finishPointer();
        this.patch = patch;
        this.simulation = simulation;
        this.picking = picking;
        this.clearActiveDiscovery();
        this.syncSimulationControls();
        const e = this.elements;
        e.speedInput.value = String(data.stepsPerSecond);
        e.paletteSelect.value = data.palette;
        e.gridCheckbox.checked = data.drawGrid;
        e.typeCheckbox.checked = data.showTileTypes;
        this.renderer.setPalette(data.palette);
        this.renderer.camera = { x: data.view.x, y: data.view.y, zoom: data.view.zoom };
        this.updateRangeLabels();
        this.resetCycleDetector();
        this.updateStats(true);
        this.dirty = true;
        loaded = true;
        this.closeControls();
        this.snapshotMessage(`Loaded generation ${numberFormat.format(data.generation)} with ${numberFormat.format(data.cellStates.length)} nonzero cells; paused.`);
        this.showToast('Saved state restored; paused.');
        return true;
      } finally {
        if (requestId === this.rebuildRequestId) {
          this.setBusy(false);
          this.resumeAfterRebuild = false;
          if (!loaded && wasRunning) this.setRunning(true);
        }
      }
    }

    async copyConfig() {
      const activeNeighborhood = this.patch && this.simulation
        ? this.simulation.graph === this.patch.touchGraph ? 'touch' : 'edge'
        : this.elements.neighborhoodSelect.value;
      const config = {
        version: 3,
        tiling: this.patch ? this.patch.tiling : this.elements.tilingSelect.value,
        patchDepth: this.patch ? this.patch.depth : Number(this.elements.depthSelect.value),
        penroseSeed: this.patch && this.patch.tiling === 'penrose'
          ? this.patch.seed
          : this.elements.penroseSeedSelect.value,
        neighborhood: activeNeighborhood,
        rule: this.simulation ? this.simulation.rule.text : this.elements.ruleInput.value,
        generations: this.simulation ? this.simulation.generations : Number(this.elements.generationsInput.value),
        deadBorderRings: this.simulation ? this.simulation.borderRings : Number(this.elements.borderInput.value),
        density: Number(this.elements.densityInput.value),
        seed: this.elements.seedInput.value,
        stepsPerSecond: Number(this.elements.speedInput.value),
        palette: this.elements.paletteSelect.value,
        drawGrid: this.elements.gridCheckbox.checked,
        showTileTypes: this.elements.typeCheckbox.checked,
      };
      if (this.activeDiscovery) config.discovery = this.activeDiscovery;
      const text = JSON.stringify(config, null, 2);
      try {
        await navigator.clipboard.writeText(text);
        this.showToast('Configuration copied to the clipboard.');
      } catch (_) {
        window.prompt('Copy this configuration:', text);
      }
    }

    showToast(message) {
      clearTimeout(this.toastTimer);
      this.toast.textContent = message;
      this.toast.hidden = false;
      this.toastTimer = setTimeout(() => { this.toast.hidden = true; }, 2600);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    try {
      new AperiodicLifeApp();
    } catch (error) {
      console.error(error);
      const busy = document.getElementById('busy');
      busy.hidden = false;
      document.getElementById('busyTitle').textContent = 'Unable to start';
      document.getElementById('busyDetail').textContent = error.message || String(error);
    }
  });
})();
