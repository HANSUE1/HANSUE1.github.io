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
js/main.js           nav highlighting, article dialog, contact form, glass icons + profile card setup, GSAP motion
js/glass-icons.js    vanilla port of React Bits' GlassIcons (WebGL glass, CSS fallback)
js/reflective-card.js  vanilla port of React Bits' ReflectiveCard (WebGL brushed metal)
images/              WebP photos/screenshots
```

Layout breakpoints: base styles are the tablet layout (561–820px); `≤560px` is mobile; `≥821px` pins the profile card on the left and puts sections in a right-hand rail, with a compact card on short screens (`max-height: 820px`).

## Contact form

The form opens the visitor's email app addressed to `CONTACT_EMAIL` (top of `js/main.js`).

## Behaviour

The Tools section uses glass icons: each link in `#tool-icons` (index.html) holds an inline SVG glyph, its label text, and a `data-color` plate color; `GlassIcons()` in `js/main.js` sets size, gap and columns. The profile card (`#profile-card`) is a brushed-metal ReflectiveCard that tilts toward the pointer; its content stays in index.html and `ReflectiveCard()` in `js/main.js` sets its options. The section navigation highlights the current section, article cards open a reading dialog, the contact form prepares an email via `mailto:`, and a back-to-top button appears on scroll. Motion uses GSAP + ScrollTrigger (loaded from jsDelivr); without them, or with reduced motion enabled, the page renders fully static. Everything is reachable by keyboard (skip link, visible focus rings).
