param(
  [string]$WorkbookPath = (Join-Path $PSScriptRoot '..\db\データベース定義書.xlsx'),
  [string]$PumlPath = (Join-Path $PSScriptRoot '..\db\db-schema.puml'),
  [string]$ErSvgPath = (Join-Path $PSScriptRoot '..\db\db-schema.svg'),
  [string]$ReportPath = (Join-Path $PSScriptRoot '..\db\db-definition-sync-report.json'),
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Resolve-AbsolutePath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return [System.IO.Path]::GetFullPath($Path)
  }
  return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
}

function Escape-XmlText {
  param([AllowNull()][object]$Value)
  if ($null -eq $Value) { return '' }
  return [System.Security.SecurityElement]::Escape([string]$Value)
}

function Normalize-Text {
  param([AllowNull()][string]$Text)
  if ([string]::IsNullOrWhiteSpace($Text)) { return $null }
  return (($Text -replace "`r", "`n") -replace "[`t ]+", ' ' -replace " *`n+ *", ' ').Trim()
}

function Get-TextRowHeight {
  param(
    [AllowNull()][string]$Text,
    [int]$BaseHeight = 20,
    [int]$CharsPerLine = 90,
    [int]$LineHeight = 18,
    [int]$MaxHeight = 144
  )

  if ([string]::IsNullOrWhiteSpace($Text)) { return $BaseHeight }
  $lineCount = [Math]::Max(1, [Math]::Ceiling(([double]$Text.Length) / $CharsPerLine))
  $height = $BaseHeight + (($lineCount - 1) * $LineHeight)
  return [int]([Math]::Min($MaxHeight, $height))
}

function Get-SvgDimensions {
  param([string]$Path)

  $svg = Get-Content -Raw -Encoding UTF8 -LiteralPath $Path
  if ($svg -match 'viewBox="0 0 ([0-9.]+) ([0-9.]+)"') {
    return [pscustomobject]@{
      Width = [double]$matches[1]
      Height = [double]$matches[2]
    }
  }
  if ($svg -match 'width="([0-9.]+)px?"[^>]*height="([0-9.]+)px?"') {
    return [pscustomobject]@{
      Width = [double]$matches[1]
      Height = [double]$matches[2]
    }
  }
  throw "SVG dimensions not found: $Path"
}

function Parse-DataType {
  param([string]$RawType)
  $value = $RawType.Trim()
  if ($value -match '^([a-zA-Z0-9_]+)\(([^)]+)\)$') {
    return [pscustomobject]@{
      DataType = $matches[1]
      Length = $matches[2]
    }
  }
  return [pscustomobject]@{
    DataType = $value
    Length = $null
  }
}

function Parse-PumlSchema {
  param([string]$Path)

  $lines = Get-Content -Path $Path -Encoding UTF8
  $entities = New-Object System.Collections.Generic.List[object]
  $byAlias = @{}

  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match '^\s*entity\s+"([^"]+)"\s+as\s+([A-Za-z0-9_]+)\s*\{') {
      $alias = $matches[2]
      $entity = [ordered]@{
        Physical = $alias
        DisplayName = $matches[1]
        Columns = New-Object System.Collections.Generic.List[object]
        Note = $null
      }

      $i++
      while ($i -lt $lines.Count -and $lines[$i] -notmatch '^\s*\}\s*$') {
        $columnLine = $lines[$i]
        if ($columnLine -match '^\s*(\*)?\s*([^/]+?)\s*/\s*([A-Za-z0-9_]+)\s*:\s*(.+?)\s*$') {
          $type = Parse-DataType $matches[4]
          $entity.Columns.Add([pscustomobject]@{
            Logical = $matches[2].Trim()
            Physical = $matches[3].Trim()
            DataType = $type.DataType
            Length = $type.Length
            IsPrimaryKey = -not [string]::IsNullOrEmpty($matches[1])
          }) | Out-Null
        }
        $i++
      }

      $entityObject = [pscustomobject]$entity
      $entities.Add($entityObject) | Out-Null
      $byAlias[$alias] = $entityObject
    }
  }

  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*note\s+right\s+of\s+([A-Za-z0-9_]+)\s*$') {
      $alias = $matches[1]
      $noteLines = New-Object System.Collections.Generic.List[string]
      $i++
      while ($i -lt $lines.Count -and $lines[$i] -notmatch '^\s*end\s+note\s*$') {
        $noteLines.Add($lines[$i].Trim()) | Out-Null
        $i++
      }
      if ($byAlias.ContainsKey($alias)) {
        $byAlias[$alias].Note = Normalize-Text (($noteLines | Where-Object { $_ -ne '' }) -join "`n")
      }
    }
  }

  return $entities
}

function Read-SharedStrings {
  param([string]$ExtractRoot)

  $path = Join-Path $ExtractRoot 'xl\sharedStrings.xml'
  $values = New-Object System.Collections.Generic.List[string]
  if (-not (Test-Path $path)) { return $values }

  [xml]$xml = Get-Content -Raw -Encoding UTF8 -Path $path
  $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
  $ns.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
  foreach ($si in $xml.SelectNodes('//x:si', $ns)) {
    $textNodes = $si.SelectNodes('.//x:t', $ns)
    $values.Add((($textNodes | ForEach-Object { $_.InnerText }) -join '')) | Out-Null
  }
  return $values
}

function Get-WorksheetCellMap {
  param(
    [string]$SheetPath,
    [System.Collections.Generic.List[string]]$SharedStrings
  )

  $cells = @{}
  if (-not (Test-Path $SheetPath)) { return $cells }

  [xml]$xml = Get-Content -Raw -Encoding UTF8 -Path $SheetPath
  $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
  $ns.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')

  foreach ($cell in $xml.SelectNodes('//x:sheetData/x:row/x:c', $ns)) {
    $ref = $cell.GetAttribute('r')
    $type = $cell.GetAttribute('t')
    $value = $null
    if ($type -eq 's') {
      $idxNode = $cell.SelectSingleNode('./x:v', $ns)
      if ($idxNode) {
        $idx = [int]$idxNode.InnerText
        if ($idx -ge 0 -and $idx -lt $SharedStrings.Count) { $value = $SharedStrings[$idx] }
      }
    } elseif ($type -eq 'inlineStr') {
      $texts = $cell.SelectNodes('.//x:t', $ns)
      if ($texts) { $value = (($texts | ForEach-Object { $_.InnerText }) -join '') }
    } else {
      $v = $cell.SelectSingleNode('./x:v', $ns)
      if ($v) { $value = $v.InnerText }
    }
    if ($null -ne $value) { $cells[$ref] = $value }
  }
  return $cells
}

function Get-Cell {
  param(
    [hashtable]$Cells,
    [string]$Address
  )
  if ($Cells.ContainsKey($Address)) { return $Cells[$Address] }
  return $null
}

