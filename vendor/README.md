# Locally served MathJax

The site uses the official `mathjax` npm package at **4.1.3** and its
`@mathjax/mathjax-newcm-font` dependency at **4.1.3**, as pinned in
`package-lock.json`. Their Apache 2.0 license is included in both vendor folders.

Only the combined TeX-to-SVG browser renderer and New Computer Modern SVG font
data are copied here. No package manager or build step is needed on GitHub Pages,
and mathematical rendering does not depend on a public CDN. Plain-text label
fallbacks remain visible if the scripts cannot load.

To reproduce these files:

```sh
npm ci --ignore-scripts
npm run vendor:mathjax
```

`math-rendering.js` configures the local paths and renders elements with a
`data-tex` attribute. The attribute contains TeX without delimiters, and the
element's initial content provides the readable fallback. After replacing a
metrics panel's contents, call `window.renderMath?.(panel)`.

Official self-hosting documentation:
https://docs.mathjax.org/en/latest/web/hosting.html
