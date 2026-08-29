$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$pkgDir = Join-Path $root "node_modules\@esbuild\win32-x64"
$exe = Join-Path $pkgDir "esbuild.exe"
$minGoodBytes = 10000000

function Write-Check($msg) { Write-Host "[fix-esbuild] $msg" }

if (-not (Test-Path $exe)) {
  Write-Check "missing, re-downloading"
  & { } 
} elseif ((Get-Item $exe).Length -ge $minGoodBytes) {
  Write-Check "binary OK ($((Get-Item $exe).Length) bytes)"
  exit 0
} else {
  Write-Check "corrupted ($((Get-Item $exe).Length) bytes), re-downloading"
}

$pkgJson = Get-Content (Join-Path $pkgDir "package.json") -Raw | ConvertFrom-Json
$ver = $pkgJson.version
if (-not $ver) { $ver = "0.25.12" }

$tmp = Join-Path $env:TEMP "esbuild-repair"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$tgz = Join-Path $tmp "win32-x64.tgz"
$url = "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-$ver.tgz"
Write-Check "downloading $url"
curl.exe -sSL -o $tgz $url --max-time 90
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $tgz)) { Write-Check "download failed, leaving as-is (best effort)"; exit 0 }
tar -xzf $tgz -C $tmp
$fresh = Join-Path $tmp "package\esbuild.exe"
if (-not (Test-Path $fresh)) { throw "tarball did not contain esbuild.exe" }
$len = (Get-Item $fresh).Length
if ($len -lt $minGoodBytes) { throw "downloaded binary suspiciously small ($len bytes)" }
Copy-Item $fresh $exe -Force
Remove-Item -Recurse -Force $tmp
Write-Check "replaced with $len bytes"