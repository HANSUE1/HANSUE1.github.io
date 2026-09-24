const GradientWaves = (() => {
  const vertexShaderSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision highp float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec3 u_color_a;
    uniform vec3 u_color_b;
    uniform vec3 u_color_c;
    uniform float u_mouse_x;
    uniform float u_mouse_y;
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;
      
      float t = u_time * 0.4;
      
      float wave1 = sin(p.x * 1.5 + t + sin(p.y * 1.2 + t * 0.7)) * 0.5 + 0.5;
      float wave2 = sin(p.y * 1.8 - t * 0.8 + sin(p.x * 1.4 - t * 0.6)) * 0.5 + 0.5;
      float wave3 = sin((p.x + p.y) * 1.2 + t * 0.5 + sin(length(p) * 2.0 - t)) * 0.5 + 0.5;
      
      float mouseInfluence = 0.0;
      if (u_mouse_x > -1.0 && u_mouse_y > -1.0) {
        vec2 mouse = vec2(u_mouse_x, u_mouse_y);
        float dist = length(p - mouse);
        mouseInfluence = smoothstep(1.5, 0.0, dist) * 0.15;
      }
      
      float blend = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2 + mouseInfluence;
      blend = clamp(blend, 0.0, 1.0);
      
      vec3 color = mix(u_color_a, u_color_b, blend);
      color = mix(color, u_color_c, wave3 * 0.3);
      
      float vignette = 1.0 - smoothstep(0.5, 1.5, length(p * 0.5));
      color *= vignette * 0.3 + 0.7;
      
      gl_FragColor = vec4(color, 1.0);
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
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }

  let canvas = null;
  let gl = null;
  let program = null;
  let animationId = null;
  let startTime = Date.now();
  let mouseX = -1;
  let mouseY = -1;
  let isVisible = true;
  let resizeObserver = null;
  let intersectionObserver = null;

  const themes = {
    light: {
      color_a: '#e0e7ff',
      color_b: '#f0f9ff',
      color_c: '#fdf4ff'
    },
    dark: {
      color_a: '#0f172a',
      color_b: '#1e293b',
      color_c: '#0c0a1d'
    }
  };

  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return themes[isDark ? 'dark' : 'light'];
  }

  function init() {
    canvas = document.getElementById('gradient-waves-canvas');
    if (!canvas) return;

    gl = canvas.getContext('webgl', { 
      alpha: false, 
      antialias: false,
      powerPreference: 'high-performance'
    });
    
    if (!gl) {
      console.warn('WebGL not supported, falling back to CSS background');
      canvas.style.display = 'none';
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;
    
    program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

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

    resize();
    setupObservers();
    setupMouseTracking();
    render();
  }

  function resize() {
    if (!canvas || !gl) return;
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
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
    let mouseTimeout;
    
    document.addEventListener('mousemove', (e) => {
      if (!canvas || !gl) return;
      
      const rect = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        mouseX = -1;
        mouseY = -1;
      }, 1000);
    });

    document.addEventListener('mouseleave', () => {
      mouseX = -1;
      mouseY = -1;
    });
  }

  function render() {
    if (!isVisible || !gl || !program) {
      animationId = null;
      return;
    }

    gl.useProgram(program);

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const colorALocation = gl.getUniformLocation(program, 'u_color_a');
    const colorBLocation = gl.getUniformLocation(program, 'u_color_b');
    const colorCLocation = gl.getUniformLocation(program, 'u_color_c');
    const mouseXLocation = gl.getUniformLocation(program, 'u_mouse_x');
    const mouseYLocation = gl.getUniformLocation(program, 'u_mouse_y');

    const colors = getThemeColors();
    const colorA = hexToRgb(colors.color_a);
    const colorB = hexToRgb(colors.color_b);
    const colorC = hexToRgb(colors.color_c);

    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, (Date.now() - startTime) / 1000.0);
    gl.uniform3f(colorALocation, colorA.r, colorA.g, colorA.b);
    gl.uniform3f(colorBLocation, colorB.r, colorB.g, colorB.b);
    gl.uniform3f(colorCLocation, colorC.r, colorC.g, colorC.b);
    gl.uniform1f(mouseXLocation, mouseX);
    gl.uniform1f(mouseYLocation, mouseY);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationId = requestAnimationFrame(render);
  }

  function destroy() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    
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

  function updateTheme() {
    if (!gl || !program) return;
    render();
  }

  return {
    init,
    destroy,
    updateTheme
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GradientWaves.init());
} else {
  GradientWaves.init();
}