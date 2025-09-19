# Simple Spontra Smoke Tests - No Unicode
param(
    [string]$DatabaseUrl = "postgres://spontra:development@localhost:15432/search_service_db?sslmode=disable",
    [string]$SearchServiceUrl = "http://localhost:8084"
)

Write-Host "Starting Spontra Smoke Tests..." -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# Test 1: Database Connection
Write-Host "Testing database connection... " -NoNewline
try {
    $result = psql $DatabaseUrl -c "SELECT 1;" 2>$null
    Write-Host "PASS" -ForegroundColor Green
} catch {
    Write-Host "FAIL - Cannot connect to database" -ForegroundColor Red
    exit 1
}

# Test 2: Airports Count
Write-Host "Checking airports data... " -NoNewline
try {
    $airportCount = psql $DatabaseUrl -t -c "SELECT COUNT(*) FROM airports;" 2>$null | ForEach-Object { $_.Trim() }
    if ([int]$airportCount -ge 5000) {
        Write-Host "PASS ($airportCount airports)" -ForegroundColor Green
    } else {
        Write-Host "FAIL - Only $airportCount airports found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "FAIL - Error checking airports" -ForegroundColor Red
    exit 1
}

# Test 3: Flight Durations Count
Write-Host "Checking flight durations... " -NoNewline
try {
    $durationCount = psql $DatabaseUrl -t -c "SELECT COUNT(*) FROM flight_durations;" 2>$null | ForEach-Object { $_.Trim() }
    if ([int]$durationCount -ge 3000) {
        Write-Host "PASS ($durationCount routes)" -ForegroundColor Green
    } else {
        Write-Host "FAIL - Only $durationCount routes found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "FAIL - Error checking flight durations" -ForegroundColor Red
    exit 1
}

# Test 4: Search Service Health
Write-Host "Testing search service... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$SearchServiceUrl/health" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "PASS" -ForegroundColor Green
    } else {
        Write-Host "FAIL - Service returned status $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "FAIL - Service not responding" -ForegroundColor Red
    exit 1
}

# Test 5: Sample API Call
Write-Host "Testing API endpoint... " -NoNewline
try {
    $apiResponse = Invoke-WebRequest -Uri "$SearchServiceUrl/api/v1/durations/route?origin=LHR&destination=CDG" -TimeoutSec 5 -UseBasicParsing
    if ($apiResponse.Content -like "*duration*") {
        Write-Host "PASS" -ForegroundColor Green
    } else {
        Write-Host "FAIL - Invalid API response" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "FAIL - API call failed" -ForegroundColor Red
    exit 1
}

Write-Host "===============================" -ForegroundColor Cyan
Write-Host "All tests passed! System is healthy." -ForegroundColor Green
Write-Host "Airports: $airportCount | Routes: $durationCount" -ForegroundColor White
