param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,
  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory,
  [int]$Dpi = 144,
  [ValidateSet('Screen', 'Print')]
  [string]$OptimizeFor = 'Screen',
  [string]$PdfToPpmPath = 'C:\Users\ryoku\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $InputPath)) {
  throw "DOCX not found: $InputPath"
}
if (-not (Test-Path -LiteralPath $PdfToPpmPath)) {
  throw "pdftoppm not found: $PdfToPpmPath"
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
if (-not (Test-Path -LiteralPath $resolvedOutput)) {
  New-Item -ItemType Directory -Path $resolvedOutput -Force | Out-Null
}

$pdfPath = Join-Path $resolvedOutput ([System.IO.Path]::GetFileNameWithoutExtension($resolvedInput) + '.pdf')
$pagePrefix = Join-Path $resolvedOutput 'page'
$stagePath = Join-Path $resolvedOutput 'render-stage.txt'
$word = $null
$document = $null

function Set-RenderStage {
  param([string]$Stage)
  [System.IO.File]::WriteAllText($stagePath, $Stage, [System.Text.UTF8Encoding]::new($false))
}

try {
  Set-RenderStage 'starting-word'
  Write-Output "Starting Word COM"
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $word.Options.UpdateLinksAtOpen = $false
  $word.Options.CheckGrammarAsYouType = $false
  $word.Options.CheckSpellingAsYouType = $false
  Set-RenderStage 'opening-docx'
  Write-Output "Opening DOCX"
  $document = $word.Documents.Open($resolvedInput, $false, $true)
  Set-RenderStage 'exporting-pdf'
  Write-Output "Exporting PDF"
  $optimizeForValue = if ($OptimizeFor -eq 'Screen') { 1 } else { 0 }
  # Keep the verification render independent from the default printer. Screen
  # optimization is sufficient for layout QA and avoids Word's print-layout
  # export path stalling on hosts without a responsive printer driver.
  $document.ExportAsFixedFormat(
    $pdfPath,
    17,
    $false,
    $optimizeForValue,
    0,
    1,
    1,
    0,
    $true,
    $true,
    0,
    $true,
    $true,
    $false
  )
  Set-RenderStage 'pdf-exported'
  Write-Output "PDF export completed"
}
finally {
  if ($null -ne $document) {
    $document.Close(0)
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($document)
  }
  if ($null -ne $word) {
    $word.Quit()
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

Write-Output "Rasterizing PDF"
Set-RenderStage 'rasterizing-pdf'
& $PdfToPpmPath -png -r $Dpi $pdfPath $pagePrefix
if ($LASTEXITCODE -ne 0) {
  throw "pdftoppm failed with exit code $LASTEXITCODE"
}

$pages = @(Get-ChildItem -LiteralPath $resolvedOutput -Filter 'page-*.png' | Sort-Object Name)
if ($pages.Count -eq 0) {
  throw 'No page images were generated.'
}
Set-RenderStage 'completed'

Write-Output ([pscustomobject]@{
  PdfPath = $pdfPath
  PageCount = $pages.Count
  FirstPage = $pages[0].FullName
  LastPage = $pages[-1].FullName
})
