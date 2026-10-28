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
index.html                     page markup, meta tags, JSON-LD
favicon.svg
css/main.css                   tokens → base → sections → responsive breakpoints
css/splash.css                 opening splash (aurora + name) and its fade-out
css/components/                styles for the three React Bits components below
js/main.js                     nav highlighting, back-to-top, article dialog, contact form, component setup, GSAP motion
js/splash.js                   splash timing: hold, skip on click/key/scroll, fade out, then start the hero motion
js/components/glass-icons.js   GlassIcons: Tools section icons (WebGL glass, CSS fallback)
js/components/reflective-card.js  ReflectiveCard: brushed-metal profile card
js/components/soft-aurora.js   SoftAurora: aurora band behind the splash
images/                        WebP photo and project screenshots
```

The files in `components/` are plain-JavaScript ports of [React Bits](https://reactbits.dev) components (JS + CSS variant). Their shaders and helpers are the original source unchanged; only the part that replaced React is rewritten, so each one is set up with a function call (`GlassIcons(el, options)`, `ReflectiveCard(el, options)`, `SoftAurora(el, options)`) that takes the same options as the React props.

Layout breakpoints: base styles are the tablet layout (561–820px); `≤560px` is mobile; `≥821px` pins the profile card on the left and puts sections in a right-hand rail, with a compact card on short screens (`max-height: 820px`).

## Editing

- **Content** lives in `index.html`: profile card, hero, projects, experience, tools, articles (`data-copy` holds an article's full text) and contact form.
- **Contact email**: `CONTACT_EMAIL` at the top of `js/main.js`. The form has no backend; it opens the visitor's email app.
- **Component options** (icon size, card tilt, colors): the `GlassIcons(...)` and `ReflectiveCard(...)` calls in `js/main.js`, and the `SoftAurora(...)` call in `js/splash.js`.
- **Cache busting**: after changing a CSS or JS file, bump the `?v=` number on its tag in `index.html`. GitHub Pages lets browsers cache files, so without it visitors (and you) can keep seeing the old version.

## Behaviour

The first visit in a browser tab opens on a splash: a SoftAurora band (site orange and cyan) behind the name, held for 4.5s (or until a click, key press or scroll) and then faded out to the page, at which point the hero entrance plays. An inline script in `<head>` decides whether to show it (`sessionStorage` key `introSeen`); to see it again, open the site in a new tab. If `js/splash.js` fails to load, `css/splash.css` still fades the splash out after 6s.

The Tools section uses glass icons: each link in `#tool-icons` holds an inline SVG glyph, its label text, and a `data-color` plate color. The profile card (`#profile-card`) is a ReflectiveCard holding the photo, name, role and social links; its colors are also set in `css/main.css`, so it is styled before its script runs.

The section navigation highlights the current section, article cards open a reading dialog, the contact form prepares an email via `mailto:`, and a back-to-top button appears on scroll. Motion uses GSAP + ScrollTrigger (loaded from jsDelivr with integrity hashes); without them, or with reduced motion enabled, the page renders fully static. Everything is reachable by keyboard (skip link, visible focus rings).
