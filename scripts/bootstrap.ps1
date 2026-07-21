param(
    [ValidateSet("dev", "build", "test", "lint")]
    [string]$Action = "dev"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies"
$nodeBin = Join-Path $runtimeRoot "node\bin"
$pnpmBin = Join-Path $runtimeRoot "bin\fallback"
$pnpmCommand = Join-Path $pnpmBin "pnpm.cmd"

if (-not (Test-Path -LiteralPath $pnpmCommand)) {
    throw "Bundled pnpm runtime was not found at $pnpmCommand"
}

$env:PATH = "$nodeBin;$pnpmBin;$env:PATH"
Push-Location $projectRoot
try {
    & $pnpmCommand run $Action
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
