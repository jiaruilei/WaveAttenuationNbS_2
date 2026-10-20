const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const mathjax = path.join(root, 'node_modules', 'mathjax');
const fonts = path.join(root, 'node_modules', '@mathjax', 'mathjax-newcm-font');
const vendor = path.join(root, 'vendor');
const copy = (source, destination) => {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
};

// The combined SVG renderer includes its initial font data. Dynamic font
// modules are also served locally, so rendering never needs a public CDN.
copy(path.join(mathjax, 'tex-svg.js'), path.join(vendor, 'mathjax', 'tex-svg.js'));
copy(path.join(mathjax, 'LICENSE'), path.join(vendor, 'mathjax', 'LICENSE'));
copy(path.join(fonts, 'svg.js'), path.join(vendor, 'mathjax-newcm', 'svg.js'));
copy(path.join(fonts, 'svg', 'dynamic'), path.join(vendor, 'mathjax-newcm', 'svg', 'dynamic'));
copy(path.join(mathjax, 'LICENSE'), path.join(vendor, 'mathjax-newcm', 'LICENSE'));
console.log('Vendored MathJax 4.1.3 and New Computer Modern SVG font data.');
