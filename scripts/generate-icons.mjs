import sharp from "sharp";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
mkdirSync(publicDir, { recursive: true });

function iconSvg(size) {
  const radius = size * 0.22;
  const fontSize = size * 0.42;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#0a0a0a"/>
  <rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="${radius}" fill="none" stroke="#6366f1" stroke-opacity="0.35" stroke-width="${size * 0.012}"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-weight="700"
    font-size="${fontSize}" fill="#ffffff" letter-spacing="-2">TL</text>
</svg>`;
}

async function generate(size, filename) {
  const svg = Buffer.from(iconSvg(size));
  await sharp(svg).png().toFile(path.join(publicDir, filename));
  console.log(`Generated ${filename}`);
}

async function main() {
  await generate(192, "icon-192.png");
  await generate(512, "icon-512.png");
  await generate(180, "apple-touch-icon.png");
  await generate(32, "favicon-32.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
