// Vanilla port of <GlassFolder /> (glass-folder-cards.tsx). Everything above `window.GlassFolder` is the original
// source with its TypeScript types removed: the art presets, the noise/liquid art generator, the shared paint queue
// and the folder geometry. `window.GlassFolder` replaces the React component: it builds the folder inside an
// existing element. Usage: GlassFolder(rootElement, { label, files, art, tone, action, menu, ... }), with the same
// options as the React props, plus `width: 'fit'` (fill the parent, up to 340px). Returns { open, close, toggle, addFile }.
//
// A folder you can use, drawn as an object: a back panel holding generated artwork, the files it contains, and a
// frosted front panel. Hover leans the glass toward you, click opens it and fans the files out, `+` drops a new file
// in, `···` opens a keyboard-driven menu.
(() => {
  // #region art
  const ART_PRESETS = {
    // a long exposure: blush, oxblood and steel pulled across the frame
    aurora: { style: 'streak', colors: ['#f4efe9', '#e9c2b8', '#c2433f', '#2a1e2a', '#22395e', '#6f97c2', '#e5edf4'], scale: 0.7, warp: 1.4, angle: -0.62, gloss: 0.18, veins: 0 },
    // red ink folding through teal-black water
    ember: { style: 'marble', colors: ['#07090c', '#16252c', '#3d5f68', '#1a1416', '#a3201a', '#ef4a2b', '#ff8a5c'], scale: 0.62, warp: 3.2, angle: -0.5, gloss: 0.55, veins: 0.6 },
    // plum and rust, swirled
    dusk: { style: 'marble', colors: ['#120c18', '#3e2850', '#8f6c9c', '#2b1a24', '#b3502f', '#eab08a', '#fbe7d2'], scale: 0.75, warp: 3.6, angle: 0.8, gloss: 0.5, veins: 0.5 },
    // cold, pale, nearly white
    glacier: { style: 'streak', colors: ['#f7f8fa', '#d9e2ea', '#9fb4c7', '#e8edf2', '#bccbd8', '#ffffff'], scale: 0.7, warp: 1.6, angle: 0.35, gloss: 0.25, veins: 0 },
    // moss and brass
    verdant: { style: 'marble', colors: ['#070b08', '#173024', '#4f7a5a', '#141812', '#a7843a', '#e9cf87', '#fbf3d6'], scale: 0.7, warp: 3.4, angle: 2.1, gloss: 0.5, veins: 0.5 }
  };

  /** `#rgb` or `#rrggbb` to a triple. Anything unreadable comes back mid-grey. */
  const hexToRgb = hex => {
    let h = hex.trim().replace(/^#/, '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = /^[0-9a-f]{6}$/i.test(h) ? parseInt(h, 16) : 0x808080;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  /** A small, fast, seedable PRNG (mulberry32). */
  const rng = seed => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /** A stable small integer for a string, so a file's art follows its name. */
  const hashString = s => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };

  /** Seeded gradient noise, summed into fractal octaves with a rotation between each. */
  const makeFbm = seed => {
    const r = rng(seed);
    const perm = new Uint8Array(512);
    const grad = new Float32Array(512);
    const p = [];
    for (let i = 0; i < 256; i++) p.push(i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = p[i];
      p[i] = p[j];
      p[j] = t;
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    for (let i = 0; i < 256; i++) {
      const a = r() * Math.PI * 2;
      grad[i * 2] = Math.cos(a);
      grad[i * 2 + 1] = Math.sin(a);
    }
    const noise = (x, y) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const xf = x - xi;
      const yf = y - yi;
      const X = xi & 255;
      const Y = yi & 255;
      const h00 = perm[X + perm[Y]] * 2;
      const h10 = perm[X + 1 + perm[Y]] * 2;
      const h01 = perm[X + perm[Y + 1]] * 2;
      const h11 = perm[X + 1 + perm[Y + 1]] * 2;
      const d00 = grad[h00] * xf + grad[h00 + 1] * yf;
      const d10 = grad[h10] * (xf - 1) + grad[h10 + 1] * yf;
      const d01 = grad[h01] * xf + grad[h01 + 1] * (yf - 1);
      const d11 = grad[h11] * (xf - 1) + grad[h11 + 1] * (yf - 1);
      const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
      const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
      return d00 + u * (d10 - d00) + v * (d01 - d00 + u * (d11 - d01 - d10 + d00));
    };
    return (x, y, octaves) => {
      let sum = 0;
      let amp = 0.5;
      for (let i = 0; i < octaves; i++) {
        sum += amp * noise(x, y);
        const nx = 1.6 * x + 1.2 * y + 7.1;
        y = -1.2 * x + 1.6 * y + 3.3;
        x = nx;
        amp *= 0.5;
      }
      return sum;
    };
  };

  /**
   * The artwork, as a job that can be spread over several frames.
   *
   * A field is domain-warped twice (each fold feeding the next), then normalised by its own percentiles so every
   * seed spans the whole palette. The field is then treated as the height of a liquid surface: its slope gives a
   * normal, the normal gives diffuse light and a tight specular, and fine striations run along the contours like
   * combed ink. `streak` squeezes the coordinates along one axis first, which turns the same folds into a
   * long-exposure smear.
   */
  const createArtJob = (width, height, recipe, seed) => {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const colors = recipe.colors.length >= 2 ? recipe.colors : ['#111111', '#eeeeee'];
    const stops = colors.map((c, i) => ({ t: i / (colors.length - 1), c: hexToRgb(c) }));
    const scale = recipe.scale ?? 0.7;
    const warp = recipe.warp ?? 3;
    const gloss = recipe.gloss ?? 0.4;
    const veins = recipe.veins ?? 0;
    const streak = recipe.style === 'streak';
    const fbm = makeFbm(seed * 977 + 13);
    const r = rng(seed + 1);
    const ox = r() * 50;
    const oy = r() * 50;
    const angle = (recipe.angle ?? 0) + (r() - 0.5) * 0.5;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const m = Math.min(w, h);
    // The field is sampled on a half-resolution grid (with a one-cell apron) and brought up with Catmull-Rom,
    // which keeps the slope continuous for the lighting: a quarter of the noise for no visible loss.
    const gw = Math.ceil(w / 2) + 3;
    const gh = Math.ceil(h / 2) + 3;
    const G = new Float32Array(gw * gh);
    const GQ = new Float32Array(gw * gh);
    const F = new Float32Array(w * h);
    const Q = new Float32Array(w * h);
    const pixels = new Uint8ClampedArray(w * h * 4);
    let row = 0;

    const field = gy => {
      for (let gx = 0; gx < gw; gx++) {
        const u = ((gx - 1) * 2 - w / 2) / m;
        const v = ((gy - 1) * 2 - h / 2) / m;
        let px = (u * ca - v * sa) * scale;
        let py = (u * sa + v * ca) * scale;
        if (streak) {
          px *= 0.14;
          py *= 2.2;
        }
        px += ox;
        py += oy;
        const qx = fbm(px, py, 3);
        const qy = fbm(px + 5.2, py + 1.3, 3);
        const rx = fbm(px + warp * qx + 1.7, py + warp * qy + 9.2, 3);
        const ry = fbm(px + warp * qx + 8.3, py + warp * qy + 2.8, 3);
        G[gy * gw + gx] = fbm(px + warp * rx, py + warp * ry, 4);
        GQ[gy * gw + gx] = Math.sqrt(qx * qx + qy * qy);
      }
    };

    const upsample = () => {
      // pixel x sits on grid column x/2 + 1: either exactly on a sample, or halfway
      const cr = (a, b, c, d) => (-a + 9 * b + 9 * c - d) / 16;
      const T = new Float32Array(w * gh);
      for (let gy = 0; gy < gh; gy++) {
        const r = gy * gw;
        for (let x = 0; x < w; x++) {
          const c = (x >> 1) + 1;
          T[gy * w + x] = x & 1 ? cr(G[r + c - 1], G[r + c], G[r + c + 1], G[r + c + 2]) : G[r + c];
        }
      }
      for (let y = 0; y < h; y++) {
        const c = (y >> 1) + 1;
        for (let x = 0; x < w; x++) {
          F[y * w + x] = y & 1 ? cr(T[(c - 1) * w + x], T[c * w + x], T[(c + 1) * w + x], T[(c + 2) * w + x]) : T[c * w + x];
          const gx = (x >> 1) + 1;
          const q0 = GQ[c * gw + gx];
          const qx = x & 1 ? (q0 + GQ[c * gw + gx + 1]) / 2 : q0;
          const q1 = y & 1 ? (x & 1 ? (GQ[(c + 1) * gw + gx] + GQ[(c + 1) * gw + gx + 1]) / 2 : GQ[(c + 1) * gw + gx]) : qx;
          Q[y * w + x] = (qx + q1) / 2;
        }
      }
    };

    const colorize = () => {
      // percentiles from a sample, not a full sort: cheap and just as stable
      const sample = [];
      const stride = Math.max(1, Math.floor(F.length / 4096));
      for (let i = 0; i < F.length; i += stride) sample.push(F[i]);
      sample.sort((a, b) => a - b);
      const lo = sample[Math.floor(sample.length * 0.02)];
      const hi = sample[Math.floor(sample.length * 0.98)];
      const k = 1 / (hi - lo || 1);
      const lx = -0.55;
      const ly = -0.65;
      const lz = 0.52;
      const slope = k * m * 0.012;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          let t = (F[i] - lo) * k;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          let j = 1;
          while (j < stops.length - 1 && stops[j].t < t) j++;
          const a = stops[j - 1];
          const b = stops[j];
          let f = (t - a.t) / (b.t - a.t || 1);
          f = f < 0 ? 0 : f > 1 ? 1 : f;
          f = f * f * (3 - 2 * f);
          const gx = (F[x < w - 1 ? i + 1 : i] - F[x > 0 ? i - 1 : i]) * slope;
          const gy = (F[y < h - 1 ? i + w : i] - F[y > 0 ? i - w : i]) * slope;
          const nd = (-gx * lx - gy * ly + lz) / Math.sqrt(gx * gx + gy * gy + 1);
          const spec = Math.pow(nd > 0 ? nd : 0, 24) * gloss * 255;
          const silk = 1 + 0.035 * Math.sin(t * 150 + Q[i] * 24);
          const vein = veins * Math.max(0, 1 - Math.abs(Q[i] - 0.42) * 14) * 0.6;
          const lit = (0.82 + 0.28 * nd) * silk * (1 - vein);
          pixels[i * 4] = (a.c[0] + (b.c[0] - a.c[0]) * f) * lit + spec;
          pixels[i * 4 + 1] = (a.c[1] + (b.c[1] - a.c[1]) * f) * lit + spec;
          pixels[i * 4 + 2] = (a.c[2] + (b.c[2] - a.c[2]) * f) * lit + spec;
          pixels[i * 4 + 3] = 255;
        }
      }
    };

    const step = rows => {
      if (row >= gh) return true;
      const end = Math.min(gh, row + Math.max(1, rows));
      while (row < end) field(row++);
      if (row < gh) return false;
      upsample();
      colorize();
      return true;
    };

    return { width: w, height: h, pixels, step };
  };

  /** Where a file sits in the fan: -1 … 1 across the visible stack, 0 for one file. */
  const fanSlot = (index, count) => (count <= 1 ? 0 : (index / (count - 1)) * 2 - 1);
  // #endregion

  const recipeOf = art => (typeof art === 'string' ? ART_PRESETS[art] : art);

  // One shared painter: every folder on the page queues its art here and the queue spends a few milliseconds a
  // frame, so a row of folders never janks.
  const artCache = new Map();
  const queue = [];
  let pumping = false;

  const pump = () => {
    if (pumping) return;
    pumping = true;
    const tick = () => {
      const until = performance.now() + 7;
      while (queue.length && performance.now() < until) {
        const head = queue[0];
        if (head.job.step(4)) {
          queue.shift();
          const c = document.createElement('canvas');
          c.width = head.job.width;
          c.height = head.job.height;
          c.getContext('2d')?.putImageData(new ImageData(head.job.pixels, c.width, c.height), 0, 0);
          head.done(c);
        }
      }
      if (queue.length) requestAnimationFrame(tick);
      else pumping = false;
    };
    requestAnimationFrame(tick);
  };

  /** Lower priority paints first: back panels (0) before the files tucked behind glass (1). */
  const paint = (recipe, seed, w, h, priority) => {
    const key = JSON.stringify([recipe, seed, w, h]);
    let p = artCache.get(key);
    if (!p) {
      p = new Promise(done => {
        // never jump the job already in progress
        let at = queue.length;
        while (at > 1 && queue[at - 1].priority > priority) at--;
        queue.splice(at, 0, { job: createArtJob(w, h, recipe, seed), priority, done });
        pump();
      });
      artCache.set(key, p);
    }
    return p;
  };

  // React's <ArtCanvas />: a canvas that fades in once its art has been painted.
  const artCanvas = ({ art, seed, w, h, density, priority, className }) => {
    const canvas = document.createElement('canvas');
    canvas.className = className;
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, { width: `${w}px`, height: `${h}px`, maxWidth: 'none' });
    paint(recipeOf(art), seed, Math.round(w * density), Math.round(h * density), priority).then(src => {
      canvas.width = src.width;
      canvas.height = src.height;
      canvas.getContext('2d')?.drawImage(src, 0, 0);
      canvas.dataset.ready = '';
    });
    return canvas;
  };

  // Geometry, in the folder's own units. The stage is drawn at 340 × 272 and scaled to `width`, so the shapes can
  // be fixed paths.
  const W = 340;
  const H = 272;
  const HEADROOM = 54; // room above the back panel for the files to rise into
  const FRONT_TOP = 74;
  const FRONT_H = H - FRONT_TOP;
  const SHEET_W = 272;
  const SHEET_H = 184;

  const BACK_PATH =
    'M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z';
  const FRONT_PATH =
    `M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 ${FRONT_H - 22}` +
    `A22 22 0 0 1 318 ${FRONT_H}L22 ${FRONT_H}A22 22 0 0 1 0 ${FRONT_H - 22}Z`;

  const MAX_VISIBLE = 4;

  const SAMPLE_FILES = [
    { name: 'Cover — final', meta: 'PNG · 4.8 MB', art: 'ember' },
    { name: 'Moodboard', meta: '24 images', art: 'dusk' },
    { name: 'Brief.pdf', meta: 'PDF · 1.2 MB' }
  ];

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let instances = 0;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  // Restarts a CSS animation, which React does by remounting the element under a new key.
  const replay = (node, className) => {
    if (className) node.classList.remove(className);
    else node.style.animation = 'none';
    void node.offsetWidth;
    if (className) node.classList.add(className);
    else node.style.animation = '';
  };

  window.GlassFolder = (root, {
    label = 'My Files',
    meta,
    tone = 'light',
    art = 'aurora',
    seed = 3,
    image,
    files: initialFiles = SAMPLE_FILES,
    action = 'add',
    onAdd,
    onFilesChange,
    menu = [],
    labelPlacement = 'bottom-left',
    open: initialOpen,
    defaultOpen = false,
    onOpenChange,
    onFileSelect,
    width = 340,
    appear = true,
    appearDelay = 0
  } = {}) => {
    const uid = ++instances;
    const fit = width === 'fit';
    const widthNow = () => (fit ? Math.min(W, root.parentElement?.clientWidth || W) : width);
    let k = widthNow() / W;
    const density = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1)) * k;

    let files = [...initialFiles];
    // ids survive re-renders so a newly added file is the only one that animates in
    let ids = files.map((_, i) => i);
    let nextId = files.length;
    let open = initialOpen ?? defaultOpen;
    let menuOpen = false;

    // ---- markup --------------------------------------------------------------
    root.classList.add('gf-root');
    root.dataset.tone = tone;
    root.dataset.place = labelPlacement;
    root.innerHTML = `
      <div class="gf-stage">
        <div class="gf-tilt">
          <div class="gf-shadow" aria-hidden="true"></div>
          <div class="gf-back" aria-hidden="true"><div class="gf-back-sheen"></div></div>
          <svg class="gf-rim gf-back-rim" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${BACK_PATH}"/></svg>
          <div class="gf-front">
            <div class="gf-tint" aria-hidden="true"></div>
            <div class="gf-spec" aria-hidden="true"></div>
            <svg class="gf-rim gf-front-rim" viewBox="0 0 ${W} ${FRONT_H}" aria-hidden="true">
              <defs>
                <linearGradient id="gf-rim-${uid}" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#fff" stop-opacity="0.95"/>
                  <stop offset="0.35" stop-color="#fff" stop-opacity="0.35"/>
                  <stop offset="1" stop-color="#fff" stop-opacity="0.12"/>
                </linearGradient>
              </defs>
              <path d="${FRONT_PATH}" stroke="url(#gf-rim-${uid})"/>
            </svg>
            <button type="button" class="gf-hit"></button>
            <div class="gf-label"><span class="gf-title"></span><span class="gf-meta"></span></div>
          </div>
          <div class="gf-files" role="list"></div>
        </div>
      </div>`;
    const stage = root.querySelector('.gf-stage');
    const tilt = root.querySelector('.gf-tilt');
    const back = root.querySelector('.gf-back');
    const front = root.querySelector('.gf-front');
    const hit = root.querySelector('.gf-hit');
    const metaEl = root.querySelector('.gf-meta');
    const filesEl = root.querySelector('.gf-files');
    back.style.clipPath = `path('${BACK_PATH}')`;
    front.style.clipPath = `path('${FRONT_PATH}')`;
    root.querySelector('.gf-title').textContent = label;
    filesEl.setAttribute('aria-label', `${label} contents`);

    // back panel and its artwork
    if (image) {
      const img = el('img', 'gf-art');
      Object.assign(img, { src: image, alt: '', width: W + 24, height: H + 24, draggable: false });
      back.prepend(img);
    } else if (art !== 'none') {
      back.prepend(artCanvas({ art, seed, w: W + 24, h: H + 24, density, priority: 0, className: 'gf-art' }));
    }

    const applyWidth = () => {
      root.style.width = `${k * W}px`;
      root.style.height = `${(H + HEADROOM) * k}px`;
      stage.style.transform = `translateY(${HEADROOM * k}px) scale(${k})`;
    };
    applyWidth();
    if (fit && root.parentElement) {
      new ResizeObserver(() => {
        const next = widthNow() / W;
        if (Math.abs(next - k) < 0.001) return;
        k = next;
        applyWidth();
      }).observe(root.parentElement);
    }

    // ---- files ---------------------------------------------------------------
    const sheets = new Map(); // id -> slot element
    let dropped = null;

    const buildSheet = (file, id) => {
      const picture = Boolean(file.art || file.image);
      const sheet = el(file.href ? 'a' : 'button', 'gf-sheet' + (picture ? ' gf-sheet--art' : ''));
      if (file.href) {
        sheet.href = file.href;
        if (/^https?:/.test(file.href)) {
          sheet.target = '_blank';
          sheet.rel = 'noopener noreferrer';
        }
      } else {
        sheet.type = 'button';
      }
      if (file.image) {
        const img = el('img', 'gf-sheet-art');
        Object.assign(img, { src: file.image, alt: '', width: SHEET_W, height: SHEET_H, draggable: false, loading: 'lazy', decoding: 'async' });
        sheet.append(img);
      } else if (file.art) {
        sheet.append(artCanvas({ art: file.art, seed: hashString(file.name) % 997, w: SHEET_W, h: SHEET_H, density: Math.min(density, 1.25), priority: 1, className: 'gf-sheet-art' }));
      } else {
        const lines = el('span', 'gf-lines');
        lines.setAttribute('aria-hidden', 'true');
        for (const width of ['86%', '92%', '64%', '88%', '42%']) lines.append(Object.assign(el('i'), { style: `width: ${width}` }));
        sheet.append(lines);
      }
      const head = el('span', 'gf-sheet-head');
      head.append(el('span', 'gf-sheet-name', file.name));
      if (file.meta) head.append(el('span', 'gf-sheet-meta', file.meta));
      sheet.append(head);
      if (id === dropped) {
        sheet.classList.add('gf-sheet--drop');
        sheet.addEventListener('animationend', () => sheet.classList.remove('gf-sheet--drop'), { once: true });
      }
      sheet.addEventListener('click', () => onFileSelect?.(file, ids.indexOf(id)));
      const slot = el('div', 'gf-sheet-slot');
      slot.setAttribute('role', 'listitem');
      slot.append(sheet);
      return slot;
    };

    // the newest files sit at the front of the stack, nearest the glass
    const renderFiles = () => {
      const start = Math.max(0, files.length - MAX_VISIBLE);
      const visible = files.slice(start);
      const keep = new Set();
      visible.forEach((file, v) => {
        const id = ids[start + v];
        keep.add(id);
        let slot = sheets.get(id);
        if (!slot) {
          slot = buildSheet(file, id);
          sheets.set(id, slot);
          filesEl.append(slot); // files only ever join at the end, so DOM order stays stack order
        }
        const jitter = rng(hashString(file.name) + id);
        const style = slot.firstChild.style;
        style.setProperty('--gf-slot', fanSlot(v, visible.length));
        style.setProperty('--gf-depth', visible.length - 1 - v);
        style.setProperty('--gf-jx', `${((jitter() - 0.5) * 10).toFixed(2)}px`);
        style.setProperty('--gf-jr', `${((jitter() - 0.5) * 3.2).toFixed(2)}deg`);
        style.zIndex = v + 1;
      });
      for (const [id, slot] of sheets) {
        if (keep.has(id)) continue;
        slot.remove();
        sheets.delete(id);
      }

      const count = files.length;
      const items = count + (count === 1 ? ' item' : ' items');
      const metaLine = meta ?? items;
      if (metaEl.textContent !== metaLine) {
        metaEl.textContent = metaLine;
        replay(metaEl);
      }
      hit.setAttribute('aria-label', `${open ? 'Close' : 'Open'} ${label}, ${items}`);
    };

    // ---- open / close ----------------------------------------------------------
    let menuItems = [];
    const setOpen = next => {
      open = next;
      root.toggleAttribute('data-open', open);
      hit.setAttribute('aria-expanded', String(open));
      filesEl.inert = !open; // closed files are out of the tab order
      if (menuItems[0]) menuItems[0].textContent = open ? 'Close folder' : 'Open folder';
      renderFiles();
    };
    const toggle = () => {
      setOpen(!open);
      onOpenChange?.(open);
    };

    // ---- the key: + or ··· and its menu ----------------------------------------
    let key = null;
    let menuEl = null;
    const setMenuOpen = next => {
      menuOpen = next;
      if (!key || !menuEl) return;
      key.setAttribute('aria-expanded', String(menuOpen));
      menuEl.toggleAttribute('data-open', menuOpen);
      for (const item of menuItems) {
        item.disabled = !menuOpen;
        if (menuOpen) item.tabIndex = -1;
        else item.removeAttribute('tabindex');
      }
      if (menuOpen) menuItems[0]?.focus();
    };

    const addFile = made => {
      const file = made || onAdd?.(files) || { name: `Untitled ${files.length + 1}`, meta: 'Just now' };
      files = [...files, file];
      const id = nextId++;
      ids = [...ids, id];
      dropped = id;
      renderFiles();
      replay(front, 'gf-front--bump');
      const plus = key?.querySelector('.gf-glyph--plus');
      if (plus) replay(plus);
      onFilesChange?.(files);
    };

    if (action !== 'none') {
      key = el('button', `gf-key gf-key--${action}`);
      key.type = 'button';
      key.innerHTML =
        action === 'add'
          ? '<svg class="gf-glyph gf-glyph--plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5v15M4.5 12h15"/></svg>'
          : '<svg class="gf-glyph gf-glyph--more" viewBox="0 0 30 12" aria-hidden="true"><rect x="1" y="1.5" width="8" height="9" rx="3.4"/><rect x="11" y="1.5" width="8" height="9" rx="3.4"/><rect x="21" y="1.5" width="8" height="9" rx="3.4"/></svg>';
      key.setAttribute('aria-label', action === 'add' ? `Add a file to ${label}` : `More options for ${label}`);
      key.addEventListener('click', () => (action === 'add' ? addFile() : setMenuOpen(!menuOpen)));
      tilt.append(key);
    }

    if (action === 'more') {
      menuEl = el('div', 'gf-menu');
      menuEl.id = `gf-menu-${uid}`;
      menuEl.setAttribute('role', 'menu');
      menuEl.setAttribute('aria-label', `${label} options`);
      key.setAttribute('aria-haspopup', 'menu');
      key.setAttribute('aria-controls', menuEl.id);
      // An Open / Close item is always first.
      menuItems = [{ label: 'Open folder', onSelect: toggle }, ...menu].map(item => {
        const button = el('button', 'gf-menu-item' + (item.danger ? ' gf-menu-item--danger' : ''), item.label);
        button.type = 'button';
        button.setAttribute('role', 'menuitem');
        button.addEventListener('click', () => {
          setMenuOpen(false);
          key.focus();
          item.onSelect?.();
        });
        return button;
      });
      menuEl.append(...menuItems);
      menuEl.addEventListener('keydown', event => {
        const at = menuItems.indexOf(document.activeElement);
        const go = i => {
          event.preventDefault();
          menuItems[(i + menuItems.length) % menuItems.length]?.focus();
        };
        if (event.key === 'ArrowDown') go(at + 1);
        else if (event.key === 'ArrowUp') go(at - 1);
        else if (event.key === 'Home') go(0);
        else if (event.key === 'End') go(menuItems.length - 1);
        else if (event.key === 'Tab') setMenuOpen(false);
      });
      tilt.append(menuEl);
    }

    hit.addEventListener('click', () => {
      setMenuOpen(false);
      toggle();
    });

    // ---- Escape and a press outside close whatever is open ---------------------
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || (!open && !menuOpen)) return;
      if (menuOpen) {
        setMenuOpen(false);
        key?.focus();
      } else {
        toggle();
        hit.focus();
      }
    });
    document.addEventListener('pointerdown', event => {
      const target = event.target;
      if (menuOpen && !menuEl?.contains(target) && !key?.contains(target)) setMenuOpen(false);
      else if (open && !menuOpen && !root.contains(target)) toggle();
    });

    // ---- pointer: light and parallax follow the cursor -------------------------
    let raf = 0;
    let px = 0;
    let py = 0;
    const write = () => {
      raf = 0;
      root.style.setProperty('--gf-px', px.toFixed(3));
      root.style.setProperty('--gf-py', py.toFixed(3));
    };
    root.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const rect = root.getBoundingClientRect();
      px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      py = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(write);
    });
    root.addEventListener('pointerleave', () => {
      px = 0;
      py = 0;
      if (!raf) raf = requestAnimationFrame(write);
    });

    // ---- entrance: assemble the first time the folder is on screen -------------
    const enter = () => root.toggleAttribute('data-entered', true);
    if (!appear || typeof IntersectionObserver === 'undefined') {
      enter();
    } else {
      const io = new IntersectionObserver(
        entries => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          io.disconnect();
          setTimeout(enter, appearDelay);
        },
        { threshold: 0.25 }
      );
      io.observe(root);
    }

    setMenuOpen(false);
    setOpen(open);

    return {
      open: () => open || toggle(),
      close: () => open && toggle(),
      toggle,
      addFile
    };
  };
})();
