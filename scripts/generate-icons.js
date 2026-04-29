/**
 * Generates all Android mipmap icons from public/onyxx-symbol.png.
 * Black background · Onyxx symbol · Rounded corners.
 * Run: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const ROOT   = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'public', 'onyxx-symbol.png');
const RES    = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

// Legacy icon sizes + adaptive-foreground sizes per density
const DENSITIES = [
  { dir: 'mipmap-mdpi',    icon: 48,  fg: 108 },
  { dir: 'mipmap-hdpi',    icon: 72,  fg: 162 },
  { dir: 'mipmap-xhdpi',   icon: 96,  fg: 216 },
  { dir: 'mipmap-xxhdpi',  icon: 144, fg: 324 },
  { dir: 'mipmap-xxxhdpi', icon: 192, fg: 432 },
];

/** Build a filled icon (black bg + symbol) then apply an SVG mask. */
async function buildMasked(size, maskSvg, outPath) {
  const padding = Math.round(size * 0.18); // 18 % breathing room on each side
  const symSize = size - padding * 2;

  const symbol = await sharp(SOURCE)
    .resize(symSize, symSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const withBg = await sharp({
    create: {
      width: size, height: size, channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 255 },
    },
  })
    .composite([{ input: symbol, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(withBg)
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .png()
    .toFile(outPath);
}

/** Rounded-rectangle icon (ic_launcher.png). */
async function buildRounded(size, outPath) {
  const r   = Math.round(size * 0.22); // ~22 % corner radius — modern look
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="white"/>
  </svg>`;
  await buildMasked(size, svg, outPath);
}

/** Circle icon (ic_launcher_round.png). */
async function buildCircle(size, outPath) {
  const c   = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${c}" cy="${c}" r="${c}" fill="white"/>
  </svg>`;
  await buildMasked(size, svg, outPath);
}

/**
 * Adaptive-icon foreground (ic_launcher_foreground.png).
 * Transparent background; symbol centred in the 66.7 % safe zone.
 */
async function buildForeground(size, outPath) {
  const symSize = Math.round(size * 0.55); // comfortably inside safe zone

  const symbol = await sharp(SOURCE)
    .resize(symSize, symSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp({
    create: {
      width: size, height: size, channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: symbol, gravity: 'center' }])
    .png()
    .toFile(outPath);
}

async function main() {
  console.log('\n── Generating Android icons ─────────────────────────────────');

  for (const { dir, icon, fg } of DENSITIES) {
    const resDir = path.join(RES, dir);

    await buildRounded(   icon, path.join(resDir, 'ic_launcher.png'));
    await buildCircle(    icon, path.join(resDir, 'ic_launcher_round.png'));
    await buildForeground(fg,   path.join(resDir, 'ic_launcher_foreground.png'));

    console.log(`  ✓ ${dir}  (${icon}px legacy · ${fg}px foreground)`);
  }

  // Update background color to black
  const bgXmlPath = path.join(RES, 'values', 'ic_launcher_background.xml');
  fs.writeFileSync(bgXmlPath,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#000000</color>\n</resources>\n`
  );
  console.log('  ✓ ic_launcher_background → #000000');

  console.log('\n── Done. Run: npx cap sync android ─────────────────────────\n');
}

main().catch(err => { console.error(err); process.exit(1); });
