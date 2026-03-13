param(
  [string]$TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\作成済み\API設計書_現有品調査.docx',
  [string]$OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\作成済み\API設計書_SHIP施設マスタ.docx',
  [string]$ScreenLabel = 'SHIP施設マスタ',
  [string]$CoverDateText = '2026年3月12日',
  [string]$RevisionDateText = '2026/03/12'
)

$ErrorActionPreference = 'Stop'

$wdStyleNormal = -1
$wdStyleHeading1 = -2
$wdStyleHeading2 = -3
$wdStyleHeading3 = -4
$wdStyleHeading4 = -5
$wdStyleTableGrid = -155
$wdFindContinue = 1
$wdReplaceAll = 2
$wdCollapseEnd = 0
$wdColorAutomatic = 0
$wdBorderTop = -1
$wdBorderLeft = -2
$wdBorderBottom = -3
$wdBorderRight = -4
$wdBorderHorizontal = -5
$wdBorderVertical = -6
$wdLineStyleSingle = 1
$wdLineWidth050pt = 4

function Replace-AllText {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)][string]$FindText,
    [Parameter(Mandatory = $true)][string]$ReplaceText
  )

  $story = $Document.StoryRanges.Item(1)
  while ($story -ne $null) {
    $find = $story.Find
    $find.ClearFormatting()
    $find.Replacement.ClearFormatting()
    $find.Text = $FindText
    $find.Replacement.Text = $ReplaceText
    $find.Forward = $true
    $find.Wrap = $wdFindContinue
    $find.Format = $false
    $find.MatchCase = $false
    $find.MatchWholeWord = $false
    $find.MatchWildcards = $false
    $find.MatchSoundsLike = $false
    $find.MatchAllWordForms = $false
    $find.Execute(
      $FindText,
      $false,
      $false,
      $false,
      $false,
      $false,
      $true,
      $wdFindContinue,
      $false,
      $ReplaceText,
      $wdReplaceAll
    ) | Out-Null

    $story = $story.NextStoryRange
  }
}

function Find-RangeByText {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)][string]$Text
  )

  $range = $Document.Content
  $find = $range.Find
  $find.ClearFormatting()
  $find.Text = $Text
  $find.Forward = $true
  $find.Wrap = 0
  $find.MatchCase = $false
  $find.MatchWholeWord = $false
  $find.MatchWildcards = $false

  if (-not $find.Execute()) {
    throw "Text not found: $Text"
  }

  return $range
}

function Set-ReplacementBodyStart {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)]$WordApp
  )

  $firstHeadingRange = Find-RangeByText -Document $Document -Text '第1章 概要'
  $start = $firstHeadingRange.Start
  $selection = $WordApp.Selection
  $selection.SetRange($start, $Document.Content.End - 1)
  $selection.Delete() | Out-Null
  $selection.SetRange($start, $start)
  return $selection
}

function Add-Paragraph {
  param(
    [Parameter(Mandatory = $true)]$Selection,
    [Parameter(Mandatory = $true)][string]$Text,
    [int]$Style = $wdStyleNormal
  )

  $Selection.Style = $Style
  $Selection.TypeText($Text)
  $Selection.TypeParagraph()
}

function Add-BulletsAsParagraphs {
  param(
    [Parameter(Mandatory = $true)]$Selection,
    [Parameter(Mandatory = $true)][string[]]$Items
  )

  foreach ($item in $Items) {
    Add-Paragraph -Selection $Selection -Text ("・{0}" -f $item) -Style $wdStyleNormal
  }
}

function Add-NumberedAsParagraphs {
  param(
    [Parameter(Mandatory = $true)]$Selection,
    [Parameter(Mandatory = $true)][string[]]$Items
  )

  $index = 1
  foreach ($item in $Items) {
    Add-Paragraph -Selection $Selection -Text ("{0}. {1}" -f $index, $item) -Style $wdStyleNormal
    $index++
  }
}

