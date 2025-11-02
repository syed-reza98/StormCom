# Database Backup Script
# 
# Creates a timestamped backup of the SQLite development database.
# For production PostgreSQL backups, use Vercel Postgres backup features.
#
# Usage:
#   npm run db:backup
#   or
#   powershell -ExecutionPolicy Bypass -File ./scripts/backup-db.ps1

param(
    [string]$OutputDir = "backups",
    [switch]$Compress
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 Starting database backup..." -ForegroundColor Cyan
Write-Host ""

# Check if database exists
$dbPath = "prisma\dev.db"
if (-not (Test-Path $dbPath)) {
    Write-Host "❌ Database file not found: $dbPath" -ForegroundColor Red
    Write-Host "   Make sure you're running this from the project root." -ForegroundColor Yellow
    exit 1
}

# Create backup directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "✓ Created backup directory: $OutputDir" -ForegroundColor Green
}

# Generate timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "dev_$timestamp.db"
$backupPath = Join-Path $OutputDir $backupName

# Copy database file
try {
    Copy-Item -Path $dbPath -Destination $backupPath -Force
    Write-Host "✓ Database backed up to: $backupPath" -ForegroundColor Green
    
    # Get file size
    $fileSize = (Get-Item $backupPath).Length / 1MB
    Write-Host "  Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
    
    # Compress if requested
    if ($Compress) {
        Write-Host ""
        Write-Host "🗜️  Compressing backup..." -ForegroundColor Cyan
        
        $zipPath = "$backupPath.zip"
        Compress-Archive -Path $backupPath -DestinationPath $zipPath -Force
        
        $zipSize = (Get-Item $zipPath).Length / 1MB
        $compressionRatio = [math]::Round((1 - ($zipSize / $fileSize)) * 100, 1)
        
        Write-Host "✓ Compressed backup: $zipPath" -ForegroundColor Green
        Write-Host "  Size: $([math]::Round($zipSize, 2)) MB (saved $compressionRatio%)" -ForegroundColor Gray
        
        # Remove uncompressed file
        Remove-Item -Path $backupPath -Force
    }
    
    # List recent backups
    Write-Host ""
    Write-Host "📦 Recent backups:" -ForegroundColor Cyan
    Get-ChildItem -Path $OutputDir -Filter "dev_*.db*" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 5 | 
        ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "   $($_.Name) - $size MB - $($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Gray
        }
    
    # Calculate total backup size
    $totalSize = (Get-ChildItem -Path $OutputDir -Filter "dev_*.db*" | 
        Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host ""
    Write-Host "📊 Total backup size: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Gray
    
    # Cleanup old backups (keep last 10)
    $allBackups = Get-ChildItem -Path $OutputDir -Filter "dev_*.db*" | 
        Sort-Object LastWriteTime -Descending
    
    if ($allBackups.Count -gt 10) {
        Write-Host ""
        Write-Host "🧹 Cleaning up old backups (keeping 10 most recent)..." -ForegroundColor Cyan
        
        $allBackups | Select-Object -Skip 10 | ForEach-Object {
            Write-Host "   Removing: $($_.Name)" -ForegroundColor Gray
            Remove-Item -Path $_.FullName -Force
        }
        
        Write-Host "✓ Cleanup complete" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "✅ Backup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Tip: Use -Compress flag to create compressed backups" -ForegroundColor Yellow
    Write-Host "   Example: npm run db:backup -- -Compress" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "❌ Backup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
