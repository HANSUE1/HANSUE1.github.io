# Hans — Portfolio

A responsive portfolio for a Software Engineer, built with plain HTML, CSS, and JavaScript — no build step.

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
css/main.css    tokens → base → sections → glow → responsive breakpoints
js/main.js      nav highlighting, article dialog, contact form, glow, GSAP motion
images/         WebP photos/screenshots + tool logos
```

Layout breakpoints: base styles are the tablet layout (561–820px); `≤560px` is mobile; `≥821px` pins the profile card on the left and puts sections in a right-hand rail, with a compact card on short screens (`max-height: 820px`).

## Contact form

The form opens the visitor's email app addressed to `CONTACT_EMAIL` (top of `js/main.js`).

## Behaviour

The section navigation highlights the current section, article cards open a reading dialog, the contact form prepares an email via `mailto:`, and a back-to-top button appears on scroll. Motion uses GSAP + ScrollTrigger (loaded from jsDelivr); without them, or with reduced motion enabled, the page renders fully static. Everything is reachable by keyboard (skip link, visible focus rings).
