#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Disables TLS 1.0 and TLS 1.1 on Windows Server (Schannel) and enforces TLS 1.2 / TLS 1.3.

.DESCRIPTION
    Remediates VA-006: Deprecated & Insecure TLS Protocol Supported.
    Modifies the Windows Schannel registry under:
        HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols

    A SERVER REBOOT is required for the changes to take effect.

.NOTES
    Run as Administrator on the IIS host. Test in a non-production environment first.
    Verify with: openssl s_client -connect <host>:443 -tls1 (should fail after reboot)
                 openssl s_client -connect <host>:443 -tls1_2 (should succeed)
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$protocolsRoot = 'HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols'

function Set-SchannelProtocol {
    param(
        [string]$Protocol,
        [bool]$Enabled
    )
    $enabledValue      = if ($Enabled) { 1 } else { 0 }
    $disabledByDefault = if ($Enabled) { 0 } else { 1 }

    foreach ($role in @('Server', 'Client')) {
        $keyPath = Join-Path $protocolsRoot "$Protocol\$role"
        if (-not (Test-Path $keyPath)) {
            New-Item -Path $keyPath -Force | Out-Null
        }
        Set-ItemProperty -Path $keyPath -Name 'Enabled'          -Value $enabledValue      -Type DWord
        Set-ItemProperty -Path $keyPath -Name 'DisabledByDefault' -Value $disabledByDefault -Type DWord
        Write-Host "[$Protocol\$role] Enabled=$enabledValue  DisabledByDefault=$disabledByDefault"
    }
}

Write-Host "`n=== Disabling deprecated TLS protocols ==="
Set-SchannelProtocol -Protocol 'SSL 2.0' -Enabled $false
Set-SchannelProtocol -Protocol 'SSL 3.0' -Enabled $false
Set-SchannelProtocol -Protocol 'TLS 1.0' -Enabled $false
Set-SchannelProtocol -Protocol 'TLS 1.1' -Enabled $false

Write-Host "`n=== Enabling current TLS protocols ==="
Set-SchannelProtocol -Protocol 'TLS 1.2' -Enabled $true
Set-SchannelProtocol -Protocol 'TLS 1.3' -Enabled $true   # Requires Windows Server 2022 / Windows 11

Write-Host "`n=== Enforcing strong cipher order (IIS) ==="
# Disable RC4 and 3DES at the cipher level
$ciphersRoot = 'HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Ciphers'
foreach ($weakCipher in @('RC4 128/128', 'RC4 64/64', 'RC4 56/56', 'RC4 40/128', 'Triple DES 168')) {
    $cipherKey = Join-Path $ciphersRoot $weakCipher
    if (-not (Test-Path $cipherKey)) { New-Item -Path $cipherKey -Force | Out-Null }
    Set-ItemProperty -Path $cipherKey -Name 'Enabled' -Value 0 -Type DWord
    Write-Host "[Cipher\$weakCipher] Disabled"
}

Write-Host "`n=== Setting TLS cipher suite order via Group Policy ==="
# Enforce a modern cipher suite order (AES-GCM / CHACHA20 preferred; no CBC before TLS 1.3)
$cipherSuites = @(
    'TLS_AES_256_GCM_SHA384',
    'TLS_AES_128_GCM_SHA256',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
    'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
    'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
    'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
    'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
    'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256'
)

$policyKey = 'HKLM:\SOFTWARE\Policies\Microsoft\Cryptography\Configuration\SSL\00010002'
if (-not (Test-Path $policyKey)) { New-Item -Path $policyKey -Force | Out-Null }
Set-ItemProperty -Path $policyKey -Name 'Functions' -Value ($cipherSuites -join ',') -Type String
Write-Host "Cipher suite order updated."

Write-Host "`n=== Summary ==="
Write-Host "  SSL 2.0  : DISABLED"
Write-Host "  SSL 3.0  : DISABLED"
Write-Host "  TLS 1.0  : DISABLED"
Write-Host "  TLS 1.1  : DISABLED"
Write-Host "  TLS 1.2  : ENABLED"
Write-Host "  TLS 1.3  : ENABLED  (Windows Server 2022 / Windows 11+ only)"
Write-Host ""
Write-Host "ACTION REQUIRED: Restart the server for Schannel changes to take effect."
Write-Host "VERIFY with:     openssl s_client -connect <host>:443 -tls1_1"
Write-Host "                 (connection should be refused after reboot)"
