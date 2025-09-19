# Spontra Database Smoke Tests - PowerShell Version
# Prevents accidental data loss and ensures core functionality

param(
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$SearchServiceUrl = $env:SEARCH_SERVICE_URL
)

# Default values
if (-not $DatabaseUrl) { $DatabaseUrl = "postgres://spontra:development@localhost:15432/search_service_db?sslmode=disable" }
if (-not $SearchServiceUrl) { $SearchServiceUrl = "http://localhost:8084" }

$MinimumAirports = 5000
$MinimumFlightDurations = 3000
$MinimumApiResponseTime = 5000  # 5 seconds max

Write-Host "Starting Spontra Smoke Tests..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Test 1: Database Connection
Write-Host "Testing database connection... " -NoNewline
try {
    $null = psql $DatabaseUrl -c "SELECT 1;" 2>$null
    Write-Host "PASS" -ForegroundColor Green
} catch {
    Write-Host "FAIL - Cannot connect to database" -ForegroundColor Red
    exit 1
}

# Test 2: Airports Data Integrity
Write-Host "Checking airports data... " -NoNewline
try {
    $airportCount = psql $DatabaseUrl -t -c "SELECT COUNT(*) FROM airports;" | ForEach-Object { $_.Trim() }
    if ([int]$airportCount -ge $MinimumAirports) {
        Write-Host "PASS ($airportCount airports)" -ForegroundColor Green
    } else {
        Write-Host "FAIL - Only $airportCount airports (minimum: $MinimumAirports)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL - Error checking airports" -ForegroundColor Red
    exit 1
}

# Test 3: Flight Durations Data Integrity
Write-Host "⏱️  Checking flight durations data... " -NoNewline
try {
    $durationCount = psql $DatabaseUrl -t -c "SELECT COUNT(*) FROM flight_durations;" | ForEach-Object { $_.Trim() }
    if ([int]$durationCount -ge $MinimumFlightDurations) {
        Write-Host "✅ PASS ($durationCount routes)" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL - Only $durationCount routes (minimum: $MinimumFlightDurations)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL - Error checking flight durations" -ForegroundColor Red
    exit 1
}

# Test 4: Data Quality Checks
Write-Host "🔍 Checking data quality... " -NoNewline
try {
    $invalidData = psql $DatabaseUrl -t -c @"
SELECT COUNT(*) FROM flight_durations 
WHERE duration_minutes <= 0 
OR distance_km <= 0 
OR origin_airport = destination_airport
OR length(origin_airport) != 3 
OR length(destination_airport) != 3;
"@ | ForEach-Object { $_.Trim() }

    if ([int]$invalidData -eq 0) {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING - $invalidData invalid records found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAIL - Error checking data quality" -ForegroundColor Red
    exit 1
}

# Test 5: Search Service Health
Write-Host "🔍 Testing search service health... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$SearchServiceUrl/health" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL - Search service returned status $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL - Search service not responding" -ForegroundColor Red
    exit 1
}

# Test 6: Core API Endpoints
Write-Host "🌐 Testing core API endpoints... " -NoNewline
try {
    $startTime = Get-Date
    $routeTest = Invoke-WebRequest -Uri "$SearchServiceUrl/api/v1/durations/route?origin=LHR&destination=CDG" -TimeoutSec 5 -UseBasicParsing
    $endTime = Get-Date
    $responseTime = ($endTime - $startTime).TotalMilliseconds

    if ($routeTest.Content -like "*duration*") {
        if ($responseTime -le $MinimumApiResponseTime) {
            Write-Host "✅ PASS ($([int]$responseTime)ms)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  SLOW - $([int]$responseTime)ms response time" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ FAIL - API not returning valid data" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL - API endpoint error" -ForegroundColor Red
    exit 1
}

# Test 7: Sample Data Verification
Write-Host "📊 Verifying sample routes... " -NoNewline
$sampleRoutes = @(
    @("LHR", "CDG"),  # London to Paris
    @("FRA", "FCO"),  # Frankfurt to Rome  
    @("AMS", "BCN")   # Amsterdam to Barcelona
)

$failedRoutes = 0
foreach ($route in $sampleRoutes) {
    $origin = $route[0]
    $dest = $route[1]
    $result = psql $DatabaseUrl -t -c "SELECT COUNT(*) FROM flight_durations WHERE origin_airport='$origin' AND destination_airport='$dest';" | ForEach-Object { $_.Trim() }
    if ([int]$result -eq 0) {
        $failedRoutes++
    }
}

if ($failedRoutes -eq 0) {
    Write-Host "✅ PASS" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING - $failedRoutes sample routes missing" -ForegroundColor Yellow
}

# Test 8: Database Indexes
Write-Host "⚡ Checking database indexes... " -NoNewline
try {
    $indexCount = psql $DatabaseUrl -t -c @"
SELECT COUNT(*) FROM pg_indexes 
WHERE tablename IN ('airports', 'flight_durations') 
AND indexname LIKE 'idx_%';
"@ | ForEach-Object { $_.Trim() }

    if ([int]$indexCount -ge 2) {
        Write-Host "✅ PASS ($indexCount indexes)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING - Only $indexCount performance indexes found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAIL - Error checking indexes" -ForegroundColor Red
    exit 1
}

# Test 9: Data Freshness
Write-Host "🕒 Checking data freshness... " -NoNewline
try {
    $oldestData = psql $DatabaseUrl -t -c @"
SELECT EXTRACT(DAYS FROM NOW() - MIN(created_at)) 
FROM flight_durations;
"@ | ForEach-Object { $_.Trim() }

    $daysOld = [math]::Floor([double]$oldestData)
    if ($daysOld -le 7) {
        Write-Host "✅ PASS ($daysOld days old)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING - Data is $daysOld days old" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAIL - Error checking data freshness" -ForegroundColor Red
    exit 1
}

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "🎉 All critical tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "📈 Summary:"
Write-Host "  • Airports: $airportCount"
Write-Host "  • Flight Routes: $durationCount"  
Write-Host "  • API Response Time: $([int]$responseTime)ms"
Write-Host "  • Data Age: $daysOld days"
Write-Host ""
Write-Host "🚀 System is ready for development/production!" -ForegroundColor Green
