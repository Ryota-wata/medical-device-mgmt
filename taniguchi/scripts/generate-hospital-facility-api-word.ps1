param(
  [string]$BaseScriptPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\scripts\generate-ship-facility-api-word.ps1',
  [string]$OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\作成済み\API設計書_SHIP個別施設マスタ.docx',
  [string]$ScreenLabel = 'SHIP個別施設マスタ',
  [string]$CoverDateText = '2026年3月12日',
  [string]$RevisionDateText = '2026/03/12'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $BaseScriptPath)) {
  throw "Base script not found: $BaseScriptPath"
}

$script = Get-Content $BaseScriptPath -Raw
$script = $script.Replace(
  "[string]`$OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\作成済み\API設計書_SHIP施設マスタ.docx',",
  "[string]`$OutputPath = '$OutputPath',"
)
$script = $script.Replace(
  "[string]`$ScreenLabel = 'SHIP施設マスタ',",
  "[string]`$ScreenLabel = '$ScreenLabel',"
)

$replacementBlock = @'
$apiListRows = @(
  @('対象施設候補取得', 'GET', '/hospital-facility-master/facilities', '施設選択コンボボックス用の施設候補を取得する', '要'),
  @('SHIP部署候補取得', 'GET', '/hospital-facility-master/ship-departments', '共通マスタの部門/部署候補を取得する', '要'),
  @('SHIP諸室区分候補取得', 'GET', '/hospital-facility-master/ship-room-categories', '共通マスタの諸室区分候補を取得する', '要'),
  @('個別施設マスタ一覧取得', 'GET', '/hospital-facility-master/facility-locations', '選択施設の個別施設マスタ一覧を取得する', '要'),
  @('個別施設マスタエクスポート', 'GET', '/hospital-facility-master/facility-locations/export', '絞り込み結果をExcel出力する', '要'),
  @('個別施設マスタテンプレート取得', 'GET', '/hospital-facility-master/facility-locations/template', 'インポート用テンプレートを取得する', '要'),
  @('個別施設マスタインポートプレビュー', 'POST', '/hospital-facility-master/facility-locations/import-preview', 'Excel取込内容を検証してプレビューを返す', '要'),
  @('個別施設マスタインポート実行', 'POST', '/hospital-facility-master/facility-locations/import', '追加/置換インポートを実行する', '要'),
  @('個別施設マスタ新規作成', 'POST', '/hospital-facility-master/facility-locations', '個別施設マスタ1行を新規登録する', '要'),
  @('個別施設マスタ更新', 'PUT', '/hospital-facility-master/facility-locations/{facilityLocationId}', '個別施設マスタ1行を更新する', '要'),
  @('個別施設マスタ削除', 'DELETE', '/hospital-facility-master/facility-locations/{facilityLocationId}', '個別施設マスタ1行を削除する', '要')
)

