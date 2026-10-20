const fs = require('node:fs/promises');
const path = require('node:path');
const QRCode = require('qrcode');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');

const url = 'https://jiaruilei.github.io/WaveAttenuationNbS_2/';
const outputDirectory = path.resolve(__dirname, '..', 'assets');
const options = {
  errorCorrectionLevel: 'M',
  margin: 4,
  color: { dark: '#000000ff', light: '#ffffffff' },
};

function verify(buffer, expectedWidth) {
  const png = PNG.sync.read(buffer);
  if (png.width !== expectedWidth || png.height !== expectedWidth) {
    throw new Error(`Unexpected QR image dimensions: ${png.width} × ${png.height}`);
  }
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, {
    inversionAttempts: 'dontInvert',
  });
  if (!decoded || decoded.data !== url) {
    throw new Error(`QR code failed to decode to the canonical URL at ${expectedWidth}px.`);
  }
}

async function main() {
  const qr = QRCode.create(url, options);
  const totalModules = qr.modules.size + 2 * options.margin;
  // Four pixels per module gives a crisp 164px monitor image. The standalone
  // PNG uses 30 pixels per module (1230px) for signs and printed material.
  const displayWidth = totalModules * 4;
  const printWidth = totalModules * 30;
  const svg = await QRCode.toString(url, { ...options, type: 'svg', width: displayWidth });
  const png = await QRCode.toBuffer(url, { ...options, type: 'png', width: printWidth });
  const displayPng = await QRCode.toBuffer(url, { ...options, type: 'png', width: displayWidth });
  verify(png, printWidth);
  verify(displayPng, displayWidth);

  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(path.join(outputDirectory, 'wave-tank-qr.svg'), svg);
  await fs.writeFile(path.join(outputDirectory, 'wave-tank-qr.png'), png);
  console.log(`Generated QR version ${qr.version}, ${qr.modules.size} × ${qr.modules.size} modules, with a 4-module quiet zone.`);
  console.log(`Verified the canonical URL at ${displayWidth}px and ${printWidth}px: ${url}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
