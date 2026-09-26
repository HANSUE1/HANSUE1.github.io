# Portfolio Project

This project is a static personal portfolio website built with HTML, CSS, and JavaScript.

## Design

The design is inspired by modern glassmorphism aesthetics with a dual-tone color system:

- **Light mode**: Vanilla palette with soft cream backgrounds (`#F1FEC8`) and frosted glass surfaces
- **Dark mode**: Cosmic palette with deep purple-gray backgrounds (`#23212C`) and translucent glass panels

Key visual features:
- Frosted glass cards with `backdrop-filter: blur()`
- GPU-accelerated animations via `translate3d` and `will-change`
- Smooth scroll-triggered reveal animations
- Responsive grid background pattern
- Custom typography with Playfair Display + Inter

## Structure

```text
PORTFOLIO/
├── index.html
├── README.md
├── css/
│   ├── main.css
│   ├── _variables.css
│   ├── _reset.css
│   ├── _typography.css
│   ├── _layout.css
│   ├── _components.css
│   └── _animations.css
├── data/
│   └── projects.json
├── images/
│   └── .gitkeep
├── js/
│   ├── main.js
│   ├── utils.js
│   ├── navigation.js
│   ├── animations.js
│   ├── projects.js
│   └── contact.js
└── .kilo/
```

## How to run

Open `index.html` directly in a browser, or serve the project with a local HTTP server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.