function Add-Table {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)]$Selection,
    [Parameter(Mandatory = $true)][string[]]$Headers,
    [Parameter(Mandatory = $true)][object[]]$Rows
  )

  $rowCount = 1 + $Rows.Count
  $colCount = $Headers.Count
  $table = $Document.Tables.Add($Selection.Range, $rowCount, $colCount)
  $table.Style = $wdStyleTableGrid
  $table.AllowAutoFit = $false
  $table.Range.Style = $wdStyleNormal

  $borders = @(
    $wdBorderTop,
    $wdBorderLeft,
    $wdBorderBottom,
    $wdBorderRight,
    $wdBorderHorizontal,
    $wdBorderVertical
  )
  foreach ($borderType in $borders) {
    $table.Borders.Item($borderType).LineStyle = $wdLineStyleSingle
    $table.Borders.Item($borderType).LineWidth = $wdLineWidth050pt
    $table.Borders.Item($borderType).Color = $wdColorAutomatic
  }

  for ($c = 1; $c -le $colCount; $c++) {
    $headerRange = $table.Cell(1, $c).Range
    $headerRange.Text = [string]$Headers[$c - 1]
    $headerRange.Bold = 1
  }

  for ($r = 0; $r -lt $Rows.Count; $r++) {
    $row = @($Rows[$r])
    for ($c = 1; $c -le $colCount; $c++) {
      $cellText = ''
      if ($c -le $row.Count) {
        $cellText = [string]$row[$c - 1]
      }
      $cellRange = $table.Cell($r + 2, $c).Range
      $cellRange.Text = $cellText
      $cellRange.Bold = 0
    }
  }

  $Selection.SetRange($table.Range.End, $table.Range.End)
  $Selection.TypeParagraph()
}

function Add-ApiEndpointBlock {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)]$Selection,
    [Parameter(Mandatory = $true)][hashtable]$Spec
  )

  Add-Paragraph -Selection $Selection -Text $Spec.Title -Style $wdStyleHeading2
  Add-Paragraph -Selection $Selection -Text $Spec.Overview -Style $wdStyleNormal

  Add-Paragraph -Selection $Selection -Text 'エンドポイント' -Style $wdStyleHeading3
  Add-Paragraph -Selection $Selection -Text ("Method: {0}" -f $Spec.Method) -Style $wdStyleNormal
  Add-Paragraph -Selection $Selection -Text ("Path: {0}" -f $Spec.Path) -Style $wdStyleNormal
  Add-Paragraph -Selection $Selection -Text ("認証: {0}" -f $Spec.Auth) -Style $wdStyleNormal

  if ($Spec.ContainsKey('ParametersTitle')) {
    Add-Paragraph -Selection $Selection -Text $Spec.ParametersTitle -Style $wdStyleHeading3
    Add-Table -Document $Document -Selection $Selection -Headers $Spec.ParametersHeaders -Rows $Spec.ParametersRows
  }

  if ($Spec.ContainsKey('RequestTitle')) {
    Add-Paragraph -Selection $Selection -Text $Spec.RequestTitle -Style $wdStyleHeading3
    Add-Table -Document $Document -Selection $Selection -Headers $Spec.RequestHeaders -Rows $Spec.RequestRows
  }

  if ($Spec.ContainsKey('PermissionLines')) {
    Add-Paragraph -Selection $Selection -Text '権限チェック' -Style $wdStyleHeading3
    foreach ($line in $Spec.PermissionLines) {
      Add-Paragraph -Selection $Selection -Text $line -Style $wdStyleNormal
    }
  }

  if ($Spec.ContainsKey('ProcessingLines')) {
    Add-Paragraph -Selection $Selection -Text '処理仕様' -Style $wdStyleHeading3
    foreach ($line in $Spec.ProcessingLines) {
      Add-Paragraph -Selection $Selection -Text $line -Style $wdStyleNormal
    }
  }

  if ($Spec.ContainsKey('ExtraSections')) {
    foreach ($section in $Spec.ExtraSections) {
      Add-Paragraph -Selection $Selection -Text $section.Title -Style $wdStyleHeading4
      foreach ($line in $section.Lines) {
        Add-Paragraph -Selection $Selection -Text $line -Style $wdStyleNormal
      }
    }
  }

  if ($Spec.ContainsKey('ResponseTitle')) {
    Add-Paragraph -Selection $Selection -Text $Spec.ResponseTitle -Style $wdStyleHeading3
  }

  if ($Spec.ContainsKey('ResponseHeaders')) {
    Add-Table -Document $Document -Selection $Selection -Headers $Spec.ResponseHeaders -Rows $Spec.ResponseRows
  }

  if ($Spec.ContainsKey('ResponseSubtables')) {
    foreach ($subtable in $Spec.ResponseSubtables) {
      Add-Paragraph -Selection $Selection -Text $subtable.Title -Style $wdStyleHeading4
      Add-Table -Document $Document -Selection $Selection -Headers $subtable.Headers -Rows $subtable.Rows
    }
  }

  if ($Spec.ContainsKey('ResponseLines')) {
    foreach ($line in $Spec.ResponseLines) {
      Add-Paragraph -Selection $Selection -Text $line -Style $wdStyleNormal
    }
  }

  Add-Paragraph -Selection $Selection -Text 'ステータスコード' -Style $wdStyleHeading3
  Add-Table -Document $Document -Selection $Selection -Headers @('HTTP', '条件', 'Body') -Rows $Spec.StatusRows
}

if (-not (Test-Path $TemplatePath)) {
  throw "Template file not found: $TemplatePath"
}

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

