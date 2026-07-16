#!/usr/bin/env node
/**
 * Genera los iconos PNG del manifest a partir de markmax-bg.svg
 * Requiere: sharp
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.resolve(__dirname, '../public/markmax-bg.svg');
const iconsDir = path.resolve(__dirname, '../public/icons');
const sizes = [192, 512];

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svgBuffer = fs.readFileSync(svgPath);

(async () => {
  for (const size of sizes) {
    const outPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generado: ${outPath}`);
  }
  console.log('Iconos generados correctamente.');
})();
