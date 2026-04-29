/**
 * Mobile build script: temporarily swaps in next.config.mobile.mjs,
 * runs next build (produces /out for Capacitor), then restores original config.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const mainConfig = path.join(root, 'next.config.mjs');
const mobileConfig = path.join(root, 'next.config.mobile.mjs');
const backupConfig = path.join(root, 'next.config.mjs.bak');

let restored = false;

function restore() {
  if (!restored && fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, mainConfig);
    fs.unlinkSync(backupConfig);
    restored = true;
    console.log('\n── Restored next.config.mjs ────────────────────────────────');
  }
}

process.on('exit', restore);
process.on('SIGINT', () => { restore(); process.exit(1); });
process.on('uncaughtException', (err) => { restore(); throw err; });

try {
  // Backup and swap config
  fs.copyFileSync(mainConfig, backupConfig);
  fs.copyFileSync(mobileConfig, mainConfig);
  console.log('\n── Step 1: Using mobile config (static export) ─────────────');

  // Build
  console.log('\n── Step 2: Building Next.js ────────────────────────────────');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });

  restore();
  console.log('\n── Done. Run: npx cap sync android ─────────────────────────\n');
} catch (err) {
  restore();
  process.exit(1);
}