function Get-WorkbookSheetInfo {
  param([string]$ExtractRoot)

  [xml]$workbook = Get-Content -Raw -Encoding UTF8 -Path (Join-Path $ExtractRoot 'xl\workbook.xml')
  [xml]$rels = Get-Content -Raw -Encoding UTF8 -Path (Join-Path $ExtractRoot 'xl\_rels\workbook.xml.rels')
  $ns = New-Object System.Xml.XmlNamespaceManager($workbook.NameTable)
  $ns.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')

  $relMap = @{}
  foreach ($rel in $rels.Relationships.Relationship) {
    $relMap[$rel.Id] = $rel.Target
  }

  $sheets = New-Object System.Collections.Generic.List[object]
  foreach ($sheet in $workbook.SelectNodes('//x:sheets/x:sheet', $ns)) {
    $rid = $sheet.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $target = $relMap[$rid]
    if ($target -like '/xl/*') { $target = $target.Substring(4) }
    $sheets.Add([pscustomobject]@{
      Name = $sheet.GetAttribute('name')
      SheetId = [int]$sheet.GetAttribute('sheetId')
      RelationshipId = $rid
      Target = $target
      Path = Join-Path (Join-Path $ExtractRoot 'xl') ($target -replace '/', '\')
    }) | Out-Null
  }
  return $sheets
}

function Get-ExistingWorkbookMetadata {
  param(
    [string]$ExtractRoot,
    [System.Collections.Generic.List[string]]$SharedStrings
  )

  $specialSheets = @('表紙', 'Ver管理', 'テーブル一覧', 'ER図')
  $metadata = @{}
  foreach ($sheet in (Get-WorkbookSheetInfo $ExtractRoot)) {
    if ($specialSheets -contains $sheet.Name) { continue }
    $cells = Get-WorksheetCellMap -SheetPath $sheet.Path -SharedStrings $SharedStrings
    $physical = Get-Cell $cells 'C2'
    if ([string]::IsNullOrWhiteSpace($physical)) { continue }

    $columns = @{}
    for ($row = 9; $row -le 400; $row++) {
      $columnPhysical = Get-Cell $cells "E$row"
      if ([string]::IsNullOrWhiteSpace($columnPhysical)) { continue }
      $columns[$columnPhysical] = [pscustomobject]@{
        Logical = Get-Cell $cells "B$row"
        Physical = $columnPhysical
        DataType = Get-Cell $cells "H$row"
        Length = Get-Cell $cells "J$row"
        NotNull = Get-Cell $cells "L$row"
        HalfFull = Get-Cell $cells "M$row"
        Alpha = Get-Cell $cells "N$row"
        Digit = Get-Cell $cells "O$row"
        PrimaryKey = Get-Cell $cells "P$row"
        ForeignKey = Get-Cell $cells "Q$row"
        AutoNumber = Get-Cell $cells "R$row"
        DefaultValue = Get-Cell $cells "S$row"
        Remarks = Get-Cell $cells "U$row"
      }
    }

    $metadata[$physical] = [pscustomobject]@{
      Sheet = $sheet
      TableLogical = Get-Cell $cells 'C1'
      Summary = Get-Cell $cells 'C3'
      Columns = $columns
    }
  }
  return $metadata
}

function New-SheetName {
  param(
    [string]$PhysicalName,
    [System.Collections.Generic.HashSet[string]]$UsedNames
  )

  $name = $PhysicalName -replace '[:\\/\?\*\[\]]', '_'
  if ($name.Length -gt 31) { $name = $name.Substring(0, 31) }
  $candidate = $name
  $n = 2
  while ($UsedNames.Contains($candidate)) {
    $suffix = "~$n"
    $baseLength = 31 - $suffix.Length
    $candidate = $name
    if ($candidate.Length -gt $baseLength) { $candidate = $candidate.Substring(0, $baseLength) }
    $candidate = "$candidate$suffix"
    $n++
  }
  $UsedNames.Add($candidate) | Out-Null
  return $candidate
}

function Derive-LogicalTableName {
  param(
    [object]$Entity,
    [AllowNull()][object]$Existing
  )

  if ($Existing -and -not [string]::IsNullOrWhiteSpace($Existing.TableLogical) -and $Existing.TableLogical -ne '要確認') {
    return $Existing.TableLogical
  }
  $pk = $Entity.Columns | Where-Object { $_.IsPrimaryKey } | Select-Object -First 1
  if ($pk -and $pk.Logical -match '(.+?)ID$') { return $matches[1] }
  return $Entity.Physical
}

function Get-DefaultEntitySummary {
  param([string]$PhysicalName)

  $summaries = @{
    column_catalogs = '機能別に表示・設定可能なカラム定義を保持するマスタ。関連機能、分類、利用文脈、表示順、有効状態を管理する。'
    facility_column_settings = '施設単位で利用可能なカラムを制御する設定。column_catalogs のカラムごとの有効/無効を施設別に保持する。'
    user_facility_column_settings = 'ユーザーの施設割当単位でカラム表示可否を制御する設定。施設設定に対する個別の有効/無効を保持する。'
    facility_collaboration_group_facilities = '施設協業グループに所属する施設を保持する中間テーブル。グループ経由で閲覧・共有対象となる施設範囲を定義する。'
    facility_external_view_settings = '公開元施設が他施設へ共有するデータ種別の有効/無効を保持する設定。協業グループで見せるデータ範囲の基礎となる。'
    facility_external_column_settings = '公開元施設が他施設へ共有するカラムの有効/無効を保持する設定。外部公開時に表示可能な項目をカラム単位で制御する。'
    ship_room_categories = 'SHIP連携で利用する諸室区分のマスタ。諸室区分1・2、表示順、有効状態を保持する。'
    facility_location_remodels = '施設ロケーションのリモデル後の所属・棟階・室情報を保持する。既存ロケーションに対する移設/再編後の候補情報を管理する。'
    edit_list_facilities = '編集リストの対象施設を保持する中間テーブル。編集リストがどの施設を対象とし、どの役割で扱うかを管理する。'
    edit_list_item_attachments = '編集リスト明細に紐づく添付ファイル情報を保持する。ファイル名、パス、表示順、登録者、削除状態を管理する。'
    application_status_definitions = '申請種別ごとのステータス定義を保持するマスタ。表示順、初期状態、終端状態を管理する。'
    application_status_transitions = '申請種別ごとのステータス遷移を保持する定義。遷移元/先、アクションコード、コメント必須条件を管理する。'
    application_approval_steps = '申請に紐づく承認ステップの進行状態を保持する。ラウンド、順序、現在ステップ、担当・処理結果を管理する。'
    application_approval_step_assignees = '承認ステップに割り当てられた承認者・承認単位を保持する。並列承認、代理、処理状態、コメントを管理する。'
    application_documents = '申請、明細、見積、保守契約、点検、資産調査などに紐づく添付ファイル/写真を保持する共通ドキュメントテーブル。'
    application_task_steps = '申請に紐づく業務工程の進行状態を保持する。工程順、再実行番号、現在工程、担当者、完了情報を管理する。'
    purchase_application_details = '購入申請固有の詳細情報を保持する。購入区分、優先順位、希望納期、用途、接続要望、廃棄同意を管理する。'
    borrowing_application_details = '借用申請固有の詳細情報を保持する。貸出元、希望納品/返却日、契約、納品・返却実績、承認コメントを管理する。'
    borrowing_application_purposes = '借用申請の利用目的を保持する明細テーブル。目的コードとその他目的詳細を申請単位で管理する。'
    borrowing_cost_burdens = '借用申請における費用負担区分を保持する明細テーブル。費用区分と負担先を申請単位で管理する。'
    transfer_application_details = '移動申請固有の詳細情報を保持する。移動元/先ロケーション、移動先の棟階・部門部署・室名、移動理由を管理する。'
    disposal_application_details = '廃棄申請固有の詳細情報を保持する。廃棄理由、関連申請、業者受付、見積/発注/廃棄予定、検収情報を管理する。'
    orders = '見積・業者に基づく発注情報を保持する。発注番号、支払条件、リース条件、納品/検収、合計金額、発注状態を管理する。'
    order_items = '発注に含まれる品目明細を保持する。見積明細との紐づけ、品目・メーカー・型式、数量、単価、金額、納品日を管理する。'
    inspection_menus = '点検で使用するメニュー定義を保持する。日常/定期などの種別、周期、対象分類、有効状態を管理する。'
    inspection_menu_items = '点検メニューに含まれる点検項目を保持する。表示順、点検内容、入力種別、評価種別、単位、選択肢を管理する。'
    lending_transaction_status_definitions = '貸出取引のステータス定義を保持するマスタ。表示順、初期状態、終端状態を管理する。'
    lending_transaction_status_transitions = '貸出取引のステータス遷移を保持する定義。遷移元/先と遷移アクションを管理する。'
    vendors = '施設ごとの業者/連絡先情報を保持するマスタ。インボイス番号、業者名、住所、担当者、連絡先、主担当状態を管理する。'
    purchase_applications = '購入申請一覧・詳細表示向けのビュー。申請、購入申請詳細、対象資産、編集リスト、見積依頼の情報を集約する。'
    repair_requests = '修理依頼一覧・詳細表示向けのビュー。申請、修理依頼詳細、対象資産の情報を集約し、修理進行状況を表示する。'
    asset_survey_integration_session_targets = '資産調査統合セッションで統合対象となる調査セッションを保持する。施設と対象調査セッションの組み合わせを管理する。'
    asset_survey_integration_result_records = '資産調査統合結果で採用された調査レコードを保持する。寄与区分、採用状態、現行採用、資産反映対象を管理する。'
    asset_survey_integration_result_documents = '資産調査統合結果に伴う写真/ドキュメントの引継ぎ情報を保持する。元/反映先ドキュメント、引継ぎ区分、代表写真を管理する。'
  }

  if ($summaries.ContainsKey($PhysicalName)) { return $summaries[$PhysicalName] }
  return $null
}

function Get-EntitySummary {
  param(
    [object]$Entity,
    [AllowNull()][object]$Existing
  )

  if (-not [string]::IsNullOrWhiteSpace($Entity.Note)) { return $Entity.Note }
  if (
    $Existing -and
    -not [string]::IsNullOrWhiteSpace($Existing.Summary) -and
    $Existing.Summary -notlike '要確認*'
  ) { return $Existing.Summary }
  $defaultSummary = Get-DefaultEntitySummary -PhysicalName $Entity.Physical
  if (-not [string]::IsNullOrWhiteSpace($defaultSummary)) { return $defaultSummary }
  return '要確認'
}

function Get-NonBlankValue {
  param(
    [AllowNull()][object]$Value,
    [AllowNull()][object]$DefaultValue = '-'
  )

  if ($null -ne $Value -and -not [string]::IsNullOrWhiteSpace([string]$Value)) {
    return $Value
  }
  return $DefaultValue
}

function Get-NormalizedColumnType {
  param([AllowNull()][string]$DataType)
  if ([string]::IsNullOrWhiteSpace($DataType)) { return '' }
  return (($DataType -replace '\s+\[generated\]$', '').Trim().ToLowerInvariant())
}

function Test-CharacterColumnType {
  param([string]$DataType)
  $type = Get-NormalizedColumnType $DataType
  return @('char', 'varchar', 'text', 'json') -contains $type
}

function Test-NumericColumnType {
  param([string]$DataType)
  $type = Get-NormalizedColumnType $DataType
  return @('bigint', 'int', 'integer', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'double') -contains $type
}

function Get-DefaultColumnLength {
  param(
    [object]$Column,
    [AllowNull()][object]$ExistingColumn,
    [AllowNull()][string]$ParsedLength
  )

  if (-not [string]::IsNullOrWhiteSpace($ParsedLength)) { return $ParsedLength }
  if ($ExistingColumn -and -not [string]::IsNullOrWhiteSpace($ExistingColumn.Length)) { return $ExistingColumn.Length }

  $type = Get-NormalizedColumnType $Column.DataType
  switch ($type) {
    'bigint' { return '8' }
    'int' { return '4' }
    'integer' { return '4' }
    'smallint' { return '2' }
    'tinyint' { return '1' }
    'boolean' { return '1' }
    'date' { return '3' }
    'time' { return '3' }
    'timestamp' { return '8' }
    'char' { return '1' }
    default { return '-' }
  }
}

function Get-DefaultHalfFull {
  param([object]$Column)

  if (-not (Test-CharacterColumnType $Column.DataType)) { return '-' }
  if ($Column.Physical -match '(?i)(^|_)(id|code|email|mail|phone|tel|fax|token|password|hash|url|uri|path|key|type|status|no|number|zip|postal|ip|uuid)(_|$)') {
    return '半角'
  }
  return '半角/全角'
}

function Get-DefaultAlphaFlag {
  param([object]$Column)

  if (Test-CharacterColumnType $Column.DataType) { return '○' }
  return '-'
}

function Get-DefaultDigitFlag {
  param([object]$Column)

  if ((Test-CharacterColumnType $Column.DataType) -or (Test-NumericColumnType $Column.DataType)) { return '○' }
  return '-'
}

function Get-DefaultValueForColumn {
  param([object]$Column)

  if ($Column.Physical -eq 'created_at') { return 'CURRENT_TIMESTAMP' }
  if ($Column.Physical -eq 'updated_at') { return 'CURRENT_TIMESTAMP' }
  return '-'
}

function Get-DefaultRemarksForColumn {
  param(
    [object]$Column,
    [string]$ForeignKey,
    [string]$AutoNumber
  )

  $remarks = New-Object System.Collections.Generic.List[string]
  if ($Column.IsPrimaryKey) { $remarks.Add('主キー') | Out-Null }
  if ($ForeignKey -eq '○') { $remarks.Add('外部キー') | Out-Null }
  if ($AutoNumber -eq 'AUTO_INCREMENT') { $remarks.Add('自動採番') | Out-Null }
  if ($Column.DataType -match '\[generated\]' -or $Column.Physical -match '^active_.*_unique_key$') {
    $remarks.Add('生成列') | Out-Null
  }
  if ($Column.Physical -eq 'created_at') { $remarks.Add('作成日時') | Out-Null }
  if ($Column.Physical -eq 'updated_at') { $remarks.Add('更新日時') | Out-Null }
  if ($Column.Physical -eq 'deleted_at') { $remarks.Add('論理削除日時') | Out-Null }
  if ($remarks.Count -gt 0) { return ($remarks -join '、') }
  return '-'
}

function Merge-ColumnMetadata {
  param(
    [object]$Column,
    [AllowNull()][object]$ExistingColumn
  )

  $length = $Column.Length
  if ([string]::IsNullOrWhiteSpace($length) -and $ExistingColumn -and $ExistingColumn.DataType -eq $Column.DataType) {
    $length = $ExistingColumn.Length
  }
  $length = Get-DefaultColumnLength -Column $Column -ExistingColumn $ExistingColumn -ParsedLength $length

  $notNull = if ($ExistingColumn) { $ExistingColumn.NotNull } else { $null }
  if ($Column.IsPrimaryKey) { $notNull = '○' }
  $notNull = Get-NonBlankValue $notNull '-'

  $foreignKey = if ($ExistingColumn -and -not [string]::IsNullOrWhiteSpace($ExistingColumn.ForeignKey)) {
    $ExistingColumn.ForeignKey
  } elseif (-not $Column.IsPrimaryKey -and $Column.Physical -match '(^|_)id$') {
    '○'
  } else {
    '-'
  }

  $autoNumber = if ($ExistingColumn -and -not [string]::IsNullOrWhiteSpace($ExistingColumn.AutoNumber)) {
    $ExistingColumn.AutoNumber
  } elseif ($Column.IsPrimaryKey -and (Get-NormalizedColumnType $Column.DataType) -eq 'bigint') {
    'AUTO_INCREMENT'
  } else {
    '-'
  }

  $defaultValue = Get-NonBlankValue $(if ($ExistingColumn) { $ExistingColumn.DefaultValue } else { $null }) (Get-DefaultValueForColumn $Column)
  $remarks = Get-NonBlankValue $(if ($ExistingColumn) { $ExistingColumn.Remarks } else { $null }) (Get-DefaultRemarksForColumn -Column $Column -ForeignKey $foreignKey -AutoNumber $autoNumber)

  return [pscustomobject]@{
    Logical = $Column.Logical
    Physical = $Column.Physical
    DataType = $Column.DataType
    Length = $length
    NotNull = $notNull
    HalfFull = Get-NonBlankValue $(if ($ExistingColumn) { $ExistingColumn.HalfFull } else { $null }) (Get-DefaultHalfFull $Column)
    Alpha = Get-NonBlankValue $(if ($ExistingColumn) { $ExistingColumn.Alpha } else { $null }) (Get-DefaultAlphaFlag $Column)
    Digit = Get-NonBlankValue $(if ($ExistingColumn) { $ExistingColumn.Digit } else { $null }) (Get-DefaultDigitFlag $Column)
    PrimaryKey = if ($Column.IsPrimaryKey) { '○' } else { '-' }
    ForeignKey = $foreignKey
    AutoNumber = $autoNumber
    DefaultValue = $defaultValue
    Remarks = $remarks
  }
}

function New-CellXml {
  param(
    [string]$Ref,
    [int]$Style,
    [AllowNull()][object]$Value
  )

  if ($null -eq $Value -or [string]::IsNullOrEmpty([string]$Value)) {
    return "<c r=`"$Ref`" s=`"$Style`"/>"
  }

  if ($Value -is [int] -or $Value -is [long] -or $Value -is [double] -or $Value -is [decimal]) {
    return "<c r=`"$Ref`" s=`"$Style`"><v>$Value</v></c>"
  }

  $escaped = Escape-XmlText $Value
  return "<c r=`"$Ref`" s=`"$Style`" t=`"inlineStr`"><is><t>$escaped</t></is></c>"
}

function New-TableRowXml {
  param(
    [int]$RowNumber,
    [object]$Column,
    [int]$No
  )

  $styles = @{
    A = 2; B = 34; C = 35; D = 36; E = 34; F = 35; G = 36; H = 34; I = 36; J = 34; K = 36
    L = 2; M = 2; N = 2; O = 2; P = 2; Q = 2; R = 2; S = 34; T = 36
    U = 34; V = 35; W = 35; X = 35; Y = 35; Z = 35; AA = 35; AB = 36
  }
  $values = @{
    A = $No; B = $Column.Logical; E = $Column.Physical; H = $Column.DataType; J = $Column.Length
    L = $Column.NotNull; M = $Column.HalfFull; N = $Column.Alpha; O = $Column.Digit
    P = $Column.PrimaryKey; Q = $Column.ForeignKey; R = $Column.AutoNumber
    S = $Column.DefaultValue; U = $Column.Remarks
  }
  $cols = @('A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','AA','AB')
  $cells = foreach ($col in $cols) {
    New-CellXml -Ref "$col$RowNumber" -Style $styles[$col] -Value $values[$col]
  }
  return "<row r=`"$RowNumber`" spans=`"1:28`" ht=`"18.75`" customHeight=`"1`">$($cells -join '')</row>"
}

function New-TableWorksheetXml {
  param(
    [string]$TemplateXml,
    [object]$Table
  )

  $lastRow = 8 + $Table.Columns.Count
  $summaryHeight = Get-TextRowHeight -Text $Table.Summary -BaseHeight 20 -CharsPerLine 85 -LineHeight 18 -MaxHeight 144
  $rows = New-Object System.Collections.Generic.List[string]
  $valueCols = @('C','D','E','F','G','H','I','J','K','L')
  $mergedValueStyles = @{ C = 37; D = 38; E = 38; F = 38; G = 38; H = 38; I = 38; J = 38; K = 38; L = 39 }

  $logicalNameCells = ($valueCols | ForEach-Object { New-CellXml "$_`1" $mergedValueStyles[$_] $(if ($_ -eq 'C') { $Table.LogicalName } else { $null }) }) -join ''
  $physicalNameCells = ($valueCols | ForEach-Object { New-CellXml "$_`2" $mergedValueStyles[$_] $(if ($_ -eq 'C') { $Table.PhysicalName } else { $null }) }) -join ''
  $summaryCells = ($valueCols | ForEach-Object { New-CellXml "$_`3" $mergedValueStyles[$_] $(if ($_ -eq 'C') { $Table.Summary } else { $null }) }) -join ''

  $rows.Add("<row r=`"1`" spans=`"1:12`" ht=`"18.75`" customHeight=`"1`">$(New-CellXml A1 40 'テーブル名(論理)')$(New-CellXml B1 42 $null)$logicalNameCells</row>") | Out-Null
  $rows.Add("<row r=`"2`" spans=`"1:12`" ht=`"18.75`" customHeight=`"1`">$(New-CellXml A2 40 'テーブル名(物理)')$(New-CellXml B2 42 $null)$physicalNameCells</row>") | Out-Null
  $rows.Add("<row r=`"3`" spans=`"1:12`" ht=`"$summaryHeight`" customHeight=`"1`">$(New-CellXml A3 40 '概要')$(New-CellXml B3 42 $null)$summaryCells</row>") | Out-Null

  $headerValues = @{
    A='No.'; B='論理名'; E='物理名'; H='データ型'; J='桁(バイト)'; L='Not Null'; M='半角/全角'; N='英字'; O='数字'; P='PK'; Q='FK'; R='自動採番'; S='デフォルト値'; U='備考'
  }
  $headerStyles = @{
    A=3; B=40; C=41; D=42; E=40; F=41; G=42; H=40; I=42; J=40; K=42; L=3; M=3; N=3; O=3; P=3; Q=3; R=3; S=40; T=42; U=40; V=41; W=41; X=41; Y=41; Z=41; AA=41; AB=42
  }
  $cols = @('A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','AA','AB')
  $headerCells = foreach ($col in $cols) {
    New-CellXml -Ref "$col`8" -Style $headerStyles[$col] -Value $headerValues[$col]
  }
  $rows.Add("<row r=`"8`" spans=`"1:28`" ht=`"18.75`" customHeight=`"1`">$($headerCells -join '')</row>") | Out-Null

  for ($idx = 0; $idx -lt $Table.Columns.Count; $idx++) {
    $rows.Add((New-TableRowXml -RowNumber (9 + $idx) -Column $Table.Columns[$idx] -No (1 + $idx))) | Out-Null
  }

  $merges = New-Object System.Collections.Generic.List[string]
  foreach ($ref in @('A1:B1','C1:L1','A2:B2','C2:L2','A3:B3','C3:L3','B8:D8','E8:G8','H8:I8','J8:K8','S8:T8','U8:AB8')) {
    $merges.Add("<mergeCell ref=`"$ref`"/>") | Out-Null
  }
  for ($r = 9; $r -le $lastRow; $r++) {
    foreach ($ref in @("B$r`:D$r","E$r`:G$r","H$r`:I$r","J$r`:K$r","S$r`:T$r","U$r`:AB$r")) {
      $merges.Add("<mergeCell ref=`"$ref`"/>") | Out-Null
    }
  }

  $sheetData = "<sheetData>$($rows -join '')</sheetData>"
  $mergeXml = "<mergeCells count=`"$($merges.Count)`">$($merges -join '')</mergeCells>"

  $xml = [regex]::Replace($TemplateXml, '<dimension ref="[^"]+"\s*/>', "<dimension ref=`"A1:AB$lastRow`"/>")
  $xml = [regex]::Replace($xml, '<sheetData>.*?</sheetData>', $sheetData, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if ($xml -match '<mergeCells\b') {
    $xml = [regex]::Replace($xml, '<mergeCells\b[^>]*>.*?</mergeCells>', $mergeXml, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  } else {
    $xml = $xml -replace '</sheetData>', "</sheetData>$mergeXml"
  }
  return $xml
}

function New-TableListWorksheetXml {
  param(
    [string]$OriginalXml,
    [object[]]$Tables
  )

  $lastRow = 9 + $Tables.Count
  $xmlDoc = [xml]$OriginalXml
  $ns = New-Object System.Xml.XmlNamespaceManager($xmlDoc.NameTable)
  $ns.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
  $staticRows = New-Object System.Collections.ArrayList
  foreach ($row in $xmlDoc.SelectNodes('//x:sheetData/x:row', $ns)) {
    if ([int]$row.GetAttribute('r') -lt 9) { $staticRows.Add($row.OuterXml) | Out-Null }
  }

  $rows = New-Object System.Collections.ArrayList
  foreach ($staticRow in $staticRows) {
    $rows.Add($staticRow) | Out-Null
  }
  $tableNameCols = @('C','D','E','F','G','H','I','J','K')
  $summaryCols = @('L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','AA','AB','AC','AD','AE','AF','AG','AH','AI','AJ','AK','AL','AM','AN','AO','AP','AQ','AR','AS','AT','AU','AV','AW','AX','AY','AZ','BA','BB','BC','BD','BE')
  $headerStyleFor = { param([string]$Col, [string]$FirstCol, [string]$LastCol) if ($Col -eq $FirstCol) { 40 } elseif ($Col -eq $LastCol) { 42 } else { 41 } }
  $bodyStyleFor = { param([string]$Col, [string]$FirstCol, [string]$LastCol) if ($Col -eq $FirstCol) { 34 } elseif ($Col -eq $LastCol) { 36 } else { 35 } }

  $headerCells = New-Object System.Collections.ArrayList
  foreach ($col in $tableNameCols) {
    $style = & $headerStyleFor $col 'C' 'K'
    $headerCells.Add((New-CellXml -Ref "$col`9" -Style $style -Value $(if ($col -eq 'C') { 'テーブル名' } else { $null }))) | Out-Null
  }
  foreach ($col in $summaryCols) {
    $style = & $headerStyleFor $col 'L' 'BE'
    $headerCells.Add((New-CellXml -Ref "$col`9" -Style $style -Value $(if ($col -eq 'L') { '概要' } else { $null }))) | Out-Null
  }
  $rows.Add("<row r=`"9`" ht=`"18.75`" customHeight=`"1`">$($headerCells -join '')</row>") | Out-Null

  for ($idx = 0; $idx -lt $Tables.Count; $idx++) {
    $rowNo = 10 + $idx
    $table = $Tables[$idx]
    $rowHeight = Get-TextRowHeight -Text $table.Summary -BaseHeight 45 -CharsPerLine 170 -LineHeight 18 -MaxHeight 108
    $cells = New-Object System.Collections.ArrayList
    foreach ($col in $tableNameCols) {
      $style = & $bodyStyleFor $col 'C' 'K'
      $cells.Add((New-CellXml -Ref "$col$rowNo" -Style $style -Value $(if ($col -eq 'C') { $table.PhysicalName } else { $null }))) | Out-Null
    }
    foreach ($col in $summaryCols) {
      $style = & $bodyStyleFor $col 'L' 'BE'
      $cells.Add((New-CellXml -Ref "$col$rowNo" -Style $style -Value $(if ($col -eq 'L') { $table.Summary } else { $null }))) | Out-Null
    }
    $rows.Add("<row r=`"$rowNo`" ht=`"$rowHeight`" customHeight=`"1`">$($cells -join '')</row>") | Out-Null
  }

  $mergeRefs = New-Object System.Collections.ArrayList
  foreach ($merge in $xmlDoc.SelectNodes('//x:mergeCells/x:mergeCell', $ns)) {
    if ($merge.GetAttribute('ref') -match '^[A-Z]+([0-9]+):[A-Z]+([0-9]+)$') {
      if ([int]$matches[1] -lt 9 -and [int]$matches[2] -lt 9) {
        $mergeRefs.Add($merge.GetAttribute('ref')) | Out-Null
      }
    }
  }
  $mergeRefs.Add('C9:K9') | Out-Null
  $mergeRefs.Add('L9:BE9') | Out-Null
  for ($rowNo = 10; $rowNo -le $lastRow; $rowNo++) {
    $mergeRefs.Add("C$rowNo`:K$rowNo") | Out-Null
    $mergeRefs.Add("L$rowNo`:BE$rowNo") | Out-Null
  }

  $sheetData = "<sheetData>$($rows -join '')</sheetData>"
  $mergeCellsXml = ($mergeRefs | ForEach-Object { '<mergeCell ref="' + (Escape-XmlText $_) + '"/>' }) -join ''
  $mergeXml = "<mergeCells count=`"$($mergeRefs.Count)`">$mergeCellsXml</mergeCells>"
  $xml = [regex]::Replace($OriginalXml, '<dimension ref="[^"]+"\s*/>', "<dimension ref=`"A1:BE$lastRow`"/>")
  $xml = [regex]::Replace($xml, '<sheetData>.*?</sheetData>', $sheetData, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  $xml = [regex]::Replace($xml, '<mergeCells\b[^>]*>.*?</mergeCells>', $mergeXml, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  return $xml
}

function Update-WorkbookXml {
  param(
    [string]$WorkbookXmlPath,
    [object[]]$SheetEntries
  )

  $xml = Get-Content -Raw -Encoding UTF8 -Path $WorkbookXmlPath
  $sheetXml = ($SheetEntries | ForEach-Object {
    "<sheet name=`"$(Escape-XmlText $_.Name)`" sheetId=`"$($_.SheetId)`" r:id=`"$($_.RelationshipId)`"/>"
  }) -join ''
  $xml = [regex]::Replace($xml, '<sheets>.*?</sheets>', "<sheets>$sheetXml</sheets>", [System.Text.RegularExpressions.RegexOptions]::Singleline)
  Set-Content -Path $WorkbookXmlPath -Value $xml -Encoding UTF8 -NoNewline
}

function Update-WorkbookRelationships {
  param(
    [string]$RelsPath,
    [object[]]$SheetEntries
  )

  [xml]$rels = Get-Content -Raw -Encoding UTF8 -Path $RelsPath
  $worksheetType = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet'
  $existingWorksheetRels = @($rels.Relationships.Relationship | Where-Object { $_.Type -eq $worksheetType })
  foreach ($rel in $existingWorksheetRels) {
    [void]$rels.Relationships.RemoveChild($rel)
  }
  foreach ($sheet in $SheetEntries) {
    $rel = $rels.CreateElement('Relationship', 'http://schemas.openxmlformats.org/package/2006/relationships')
    $rel.SetAttribute('Id', $sheet.RelationshipId)
    $rel.SetAttribute('Type', $worksheetType)
    $rel.SetAttribute('Target', $sheet.Target)
    [void]$rels.Relationships.AppendChild($rel)
  }
  $settings = New-Object System.Xml.XmlWriterSettings
  $settings.Encoding = New-Object System.Text.UTF8Encoding($false)
  $settings.Indent = $false
  $writer = [System.Xml.XmlWriter]::Create($RelsPath, $settings)
  try { $rels.Save($writer) } finally { $writer.Dispose() }
}

function Update-ContentTypes {
  param(
    [string]$ContentTypesPath,
    [object[]]$SheetEntries
  )

  [xml]$types = Get-Content -Raw -Encoding UTF8 -LiteralPath $ContentTypesPath
  $worksheetContentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml'
  $worksheetOverrides = @($types.Types.Override | Where-Object { $_.ContentType -eq $worksheetContentType })
  foreach ($override in $worksheetOverrides) {
    [void]$types.Types.RemoveChild($override)
  }
  foreach ($sheet in $SheetEntries) {
    $override = $types.CreateElement('Override', 'http://schemas.openxmlformats.org/package/2006/content-types')
    $override.SetAttribute('PartName', "/xl/$($sheet.Target)")
    $override.SetAttribute('ContentType', $worksheetContentType)
    [void]$types.Types.AppendChild($override)
  }
  $settings = New-Object System.Xml.XmlWriterSettings
  $settings.Encoding = New-Object System.Text.UTF8Encoding($false)
  $settings.Indent = $false
  $writer = [System.Xml.XmlWriter]::Create($ContentTypesPath, $settings)
  try { $types.Save($writer) } finally { $writer.Dispose() }
}

function Set-WrapTextStyles {
  param(
    [string]$StylesPath,
    [int[]]$StyleIndexes
  )

  [xml]$styles = Get-Content -Raw -Encoding UTF8 -LiteralPath $StylesPath
  $ns = New-Object System.Xml.XmlNamespaceManager($styles.NameTable)
  $ns.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
  $cellXfs = $styles.SelectSingleNode('//x:cellXfs', $ns)
  $xfs = @($cellXfs.SelectNodes('./x:xf', $ns))
  foreach ($styleIndex in $StyleIndexes) {
    if ($styleIndex -lt 0 -or $styleIndex -ge $xfs.Count) { continue }
    $xf = $xfs[$styleIndex]
    $alignment = $xf.SelectSingleNode('./x:alignment', $ns)
    if (-not $alignment) {
      $alignment = $styles.CreateElement('alignment', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
      [void]$xf.AppendChild($alignment)
    }
    $alignment.SetAttribute('wrapText', '1')
    $alignment.SetAttribute('vertical', 'center')
    $xf.SetAttribute('applyAlignment', '1')
  }

  $settings = New-Object System.Xml.XmlWriterSettings
  $settings.Encoding = New-Object System.Text.UTF8Encoding($false)
  $settings.Indent = $false
  $writer = [System.Xml.XmlWriter]::Create($StylesPath, $settings)
  try { $styles.Save($writer) } finally { $writer.Dispose() }
}

function Set-DbHeaderStyles {
  param([string]$StylesPath)

  [xml]$styles = Get-Content -Raw -Encoding UTF8 -LiteralPath $StylesPath
  $ns = New-Object System.Xml.XmlNamespaceManager($styles.NameTable)
  $ns.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
  $cellXfs = $styles.SelectSingleNode('//x:cellXfs', $ns)
  $xfs = @($cellXfs.SelectNodes('./x:xf', $ns))

  while ($xfs.Count -lt 40) {
    $placeholder = $styles.CreateElement('xf', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $placeholder.SetAttribute('numFmtId', '0')
    $placeholder.SetAttribute('fontId', '0')
    $placeholder.SetAttribute('fillId', '0')
    $placeholder.SetAttribute('borderId', '0')
    $placeholder.SetAttribute('xfId', '0')
    [void]$cellXfs.AppendChild($placeholder)
    $xfs = @($cellXfs.SelectNodes('./x:xf', $ns))
  }

  $definitions = @(
    @{ Index = 40; BorderId = '2' },
    @{ Index = 41; BorderId = '3' },
    @{ Index = 42; BorderId = '4' }
  )

  foreach ($definition in $definitions) {
    $xf = $styles.CreateElement('xf', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $xf.SetAttribute('numFmtId', '0')
    $xf.SetAttribute('fontId', '3')
    $xf.SetAttribute('fillId', '3')
    $xf.SetAttribute('borderId', $definition.BorderId)
    $xf.SetAttribute('xfId', '0')
    $xf.SetAttribute('applyFont', '1')
    $xf.SetAttribute('applyFill', '1')
    $xf.SetAttribute('applyBorder', '1')
    $xf.SetAttribute('applyAlignment', '1')

    $alignment = $styles.CreateElement('alignment', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $alignment.SetAttribute('wrapText', '1')
    $alignment.SetAttribute('vertical', 'center')
    [void]$xf.AppendChild($alignment)

    if ($xfs.Count -gt $definition.Index) {
      [void]$cellXfs.ReplaceChild($xf, $xfs[$definition.Index])
    } else {
      [void]$cellXfs.AppendChild($xf)
    }
    $xfs = @($cellXfs.SelectNodes('./x:xf', $ns))
  }

  $cellXfs.SetAttribute('count', [string]$xfs.Count)
  $settings = New-Object System.Xml.XmlWriterSettings
  $settings.Encoding = New-Object System.Text.UTF8Encoding($false)
  $settings.Indent = $false
  $writer = [System.Xml.XmlWriter]::Create($StylesPath, $settings)
  try { $styles.Save($writer) } finally { $writer.Dispose() }
}

function Update-ErDiagramWorksheet {
  param(
    [string]$ExtractRoot,
    [string]$SvgPath,
    [int]$DisplayWidthPx = 3000
  )

  if (-not (Test-Path -LiteralPath $SvgPath)) { return $false }

  $drawingPath = Join-Path $ExtractRoot 'xl\drawings\drawing2.xml'
  $svgMediaPath = Join-Path $ExtractRoot 'xl\media\image2.svg'
  if (-not (Test-Path -LiteralPath $drawingPath)) { return $false }
  if (-not (Test-Path -LiteralPath $svgMediaPath)) { return $false }

  Copy-Item -LiteralPath $SvgPath -Destination $svgMediaPath -Force

  $dimensions = Get-SvgDimensions -Path $SvgPath
  $displayHeightPx = [int][Math]::Round($DisplayWidthPx * $dimensions.Height / $dimensions.Width)
  $cx = [int64]($DisplayWidthPx * 9525)
  $cy = [int64]($displayHeightPx * 9525)

  $drawingXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="$cx" cy="$cy"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="4" name="ER図"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"><a:extLst><a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}"><asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="rId2"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="$cx" cy="$cy"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>
"@

  Set-Content -LiteralPath $drawingPath -Value $drawingXml -Encoding UTF8 -NoNewline
  return $true
}

function Get-MaxRelationshipNumber {
  param([string]$RelsPath)
  [xml]$rels = Get-Content -Raw -Encoding UTF8 -Path $RelsPath
  $max = 0
  foreach ($rel in $rels.Relationships.Relationship) {
    if ($rel.Id -match '^rId(\d+)$') { $max = [Math]::Max($max, [int]$matches[1]) }
  }
  return $max
}

function Get-MaxWorksheetNumber {
  param([string]$WorksheetDir)
  $max = 0
  Get-ChildItem -Path $WorksheetDir -Filter 'sheet*.xml' | ForEach-Object {
    if ($_.BaseName -match '^sheet(\d+)$') { $max = [Math]::Max($max, [int]$matches[1]) }
  }
  return $max
}

$workbookFullPath = Resolve-AbsolutePath $WorkbookPath
$pumlFullPath = Resolve-AbsolutePath $PumlPath
$erSvgFullPath = Resolve-AbsolutePath $ErSvgPath
$reportFullPath = Resolve-AbsolutePath $ReportPath

if (-not (Test-Path $workbookFullPath)) { throw "Workbook not found: $workbookFullPath" }
if (-not (Test-Path $pumlFullPath)) { throw "PUML not found: $pumlFullPath" }

$entities = Parse-PumlSchema -Path $pumlFullPath
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("db-definition-sync-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempRoot | Out-Null

try {
  [System.IO.Compression.ZipFile]::ExtractToDirectory($workbookFullPath, $tempRoot)

  $sharedStrings = Read-SharedStrings -ExtractRoot $tempRoot
  $existingMetadata = Get-ExistingWorkbookMetadata -ExtractRoot $tempRoot -SharedStrings $sharedStrings
  $existingTableNames = @($existingMetadata.Keys)
  $schemaTableNames = @($entities | ForEach-Object { $_.Physical })
  $newSchemaTables = @($schemaTableNames | Where-Object { $_ -notin $existingTableNames })
  $obsoleteWorkbookTables = @($existingTableNames | Where-Object { $_ -notin $schemaTableNames })
  $updatedTables = @($schemaTableNames | Where-Object { $_ -in $existingTableNames })

  $sheetInfo = Get-WorkbookSheetInfo -ExtractRoot $tempRoot
  $sheetByName = @{}
  foreach ($sheet in $sheetInfo) { $sheetByName[$sheet.Name] = $sheet }
  $specialEntries = @('表紙', 'Ver管理', 'テーブル一覧', 'ER図') | ForEach-Object { $sheetByName[$_] }

  $usedSheetNames = New-Object System.Collections.Generic.HashSet[string]([StringComparer]::OrdinalIgnoreCase)
  foreach ($sheet in $specialEntries) { $usedSheetNames.Add($sheet.Name) | Out-Null }

  $maxRel = Get-MaxRelationshipNumber -RelsPath (Join-Path $tempRoot 'xl\_rels\workbook.xml.rels')
  $maxWorksheet = Get-MaxWorksheetNumber -WorksheetDir (Join-Path $tempRoot 'xl\worksheets')
  $templateSheet = $existingMetadata.Values | Select-Object -First 1
  if (-not $templateSheet) { throw 'No table worksheet template found.' }
  $templateXml = Get-Content -Raw -Encoding UTF8 -Path $templateSheet.Sheet.Path

  $tables = New-Object System.Collections.Generic.List[object]
  $sheetEntries = New-Object System.Collections.Generic.List[object]
  foreach ($entry in $specialEntries) { $sheetEntries.Add($entry) | Out-Null }

  foreach ($entity in $entities) {
    $existing = if ($existingMetadata.ContainsKey($entity.Physical)) { $existingMetadata[$entity.Physical] } else { $null }
    $sheetEntry = $null
    if ($existing) {
      $sheetEntry = $existing.Sheet
      $usedSheetNames.Add($sheetEntry.Name) | Out-Null
    } else {
      $maxRel++
      $maxWorksheet++
      $sheetEntry = [pscustomobject]@{
        Name = New-SheetName -PhysicalName $entity.Physical -UsedNames $usedSheetNames
        SheetId = 0
        RelationshipId = "rId$maxRel"
        Target = "worksheets/sheet$maxWorksheet.xml"
        Path = Join-Path (Join-Path $tempRoot 'xl') "worksheets\sheet$maxWorksheet.xml"
      }
    }

    $columns = New-Object System.Collections.Generic.List[object]
    foreach ($column in $entity.Columns) {
      $existingColumn = if ($existing -and $existing.Columns.ContainsKey($column.Physical)) { $existing.Columns[$column.Physical] } else { $null }
      $columns.Add((Merge-ColumnMetadata -Column $column -ExistingColumn $existingColumn)) | Out-Null
    }

    $table = [pscustomobject]@{
      PhysicalName = $entity.Physical
      LogicalName = Derive-LogicalTableName -Entity $entity -Existing $existing
      Summary = Get-EntitySummary -Entity $entity -Existing $existing
      Columns = $columns
      Sheet = $sheetEntry
    }
    $tables.Add($table) | Out-Null
    $sheetEntries.Add($sheetEntry) | Out-Null
  }

  $sheetId = 1
  foreach ($entry in $sheetEntries) {
    $entry.SheetId = $sheetId
    $sheetId++
  }

  foreach ($table in $tables) {
    $xml = New-TableWorksheetXml -TemplateXml $templateXml -Table $table
    Set-Content -Path $table.Sheet.Path -Value $xml -Encoding UTF8 -NoNewline
  }

  $tableListSheet = $sheetByName['テーブル一覧']
  $tableListXml = Get-Content -Raw -Encoding UTF8 -Path $tableListSheet.Path
  $tableListXml = New-TableListWorksheetXml -OriginalXml $tableListXml -Tables $tables.ToArray()
  Set-Content -Path $tableListSheet.Path -Value $tableListXml -Encoding UTF8 -NoNewline

  $usedTargets = New-Object System.Collections.Generic.HashSet[string]([StringComparer]::OrdinalIgnoreCase)
  foreach ($sheet in $sheetEntries) { $usedTargets.Add($sheet.Target) | Out-Null }
  foreach ($sheet in $sheetInfo) {
    if ($sheet.Target -like 'worksheets/*' -and -not $usedTargets.Contains($sheet.Target)) {
      $path = Join-Path (Join-Path $tempRoot 'xl') ($sheet.Target -replace '/', '\')
      if (Test-Path $path) { Remove-Item -LiteralPath $path }
    }
  }

  $sheetEntryArray = $sheetEntries.ToArray()
  Update-WorkbookXml -WorkbookXmlPath (Join-Path $tempRoot 'xl\workbook.xml') -SheetEntries $sheetEntryArray
  Update-WorkbookRelationships -RelsPath (Join-Path $tempRoot 'xl\_rels\workbook.xml.rels') -SheetEntries $sheetEntryArray
  Update-ContentTypes -ContentTypesPath (Join-Path $tempRoot '[Content_Types].xml') -SheetEntries $sheetEntryArray
  Set-DbHeaderStyles -StylesPath (Join-Path $tempRoot 'xl\styles.xml')
  Set-WrapTextStyles -StylesPath (Join-Path $tempRoot 'xl\styles.xml') -StyleIndexes @(2, 3, 24, 28, 29, 34, 35, 36, 37, 38, 39)

  $reviewItems = New-Object System.Collections.Generic.List[object]
  $erDiagramUpdated = $false
  if (Test-Path -LiteralPath $erSvgFullPath) {
    $erDiagramUpdated = Update-ErDiagramWorksheet -ExtractRoot $tempRoot -SvgPath $erSvgFullPath
    if (-not $erDiagramUpdated) {
      $reviewItems.Add([ordered]@{
        Type = 'ER図'
        Reason = 'Excel ER図シートの画像差し替え先が見つからないため、db-schema.svgを反映できない。'
      }) | Out-Null
    } elseif ((Get-Item -LiteralPath $erSvgFullPath).LastWriteTime -lt (Get-Item -LiteralPath $pumlFullPath).LastWriteTime) {
      $reviewItems.Add([ordered]@{
        Type = 'ER図'
        Reason = 'db-schema.svgがdb-schema.pumlより古いため、PlantUMLでSVGを再生成してから同期する必要がある。'
      }) | Out-Null
    }
  } else {
    $reviewItems.Add([ordered]@{
      Type = 'ER図'
      Reason = 'db-schema.svgが存在しないため、Excel ER図シートを更新できない。'
    }) | Out-Null
  }

  $report = [ordered]@{
    DryRun = [bool]$DryRun
    GeneratedAt = (Get-Date).ToString('s')
    WorkbookInputPath = $workbookFullPath
    WorkbookOutputPath = $workbookFullPath
    PumlPath = $pumlFullPath
    TableCountBefore = $existingTableNames.Count
    TableCountAfter = $tables.Count
    NewSchemaTables = @($newSchemaTables)
    ObsoleteWorkbookTables = @($obsoleteWorkbookTables)
    UpdatedTables = @($updatedTables)
    ErDiagramUpdated = $erDiagramUpdated
    ErSvgPath = $erSvgFullPath
    ReviewItemCount = $reviewItems.Count
    ReviewItems = @($reviewItems.ToArray())
  }

  if ($DryRun) {
    $report | ConvertTo-Json -Depth 8
  } else {
    $outPath = Join-Path ([System.IO.Path]::GetTempPath()) ("db-definition-sync-out-" + [guid]::NewGuid().ToString('N') + '.xlsx')
    if (Test-Path $outPath) { Remove-Item -LiteralPath $outPath }
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempRoot, $outPath)
    Move-Item -LiteralPath $outPath -Destination $workbookFullPath -Force
    $report | ConvertTo-Json -Depth 8 | Set-Content -Path $reportFullPath -Encoding UTF8
    $report | ConvertTo-Json -Depth 8
  }
} finally {
  if (Test-Path $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force }
}
