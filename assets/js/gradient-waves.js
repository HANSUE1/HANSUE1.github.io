const GradientWaves = (() => {
  const vertexShaderSource = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const fragmentShaderSource = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec2 uMouse;
uniform float uParallax;
uniform float uEnableMouse;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
out vec4 fragColor;

const float MAX_DIST = 20000.0;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x;
  mx += uSwell * sin((r.y + mx) / 20.0 + tc.y);
  float my = r.y - tc.z;
  my += uTurbulence * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight);
}

float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.1) break;
    dist += 0.9 * dscene;
    if (!(abs(dist) < MAX_DIST)) return MAX_DIST;
  }
  return dist;
}

void main() {
  float T = iTime * uSpeed;
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = vec4(T / 0.130, T / 0.810, T / 0.200, T / 0.710);
  float c, s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, 30.0);
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
  uv.x *= iResolution.x / iResolution.y;
  uv.y *= -1.0;

  vec3 dir = vec3(0.0, 0.0, -1.0);
  float ulen = length(uv);
  float xrot = vfov * ulen;
  c = cos(xrot); s = sin(xrot);
  dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
  c = nuv.x; s = nuv.y;
  dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;
  c = cos(uTilt); s = sin(uTilt);
  dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

  if (uEnableMouse > 0.5) {
    float yaw = (uMouse.x - 0.5) * uParallax * 0.4;
    float pitch = (uMouse.y - 0.5) * uParallax * 0.4;
    c = cos(yaw); s = sin(yaw);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
    c = cos(pitch); s = sin(pitch);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  }

  float dist = raymarch(cam, dir, freq, tc);
  vec3 pos = cam + dist * dir;

  float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
  vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
  vec3 col = mix(uHorizonColor, body, t);
  col *= uBrightness;
  col = clamp(col, 0.0, 1.0);

  float alpha = clamp(t, 0.0, 1.0) * uOpacity;
  if (uGrain > 0.5) {
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  fragColor = vec4(col * alpha, alpha);
}
`;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [1, 1, 1];
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ];
  }

  const defaults = {
    horizonColor: '#5227FF',
    waveColor: '#FF9FFC',
    crestColor: '#FFFFFF',
    speed: 0.4,
    amplitude: 2.5,
    waveScale: 0.6,
    waveRatio: 0.9,
    swell: 35,
    turbulence: 20,
    tilt: 1.11,
    zoom: 1.0,
    height: 5.5,
    fogDepth: 15,
    detail: 'medium',
    brightness: 1.0,
    opacity: 1.0,
    mouseInteraction: true,
    parallaxStrength: 0.5,
    grain: true,
    grainIntensity: 0.05
  };

  const detailToSteps = detail => {
    if (detail === 'low') return 40.0;
    if (detail === 'high') return 110.0;
    return 70.0;
  };

  let canvas = null;
  let gl = null;
  let program = null;
  let animationId = null;
  let startTime = 0;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let targetMouseX = 0.5;
  let targetMouseY = 0.5;
  let isVisible = true;
  let isPageVisible = true;
  let resizeObserver = null;
  let intersectionObserver = null;
  let mouseTimeout = null;
  let currentParams = { ...defaults };

  function init() {
    canvas = document.getElementById('gradient-waves-canvas');
    if (!canvas) {
      console.warn('GradientWaves: canvas not found');
      return;
    }

    console.log('GradientWaves: initializing');
    console.log('GradientWaves: canvas dimensions', canvas.offsetWidth, 'x', canvas.offsetHeight);

    gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      console.warn('GradientWaves: WebGL 2 not supported, falling back to CSS');
      canvas.style.background = 'radial-gradient(ellipse at center, #1a103c 0%, #0a0a0f 100%)';
      return;
    }

    console.log('GradientWaves: WebGL 2 context acquired');

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      console.warn('GradientWaves: shader compilation failed');
      return;
    }

    program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      console.warn('GradientWaves: program linking failed');
      canvas.style.background = 'radial-gradient(ellipse at center, #1a103c 0%, #0a0a0f 100%)';
      return;
    }

    console.log('GradientWaves: shaders compiled and linked');
    
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('GradientWaves: WebGL context lost');
      cancelAnimationFrame(animationId);
      animationId = null;
    }, false);
    
    canvas.addEventListener('webglcontextrestored', () => {
      console.log('GradientWaves: WebGL context restored');
      if (program) {
        gl.deleteProgram(program);
        program = null;
      }
      init();
    }, false);

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    startTime = performance.now();
    resize();
    console.log('GradientWaves: canvas size', canvas.width, 'x', canvas.height);
    setupObservers();
    setupMouseTracking();
    render();
    console.log('GradientWaves: initialized');
  }

  function resize() {
    if (!canvas || !gl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    console.log('GradientWaves: resize', width, 'x', height, 'dpr', dpr);

    const targetWidth = Math.max(1, Math.floor(width * dpr));
    const targetHeight = Math.max(1, Math.floor(height * dpr));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      console.log('GradientWaves: canvas resized to', canvas.width, 'x', canvas.height);
    }
  }

  function setupObservers() {
    if (resizeObserver) resizeObserver.disconnect();
    if (intersectionObserver) intersectionObserver.disconnect();

    resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(canvas);

    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animationId) {
          render();
        }
      });
    }, { threshold: 0.0 });

    intersectionObserver.observe(canvas);
  }

  function setupMouseTracking() {
    if (mouseTimeout) clearTimeout(mouseTimeout);

    const onPointerMove = (e) => {
      if (!canvas || !gl) return;

      const rect = canvas.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left) / rect.width;
      targetMouseY = 1.0 - (e.clientY - rect.top) / rect.height;

      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        targetMouseX = 0.5;
        targetMouseY = 0.5;
      }, 1000);
    };

    const onPointerLeave = () => {
      targetMouseX = 0.5;
      targetMouseY = 0.5;
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
  }

  function render() {
    if (!isVisible || !gl || !program) {
      animationId = null;
      return;
    }

    gl.useProgram(program);

    const p = currentParams;

    const resolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const timeLocation = gl.getUniformLocation(program, 'iTime');
    const speedLocation = gl.getUniformLocation(program, 'uSpeed');
    const amplitudeLocation = gl.getUniformLocation(program, 'uAmplitude');
    const waveScaleLocation = gl.getUniformLocation(program, 'uWaveScale');
    const waveRatioLocation = gl.getUniformLocation(program, 'uWaveRatio');
    const swellLocation = gl.getUniformLocation(program, 'uSwell');
    const turbulenceLocation = gl.getUniformLocation(program, 'uTurbulence');
    const tiltLocation = gl.getUniformLocation(program, 'uTilt');
    const zoomLocation = gl.getUniformLocation(program, 'uZoom');
    const heightLocation = gl.getUniformLocation(program, 'uHeight');
    const fogDepthLocation = gl.getUniformLocation(program, 'uFogDepth');
    const stepsLocation = gl.getUniformLocation(program, 'uSteps');
    const brightnessLocation = gl.getUniformLocation(program, 'uBrightness');
    const opacityLocation = gl.getUniformLocation(program, 'uOpacity');
    const grainLocation = gl.getUniformLocation(program, 'uGrain');
    const grainIntensityLocation = gl.getUniformLocation(program, 'uGrainIntensity');
    const mouseLocation = gl.getUniformLocation(program, 'uMouse');
    const parallaxLocation = gl.getUniformLocation(program, 'uParallax');
    const enableMouseLocation = gl.getUniformLocation(program, 'uEnableMouse');
    const horizonColorLocation = gl.getUniformLocation(program, 'uHorizonColor');
    const waveColorLocation = gl.getUniformLocation(program, 'uWaveColor');
    const crestColorLocation = gl.getUniformLocation(program, 'uCrestColor');

    const horizonRgb = hexToRgb(p.horizonColor);
    const waveRgb = hexToRgb(p.waveColor);
    const crestRgb = hexToRgb(p.crestColor);

    mouseX += 0.05 * (targetMouseX - mouseX);
    mouseY += 0.05 * (targetMouseY - mouseY);

    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, (performance.now() - startTime) * 0.001);
    gl.uniform1f(speedLocation, p.speed);
    gl.uniform1f(amplitudeLocation, p.amplitude);
    gl.uniform1f(waveScaleLocation, p.waveScale);
    gl.uniform1f(waveRatioLocation, p.waveRatio);
    gl.uniform1f(swellLocation, p.swell);
    gl.uniform1f(turbulenceLocation, p.turbulence);
    gl.uniform1f(tiltLocation, p.tilt);
    gl.uniform1f(zoomLocation, p.zoom);
    gl.uniform1f(heightLocation, p.height);
    gl.uniform1f(fogDepthLocation, p.fogDepth);
    gl.uniform1f(stepsLocation, detailToSteps(p.detail));
    gl.uniform1f(brightnessLocation, p.brightness);
    gl.uniform1f(opacityLocation, p.opacity);
    gl.uniform1f(grainLocation, p.grain ? 1.0 : 0.0);
    gl.uniform1f(grainIntensityLocation, p.grainIntensity);
    gl.uniform2f(mouseLocation, mouseX, mouseY);
    gl.uniform1f(parallaxLocation, p.parallaxStrength);
    gl.uniform1f(enableMouseLocation, p.mouseInteraction ? 1.0 : 0.0);
    gl.uniform3f(horizonColorLocation, horizonRgb[0], horizonRgb[1], horizonRgb[2]);
    gl.uniform3f(waveColorLocation, waveRgb[0], waveRgb[1], waveRgb[2]);
    gl.uniform3f(crestColorLocation, crestRgb[0], crestRgb[1], crestRgb[2]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationId = requestAnimationFrame(render);
  }

  function destroy() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    if (mouseTimeout) clearTimeout(mouseTimeout);

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (intersectionObserver) {
      intersectionObserver.disconnect();
      intersectionObserver = null;
    }

    if (gl && program) {
      gl.deleteProgram(program);
      program = null;
    }

    if (canvas) {
      canvas.remove();
      canvas = null;
    }

    gl = null;
  }

  function setParams(params) {
    currentParams = { ...currentParams, ...params };
  }

  return {
    init,
    destroy,
    setParams
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GradientWaves.init());
} else {
  GradientWaves.init();
}