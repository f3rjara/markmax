const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

// Texto base de la descripcion de la app. La version se agrega automaticamente.
const APP_DESCRIPTION = 'Tu editor Markdown local';

// 1. Generar src/app/version.ts
const content = `// Este archivo se genera automaticamente en el prebuild. No editar manualmente.
export const APP_VERSION = '${pkg.version}';
`;

fs.writeFileSync(path.join(__dirname, '../src/app/version.ts'), content, 'utf8');
console.log(`[Version PWA] Archivo src/app/version.ts actualizado a v${pkg.version}`);

// 2. Estampar la version en la descripcion del manifest
const manifestPath = path.join(__dirname, '../public/manifest.webmanifest');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.description = `${APP_DESCRIPTION} — v${pkg.version}`;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`[Version PWA] Descripcion del manifest actualizada a v${pkg.version}`);
