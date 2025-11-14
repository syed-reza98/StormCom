# Migration Test Script (PowerShell)
param([switch]$Cleanup)
$ErrorActionPreference = "Stop"
$TEST_DB_PATH = ".\prisma\test-migration.db"
Write-Host "Test script running..." -ForegroundColor Green
if ($Cleanup) {
    if (Test-Path $TEST_DB_PATH) { Remove-Item $TEST_DB_PATH -Force }
    Write-Host "Cleaned up test DB" -ForegroundColor Green
    exit 0
}
$env:DATABASE_URL = "file:$TEST_DB_PATH"
Write-Host "Running migrations..." -ForegroundColor Cyan
npx prisma migrate deploy
if ($LASTEXITCODE -eq 0) {
    Write-Host " Migrations passed" -ForegroundColor Green
} else {
    Write-Host " Migrations failed" -ForegroundColor Red
    exit 1
}
