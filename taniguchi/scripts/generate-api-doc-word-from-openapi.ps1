param(
  [Parameter(Mandatory = $true)]
  [string]$ManifestPath,
  [string]$OutputPath,
  [switch]$Publish
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir 'lib\word-api-doc-common.ps1')

function ConvertTo-HashtableDeep {
  param([Parameter(ValueFromPipeline = $true)]$InputObject)

  if ($null -eq $InputObject) {
    return $null
  }
  if ($InputObject -is [System.Collections.IDictionary]) {
    $result = @{}
    foreach ($key in $InputObject.Keys) {
      $result[$key] = ConvertTo-HashtableDeep $InputObject[$key]
    }
    return $result
  }
  if ($InputObject -is [System.Management.Automation.PSCustomObject]) {
    $result = @{}
    foreach ($property in $InputObject.PSObject.Properties) {
      $result[$property.Name] = ConvertTo-HashtableDeep $property.Value
    }
    return $result
  }
  if (($InputObject -is [System.Collections.IEnumerable]) -and -not ($InputObject -is [string])) {
    return @($InputObject | ForEach-Object { ConvertTo-HashtableDeep $_ })
  }
  return $InputObject
}

if (-not (Test-Path -LiteralPath $ManifestPath)) {
  throw "Manifest not found: $ManifestPath"
}

$resolvedManifestPath = (Resolve-Path -LiteralPath $ManifestPath).Path
$temporaryModel = Join-Path ([System.IO.Path]::GetTempPath()) ("api-word-model-{0}.json" -f [System.Guid]::NewGuid().ToString('N'))

try {
  & node (Join-Path $scriptDir 'build-api-word-model.mjs') --manifest $resolvedManifestPath --output $temporaryModel | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to build Word model from OpenAPI: $resolvedManifestPath"
  }
  $modelObject = Get-Content -Raw -Encoding UTF8 -LiteralPath $temporaryModel | ConvertFrom-Json
  $spec = ConvertTo-HashtableDeep $modelObject

  if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    if ($Publish) {
      $OutputPath = $spec.OutputPath
    }
    else {
      $baseName = [System.IO.Path]::GetFileNameWithoutExtension($spec.OutputPath)
      $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
      $OutputPath = Join-Path (Join-Path (Split-Path -Parent (Split-Path -Parent $resolvedManifestPath)) '..\参考_作業用') ("{0}_{1}.docx" -f $baseName, $timestamp)
    }
  }

  $result = New-ApiWordDocumentFromSpec -Spec $spec -OutputPathOverride $OutputPath
  Write-Output $result
}
finally {
  if (Test-Path -LiteralPath $temporaryModel) {
    Remove-Item -LiteralPath $temporaryModel -Force
  }
}
