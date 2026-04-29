/**
 * Build script: prepares Next.js standalone output for Electron packaging.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root  = path.join(__dirname, '..');
const stand = path.join(root, '.next', 'standalone');

// ── Validate required public assets before starting ─────────────
const REQUIRED_ASSETS = ['icon.ico', 'banner.png', 'onyxx-logo.png', 'onyxx-symbol.png'];
for (const asset of REQUIRED_ASSETS) {
  const assetPath = path.join(root, 'public', asset);
  if (!fs.existsSync(assetPath)) {
    console.error(`\n✗ Missing required asset: public/${asset}`);
    console.error('  Add this file before packaging.\n');
    process.exit(1);
  }
}
console.log('── Asset check passed ──────────────────────────────────────');

console.log('\n── Step 1: Building Next.js ────────────────────────────────');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

// Verify the standalone output was actually created
if (!fs.existsSync(path.join(stand, 'server.js'))) {
  console.error('\n✗ Next.js standalone output not found at .next/standalone/server.js');
  console.error('  Make sure next.config.mjs has output: "standalone"\n');
  process.exit(1);
}

// ── Copy .next/static → .next/standalone/.next/static ──────────
console.log('\n── Step 2: Copying static assets ──────────────────────────');
const staticSrc = path.join(root, '.next', 'static');
const staticDst = path.join(stand, '.next', 'static');
copyDir(staticSrc, staticDst, '.next/static');
console.log(`   ✓ .next/static → standalone/.next/static`);

// ── Copy public/ → .next/standalone/public ─────────────────────
const publicSrc = path.join(root, 'public');
const publicDst = path.join(stand, 'public');
copyDir(publicSrc, publicDst, 'public');
console.log(`   ✓ public/ → standalone/public`);

console.log('\n── Done. Run electron-builder to package. ──────────────────\n');

// ── Helpers ─────────────────────────────────────────────────────
function copyDir(src, dst, label) {
  if (!fs.existsSync(src)) {
    console.error(`\n✗ Source directory not found: ${label || src}`);
    process.exit(1);
  }
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}
