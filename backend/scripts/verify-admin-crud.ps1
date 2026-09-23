$ErrorActionPreference = 'Stop'
$BackendBase = 'http://localhost:4000'
$TokenFile   = "$PSScriptRoot\backend-admin-token.txt"
$MidFile     = "$PSScriptRoot\backend-admin-mid.txt"

function Get-Token {
  if (Test-Path $TokenFile) {
    return Get-Content $TokenFile -Encoding utf8
  }
  $login = Invoke-RestMethod -Uri "$BackendBase/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{ username = 'admin'; password = 'admin123' } | ConvertTo-Json -Compress) -TimeoutSec 10
  $token = $login.data.token
  Set-Content -Path $TokenFile -Value $token -Encoding utf8
  return $token
}

$token = Get-Token
Write-Output "admin token loaded: $token"

$headers = @{ Authorization = "Bearer $token" }

Write-Output "`n=== GET /api/admin/stats (should be 200) ==="
Invoke-RestMethod -Uri "$BackendBase/api/admin/stats" -Headers $headers -TimeoutSec 10 | ConvertTo-Json -Depth 6

$new = @{
  title            = 'Prova Admin'
  tagline          = 'End-to-end check'
  overview         = 'Created directly against the backend.'
  posterUrl        = 'https://picsum.photos/seed/prova-admin/500/750'
  backdropUrl      = 'https://picsum.photos/seed/prova-admin-bd/1280/720'
  runtimeMinutes   = 101
  rating           = 8.7
  genres           = @('Sci-Fi', 'Thriller')
  language         = 'en'
  status           = 'released'
}

Write-Output "`n=== POST /api/movies (should be 201) ==="
$created = Invoke-RestMethod -Uri "$BackendBase/api/movies" -Method Post -Headers $headers -ContentType 'application/json' -Body $new -TimeoutSec 10
$mid = $created.data.id
Set-Content -Path $MidFile -Value $mid -Encoding utf8
Write-Output "created id: $mid"
$created.data | ConvertTo-Json -Depth 6

Write-Output "`n=== GET /api/movies/$mid (should be 200) ==="
Invoke-RestMethod -Uri "$BackendBase/api/movies/$mid" -Headers $headers -TimeoutSec 10 | ConvertTo-Json -Depth 6

Write-Output "`n=== PATCH /api/movies/$mid (should be 200) ==="
Invoke-RestMethod -Uri "$BackendBase/api/movies/$mid" -Method Patch -Headers $headers -ContentType 'application/json' -Body @{ rating = 9.0; tagline = 'Updated directly against the backend.' } -TimeoutSec 10 | ConvertTo-Json -Depth 6

Write-Output "`n=== DELETE /api/movies/$mid (should be 200) ==="
Invoke-RestMethod -Uri "$BackendBase/api/movies/$mid" -Method Delete -Headers $headers -TimeoutSec 10 | ConvertTo-Json -Depth 6

Write-Output "`n=== GET /api/movies/$mid after delete (should be 404) ==="
try {
  Invoke-RestMethod -Uri "$BackendBase/api/movies/$mid" -Headers $headers -TimeoutSec 10
  Write-Output 'STILL_FOUND'
} catch {
  Write-Output "status: $($_.StatusCode)"
}

Write-Output "`n=== GET /api/admin/stats after delete (should be 200) ==="
Invoke-RestMethod -Uri "$BackendBase/api/admin/stats" -Headers $headers -TimeoutSec 10 | ConvertTo-Json -Depth 6
