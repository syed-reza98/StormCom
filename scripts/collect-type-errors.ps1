# PowerShell script to run type-check and save errors to JSON
# Usage: .\scripts\collect-type-errors.ps1

$ErrorActionPreference = "Continue"
$outputFile = "typescript-errors.json"

Write-Host "Running TypeScript type check..." -ForegroundColor Cyan

# Capture both stdout and stderr
$output = & npm run type-check 2>&1

# Parse the output
$errors = @()
$summary = @{
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    command = "npm run type-check"
    exitCode = $LASTEXITCODE
    totalLines = $output.Count
}

# Process output lines
$currentError = $null
foreach ($line in $output) {
    $lineText = $line.ToString()
    
    # Detect error lines (file:line:col - error TS####:)
    if ($lineText -match '^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s*(.*)$') {
        if ($currentError) {
            $errors += $currentError
        }
        
        $currentError = @{
            file = $Matches[1]
            line = [int]$Matches[2]
            column = [int]$Matches[3]
            severity = $Matches[4]
            code = $Matches[5]
            message = $Matches[6].Trim()
            fullText = $lineText
        }
    }
    # Alternative format: src/file.ts:line:col - error TS####:
    elseif ($lineText -match '^(.+?):(\d+):(\d+)\s+-\s+(error|warning)\s+(TS\d+):\s*(.*)$') {
        if ($currentError) {
            $errors += $currentError
        }
        
        $currentError = @{
            file = $Matches[1]
            line = [int]$Matches[2]
            column = [int]$Matches[3]
            severity = $Matches[4]
            code = $Matches[5]
            message = $Matches[6].Trim()
            fullText = $lineText
        }
    }
    # Continuation of previous error message
    elseif ($currentError -and $lineText -match '^\s+(.+)$') {
        $currentError.message += " " + $Matches[1].Trim()
    }
}

# Add last error if exists
if ($currentError) {
    $errors += $currentError
}

# Extract summary information
$foundErrors = 0
$foundWarnings = 0
foreach ($line in $output) {
    $lineText = $line.ToString()
    if ($lineText -match 'Found (\d+) error[s]?') {
        $foundErrors = [int]$Matches[1]
    }
    if ($lineText -match 'Found (\d+) warning[s]?') {
        $foundWarnings = [int]$Matches[1]
    }
}

# Build final JSON structure
$result = @{
    summary = @{
        timestamp = $summary.timestamp
        command = $summary.command
        exitCode = $summary.exitCode
        totalErrors = if ($foundErrors -gt 0) { $foundErrors } else { $errors.Count }
        totalWarnings = $foundWarnings
        totalLines = $summary.totalLines
    }
    errors = $errors
    rawOutput = $output | ForEach-Object { $_.ToString() }
}

# Convert to JSON and save
$jsonOutput = $result | ConvertTo-Json -Depth 10

try {
    $jsonOutput | Out-File -FilePath $outputFile -Encoding UTF8
    Write-Host "`nType check results saved to $outputFile" -ForegroundColor Green
    Write-Host "Total errors found: $($result.summary.totalErrors)" -ForegroundColor $(if ($result.summary.totalErrors -gt 0) { "Red" } else { "Green" })
    Write-Host "Total warnings found: $($result.summary.totalWarnings)" -ForegroundColor Yellow
} catch {
    Write-Host "Error saving to file: $_" -ForegroundColor Red
    exit 1
}

# Exit with same code as type-check
exit $summary.exitCode
