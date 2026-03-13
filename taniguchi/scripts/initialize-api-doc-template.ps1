param(
  [string]$SourcePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_SHIP部署マスタ.docx',
  [string]$TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir 'lib\\word-api-doc-common.ps1')

if (-not (Test-Path $SourcePath)) {
  throw "Source doc not found: $SourcePath"
}

$templateDir = Split-Path -Parent $TemplatePath
if (-not (Test-Path $templateDir)) {
  New-Item -ItemType Directory -Path $templateDir -Force | Out-Null
}

Copy-Item $SourcePath $TemplatePath -Force

$word = $null
$doc = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $doc = $word.Documents.Open((Resolve-Path $TemplatePath).Path)

  Replace-DocumentPlaceholders -Document $doc -ReplacementMap @{
    'SHIP部署マスタ'        = '__SCREEN_LABEL__'
    '2026/3/13'             = '__REVISION_DATE__'
    '作成日：2026年3月13日' = '作成日：__COVER_DATE__'
  }

  $doc.Save()
}
finally {
  if ($doc) {
    try {
      $doc.Close(0) | Out-Null
    }
    catch {
    }
  }
  if ($word) {
    try {
      $word.Quit() | Out-Null
    }
    catch {
    }
  }
  Release-ComObjectSafely -ComObject $doc
  Release-ComObjectSafely -ComObject $word
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

Write-Output $TemplatePath
