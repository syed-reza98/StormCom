# API Route Integration Test Coverage Audit
# Scans src/app/api/**/route.ts and checks for corresponding integration tests

param(
    [switch]$OutputJson
)

$ErrorActionPreference = "Stop"

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-TestSuccess {
    param([string]$Message)
    Write-Host "OK $Message" -ForegroundColor Green
}

function Write-TestWarning {
    param([string]$Message)
    Write-Host "WARN $Message" -ForegroundColor Yellow
}

function Write-TestError {
    param([string]$Message)
    Write-Host "ERROR $Message" -ForegroundColor Red
}

# Find all API routes
Write-TestHeader "Scanning API Routes"
$apiRoutes = Get-ChildItem -Path "src\app\api" -Filter "route.ts" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    $routePath = $relativePath -replace "^src/app/api/", "" -replace "/route\.ts$", ""
    [PSCustomObject]@{
        FilePath = $relativePath
        RoutePath = $routePath
        FullPath = $_.FullPath
    }
}

Write-TestSuccess "Found $($apiRoutes.Count) API routes"

# Find all integration tests
Write-TestHeader "Scanning Integration Tests"
$integrationTests = Get-ChildItem -Path "tests\integration" -Filter "*.spec.ts" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    [PSCustomObject]@{
        FilePath = $relativePath
        FullPath = $_.FullPath
    }
}

Write-TestSuccess "Found $($integrationTests.Count) integration test files"

# Map routes to tests
Write-TestHeader "Analyzing Coverage"
$results = @{
    TotalRoutes = $apiRoutes.Count
    TestedRoutes = 0
    UntestedRoutes = 0
    CoveragePercent = 0
    RouteDetails = @()
}

foreach ($route in $apiRoutes) {
    # Check if test exists for this route
    $routePattern = $route.RoutePath -replace "\[.*?\]", "*"
    $hasTest = $integrationTests | Where-Object {
        $_.FilePath -like "*/$routePattern/*" -or $_.FilePath -like "*/$($route.RoutePath)/*"
    }
    
    $routeDetail = [PSCustomObject]@{
        Route = $route.RoutePath
        FilePath = $route.FilePath
        HasTest = $hasTest -ne $null
        TestPath = if ($hasTest) { $hasTest[0].FilePath } else { $null }
    }
    
    $results.RouteDetails += $routeDetail
    
    if ($hasTest) {
        $results.TestedRoutes++
    } else {
        $results.UntestedRoutes++
    }
}

$results.CoveragePercent = [math]::Round(($results.TestedRoutes / $results.TotalRoutes) * 100, 2)

# Output results
if ($OutputJson) {
    $results | ConvertTo-Json -Depth 10
} else {
    Write-TestHeader "Coverage Summary"
    Write-Host "Total API Routes: $($results.TotalRoutes)" -ForegroundColor White
    Write-Host "Tested Routes: $($results.TestedRoutes)" -ForegroundColor Green
    Write-Host "Untested Routes: $($results.UntestedRoutes)" -ForegroundColor Red
    Write-Host "Coverage: $($results.CoveragePercent)%" -ForegroundColor $(if ($results.CoveragePercent -ge 100) { "Green" } else { "Yellow" })
    
    if ($null -ne $results.UntestedRoutes -and $results.UntestedRoutes -gt 0) {
        Write-TestHeader "Routes Missing Tests"
        $results.RouteDetails | Where-Object { -not $_.HasTest } | ForEach-Object {
            Write-TestWarning "$($_.Route) ($($_.FilePath))"
        }
        
        Write-TestHeader "Recommended Test Files to Create"
        $results.RouteDetails | Where-Object { -not $_.HasTest } | ForEach-Object {
            $testPath = "tests/integration/$($_.Route)/route.spec.ts"
            Write-Host "  $testPath" -ForegroundColor Cyan
        }
    } else {
        Write-TestSuccess "All API routes have integration tests"
    }
}

# Exit with error if coverage is not 100%
if ($results.UntestedRoutes -gt 0) {
    exit 1
} else {
    exit 0
}
