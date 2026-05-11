import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(here, '../src/assets/icon.svg'));
const outDir = join(here, '../src/assets');

async function gen(size, name) {
  await sharp(svg).resize(size, size).png().toFile(join(outDir, name));
  console.log('✓', name);
}

await gen(180, 'icon-180.png');
await gen(192, 'icon-192.png');
await gen(512, 'icon-512.png');

// Maskable: add 10% padding inside, dark bg
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0c0c12"/>
  <g transform="translate(51 51) scale(0.8)">${svg.toString().replace(/<\?xml.*?\?>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</g>
</svg>`;
await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile(join(outDir, 'icon-maskable-512.png'));
console.log('✓ icon-maskable-512.png');
