// Splash: aurora + name, held for a few seconds, then faded out to reveal the portfolio.
// The inline script in <head> sets html.intro (once per browser session) so the splash paints first;
// this script takes over its timing. main.js waits for 'intro:done' before playing the hero entrance.
(() => {
  const root = document.documentElement;
  const splash = document.querySelector('#splash');
  if (!splash) return;
  if (!root.classList.contains('intro')) {
    splash.remove();
    return;
  }

  window.splashActive = true;
  splash.classList.add('is-live');
  try {
    sessionStorage.setItem('introSeen', '1');
  } catch {}

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const destroyAurora = window.SoftAurora
    ? SoftAurora(splash.querySelector('.splash-aurora'), {
        color1: '#ff6d37',
        color2: '#00cfff',
        spectrum: 0,
        brightness: 0.7,
        // Separate the two layers; stacked exactly, orange + cyan blend into near-white.
        layerOffset: 1.2,
        noiseAmplitude: 1.2
      })
    : () => {};

  const skip = new AbortController();
  const leave = () => {
    if (!window.splashActive) return;
    window.splashActive = false;
    clearTimeout(timer);
    skip.abort();
    splash.classList.add('is-leaving');
    root.classList.remove('intro');
    document.dispatchEvent(new Event('intro:done'));
    setTimeout(() => {
      destroyAurora();
      splash.remove();
    }, reduced ? 300 : 1000);
  };
  // Long enough for the aurora's ~2s bloom to settle before the page shows through.
  const timer = setTimeout(leave, reduced ? 1600 : 4500);

  // Skip early on any click, key or scroll attempt, after a short beat so the name registers.
  setTimeout(() => {
    for (const type of ['pointerdown', 'keydown', 'wheel', 'touchmove']) {
      window.addEventListener(type, leave, { signal: skip.signal, passive: true });
    }
  }, 600);
})();
