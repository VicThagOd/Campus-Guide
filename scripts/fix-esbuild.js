import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(msg) {
  console.log(`[fix-esbuild] ${msg}`);
}

// 1. Only run this check on Windows
if (os.platform() !== 'win32') {
  log(`Platform is ${os.platform()}, skipping win32-x64 fix.`);
  process.exit(0);
}

const rootDir = path.resolve(__dirname, '..');
const pkgDir = path.join(rootDir, 'node_modules', '@esbuild', 'win32-x64');
const exePath = path.join(pkgDir, 'esbuild.exe');
const minGoodBytes = 10000000;

try {
  if (fs.existsSync(exePath)) {
    const stats = fs.statSync(exePath);
    if (stats.size >= minGoodBytes) {
      log(`binary OK (${stats.size} bytes)`);
      process.exit(0);
    } else {
      log(`corrupted (${stats.size} bytes), re-downloading`);
    }
  } else {
    log('missing, re-downloading');
  }

  // Read version from package.json in win32-x64, default to 0.25.12 if not exists
  let version = '0.25.12';
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      if (pkgJson.version) {
        version = pkgJson.version;
      }
    } catch (e) {
      // Ignore
    }
  }

  const tmpDir = path.join(os.tmpdir(), 'esbuild-repair');
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  const tgzPath = path.join(tmpDir, 'win32-x64.tgz');
  const url = `https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-${version}.tgz`;
  log(`downloading ${url}`);

  // Download using curl.exe
  try {
    execSync(`curl.exe -sSL -o "${tgzPath}" "${url}" --max-time 90`);
  } catch (e) {
    log('download failed, leaving as-is (best effort)');
    process.exit(0);
  }

  if (!fs.existsSync(tgzPath)) {
    log('download failed, leaving as-is (best effort)');
    process.exit(0);
  }

  // Extract tarball using tar
  execSync(`tar -xzf "${tgzPath}" -C "${tmpDir}"`);
  
  const freshExePath = path.join(tmpDir, 'package', 'esbuild.exe');
  if (!fs.existsSync(freshExePath)) {
    throw new Error('tarball did not contain esbuild.exe');
  }

  const freshSize = fs.statSync(freshExePath).size;
  if (freshSize < minGoodBytes) {
    throw new Error(`downloaded binary suspiciously small (${freshSize} bytes)`);
  }

  // Ensure destination directory exists
  fs.mkdirSync(path.dirname(exePath), { recursive: true });
  
  // Copy fresh file
  fs.copyFileSync(freshExePath, exePath);
  
  // Clean up
  fs.rmSync(tmpDir, { recursive: true, force: true });
  log(`replaced with ${freshSize} bytes`);

} catch (err) {
  log(`error repairing esbuild: ${err.message}`);
  process.exit(0); // exit 0 so that it doesn't block npm installs
}
