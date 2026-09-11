# Favboard — Windows セットアップ

Write-Host "=== Favboard Setup ===" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# 1. .env.local
if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "[OK] .env.local created" -ForegroundColor Green
} else {
  Write-Host "[SKIP] .env.local already exists" -ForegroundColor Yellow
}

# 2. npm install
if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..." -ForegroundColor Cyan
  npm install
} else {
  Write-Host "[OK] node_modules exists" -ForegroundColor Green
}

# 3. Supabase init (for future cloud setup)
if (-not (Test-Path "supabase\config.toml")) {
  Write-Host "Initializing Supabase config..." -ForegroundColor Cyan
  npx supabase init
} else {
  Write-Host "[OK] Supabase config exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Ready ===" -ForegroundColor Green
Write-Host "Edit .env.local with your Supabase project URL and anon key," -ForegroundColor Yellow
Write-Host "then run migration in Supabase SQL Editor (supabase/migrations/001_canvases.sql)"
Write-Host ""
Write-Host "Start dev server:" -ForegroundColor Cyan
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then open: http://localhost:3000/login" -ForegroundColor Cyan
Write-Host "List creation requires a logged-in account."
