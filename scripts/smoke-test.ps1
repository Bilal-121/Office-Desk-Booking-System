$base = 'http://localhost:3001'
$results = @()

function Add-Result($name, $ok, $detail) {
  $status = if ($ok) { 'PASS' } else { 'FAIL' }
  $script:results += "[$status] $name - $detail"
}

try {
  foreach ($path in @('/auth/login','/auth/register','/')) {
    try {
      $r = Invoke-WebRequest -UseBasicParsing -Uri ($base + $path) -Method GET -MaximumRedirection 0 -ErrorAction Stop
      Add-Result "Page $path" $true "HTTP $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Add-Result "Page $path" ($code -eq 302 -or $code -eq 307 -or $code -eq 200) "HTTP $code"
    }
  }

  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $csrfResp = Invoke-RestMethod -Uri ($base + '/api/auth/csrf') -Method GET -WebSession $session
  $csrf = $csrfResp.csrfToken
  Add-Result 'Auth csrf' (![string]::IsNullOrWhiteSpace($csrf)) 'Token retrieved'

  $loginBody = @{
    csrfToken = $csrf
    email = 'user@company.com'
    password = 'password123'
    callbackUrl = ($base + '/')
    json = 'true'
  }

  Invoke-RestMethod -Uri ($base + '/api/auth/callback/credentials') -Method POST -Body $loginBody -WebSession $session -MaximumRedirection 0 -ErrorAction SilentlyContinue | Out-Null
  $sess = Invoke-RestMethod -Uri ($base + '/api/auth/session') -Method GET -WebSession $session
  $loggedIn = $sess.user -and $sess.user.email -eq 'user@company.com'
  Add-Result 'Login flow' $loggedIn ("Session user: " + ($sess.user.email))

  foreach ($path in @('/bookings','/admin')) {
    try {
      $r = Invoke-WebRequest -UseBasicParsing -Uri ($base + $path) -Method GET -WebSession $session -MaximumRedirection 0 -ErrorAction Stop
      Add-Result "Page $path (auth)" $true "HTTP $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Add-Result "Page $path (auth)" ($code -eq 302 -or $code -eq 307 -or $code -eq 200) "HTTP $code"
    }
  }

  $health = Invoke-RestMethod -Uri ($base + '/api/health') -Method GET
  Add-Result 'API health' ($health.success -eq $true) 'health endpoint'

  $floors = Invoke-RestMethod -Uri ($base + '/api/floors') -Method GET -WebSession $session
  $firstFloor = $floors.data | Select-Object -First 1
  Add-Result 'API floors' ($floors.success -eq $true -and $null -ne $firstFloor) ('floors: ' + ($floors.data.Count))

  $start = [DateTime]::UtcNow.Date.AddDays(1).AddHours(9)
  $end = [DateTime]::UtcNow.Date.AddDays(1).AddHours(17)
  $s = [Uri]::EscapeDataString($start.ToString('o'))
  $e = [Uri]::EscapeDataString($end.ToString('o'))

  $desksBefore = Invoke-RestMethod -Uri ($base + "/api/floors/$($firstFloor.id)/desks?startTime=$s&endTime=$e") -Method GET -WebSession $session
  $targetDesk = $desksBefore.data | Where-Object { -not $_.isBooked } | Select-Object -First 1
  Add-Result 'API desks before booking' ($desksBefore.success -eq $true -and $null -ne $targetDesk) ('available target: ' + ($targetDesk.id))

  $recBody = @{ startTime = $start.ToString('o'); endTime = $end.ToString('o'); floorId = $firstFloor.id } | ConvertTo-Json
  $recs = Invoke-RestMethod -Uri ($base + '/api/recommendations/desks') -Method POST -ContentType 'application/json' -Body $recBody -WebSession $session
  Add-Result 'API recommendations' ($recs.success -eq $true -and $recs.data.Count -ge 1) ('recommendations: ' + $recs.data.Count)

  $bookBody = @{ deskId = $targetDesk.id; startTime = $start.ToString('o'); endTime = $end.ToString('o') } | ConvertTo-Json
  $book = Invoke-RestMethod -Uri ($base + '/api/bookings') -Method POST -ContentType 'application/json' -Body $bookBody -WebSession $session
  $bookingId = $book.data.id
  Add-Result 'API create booking' ($book.success -eq $true -and $null -ne $bookingId) ('bookingId: ' + $bookingId)

  $desksAfter = Invoke-RestMethod -Uri ($base + "/api/floors/$($firstFloor.id)/desks?startTime=$s&endTime=$e") -Method GET -WebSession $session
  $bookedDesk = $desksAfter.data | Where-Object { $_.id -eq $targetDesk.id } | Select-Object -First 1
  Add-Result 'Desk status refresh' ($bookedDesk.isBooked -eq $true) ('isBooked=' + $bookedDesk.isBooked)

  $myBookings = Invoke-RestMethod -Uri ($base + '/api/bookings') -Method GET -WebSession $session
  $matchingBookings = @($myBookings.data | Where-Object { $_.id -eq $bookingId })
  $hasBooking = $matchingBookings.Length -gt 0
  Add-Result 'API list bookings' ($myBookings.success -eq $true -and $hasBooking) ('count: ' + $myBookings.data.Count)

  $cancel = Invoke-RestMethod -Uri ($base + "/api/bookings/$bookingId") -Method DELETE -WebSession $session
  Add-Result 'API cancel booking' ($cancel.success -eq $true) ('cancelled: ' + $bookingId)

  $desksAfterCancel = Invoke-RestMethod -Uri ($base + "/api/floors/$($firstFloor.id)/desks?startTime=$s&endTime=$e") -Method GET -WebSession $session
  $cancelledDesk = $desksAfterCancel.data | Where-Object { $_.id -eq $targetDesk.id } | Select-Object -First 1
  Add-Result 'Desk status after cancel' ($cancelledDesk.isBooked -eq $false) ('isBooked=' + $cancelledDesk.isBooked)

} catch {
  Add-Result 'Smoke test runner' $false $_.Exception.Message
}

$results | ForEach-Object { Write-Host $_ }
if (($results | Where-Object { $_ -like '[FAIL]*' }).Count -gt 0) { exit 1 } else { exit 0 }
