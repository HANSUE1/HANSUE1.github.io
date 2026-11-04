// Splash: light pillar + name, held for a few seconds, then faded out to reveal the portfolio.
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
  const destroyPillar = window.LightPillar
    ? LightPillar(splash.querySelector('.splash-pillar'), {
        topColor: '#22d3ee',
        bottomColor: '#e0f2fe',
        intensity: 1,
        glowAmount: 0.0015,
        bloom: 0.6,
        pillarWidth: 2.2,
        pillarHeight: 0.3,
        pillarRotation: 90,
        rotationSpeed: 0.3,
        interactive: true,
        clickPulse: true,
        intro: true,
        quality: 'high',
        mixBlendMode: 'screen',
        twist: 0.6
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
      destroyPillar();
      splash.remove();
    }, reduced ? 300 : 1000);
  };
  // Long enough for the pillar's ~2s ignition to settle before the page shows through.
  const timer = setTimeout(leave, reduced ? 1600 : 4500);

  // Skip early on any click, key or scroll attempt, after a short beat so the name registers.
  setTimeout(() => {
    for (const type of ['pointerdown', 'keydown', 'wheel', 'touchmove']) {
      window.addEventListener(type, leave, { signal: skip.signal, passive: true });
    }
  }, 600);
})();
