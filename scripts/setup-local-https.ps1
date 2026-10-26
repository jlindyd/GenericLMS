$ErrorActionPreference = 'Stop'
$principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Run this setup once in an Administrator PowerShell window so it can add the local hostname to the Windows hosts file.'
}
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$localDirectory = Join-Path $projectRoot '.local-https'
$localHostname = 'generic-local.hplife-test.dyd.solutions'
$hostsPath = Join-Path $env:SystemRoot 'System32\drivers\etc\hosts'
$hostsText = [IO.File]::ReadAllText($hostsPath)
$existing = $hostsText -split '\r?\n' | Where-Object { ($_ -notmatch '^\s*#') -and ($_ -match "\s$([regex]::Escape($localHostname))(\s|$)") }
if ($existing -and ($existing | Where-Object { $_ -notmatch '^\s*127\.0\.0\.1\s' })) { throw 'The local hostname already points somewhere else. Resolve that mapping before setup.' }
New-Item -ItemType Directory -Path $localDirectory -Force | Out-Null
$pfxPath = Join-Path $localDirectory 'localhost.pfx'
if (-not (Test-Path -LiteralPath $pfxPath)) {
  $certificate = New-SelfSignedCertificate -DnsName $localHostname -CertStoreLocation 'Cert:\CurrentUser\My' -Type SSLServerAuthentication -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 -NotAfter (Get-Date).AddMonths(6) -FriendlyName 'GenericLMS local HTTPS only'
  $randomBytes = New-Object byte[] 32
  $randomGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
  $randomGenerator.GetBytes($randomBytes)
  $randomGenerator.Dispose()
  $passphrase = [Convert]::ToBase64String($randomBytes)
  $securePassphrase = ConvertTo-SecureString $passphrase -AsPlainText -Force
  Export-PfxCertificate -Cert $certificate -FilePath $pfxPath -Password $securePassphrase | Out-Null
  [IO.File]::WriteAllText((Join-Path $localDirectory 'passphrase'), $passphrase)
  Export-Certificate -Cert $certificate -FilePath (Join-Path $localDirectory 'localhost.cer') | Out-Null
}
# Trust this endpoint's certificate only; no general-purpose development CA is installed.
Import-Certificate -FilePath (Join-Path $localDirectory 'localhost.cer') -CertStoreLocation 'Cert:\CurrentUser\Root' | Out-Null
if (-not $existing) {
  if (-not (Test-Path -LiteralPath (Join-Path $localDirectory 'hosts-before-setup'))) { [IO.File]::WriteAllText((Join-Path $localDirectory 'hosts-before-setup'), $hostsText) }
  [IO.File]::AppendAllText($hostsPath, "`r`n127.0.0.1`t$localHostname # GenericLMS local HTTPS`r`n")
}
$envPath = Join-Path $projectRoot '.env.local'
$envText = if (Test-Path -LiteralPath $envPath) { [IO.File]::ReadAllText($envPath) } else { '' }
$envText = [regex]::Replace($envText, '(?m)^NEXT_PUBLIC_LEARNER_ORIGIN=.*\r?\n?', '')
[IO.File]::WriteAllText($envPath, $envText.TrimEnd() + "`r`nNEXT_PUBLIC_LEARNER_ORIGIN=https://$localHostname`r`n")
Write-Output "Local HTTPS prepared for https://$localHostname. Rebuild/start GenericLMS, then run npm run local:https. Course rollout remains unchanged."