$endpointSpecs = @(
  @{
    Title = '対象施設候補取得（/hospital-facility-master/facilities）'
    Overview = '施設選択コンボボックスで利用する施設候補を取得する。権限および施設スコープに応じて返却対象を制限する。'
    Method = 'GET'
    Path = '/hospital-facility-master/facilities'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('keyword', 'query', 'string', '-', '施設名の前方/部分一致検索条件')
    )
    PermissionLines = @(
      '機能権限: `hospital_facility_master` が `R` 以上であること',
      '返却候補は `canAccessFacility` 相当の施設スコープで制限する'
    )
    ResponseTitle = 'レスポンス（200：FacilityOptionResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('totalCount', 'int32', '✓', '返却候補件数'),
      @('items', 'FacilityOption[]', '✓', '施設候補一覧')
    )
    ResponseSubtables = @(
      @{
        Title = 'items要素（FacilityOption）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('facilityId', 'int64', '✓', '施設ID'),
          @('facilityName', 'string', '✓', '施設名')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'FacilityOptionResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '閲覧権限なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = 'SHIP部署候補取得（/hospital-facility-master/ship-departments）'
    Overview = '共通マスタの部門/部署候補を取得する。部門選択後の部署候補絞り込み、および一覧表示時の名称解決に利用する。'
    Method = 'GET'
    Path = '/hospital-facility-master/ship-departments'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('divisionName', 'query', 'string', '-', '部門名で候補を絞り込む'),
      @('keyword', 'query', 'string', '-', '部門名/部署名の部分一致検索条件')
    )
    PermissionLines = @(
      '機能権限: `hospital_facility_master` が `R` 以上であること'
    )
    ResponseTitle = 'レスポンス（200：ShipDepartmentOptionResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('totalCount', 'int32', '✓', '返却候補件数'),
      @('items', 'ShipDepartmentOption[]', '✓', 'SHIP部署候補一覧')
    )
    ResponseSubtables = @(
      @{
        Title = 'items要素（ShipDepartmentOption）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('shipDepartmentId', 'int64', '✓', 'SHIP部署ID'),
          @('divisionName', 'string', '✓', '部門名'),
          @('departmentName', 'string', '✓', '部署名')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'ShipDepartmentOptionResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '閲覧権限なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = 'SHIP諸室区分候補取得（/hospital-facility-master/ship-room-categories）'
    Overview = '共通マスタの諸室区分候補を取得する。諸室区分①選択後の諸室区分②候補絞り込みに利用する。'
    Method = 'GET'
    Path = '/hospital-facility-master/ship-room-categories'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('roomCategory1', 'query', 'string', '-', '諸室区分①で候補を絞り込む'),
      @('keyword', 'query', 'string', '-', '諸室区分①/②の部分一致検索条件')
    )
    PermissionLines = @(
      '機能権限: `hospital_facility_master` が `R` 以上であること'
    )
    ResponseTitle = 'レスポンス（200：ShipRoomCategoryOptionResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('totalCount', 'int32', '✓', '返却候補件数'),
      @('items', 'ShipRoomCategoryOption[]', '✓', 'SHIP諸室区分候補一覧')
    )
    ResponseSubtables = @(
      @{
        Title = 'items要素（ShipRoomCategoryOption）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('shipRoomCategoryId', 'int64', '✓', 'SHIP諸室区分ID'),
          @('roomCategory1', 'string', '✓', '諸室区分①'),
          @('roomCategory2', 'string', '✓', '諸室区分②')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'ShipRoomCategoryOptionResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '閲覧権限なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '個別施設マスタ一覧取得（/hospital-facility-master/facility-locations）'
    Overview = '選択施設の個別施設マスタ一覧を取得する。`facility_locations` と `facility_location_remodels` を結合した1行DTOとして返却する。'
    Method = 'GET'
    Path = '/hospital-facility-master/facility-locations'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('facilityId', 'query', 'int64', '条件付き', '選択施設ID。認証トークンから固定施設を導出できる場合は省略可能'),
      @('shipDivisionName', 'query', 'string', '-', '共通マスタ-部門の部分一致条件'),
      @('shipDepartmentName', 'query', 'string', '-', '共通マスタ-部署の部分一致条件')
    )
    PermissionLines = @(
      '機能権限: `hospital_facility_master` が `R` 以上であること',
      'admin は全施設、consultant は担当施設、office_admin / office_staff は所属施設のみ取得可能とする',
      '`facilityId` 未指定かつ固定施設も導出できない場合は 400 とする'
    )
    ResponseTitle = 'レスポンス（200：HospitalFacilityLocationListResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('totalCount', 'int32', '✓', '絞り込み後の一覧件数'),
      @('selectedFacility', 'FacilityOption', '✓', '選択中施設'),
      @('items', 'HospitalFacilityLocationSummary[]', '✓', '個別施設マスタ一覧')
    )
    ResponseSubtables = @(
      @{
        Title = 'selectedFacility（FacilityOption）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('facilityId', 'int64', '✓', '施設ID'),
          @('facilityName', 'string', '✓', '施設名')
        )
      },
      @{
        Title = 'items要素（HospitalFacilityLocationSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('facilityLocationId', 'int64', '✓', '施設ロケーションID'),
          @('facilityId', 'int64', '✓', '施設ID'),
          @('facilityName', 'string', '✓', '施設名'),
          @('shipDepartmentId', 'int64', '-', '現行側のSHIP部署ID'),
          @('shipDivisionName', 'string', '-', '現行側のSHIP部門名'),
          @('shipDepartmentName', 'string', '-', '現行側のSHIP部署名'),
          @('shipRoomCategoryId', 'int64', '-', '現行側のSHIP諸室区分ID'),
          @('shipRoomCategory1', 'string', '-', '現行側の諸室区分①'),
          @('shipRoomCategory2', 'string', '-', '現行側の諸室区分②'),
          @('divisionId', 'string', '-', '施設側部門ID'),
          @('departmentId', 'string', '-', '施設側部署ID'),
          @('roomId', 'string', '-', '施設側諸室ID'),
          @('building', 'string', '-', '現行側の棟'),
          @('floor', 'string', '-', '現行側の階'),
          @('departmentName', 'string', '-', '現行側の部門名'),
          @('sectionName', 'string', '-', '現行側の部署名'),
          @('roomName', 'string', '-', '現行側の室名称'),
          @('targetShipDepartmentId', 'int64', '-', 'リモデル先のSHIP部署ID'),
          @('targetShipDivisionName', 'string', '-', 'リモデル先のSHIP部門名'),
          @('targetShipDepartmentName', 'string', '-', 'リモデル先のSHIP部署名'),
          @('targetShipRoomCategoryId', 'int64', '-', 'リモデル先のSHIP諸室区分ID'),
          @('targetShipRoomCategory1', 'string', '-', 'リモデル先の諸室区分①'),
          @('targetShipRoomCategory2', 'string', '-', 'リモデル先の諸室区分②'),
          @('targetBuilding', 'string', '-', 'リモデル先の棟'),
          @('targetFloor', 'string', '-', 'リモデル先の階'),
          @('targetDepartmentName', 'string', '-', 'リモデル先の部門名'),
          @('targetSectionName', 'string', '-', 'リモデル先の部署名'),
          @('targetRoomName', 'string', '-', 'リモデル先の室名称'),
          @('targetRoomCount', 'int32', '-', 'リモデル先の室数'),
          @('mappingStatus', 'string', '-', '画面用の算出ステータス。モックでは draft / mapped / completed を保持'),
          @('updatedAt', 'datetime', '✓', '最終更新日時')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'HospitalFacilityLocationListResponse'),
      @('400', '施設未選択など不正な検索条件', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '閲覧権限なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '個別施設マスタエクスポート（/hospital-facility-master/facility-locations/export）'
    Overview = '選択施設と絞り込み条件に一致する個別施設マスタ一覧を Excel ファイルとして出力する。'
    Method = 'GET'
    Path = '/hospital-facility-master/facility-locations/export'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('facilityId', 'query', 'int64', '条件付き', '選択施設ID。固定施設を導出できる場合は省略可能'),
      @('shipDivisionName', 'query', 'string', '-', '共通マスタ-部門の部分一致条件'),
      @('shipDepartmentName', 'query', 'string', '-', '共通マスタ-部署の部分一致条件')
    )
    PermissionLines = @(
      '機能権限: `hospital_facility_master` が `R` 以上であること'
    )
    ResponseTitle = 'レスポンス（200：Excel File）'
    ResponseSubtables = @(
      @{
        Title = 'Headers'
        Headers = @('ヘッダー名', '必須', '形式', '説明')
        Rows = @(
          @('Content-Type', '✓', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel 形式で返却する'),
          @('Content-Disposition', '✓', 'attachment; filename="個別部署マスタ_YYYYMMDD.xlsx"', 'ダウンロードファイル名')
        )
      },
      @{
        Title = '出力列'
        Headers = @('列名', '説明')
        Rows = @(
          @('ID', '画面内部IDまたは施設ロケーションIDに対応する識別子'),
          @('病院ID', '施設IDに対応する列'),
          @('病院名', '施設名'),
          @('旧_SHIP部門', '現行側SHIP部門名'),
          @('旧_SHIP部署', '現行側SHIP部署名'),
          @('旧_SHIP諸室区分①', '現行側諸室区分①'),
          @('諸室区分②', '現行側諸室区分②'),
          @('部門ID', '施設側部門ID'),
          @('部署ID', '施設側部署ID'),
          @('諸室ID', '施設側諸室ID'),
          @('新_棟', 'リモデル先の棟'),
          @('新_フロア', 'リモデル先の階'),
          @('新_部門', 'リモデル先の部門名'),
          @('新_部署', 'リモデル先の部署名'),
          @('新_室名称', 'リモデル先の室名称'),
          @('新_室数', 'リモデル先の室数'),
          @('旧_棟', '現行側の棟'),
          @('旧_フロア', '現行側の階'),
          @('旧_部門', '現行側の部門名'),
          @('旧_部署', '現行側の部署名'),
          @('旧_室名称', '現行側の室名称'),
          @('新_SHIP部門', 'リモデル先SHIP部門名'),
          @('新_SHIP部署', 'リモデル先SHIP部署名'),
          @('新_SHIP諸室区分', 'リモデル先SHIP諸室区分①')
        )
      }
    )
    ResponseLines = @(
      'Body: 絞り込み結果を先頭シート `個別部署マスタ` として返却する。'
    )
    StatusRows = @(
      @('200', '出力成功', 'Excel File'),
      @('400', '施設未選択など不正な検索条件', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', 'エクスポート権限なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '個別施設マスタテンプレート取得（/hospital-facility-master/facility-locations/template）'
    Overview = 'インポートプレビューモーダルのテンプレートダウンロードで使用する Excel テンプレートを返却する。'
    Method = 'GET'
    Path = '/hospital-facility-master/facility-locations/template'
    Auth = '要（Bearer）'
    PermissionLines = @(
      '機能権限: `hospital_facility_master` が `R` 以上であること'
    )
    ResponseTitle = 'レスポンス（200：Excel File）'
    ResponseSubtables = @(
      @{
        Title = 'Headers'
        Headers = @('ヘッダー名', '必須', '形式', '説明')
        Rows = @(
          @('Content-Type', '✓', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel 形式で返却する'),
          @('Content-Disposition', '✓', 'attachment; filename="個別部署マスタ_テンプレート.xlsx"', 'テンプレートファイル名')
        )
      }
    )
    ResponseLines = @(
      'Body: ヘッダー行のみを保持した Excel テンプレートを返却する。列定義はエクスポートと同一とする。'
    )
    StatusRows = @(
      @('200', '取得成功', 'Excel File'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '閲覧権限なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '個別施設マスタインポートプレビュー（/hospital-facility-master/facility-locations/import-preview）'
    Overview = 'アップロードされた Excel ファイルを解析し、取込可能件数とエラー内容を返却する。実データ反映は行わない。'
    Method = 'POST'
    Path = '/hospital-facility-master/facility-locations/import-preview'
    Auth = '要（Bearer）'
    RequestTitle = 'リクエスト（multipart/form-data）'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('facilityId', 'int64', '✓', '選択中施設ID'),
      @('file', 'binary', '✓', '.xlsx / .xls ファイル')
    )
    PermissionLines = @(
      '機能権限: `hospital_facility_master` が `W` 以上であること'
    )
    ProcessingLines = @(
      '先頭シートを読み込み、既定ヘッダー定義に基づいて列マッピングする',
      '必須列はモック実装に合わせて `病院ID`、`病院名`、`旧_フロア`、`旧_部門`、`旧_室名称` とする',
      '選択施設とファイル内の施設情報が不整合な場合はエラーとする',
      'リモデル先の階、部門、部署、室名称、および対応するSHIP情報が揃う場合は取込ステータスを `mapped`、それ以外は `draft` と判定する'
    )
    ExtraSections = @(
      @{
        Title = 'プレビュー結果の扱い'
        Lines = @(
          'プレビュー成功時は後続のインポート実行で利用する `previewToken` を返却する。',
          '画面モーダルでは取込可能件数、エラー件数、エラー詳細のみを表示する。'
        )
      }
    )
    ResponseTitle = 'レスポンス（200：HospitalFacilityImportPreviewResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('previewToken', 'string', '✓', 'インポート実行用の一時トークン'),
      @('importableCount', 'int32', '✓', '取込可能件数'),
      @('errorCount', 'int32', '✓', 'エラー件数'),
      @('errors', 'string[]', '✓', '行単位のエラー詳細')
    )
    StatusRows = @(
      @('200', '検証成功', 'HospitalFacilityImportPreviewResponse'),
      @('400', 'ファイル形式不正、ヘッダー不正、施設不整合', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '取込権限なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '個別施設マスタインポート実行（/hospital-facility-master/facility-locations/import）'
    Overview = 'プレビュー済みの Excel データを追加または置換モードで反映する。'
    Method = 'POST'
    Path = '/hospital-facility-master/facility-locations/import'
    Auth = '要（Bearer）'
    RequestTitle = 'リクエスト（HospitalFacilityImportExecuteRequest）'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('previewToken', 'string', '✓', 'プレビュー時に払い出されたトークン'),
      @('facilityId', 'int64', '✓', '選択中施設ID'),
      @('mode', 'string', '✓', '`ADD` または `REPLACE`')
    )
    PermissionLines = @(
      '機能権限: `hospital_facility_master` が `W` 以上であること'
    )
    ProcessingLines = @(
      '`ADD` は既存データへ追記する',
      '`REPLACE` は選択施設に属する既存 `facility_locations` と関連する `facility_location_remodels` を置き換える。ほか施設のデータは保持する',
      '各行について現行ロケーションは `facility_locations`、リモデル先入力がある場合のみ `facility_location_remodels` を登録する',
      '取込対象行の施設スコープは選択施設に一致していることを確認する'
    )
    ResponseTitle = 'レスポンス（200：HospitalFacilityImportExecuteResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('facilityId', 'int64', '✓', '反映対象の施設ID'),
      @('mode', 'string', '✓', '実行モード'),
      @('importedCount', 'int32', '✓', '反映件数'),
      @('replacedCount', 'int32', '-', '置換モード時に置き換えた既存件数')
    )
    StatusRows = @(
      @('200', '取込成功', 'HospitalFacilityImportExecuteResponse'),
      @('400', 'プレビュー未実施、モード不正、施設不整合', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '取込権限なし', 'ErrorResponse'),
      @('404', 'プレビュー情報が存在しない', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '個別施設マスタ新規作成（/hospital-facility-master/facility-locations）'
    Overview = '選択施設に対して個別施設マスタ1行を新規登録する。現行ロケーションは必須、リモデル先は任意とする。'
    Method = 'POST'
    Path = '/hospital-facility-master/facility-locations'
    Auth = '要（Bearer）'
    RequestTitle = 'リクエスト（HospitalFacilityLocationCreateRequest）'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('facilityId', 'int64', '✓', '対象施設ID'),
      @('shipDepartmentId', 'int64', '-', '現行側のSHIP部署ID'),
      @('shipRoomCategoryId', 'int64', '-', '現行側のSHIP諸室区分ID'),
      @('divisionId', 'string', '-', '施設側部門ID'),
      @('departmentId', 'string', '-', '施設側部署ID'),
      @('roomId', 'string', '-', '施設側諸室ID'),
      @('building', 'string', '-', '現行側の棟'),
      @('floor', 'string', '✓', '現行側の階'),
      @('departmentName', 'string', '✓', '現行側の部門名'),
      @('sectionName', 'string', '-', '現行側の部署名'),
      @('roomName', 'string', '✓', '現行側の室名称'),
      @('targetShipDepartmentId', 'int64', '-', 'リモデル先のSHIP部署ID'),
      @('targetShipRoomCategoryId', 'int64', '-', 'リモデル先のSHIP諸室区分ID'),
      @('targetBuilding', 'string', '-', 'リモデル先の棟'),
      @('targetFloor', 'string', '-', 'リモデル先の階'),
      @('targetDepartmentName', 'string', '-', 'リモデル先の部門名'),
      @('targetSectionName', 'string', '-', 'リモデル先の部署名'),
      @('targetRoomName', 'string', '-', 'リモデル先の室名称'),
      @('targetRoomCount', 'int32', '-', 'リモデル先の室数')
    )
    PermissionLines = @(
      '機能権限: `hospital_facility_master` が `W` 以上であること'
    )
    ProcessingLines = @(
      '対象施設が存在し、利用者がアクセス可能であることを確認する',
      '`facility_locations` に現行ロケーションを登録する',
      'リモデル先項目が1項目以上指定された場合は `facility_location_remodels` を子レコードとして登録する',
      'リモデル先項目が未指定の場合は子レコードを作成しない'
    )
    ExtraSections = @(
      @{
        Title = '画面入力項目との差分'
        Lines = @(
          '現行のインライン編集UIは `targetFloor`、`targetRoomCount`、新側のSHIP標準項目を表示していない。',
          '本APIは DB 設計と Excel 入出力に合わせてこれらの項目も受け付ける。'
        )
      }
    )
    ResponseTitle = 'レスポンス（201：HospitalFacilityLocationResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('item', 'HospitalFacilityLocationSummary', '✓', '登録後の1行DTO')
    )
    ResponseSubtables = @(
      @{
        Title = 'item要素（HospitalFacilityLocationSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('facilityLocationId', 'int64', '✓', '施設ロケーションID'),
          @('facilityId', 'int64', '✓', '施設ID'),
          @('facilityName', 'string', '✓', '施設名'),
          @('shipDepartmentId', 'int64', '-', '現行側のSHIP部署ID'),
          @('shipDivisionName', 'string', '-', '現行側のSHIP部門名'),
          @('shipDepartmentName', 'string', '-', '現行側のSHIP部署名'),
          @('shipRoomCategoryId', 'int64', '-', '現行側のSHIP諸室区分ID'),
          @('shipRoomCategory1', 'string', '-', '現行側の諸室区分①'),
          @('shipRoomCategory2', 'string', '-', '現行側の諸室区分②'),
          @('divisionId', 'string', '-', '施設側部門ID'),
          @('departmentId', 'string', '-', '施設側部署ID'),
          @('roomId', 'string', '-', '施設側諸室ID'),
          @('building', 'string', '-', '現行側の棟'),
          @('floor', 'string', '✓', '現行側の階'),
          @('departmentName', 'string', '✓', '現行側の部門名'),
          @('sectionName', 'string', '-', '現行側の部署名'),
          @('roomName', 'string', '✓', '現行側の室名称'),
          @('targetBuilding', 'string', '-', 'リモデル先の棟'),
          @('targetFloor', 'string', '-', 'リモデル先の階'),
          @('targetDepartmentName', 'string', '-', 'リモデル先の部門名'),
          @('targetSectionName', 'string', '-', 'リモデル先の部署名'),
          @('targetRoomName', 'string', '-', 'リモデル先の室名称'),
          @('targetRoomCount', 'int32', '-', 'リモデル先の室数'),
          @('createdAt', 'datetime', '✓', '作成日時'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
      }
    )
    StatusRows = @(
      @('201', '登録成功', 'HospitalFacilityLocationResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '登録権限なし', 'ErrorResponse'),
      @('404', '対象施設が存在しない', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '個別施設マスタ更新（/hospital-facility-master/facility-locations/{facilityLocationId}）'
    Overview = '既存の個別施設マスタ1行を更新する。現行ロケーション更新に加え、リモデル先子レコードの作成/更新/削除を行う。'
    Method = 'PUT'
    Path = '/hospital-facility-master/facility-locations/{facilityLocationId}'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('facilityLocationId', 'path', 'int64', '✓', '更新対象の施設ロケーションID')
    )
    RequestTitle = 'リクエスト（HospitalFacilityLocationUpdateRequest）'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('shipDepartmentId', 'int64', '-', '現行側のSHIP部署ID'),
      @('shipRoomCategoryId', 'int64', '-', '現行側のSHIP諸室区分ID'),
      @('divisionId', 'string', '-', '施設側部門ID'),
      @('departmentId', 'string', '-', '施設側部署ID'),
      @('roomId', 'string', '-', '施設側諸室ID'),
      @('building', 'string', '-', '現行側の棟'),
      @('floor', 'string', '✓', '現行側の階'),
      @('departmentName', 'string', '✓', '現行側の部門名'),
      @('sectionName', 'string', '-', '現行側の部署名'),
      @('roomName', 'string', '✓', '現行側の室名称'),
      @('targetShipDepartmentId', 'int64', '-', 'リモデル先のSHIP部署ID'),
      @('targetShipRoomCategoryId', 'int64', '-', 'リモデル先のSHIP諸室区分ID'),
      @('targetBuilding', 'string', '-', 'リモデル先の棟'),
      @('targetFloor', 'string', '-', 'リモデル先の階'),
      @('targetDepartmentName', 'string', '-', 'リモデル先の部門名'),
      @('targetSectionName', 'string', '-', 'リモデル先の部署名'),
      @('targetRoomName', 'string', '-', 'リモデル先の室名称'),
      @('targetRoomCount', 'int32', '-', 'リモデル先の室数')
    )
    PermissionLines = @(
      '機能権限: `hospital_facility_master` が `W` 以上であること'
    )
    ProcessingLines = @(
      '対象 `facility_locations` が存在し、未削除であることを確認する',
      '現行ロケーションを更新する',
      'リモデル先項目が存在する場合は `facility_location_remodels` を作成または更新する',
      'リモデル先項目がすべて空の場合は既存の `facility_location_remodels` を削除または論理削除する',
      '`updated_at` を更新する'
    )
    ResponseTitle = 'レスポンス（200：HospitalFacilityLocationResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('item', 'HospitalFacilityLocationSummary', '✓', '更新後の1行DTO')
    )
    ResponseSubtables = @(
      @{
        Title = 'item要素（HospitalFacilityLocationSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('facilityLocationId', 'int64', '✓', '施設ロケーションID'),
          @('facilityId', 'int64', '✓', '施設ID'),
          @('facilityName', 'string', '✓', '施設名'),
          @('shipDivisionName', 'string', '-', '現行側のSHIP部門名'),
          @('shipDepartmentName', 'string', '-', '現行側のSHIP部署名'),
          @('shipRoomCategory1', 'string', '-', '現行側の諸室区分①'),
          @('shipRoomCategory2', 'string', '-', '現行側の諸室区分②'),
          @('divisionId', 'string', '-', '施設側部門ID'),
          @('departmentId', 'string', '-', '施設側部署ID'),
          @('roomId', 'string', '-', '施設側諸室ID'),
          @('building', 'string', '-', '現行側の棟'),
          @('floor', 'string', '✓', '現行側の階'),
          @('departmentName', 'string', '✓', '現行側の部門名'),
          @('sectionName', 'string', '-', '現行側の部署名'),
          @('roomName', 'string', '✓', '現行側の室名称'),
          @('targetBuilding', 'string', '-', 'リモデル先の棟'),
          @('targetFloor', 'string', '-', 'リモデル先の階'),
          @('targetDepartmentName', 'string', '-', 'リモデル先の部門名'),
          @('targetSectionName', 'string', '-', 'リモデル先の部署名'),
          @('targetRoomName', 'string', '-', 'リモデル先の室名称'),
          @('targetRoomCount', 'int32', '-', 'リモデル先の室数'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
      }
    )
    StatusRows = @(
      @('200', '更新成功', 'HospitalFacilityLocationResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '更新権限なし', 'ErrorResponse'),
      @('404', '対象ロケーションが存在しない', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '個別施設マスタ削除（/hospital-facility-master/facility-locations/{facilityLocationId}）'
    Overview = '指定した個別施設マスタ1行を削除する。関連するリモデル先子レコードは同時に削除する。'
    Method = 'DELETE'
    Path = '/hospital-facility-master/facility-locations/{facilityLocationId}'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('facilityLocationId', 'path', 'int64', '✓', '削除対象の施設ロケーションID')
    )
    PermissionLines = @(
      '機能権限: `hospital_facility_master` が `W` 以上であること'
    )
    ProcessingLines = @(
      '対象 `facility_locations` が存在し、未削除であることを確認する',
      '対象行と関連する `facility_location_remodels` を論理削除する',
      '削除済みデータは一覧、エクスポート、候補生成の対象外とする'
    )
    ResponseTitle = 'レスポンス'
    ResponseLines = @(
      'Body: なし'
    )
    StatusRows = @(
      @('204', '削除成功', '-'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '削除権限なし', 'ErrorResponse'),
      @('404', '対象ロケーションが存在しない', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  }
)

Add-Paragraph -Selection $selection -Text '第1章 概要' -Style $wdStyleHeading1
Add-Paragraph -Selection $selection -Text '本書の目的' -Style $wdStyleHeading2
Add-Paragraph -Selection $selection -Text '本書は、医療機器管理システムにおける SHIP個別施設マスタ画面（`/hospital-facility-master`）で利用するAPIの設計内容を整理し、利用者、開発者、運用担当者が共通認識を持つことを目的とする。' -Style $wdStyleNormal
Add-Paragraph -Selection $selection -Text '特に以下を明確にする。' -Style $wdStyleNormal
Add-BulletsAsParagraphs -Selection $selection -Items @(
  '選択施設単位の個別施設マスタ一覧取得I/F',
  '共通マスタ候補取得I/F',
  '新規作成・更新・削除I/F',
  'Excel テンプレート、プレビュー、追加/置換インポートI/F',
  '権限、施設スコープ、リモデル子レコードの取扱い'
)

Add-Paragraph -Selection $selection -Text '対象システム概要' -Style $wdStyleHeading2
Add-Paragraph -Selection $selection -Text 'SHIP個別施設マスタは、選択施設に属する現行ロケーションとリモデル先ロケーションの対応関係を参照・管理する画面である。画面表示は `facility_locations` と `facility_location_remodels` を結合した1行DTOで構成する。' -Style $wdStyleNormal
Add-Paragraph -Selection $selection -Text '利用者は施設選択、共通マスタによる絞り込み、エクスポート、インポート、新規作成、編集、削除を実行できる。' -Style $wdStyleNormal

Add-Paragraph -Selection $selection -Text '用語定義' -Style $wdStyleHeading2
Add-Table -Document $doc -Selection $selection -Headers @('用語', '説明') -Rows @(
  @('SHIP個別施設マスタ', '選択施設に対する現行ロケーションとリモデル先ロケーションの対応マスタ'),
  @('現行ロケーション', '`facility_locations` に保持する現状のロケーション情報'),
  @('リモデル先ロケーション', '`facility_location_remodels` に保持する新側ロケーション情報'),
  @('施設スコープ', '利用者が閲覧・操作可能な施設範囲。権限と所属施設/担当施設により制御する')
)

Add-Paragraph -Selection $selection -Text '第2章 システム全体構成' -Style $wdStyleHeading1
Add-Paragraph -Selection $selection -Text 'SHIP個別施設マスタAPIの位置づけ' -Style $wdStyleHeading2
Add-Paragraph -Selection $selection -Text '本API群は、対象施設候補取得、共通マスタ候補取得、一覧取得、Excel入出力、新規作成、更新、削除を提供する。' -Style $wdStyleNormal
Add-Paragraph -Selection $selection -Text '一覧表示と更新は `facility_locations` を正本とし、リモデル先が存在する場合のみ `facility_location_remodels` を0..1件の子レコードとして扱う。' -Style $wdStyleNormal

Add-Paragraph -Selection $selection -Text '画面とAPIの関係' -Style $wdStyleHeading2
Add-NumberedAsParagraphs -Selection $selection -Items @(
  '施設選択候補表示時に対象施設候補取得APIを呼び出す',
  '共通マスタ候補表示時に SHIP部署候補取得API と SHIP諸室区分候補取得API を呼び出す',
  '施設選択後およびフィルタ変更時に個別施設マスタ一覧取得APIを呼び出す',
  'エクスポート押下時に個別施設マスタエクスポートAPIを呼び出す',
  'テンプレートDL押下時に個別施設マスタテンプレート取得APIを呼び出す',
  'ファイル選択後に個別施設マスタインポートプレビューAPIを呼び出し、追加/置換選択後に個別施設マスタインポート実行APIを呼び出す',
  '新規作成/編集/削除時に個別施設マスタ新規作成API、更新API、削除APIを呼び出す'
)

Add-Paragraph -Selection $selection -Text '使用テーブル' -Style $wdStyleHeading2
Add-Table -Document $doc -Selection $selection -Headers @('テーブル', '用途', '主な利用カラム') -Rows @(
  @('facilities', '施設選択候補、施設スコープ確認', 'facility_id, facility_name, deleted_at'),
  @('ship_departments', '共通マスタの部門/部署候補、名称解決', 'ship_department_id, division_name, department_name, is_active'),
  @('ship_room_categories', '共通マスタの諸室区分候補、名称解決', 'ship_room_category_id, room_category1, room_category2, is_active'),
  @('facility_locations', '現行ロケーション正本', 'facility_location_id, facility_id, division_id, department_id, room_id, building, floor, department_name, section_name, room_name, ship_department_id, ship_room_category_id, deleted_at'),
  @('facility_location_remodels', 'リモデル先ロケーション', 'facility_location_id, target_ship_department_id, target_ship_room_category_id, target_building, target_floor, target_department_name, target_section_name, target_room_name, target_room_count, deleted_at')
)

Add-Paragraph -Selection $selection -Text '第3章 共通仕様' -Style $wdStyleHeading1
Add-Paragraph -Selection $selection -Text 'API共通仕様' -Style $wdStyleHeading2
Add-BulletsAsParagraphs -Selection $selection -Items @(
  '通信方式: HTTPS',
  'データ形式: JSON（エクスポート/テンプレート取得を除く）',
  'ファイルアップロード: multipart/form-data',
  '文字コード: UTF-8',
  '日時形式: ISO 8601（例: `2026-03-12T00:00:00Z`）',
  '論理削除済みデータ（`deleted_at` が設定済みのレコード）は一覧・候補・出力対象外とする'
)

Add-Paragraph -Selection $selection -Text '認証方式' -Style $wdStyleHeading2
Add-Paragraph -Selection $selection -Text 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' -Style $wdStyleNormal

Add-Paragraph -Selection $selection -Text '権限モデル' -Style $wdStyleHeading2
Add-Paragraph -Selection $selection -Text '機能コードは `hospital_facility_master` を用いる。権限マトリクス上、admin は `F`、consultant は `R`、office_admin は `W`、office_staff は `R` とする。' -Style $wdStyleNormal
Add-Table -Document $doc -Selection $selection -Headers @('処理', '必要レベル', '想定ロール', '説明') -Rows @(
  @('施設候補取得 / 共通マスタ候補取得 / 一覧取得 / エクスポート / テンプレート取得', 'R以上', 'admin, consultant, office_admin, office_staff', '閲覧系処理'),
  @('インポートプレビュー / インポート実行 / 新規作成 / 更新 / 削除', 'W以上', 'admin, office_admin', '変更系処理')
)

Add-Paragraph -Selection $selection -Text '施設スコープ仕様' -Style $wdStyleHeading2
Add-BulletsAsParagraphs -Selection $selection -Items @(
  'admin は全施設を対象にできる',
  'consultant は担当施設のみを対象にできる',
  'office_admin / office_staff は所属施設のみを対象にできる',
  '固定施設がトークンから導出できない利用者は、一覧取得前に施設選択を必須とする'
)

Add-Paragraph -Selection $selection -Text '検索・絞り込み仕様' -Style $wdStyleHeading2
Add-BulletsAsParagraphs -Selection $selection -Items @(
  '一覧は選択施設を必須前提とする',
  '共通マスタ-部門と共通マスタ-部署は AND 条件で絞り込む',
  '文字列検索は部分一致を基本とする',
  '画面要件上ページングは定義しない'
)

Add-Paragraph -Selection $selection -Text 'ファイル入出力仕様' -Style $wdStyleHeading2
Add-BulletsAsParagraphs -Selection $selection -Items @(
  'サポート拡張子は `.xlsx` / `.xls` とする',
  'テンプレートとエクスポートは同一列定義を採用する',
  'インポートはプレビュー成功後に追加または置換を選択して反映する',
  '置換は選択施設分のみを対象とし、他施設データは保持する'
)

Add-Paragraph -Selection $selection -Text 'エラーレスポンス仕様' -Style $wdStyleHeading2
Add-Paragraph -Selection $selection -Text '基本エラーレスポンス（ErrorResponse）' -Style $wdStyleHeading3
Add-Table -Document $doc -Selection $selection -Headers @('フィールド', '型', '必須', '説明') -Rows @(
  @('code', 'string', '✓', 'エラーコード'),
  @('message', 'string', '✓', '利用者向けエラーメッセージ'),
  @('details', 'string[]', '-', '入力エラーや補足情報')
)

Add-Paragraph -Selection $selection -Text '第4章 API一覧' -Style $wdStyleHeading1
Add-Paragraph -Selection $selection -Text 'SHIP個別施設マスタ（/hospital-facility-master）' -Style $wdStyleHeading2
Add-Table -Document $doc -Selection $selection -Headers @('機能名', 'Method', 'Path', '概要', '認証') -Rows $apiListRows

Add-Paragraph -Selection $selection -Text '第5章 SHIP個別施設マスタ機能設計' -Style $wdStyleHeading1
foreach ($endpointSpec in $endpointSpecs) {
  Add-ApiEndpointBlock -Document $doc -Selection $selection -Spec $endpointSpec
}

Add-Paragraph -Selection $selection -Text '第6章 権限・業務ルール' -Style $wdStyleHeading1
Add-Paragraph -Selection $selection -Text '必要権限' -Style $wdStyleHeading2
Add-Table -Document $doc -Selection $selection -Headers @('処理', '機能権限コード', '必要レベル', '説明') -Rows @(
  @('一覧取得 / 候補取得 / エクスポート / テンプレート取得', 'hospital_facility_master', 'R以上', '閲覧系API'),
  @('インポートプレビュー / インポート実行 / 新規作成 / 更新 / 削除', 'hospital_facility_master', 'W以上', '変更系API')
)

Add-Paragraph -Selection $selection -Text 'リモデル子レコード運用ルール' -Style $wdStyleHeading2
Add-BulletsAsParagraphs -Selection $selection -Items @(
  '現行ロケーションは `facility_locations` を正本とする',
  'リモデル先入力がある場合のみ `facility_location_remodels` を0..1件で保持する',
  '更新時にリモデル先項目がすべて空になった場合は子レコードを削除または論理削除する',
  '削除時は親行と関連する子行を同時に削除する'
)

Add-Paragraph -Selection $selection -Text 'インポート運用ルール' -Style $wdStyleHeading2
Add-BulletsAsParagraphs -Selection $selection -Items @(
  '追加インポートは既存データへ追記する',
  '置換インポートは選択施設分のみを置き換える',
  'インポート前にプレビューで件数とエラー内容を確認する',
  'テンプレート列定義と一致しない列構成はエラーとする'
)

Add-Paragraph -Selection $selection -Text '未確定事項' -Style $wdStyleHeading2
Add-BulletsAsParagraphs -Selection $selection -Items @(
  '要件上の画面名は `SHIP個別施設マスタ` だが、現行モックの画面タイトルとメイン画面ボタン表記は `個別部署マスタ` になっている',
  'モックのインライン編集UIは `oldFloor`、`targetFloor`、`targetRoomCount`、新側のSHIP標準項目を表示していない一方、型定義・初期データ・Excel入出力・DB設計には存在する',
  'モック画面は施設選択状態として `facilityName` を保持しているが、DB/API の主キーは `facilityId` であるため、フロントの値保持方法は要調整である',
  '現行ロケーションの一意性条件（施設+階+部門+部署+室名など）の業務ルールは要件に明記がない',
  'インポート必須列は現行モック実装に依存しており、業務上必要な最終必須項目は要確認である'
)

Add-Paragraph -Selection $selection -Text '第7章 エラーコード一覧' -Style $wdStyleHeading1
Add-Table -Document $doc -Selection $selection -Headers @('エラーコード', 'HTTP', '説明') -Rows @(
  @('VALIDATION_ERROR', '400', '入力不正、ヘッダー不正、必須不足'),
  @('FACILITY_SELECTION_REQUIRED', '400', '施設未選択で一覧/出力/取込を要求した'),
  @('IMPORT_FILE_INVALID', '400', '取込ファイル形式不正または内容不正'),
  @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
  @('FORBIDDEN', '403', '必要権限不足または施設スコープ外'),
  @('FACILITY_NOT_FOUND', '404', '対象施設が存在しない'),
  @('FACILITY_LOCATION_NOT_FOUND', '404', '対象施設ロケーションが存在しない'),
  @('IMPORT_PREVIEW_NOT_FOUND', '404', 'プレビュー情報が存在しない'),
  @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
)

Add-Paragraph -Selection $selection -Text '第8章 運用・保守方針' -Style $wdStyleHeading1
Add-Paragraph -Selection $selection -Text 'マスタ保守方針' -Style $wdStyleHeading2
Add-BulletsAsParagraphs -Selection $selection -Items @(
  '個別施設マスタは施設単位で保守し、対象施設の誤選択を防ぐ',
  '共通マスタの部門/部署・諸室区分の候補は有効フラグ付きマスタを参照する',
  'リモデル完了後の現行値反映と子レコード整理の運用は別機能と整合を取る'
)

Add-Paragraph -Selection $selection -Text 'Excel運用方針' -Style $wdStyleHeading2
Add-BulletsAsParagraphs -Selection $selection -Items @(
  'テンプレートは最新列定義に合わせて管理する',
  'インポートエラーは行単位で明示し、全件失敗でも既存データを変更しない',
  '大量件数対応が必要になった場合は非同期取込方式を別途検討する'
)
'@

$script = [regex]::Replace(
  $script,
  '(?s)\$apiListRows = @\(.*?(?=  if \(\$doc\.TablesOfContents\.Count -ge 1\))',
  $replacementBlock + "`r`n"
)

& ([scriptblock]::Create($script)) | Out-Null

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($OutputPath, [System.IO.Compression.ZipArchiveMode]::Update)
try {
  $entry = $zip.GetEntry('word/document.xml')
  $reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
  try {
    $xml = $reader.ReadToEnd()
  }
  finally {
    $reader.Close()
  }

  $entry.Delete()
  $xml = $xml.Replace('現有品調査', $ScreenLabel)
  $xml = $xml.Replace('SHIP施設マスタ', $ScreenLabel)
  $xml = $xml.Replace('2026年3月9日', $CoverDateText)
  $xml = $xml.Replace('2026/03/09', $RevisionDateText)
  $xml = $xml.Replace(
    '2026</w:t><w:t>年</w:t><w:t>3</w:t><w:t>月</w:t><w:t>9</w:t><w:t>日',
    '2026</w:t><w:t>年</w:t><w:t>3</w:t><w:t>月</w:t><w:t>12</w:t><w:t>日'
  )

  $newEntry = $zip.CreateEntry('word/document.xml')
  $writer = New-Object System.IO.StreamWriter($newEntry.Open(), [System.Text.Encoding]::UTF8)
  try {
    $writer.Write($xml)
  }
  finally {
    $writer.Close()
  }
}
finally {
  $zip.Dispose()
}

Write-Output $OutputPath

