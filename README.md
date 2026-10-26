# Hans — Portfolio

A responsive portfolio for a Software Engineer. The page uses plain HTML, CSS, and JavaScript, with images stored in `images/`.

## Run locally

Open `index.html` in a browser, or serve this folder with Python:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

The section navigation highlights the current section, article cards open a reading dialog, the contact form prepares an email via mailto, and a back-to-top button appears on scroll. Motion uses GSAP + ScrollTrigger (loaded from jsDelivr); without them, or with reduced motion enabled, the page renders fully static.