Copy-Item -Path $TemplatePath -Destination $OutputPath -Force

$word = $null
$doc = $null

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0

  $doc = $word.Documents.Open($OutputPath)

  Replace-AllText -Document $doc -FindText '現有品調査' -ReplaceText $ScreenLabel
  Replace-AllText -Document $doc -FindText '2026年3月9日' -ReplaceText $CoverDateText
  Replace-AllText -Document $doc -FindText '2026/03/09' -ReplaceText $RevisionDateText

  if ($doc.Tables.Count -ge 1 -and $doc.Tables.Item(1).Rows.Count -ge 2) {
    $historyTable = $doc.Tables.Item(1)
    $historyTable.Cell(2, 1).Range.Text = '1.0'
    $historyTable.Cell(2, 2).Range.Text = $RevisionDateText
    $historyTable.Cell(2, 3).Range.Text = '初版作成'
  }

  $selection = Set-ReplacementBodyStart -Document $doc -WordApp $word
  $selection.Collapse($wdCollapseEnd)

  $apiListRows = @(
    @('施設マスタ一覧取得', 'GET', '/ship-facility-master/facilities', '施設一覧と表示件数を取得する', '要'),
    @('設立母体候補取得', 'GET', '/ship-facility-master/establishments', '設立母体コンボボックス用の候補を取得する', '要'),
    @('施設マスタエクスポート', 'GET', '/ship-facility-master/facilities/export', '現在の絞り込み条件でExcelを出力する', '要'),
    @('施設マスタ新規作成', 'POST', '/ship-facility-master/facilities', '施設マスタを新規登録する', '要'),
    @('施設マスタ更新', 'PUT', '/ship-facility-master/facilities/{facilityId}', '施設マスタを更新する', '要'),
    @('施設マスタ削除', 'DELETE', '/ship-facility-master/facilities/{facilityId}', '施設マスタを削除する', '要')
  )

  $endpointSpecs = @(
    @{
      Title = '施設マスタ一覧取得（/ship-facility-master/facilities）'
      Overview = 'SHIP施設マスタ一覧と表示件数を取得する。都道府県、設立母体、施設コード、施設名で絞り込み可能とする。'
      Method = 'GET'
      Path = '/ship-facility-master/facilities'
      Auth = '要（Bearer）'
      ParametersTitle = 'リクエストパラメータ'
      ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
      ParametersRows = @(
        @('prefecture', 'query', 'string', '-', '都道府県の部分一致条件'),
        @('establishmentName', 'query', 'string', '-', '設立母体名の部分一致条件'),
        @('facilityCode', 'query', 'string', '-', '施設コードの部分一致条件'),
        @('facilityName', 'query', 'string', '-', '施設名の部分一致条件')
      )
      PermissionLines = @(
        '機能権限: `ship_facility_master` が `R` 以上であること',
        '施設スコープを適用する場合は、返却対象を閲覧可能施設の範囲に制限する'
      )
      ResponseTitle = 'レスポンス（200：ShipFacilityListResponse）'
      ResponseHeaders = @('フィールド', '型', '必須', '説明')
      ResponseRows = @(
        @('totalCount', 'int32', '✓', '絞り込み後の一覧件数'),
        @('items', 'ShipFacilitySummary[]', '✓', '施設マスタ一覧')
      )
      ResponseSubtables = @(
        @{
          Title = 'items要素（ShipFacilitySummary）'
          Headers = @('フィールド', '型', '必須', '説明')
          Rows = @(
            @('facilityId', 'int64', '✓', '施設ID（`facilities.facility_id`）'),
            @('establishmentId', 'int64', '✓', '設立母体ID（`establishments.establishment_id`）'),
            @('establishmentName', 'string', '✓', '設立母体名'),
            @('facilityCode', 'string', '-', '施設コード'),
            @('facilityName', 'string', '✓', '施設名'),
            @('prefecture', 'string', '-', '都道府県'),
            @('bedCount', 'int32', '-', '病床数'),
            @('building', 'string', '-', '画面入力項目。保存先は要確認'),
            @('floor', 'string', '-', '画面入力項目。保存先は要確認'),
            @('department', 'string', '-', '画面入力項目。保存先は要確認'),
            @('section', 'string', '-', '画面入力項目。保存先は要確認'),
            @('updatedAt', 'datetime', '✓', '最終更新日時')
          )
        }
      )
      StatusRows = @(
        @('200', '取得成功', 'ShipFacilityListResponse'),
        @('400', '不正な検索条件', 'ErrorResponse'),
        @('401', '未認証', 'ErrorResponse'),
        @('403', '一覧閲覧権限なし', 'ErrorResponse'),
        @('500', 'サーバー内部エラー', 'ErrorResponse')
      )
    },
    @{
      Title = '設立母体候補取得（/ship-facility-master/establishments）'
      Overview = '施設マスタ新規作成/編集モーダルの設立母体コンボボックスで使用する既存候補を取得する。'
      Method = 'GET'
      Path = '/ship-facility-master/establishments'
      Auth = '要（Bearer）'
      ParametersTitle = 'リクエストパラメータ'
      ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
      ParametersRows = @(
        @('keyword', 'query', 'string', '-', '設立母体名の前方/部分一致検索条件')
      )
      PermissionLines = @(
        '機能権限: `ship_facility_master` が `R` 以上であること'
      )
      ResponseTitle = 'レスポンス（200：EstablishmentCandidateResponse）'
      ResponseHeaders = @('フィールド', '型', '必須', '説明')
      ResponseRows = @(
        @('totalCount', 'int32', '✓', '返却候補件数'),
        @('items', 'EstablishmentOption[]', '✓', '設立母体候補一覧')
      )
      ResponseSubtables = @(
        @{
          Title = 'items要素（EstablishmentOption）'
          Headers = @('フィールド', '型', '必須', '説明')
          Rows = @(
            @('establishmentId', 'int64', '✓', '設立母体ID'),
            @('establishmentName', 'string', '✓', '設立母体名')
          )
        }
      )
      StatusRows = @(
        @('200', '取得成功', 'EstablishmentCandidateResponse'),
        @('401', '未認証', 'ErrorResponse'),
        @('403', '閲覧権限なし', 'ErrorResponse'),
        @('500', 'サーバー内部エラー', 'ErrorResponse')
      )
    },
    @{
      Title = '施設マスタエクスポート（/ship-facility-master/facilities/export）'
      Overview = '現在の絞り込み条件に一致する施設マスタ一覧を Excel ファイルとして出力する。'
      Method = 'GET'
      Path = '/ship-facility-master/facilities/export'
      Auth = '要（Bearer）'
      ParametersTitle = 'リクエストパラメータ'
      ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
      ParametersRows = @(
        @('prefecture', 'query', 'string', '-', '都道府県の部分一致条件'),
        @('establishmentName', 'query', 'string', '-', '設立母体名の部分一致条件'),
        @('facilityCode', 'query', 'string', '-', '施設コードの部分一致条件'),
        @('facilityName', 'query', 'string', '-', '施設名の部分一致条件')
      )
      PermissionLines = @(
        '機能権限: `ship_facility_master` が `R` 以上であること'
      )
      ResponseTitle = 'レスポンス（200：Excel File）'
      ResponseSubtables = @(
        @{
          Title = 'Headers'
          Headers = @('ヘッダー名', '必須', '形式', '説明')
          Rows = @(
            @('Content-Type', '✓', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel 形式で返却する'),
            @('Content-Disposition', '✓', 'attachment; filename="SHIP施設マスタ_YYYYMMDD.xlsx"', 'ダウンロードファイル名')
          )
        }
      )
      ResponseLines = @(
        'Body: フィルタ適用後の施設マスタ一覧を Excel バイナリで返却する。',
        '出力列の詳細は画面要件に未定義のため、本設計では少なくとも一覧表示項目（都道府県、設立母体、施設コード、施設名、病床数）を含むものとする。'
      )
      StatusRows = @(
        @('200', '出力成功', 'Excel File'),
        @('401', '未認証', 'ErrorResponse'),
        @('403', 'エクスポート権限なし', 'ErrorResponse'),
        @('500', 'サーバー内部エラー', 'ErrorResponse')
      )
    },
    @{
      Title = '施設マスタ新規作成（/ship-facility-master/facilities）'
      Overview = '施設マスタを新規登録する。設立母体は既存候補選択または新規名称入力のいずれかを受け付ける。'
      Method = 'POST'
      Path = '/ship-facility-master/facilities'
      Auth = '要（Bearer）'
      RequestTitle = 'リクエスト（FacilityCreateRequest）'
      RequestHeaders = @('フィールド', '型', '必須', '説明')
      RequestRows = @(
        @('establishmentId', 'int64', '条件付き', '既存設立母体を選択した場合に指定する'),
        @('newEstablishmentName', 'string', '条件付き', '新規設立母体を入力した場合に指定する'),
        @('facilityCode', 'string', '✓', '施設コード'),
        @('facilityName', 'string', '✓', '施設名'),
        @('building', 'string', '-', '画面入力項目。保存先は要確認'),
        @('floor', 'string', '-', '画面入力項目。保存先は要確認'),
        @('department', 'string', '-', '画面入力項目。保存先は要確認'),
        @('section', 'string', '-', '画面入力項目。保存先は要確認')
      )
      PermissionLines = @(
        '機能権限: `ship_facility_master` が `F` であること'
      )
      ProcessingLines = @(
        '`establishmentId` と `newEstablishmentName` はどちらか一方のみ指定可能とする',
        '既存の設立母体が選択された場合は、その設立母体IDを `facilities.establishment_id` に設定して施設を登録する',
        '新規の設立母体名が入力された場合は、`establishments` に新規登録後、そのIDを施設へ紐づける',
        '`facilityCode` が既存の有効施設と重複する場合は登録エラーとする',
        '`facilities.deleted_at` は `NULL` で登録する'
      )
      ExtraSections = @(
        @{
          Title = 'location入力項目の扱い'
          Lines = @(
            '`building` / `floor` / `department` / `section` は画面入力項目として存在するが、`facilities` テーブル定義には対応カラムがない。',
            'DB 設計上は `facility_locations` への保存が候補となるが、本画面の使用データには明記されていないため、正式な保存先は要確認とする。'
          )
        }
      )
      ResponseTitle = 'レスポンス（201：FacilityUpsertResponse）'
      ResponseHeaders = @('フィールド', '型', '必須', '説明')
      ResponseRows = @(
        @('facilityId', 'int64', '✓', '登録された施設ID'),
        @('establishmentId', 'int64', '✓', '紐づいた設立母体ID'),
        @('establishmentName', 'string', '✓', '紐づいた設立母体名'),
        @('facilityCode', 'string', '✓', '施設コード'),
        @('facilityName', 'string', '✓', '施設名'),
        @('building', 'string', '-', '画面入力項目。保存先は要確認'),
        @('floor', 'string', '-', '画面入力項目。保存先は要確認'),
        @('department', 'string', '-', '画面入力項目。保存先は要確認'),
        @('section', 'string', '-', '画面入力項目。保存先は要確認'),
        @('createdAt', 'datetime', '✓', '作成日時'),
        @('updatedAt', 'datetime', '✓', '更新日時')
      )
      StatusRows = @(
        @('201', '登録成功', 'FacilityUpsertResponse'),
        @('400', '入力不正', 'ErrorResponse'),
        @('401', '未認証', 'ErrorResponse'),
        @('403', '登録権限なし', 'ErrorResponse'),
        @('409', '施設コード重複', 'ErrorResponse'),
        @('500', 'サーバー内部エラー', 'ErrorResponse')
      )
    },
    @{
      Title = '施設マスタ更新（/ship-facility-master/facilities/{facilityId}）'
      Overview = '既存の施設マスタを更新する。設立母体変更時は既存候補への付け替え、または新規設立母体登録後の付け替えを行う。'
      Method = 'PUT'
      Path = '/ship-facility-master/facilities/{facilityId}'
      Auth = '要（Bearer）'
      ParametersTitle = 'リクエストパラメータ'
      ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
      ParametersRows = @(
        @('facilityId', 'path', 'int64', '✓', '更新対象の施設ID')
      )
      RequestTitle = 'リクエスト（FacilityUpdateRequest）'
      RequestHeaders = @('フィールド', '型', '必須', '説明')
      RequestRows = @(
        @('establishmentId', 'int64', '条件付き', '既存設立母体を選択した場合に指定する'),
        @('newEstablishmentName', 'string', '条件付き', '新規設立母体を入力した場合に指定する'),
        @('facilityCode', 'string', '✓', '施設コード'),
        @('facilityName', 'string', '✓', '施設名'),
        @('building', 'string', '-', '画面入力項目。保存先は要確認'),
        @('floor', 'string', '-', '画面入力項目。保存先は要確認'),
        @('department', 'string', '-', '画面入力項目。保存先は要確認'),
        @('section', 'string', '-', '画面入力項目。保存先は要確認')
      )
      PermissionLines = @(
        '機能権限: `ship_facility_master` が `F` であること'
      )
      ProcessingLines = @(
        '対象施設が存在し、未削除であることを確認する',
        '設立母体が既存候補へ変更された場合は、施設の紐づけ先のみ更新する',
        '設立母体が新規名称へ変更された場合は、`establishments` 登録後に施設の紐づけ先を更新する',
        '`facilityCode` が他の有効施設と重複する場合は更新エラーとする',
        '`updated_at` を更新する'
      )
      ExtraSections = @(
        @{
          Title = 'location入力項目の扱い'
          Lines = @(
            '新規作成と同様に、`building` / `floor` / `department` / `section` の正式保存先は未確定事項とする。'
          )
        }
      )
      ResponseTitle = 'レスポンス（200：FacilityUpsertResponse）'
      ResponseHeaders = @('フィールド', '型', '必須', '説明')
      ResponseRows = @(
        @('facilityId', 'int64', '✓', '更新対象の施設ID'),
        @('establishmentId', 'int64', '✓', '更新後の設立母体ID'),
        @('establishmentName', 'string', '✓', '更新後の設立母体名'),
        @('facilityCode', 'string', '✓', '施設コード'),
        @('facilityName', 'string', '✓', '施設名'),
        @('building', 'string', '-', '画面入力項目。保存先は要確認'),
        @('floor', 'string', '-', '画面入力項目。保存先は要確認'),
        @('department', 'string', '-', '画面入力項目。保存先は要確認'),
        @('section', 'string', '-', '画面入力項目。保存先は要確認'),
        @('createdAt', 'datetime', '✓', '作成日時'),
        @('updatedAt', 'datetime', '✓', '更新日時')
      )
      StatusRows = @(
        @('200', '更新成功', 'FacilityUpsertResponse'),
        @('400', '入力不正', 'ErrorResponse'),
        @('401', '未認証', 'ErrorResponse'),
        @('403', '更新権限なし', 'ErrorResponse'),
        @('404', '対象施設が存在しない', 'ErrorResponse'),
        @('409', '施設コード重複', 'ErrorResponse'),
        @('500', 'サーバー内部エラー', 'ErrorResponse')
      )
    },
    @{
      Title = '施設マスタ削除（/ship-facility-master/facilities/{facilityId}）'
      Overview = '指定した施設マスタを削除する。施設レコードは論理削除とし、設立母体自体は削除しない。'
      Method = 'DELETE'
      Path = '/ship-facility-master/facilities/{facilityId}'
      Auth = '要（Bearer）'
      ParametersTitle = 'リクエストパラメータ'
      ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
      ParametersRows = @(
        @('facilityId', 'path', 'int64', '✓', '削除対象の施設ID')
      )
      PermissionLines = @(
        '機能権限: `ship_facility_master` が `F` であること'
      )
      ProcessingLines = @(
        '対象施設が存在し、未削除であることを確認する',
        '`facilities.deleted_at` に削除日時を設定する',
        '`establishments` は削除対象としない',
        '削除済み施設は一覧・候補・エクスポートの対象外とする'
      )
      ResponseTitle = 'レスポンス'
      ResponseLines = @(
        'Body: なし'
      )
      StatusRows = @(
        @('204', '削除成功', '-'),
        @('401', '未認証', 'ErrorResponse'),
        @('403', '削除権限なし', 'ErrorResponse'),
        @('404', '対象施設が存在しない', 'ErrorResponse'),
        @('500', 'サーバー内部エラー', 'ErrorResponse')
      )
    }
  )

  Add-Paragraph -Selection $selection -Text '第1章 概要' -Style $wdStyleHeading1
  Add-Paragraph -Selection $selection -Text '本書の目的' -Style $wdStyleHeading2
  Add-Paragraph -Selection $selection -Text '本書は、医療機器管理システムにおける SHIP施設マスタ画面（`/ship-facility-master`）で利用するAPIの設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' -Style $wdStyleNormal
  Add-Paragraph -Selection $selection -Text '特に以下を明確にする。' -Style $wdStyleNormal
  Add-BulletsAsParagraphs -Selection $selection -Items @(
    '一覧表示および絞り込み条件のI/F',
    '設立母体候補取得と新規設立母体登録ルール',
    '施設マスタの新規作成・更新・削除I/F',
    'エクスポート処理のI/F',
    '権限・バリデーション・エラーレスポンス'
  )

  Add-Paragraph -Selection $selection -Text '対象システム概要' -Style $wdStyleHeading2
  Add-Paragraph -Selection $selection -Text 'SHIP施設マスタは、施設コード、施設名、都道府県、設立母体、病床数などの施設マスタを参照・管理する画面である。ヘッダーの表示件数、一覧絞り込み、エクスポート、新規作成、編集、削除を提供する。' -Style $wdStyleNormal
  Add-Paragraph -Selection $selection -Text '設立母体は既存候補から選択でき、新規名称が入力された場合は設立母体登録後に施設へ紐づける。' -Style $wdStyleNormal

  Add-Paragraph -Selection $selection -Text '用語定義' -Style $wdStyleHeading2
  Add-Table -Document $doc -Selection $selection -Headers @('用語', '説明') -Rows @(
    @('SHIP施設マスタ', 'SHIP側で参照・管理する施設マスタ画面およびその対象データ'),
    @('設立母体', '施設の上位組織。`establishments` で管理する'),
    @('施設マスタ', '施設コード、施設名、都道府県、病床数などを保持する `facilities` の業務概念'),
    @('施設スコープ', '利用者が閲覧・操作可能な施設範囲。権限および閲覧可能施設設定で制御する')
  )

  Add-Paragraph -Selection $selection -Text '第2章 システム全体構成' -Style $wdStyleHeading1
  Add-Paragraph -Selection $selection -Text 'SHIP施設マスタAPIの位置づけ' -Style $wdStyleHeading2
  Add-Paragraph -Selection $selection -Text '本API群は、SHIP施設マスタ画面の一覧参照、設立母体候補取得、エクスポート、施設登録、施設更新、施設削除を提供する。' -Style $wdStyleNormal
  Add-Paragraph -Selection $selection -Text '画面は `establishments` と `facilities` を主に参照し、設立母体の新規入力時のみ `establishments` の作成を伴う。' -Style $wdStyleNormal

  Add-Paragraph -Selection $selection -Text '画面とAPIの関係' -Style $wdStyleHeading2
  Add-NumberedAsParagraphs -Selection $selection -Items @(
    '画面初期表示およびフィルタ変更時に施設マスタ一覧取得APIを呼び出す',
    '設立母体コンボボックス表示時に設立母体候補取得APIを呼び出す',
    'エクスポート押下時にエクスポートAPIを呼び出す',
    '新規作成モーダルの登録押下時に施設マスタ新規作成APIを呼び出す',
    '編集モーダルの更新押下時に施設マスタ更新APIを呼び出す',
    '削除確認モーダルの OK 押下時に施設マスタ削除APIを呼び出す'
  )

  Add-Paragraph -Selection $selection -Text '使用テーブル' -Style $wdStyleHeading2
  Add-Table -Document $doc -Selection $selection -Headers @('テーブル', '用途', '主な利用カラム') -Rows @(
    @('establishments', '設立母体候補表示、新規設立母体登録', 'establishment_id, establishment_name'),
    @('facilities', '一覧表示、施設登録、施設更新、施設削除', 'facility_id, establishment_id, facility_code, facility_name, prefecture, bed_count, deleted_at'),
    @('facility_locations', '棟/階/部門/部署の保存候補（要確認）', 'building, floor, department_name, section_name')
  )
  Add-Paragraph -Selection $selection -Text '`facility_locations` の利用は、画面入力項目と DB 設計との差分からみた候補であり、正式な採用可否は要確認とする。' -Style $wdStyleNormal

  Add-Paragraph -Selection $selection -Text '第3章 共通仕様' -Style $wdStyleHeading1
  Add-Paragraph -Selection $selection -Text 'API共通仕様' -Style $wdStyleHeading2
  Add-BulletsAsParagraphs -Selection $selection -Items @(
    '通信方式: HTTPS',
    'データ形式: JSON（エクスポートAPIを除く）',
    '文字コード: UTF-8',
    '日時形式: ISO 8601（例: `2026-03-12T00:00:00Z`）',
    '論理削除済みデータ（`deleted_at` が設定済みのレコード）は一覧・候補・エクスポート対象外とする'
  )

  Add-Paragraph -Selection $selection -Text '認証方式' -Style $wdStyleHeading2
  Add-Paragraph -Selection $selection -Text 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' -Style $wdStyleNormal

  Add-Paragraph -Selection $selection -Text '権限モデル' -Style $wdStyleHeading2
  Add-Paragraph -Selection $selection -Text '機能コードは `ship_facility_master` を用いる。画面遷移は `R` 以上、登録/更新/削除は `F` を必要とする。' -Style $wdStyleNormal
  Add-Table -Document $doc -Selection $selection -Headers @('処理', '必要レベル', '想定ロール', '説明') -Rows @(
    @('一覧表示 / 設立母体候補取得 / エクスポート', 'R以上', 'admin, consultant', '画面閲覧系の処理'),
    @('新規作成 / 更新 / 削除', 'F', 'admin', '施設マスタ管理処理')
  )

  Add-Paragraph -Selection $selection -Text '検索・絞り込み仕様' -Style $wdStyleHeading2
  Add-BulletsAsParagraphs -Selection $selection -Items @(
    '都道府県、設立母体、施設コード、施設名は AND 条件で絞り込む',
    '文字列検索は部分一致を基本とする',
    '表示件数は絞り込み後件数をそのまま返却する',
    '画面要件上ページングは定義しない'
  )

  Add-Paragraph -Selection $selection -Text 'エラーレスポンス仕様' -Style $wdStyleHeading2
  Add-Paragraph -Selection $selection -Text '基本エラーレスポンス（ErrorResponse）' -Style $wdStyleHeading3
  Add-Table -Document $doc -Selection $selection -Headers @('フィールド', '型', '必須', '説明') -Rows @(
    @('code', 'string', '✓', 'エラーコード'),
    @('message', 'string', '✓', '利用者向けエラーメッセージ'),
    @('details', 'string[]', '-', '入力エラーや補足情報')
  )

  Add-Paragraph -Selection $selection -Text '第4章 API一覧' -Style $wdStyleHeading1
  Add-Paragraph -Selection $selection -Text 'SHIP施設マスタ（/ship-facility-master）' -Style $wdStyleHeading2
  Add-Table -Document $doc -Selection $selection -Headers @('機能名', 'Method', 'Path', '概要', '認証') -Rows $apiListRows

  Add-Paragraph -Selection $selection -Text '第5章 SHIP施設マスタ機能設計' -Style $wdStyleHeading1
  foreach ($endpointSpec in $endpointSpecs) {
    Add-ApiEndpointBlock -Document $doc -Selection $selection -Spec $endpointSpec
  }

  Add-Paragraph -Selection $selection -Text '第6章 権限・業務ルール' -Style $wdStyleHeading1
  Add-Paragraph -Selection $selection -Text '必要権限' -Style $wdStyleHeading2
  Add-Table -Document $doc -Selection $selection -Headers @('処理', '機能権限コード', '必要レベル', '説明') -Rows @(
    @('一覧表示', 'ship_facility_master', 'R以上', '施設一覧と表示件数を参照する'),
    @('設立母体候補取得', 'ship_facility_master', 'R以上', '既存設立母体候補を取得する'),
    @('エクスポート', 'ship_facility_master', 'R以上', '絞り込み結果を Excel で取得する'),
    @('新規作成 / 更新 / 削除', 'ship_facility_master', 'F', '施設マスタを管理する')
  )

  Add-Paragraph -Selection $selection -Text '設立母体登録ルール' -Style $wdStyleHeading2
  Add-BulletsAsParagraphs -Selection $selection -Items @(
    '既存設立母体を選択した場合は、選択した設立母体IDを施設へ紐づける',
    '新規名称が入力された場合は、設立母体登録後に施設へ紐づける',
    '更新時に設立母体が変更された場合も同じルールを適用する'
  )

  Add-Paragraph -Selection $selection -Text '削除ルール' -Style $wdStyleHeading2
  Add-BulletsAsParagraphs -Selection $selection -Items @(
    '削除対象は `facilities` のみとし、`establishments` は削除しない',
    '削除は論理削除（`deleted_at` 更新）とする',
    '論理削除済み施設は一覧、候補、エクスポートの対象外とする'
  )

  Add-Paragraph -Selection $selection -Text '未確定事項' -Style $wdStyleHeading2
  Add-BulletsAsParagraphs -Selection $selection -Items @(
    'モーダル入力項目の `building` / `floor` / `department` / `section` は画面要件に存在するが、`facilities` テーブル定義に対応カラムがないため正式保存先が未確定である',
    'エクスポートAPIの詳細出力列は画面要件に明記がないため、一覧表示項目を最低限の出力対象としている'
  )

  Add-Paragraph -Selection $selection -Text '第7章 エラーコード一覧' -Style $wdStyleHeading1
  Add-Table -Document $doc -Selection $selection -Headers @('エラーコード', 'HTTP', '説明') -Rows @(
    @('VALIDATION_ERROR', '400', '入力不正、条件付き必須不足、形式不正'),
    @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
    @('FORBIDDEN', '403', '必要権限不足'),
    @('FACILITY_NOT_FOUND', '404', '対象施設が存在しない、または削除済み'),
    @('ESTABLISHMENT_NOT_FOUND', '404', '指定した設立母体が存在しない'),
    @('FACILITY_CODE_DUPLICATE', '409', '施設コードが重複している'),
    @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
  )

  Add-Paragraph -Selection $selection -Text '第8章 運用・保守方針' -Style $wdStyleHeading1
  Add-Paragraph -Selection $selection -Text 'マスタ保守方針' -Style $wdStyleHeading2
  Add-BulletsAsParagraphs -Selection $selection -Items @(
    '施設コードの一意性を維持する',
    '設立母体名の新規登録は重複名称の有無を確認して実施する',
    '施設更新・削除後は一覧APIの返却結果に即時反映する'
  )

  Add-Paragraph -Selection $selection -Text 'エクスポート運用' -Style $wdStyleHeading2
  Add-BulletsAsParagraphs -Selection $selection -Items @(
    'エクスポート対象は呼び出し時点の絞り込み結果とする',
    'ファイル名は `SHIP施設マスタ_YYYYMMDD.xlsx` を基本とする',
    '大量件数対応が必要になった場合は非同期出力方式を別途検討する'
  )

  if ($doc.TablesOfContents.Count -ge 1) {
    $doc.TablesOfContents.Item(1).Update() | Out-Null
  }
  $doc.Fields.Update() | Out-Null
  $doc.Save()
}
finally {
  if ($doc) {
    $doc.Close() | Out-Null
  }
  if ($word) {
    $word.Quit() | Out-Null
  }
}

Write-Output $OutputPath
