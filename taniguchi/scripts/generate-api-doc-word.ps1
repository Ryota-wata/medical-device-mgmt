param(
  [Parameter(Mandatory = $true)]
  [string]$SpecPath,
  [string]$OutputPath,
  [switch]$Publish
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir 'lib\\word-api-doc-common.ps1')

if (-not (Test-Path $SpecPath)) {
  throw "Spec not found: $SpecPath"
}

$resolvedSpecPath = (Resolve-Path $SpecPath).Path
$spec = & $resolvedSpecPath

if (-not ($spec -is [hashtable])) {
  throw "Spec must return a hashtable: $resolvedSpecPath"
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  if ($Publish) {
    $OutputPath = $spec.OutputPath
  }
  else {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($spec.OutputPath)
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $OutputPath = Join-Path 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\参考_作業用' ("{0}_{1}.docx" -f $baseName, $timestamp)
  }
}

$result = New-ApiWordDocumentFromSpec -Spec $spec -OutputPathOverride $OutputPath
Write-Output $result
