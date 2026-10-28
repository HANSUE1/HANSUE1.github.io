# Hans Santos — Portfolio

Portfolio of Hans Curt Austin C. Santos, Computer Science student at National University (Digital Forensics). Live at https://hansue-debuger.github.io/

Built with plain HTML, CSS, and JavaScript — no build step.

## Run locally

Open `index.html` in a browser, or serve this folder with Python:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Structure

```
index.html      page markup, meta tags, JSON-LD
favicon.svg
css/main.css         tokens → base → sections → responsive breakpoints
css/glass-icons.css  styles for the Tools glass icons
css/reflective-card.css  styles for the metal profile card
css/soft-aurora.css  styles for the splash aurora
css/splash.css       the opening splash (aurora + name) and its fade-out
js/main.js           nav highlighting, article dialog, contact form, glass icons + profile card setup, GSAP motion
js/glass-icons.js    vanilla port of React Bits' GlassIcons (WebGL glass, CSS fallback)
js/reflective-card.js  vanilla port of React Bits' ReflectiveCard (WebGL brushed metal)
js/soft-aurora.js    vanilla port of React Bits' SoftAurora (WebGL aurora band)
js/splash.js         splash timing: hold, skip on click/key/scroll, fade out, then start the hero motion
images/              WebP photos/screenshots
```

Layout breakpoints: base styles are the tablet layout (561–820px); `≤560px` is mobile; `≥821px` pins the profile card on the left and puts sections in a right-hand rail, with a compact card on short screens (`max-height: 820px`).

## Contact form

The form opens the visitor's email app addressed to `CONTACT_EMAIL` (top of `js/main.js`).

## Behaviour

The first visit in a browser session opens on a splash: a SoftAurora band (site orange and cyan) behind the name, held for 4.5s (or until a click, key press or scroll) and then faded out to the page, at which point the hero entrance plays. An inline script in `<head>` decides whether to show it (`sessionStorage` key `introSeen`); to see it again, open the site in a new tab or window. If `js/splash.js` fails to load, `css/splash.css` still fades the splash out after 6s.

The Tools section uses glass icons: each link in `#tool-icons` (index.html) holds an inline SVG glyph, its label text, and a `data-color` plate color; `GlassIcons()` in `js/main.js` sets size, gap and columns. The profile card (`#profile-card`) is a React Bits ReflectiveCard (brushed metal that tilts toward the pointer) holding the photo, name, role and social links; its content lives in index.html and `ReflectiveCard()` in `js/main.js` sets its options. When you change a CSS or JS file, bump the `?v=` number on its tag in index.html so browsers don't keep the cached copy. The section navigation highlights the current section, article cards open a reading dialog, the contact form prepares an email via `mailto:`, and a back-to-top button appears on scroll. Motion uses GSAP + ScrollTrigger (loaded from jsDelivr); without them, or with reduced motion enabled, the page renders fully static. Everything is reachable by keyboard (skip link, visible focus rings).
