$ShipFacilitySummaryRows = @(
  @('facilityId', 'int64', '✓', '施設ID（`facilities.facility_id`）。編集・削除操作で利用するAPI制御項目'),
  @('establishmentId', 'int64', '✓', '経営主体ID（`establishments.establishment_id`）'),
  @('medicalInstitutionCode', 'string', '✓', '医療機関コード。保存先は `facilities.facility_code`'),
  @('facilityName', 'string', '✓', '施設名（`facilities.facility_name`）'),
  @('establishmentName', 'string', '✓', '経営主体名。保存元は `establishments.establishment_name`'),
  @('prefecture', 'string', '✓', '都道府県（`facilities.prefecture`）'),
  @('city', 'string', '✓', '市区町村（`facility_details.city`）'),
  @('secondaryMedicalAreaName', 'string', '✓', '二次医療圏名（`facility_details.secondary_medical_area_name`）'),
  @('rebuildFiscalYear', 'string', '✓', '建替年度。4桁年度（`facility_details.rebuild_fiscal_year`）'),
  @('buildingArea', 'decimal', '✓', '建物面積。decimal(12,2)（`facility_details.building_area`）'),
  @('emergencyCenterCertified', 'boolean', '✓', '救命救急センター認定（`facility_details.emergency_center_certified`）'),
  @('emergencyHospitalCertificationType', 'string', '✓', '2次救急・3次救急病院認定区分。`NONE` / `SECONDARY` / `TERTIARY` / `SECONDARY_TERTIARY`'),
  @('perinatalCenterCertificationType', 'string', '✓', '周産期母子医療センター認定区分。`NONE` / `GENERAL` / `REGIONAL`'),
  @('disasterBaseHospitalCertified', 'boolean', '✓', '災害拠点病院認定（`facility_details.disaster_base_hospital_certified`）'),
  @('cancerRegionalBaseHospitalCertified', 'boolean', '✓', 'がん診療連携拠点病院認定（国指定）（`facility_details.cancer_regional_base_hospital_certified`）'),
  @('regionalMedicalSupportHospitalCertified', 'boolean', '✓', '地域医療支援病院認定（`facility_details.regional_medical_support_hospital_certified`）'),
  @('emergencyInitialCareRoomCount', 'int32', '✓', '救急初療室数（`facility_details.emergency_initial_care_room_count`）'),
  @('centralTreatmentBedCount', 'int32', '✓', '中央処置ベッド数（`facility_details.central_treatment_bed_count`）'),
  @('chemotherapyBedCount', 'int32', '✓', '化学療法ベッド数（`facility_details.chemotherapy_bed_count`）'),
  @('deliveryRoomCount', 'int32', '✓', '分娩室数（`facility_details.delivery_room_count`）'),
  @('endoscopyRoomCount', 'int32', '✓', '内視鏡室数（`facility_details.endoscopy_room_count`）'),
  @('dialysisBedCount', 'int32', '✓', '人工透析ベッド数（`facility_details.dialysis_bed_count`）'),
  @('operatingRoomCount', 'int32', '✓', '手術室数（`facility_details.operating_room_count`）'),
  @('centralBloodCollectionUnitCount', 'int32', '✓', '中央採血台数（`facility_details.central_blood_collection_unit_count`）'),
  @('totalBedCount', 'int32', '✓', '総病床数。保存先は `facilities.bed_count`'),
  @('emergencyWardBedCount', 'int32', '✓', '救急病棟病床数（`facility_details.emergency_ward_bed_count`）'),
  @('eicuBedCount', 'int32', '✓', 'E-ICU（遠隔集中治療室）病床数（`facility_details.eicu_bed_count`）'),
  @('icuBedCount', 'int32', '✓', 'ICU（集中治療室）病床数（`facility_details.icu_bed_count`）'),
  @('hcuBedCount', 'int32', '✓', 'HCU（ハイケアユニット）病床数（`facility_details.hcu_bed_count`）'),
  @('gicuBedCount', 'int32', '✓', 'G-ICU（総合集中治療室）病床数（`facility_details.gicu_bed_count`）'),
  @('ccuBedCount', 'int32', '✓', 'CCU（冠疾患集中治療室）病床数（`facility_details.ccu_bed_count`）'),
  @('scuBedCount', 'int32', '✓', 'SCU（脳卒中ケアユニット）病床数（`facility_details.scu_bed_count`）'),
  @('nicuBedCount', 'int32', '✓', 'NICU（新生児集中治療室）病床数（`facility_details.nicu_bed_count`）'),
  @('gcuBedCount', 'int32', '✓', 'GCU（新生児回復治療室）病床数（`facility_details.gcu_bed_count`）'),
  @('mficuBedCount', 'int32', '✓', 'MFICU（母体・胎児集中治療室）病床数（`facility_details.mficu_bed_count`）'),
  @('generalBedCount', 'int32', '✓', '一般病床数（`facility_details.general_bed_count`）'),
  @('cleanRoomBedCount', 'int32', '✓', '一般病床（無菌病棟）数（`facility_details.clean_room_bed_count`）'),
  @('palliativeCareBedCount', 'int32', '✓', '一般病床（緩和ケア）数（`facility_details.palliative_care_bed_count`）'),
  @('rehabilitationBedCount', 'int32', '✓', '一般病床（回復期リハ）数（`facility_details.rehabilitation_bed_count`）'),
  @('communityCareBedCount', 'int32', '✓', '一般病床（地域包括ケア）数（`facility_details.community_care_bed_count`）'),
  @('chronicCareBedCount', 'int32', '✓', '療養病床数（`facility_details.chronic_care_bed_count`）'),
  @('psychiatricBedCount', 'int32', '✓', '精神病床数（`facility_details.psychiatric_bed_count`）'),
  @('infectiousTuberculosisBedCount', 'int32', '✓', '感染症・結核病床数（`facility_details.infectious_tuberculosis_bed_count`）'),
  @('updatedAt', 'datetime', '✓', '最終更新日時。`facilities.updated_at` と `facility_details.updated_at` のうち最新の日時')
)

$ShipFacilityInputRows = @(
  @('establishmentId', 'int64', '条件付き', '既存の経営主体を選択する場合に指定する。保存先は `facilities.establishment_id`'),
  @('newEstablishmentName', 'string', '条件付き', '新規の経営主体名を入力する場合に指定する。`establishmentId` と排他的に指定する'),
  @('medicalInstitutionCode', 'string', '✓', '医療機関コード。保存先は `facilities.facility_code`'),
  @('facilityName', 'string', '✓', '施設名'),
  @('prefecture', 'string', '✓', '都道府県'),
  @('city', 'string', '✓', '市区町村'),
  @('secondaryMedicalAreaName', 'string', '✓', '二次医療圏名'),
  @('rebuildFiscalYear', 'string', '✓', '建替年度。4桁年度で指定する'),
  @('buildingArea', 'decimal', '✓', '建物面積。decimal(12,2)、0以上'),
  @('emergencyCenterCertified', 'boolean', '✓', '救命救急センター認定'),
  @('emergencyHospitalCertificationType', 'string', '✓', '2次救急・3次救急病院認定区分。`NONE` / `SECONDARY` / `TERTIARY` / `SECONDARY_TERTIARY`'),
  @('perinatalCenterCertificationType', 'string', '✓', '周産期母子医療センター認定区分。`NONE` / `GENERAL` / `REGIONAL`'),
  @('disasterBaseHospitalCertified', 'boolean', '✓', '災害拠点病院認定'),
  @('cancerRegionalBaseHospitalCertified', 'boolean', '✓', 'がん診療連携拠点病院認定（国指定）'),
  @('regionalMedicalSupportHospitalCertified', 'boolean', '✓', '地域医療支援病院認定'),
  @('emergencyInitialCareRoomCount', 'int32', '✓', '救急初療室数。0以上の整数'),
  @('centralTreatmentBedCount', 'int32', '✓', '中央処置ベッド数。0以上の整数'),
  @('chemotherapyBedCount', 'int32', '✓', '化学療法ベッド数。0以上の整数'),
  @('deliveryRoomCount', 'int32', '✓', '分娩室数。0以上の整数'),
  @('endoscopyRoomCount', 'int32', '✓', '内視鏡室数。0以上の整数'),
  @('dialysisBedCount', 'int32', '✓', '人工透析ベッド数。0以上の整数'),
  @('operatingRoomCount', 'int32', '✓', '手術室数。0以上の整数'),
  @('centralBloodCollectionUnitCount', 'int32', '✓', '中央採血台数。0以上の整数'),
  @('totalBedCount', 'int32', '✓', '総病床数。保存先は `facilities.bed_count`。0以上の整数'),
  @('emergencyWardBedCount', 'int32', '✓', '救急病棟病床数。0以上の整数'),
  @('eicuBedCount', 'int32', '✓', 'E-ICU（遠隔集中治療室）病床数。0以上の整数'),
  @('icuBedCount', 'int32', '✓', 'ICU（集中治療室）病床数。0以上の整数'),
  @('hcuBedCount', 'int32', '✓', 'HCU（ハイケアユニット）病床数。0以上の整数'),
  @('gicuBedCount', 'int32', '✓', 'G-ICU（総合集中治療室）病床数。0以上の整数'),
  @('ccuBedCount', 'int32', '✓', 'CCU（冠疾患集中治療室）病床数。0以上の整数'),
  @('scuBedCount', 'int32', '✓', 'SCU（脳卒中ケアユニット）病床数。0以上の整数'),
  @('nicuBedCount', 'int32', '✓', 'NICU（新生児集中治療室）病床数。0以上の整数'),
  @('gcuBedCount', 'int32', '✓', 'GCU（新生児回復治療室）病床数。0以上の整数'),
  @('mficuBedCount', 'int32', '✓', 'MFICU（母体・胎児集中治療室）病床数。0以上の整数'),
  @('generalBedCount', 'int32', '✓', '一般病床数。0以上の整数'),
  @('cleanRoomBedCount', 'int32', '✓', '一般病床（無菌病棟）数。0以上の整数'),
  @('palliativeCareBedCount', 'int32', '✓', '一般病床（緩和ケア）数。0以上の整数'),
  @('rehabilitationBedCount', 'int32', '✓', '一般病床（回復期リハ）数。0以上の整数'),
  @('communityCareBedCount', 'int32', '✓', '一般病床（地域包括ケア）数。0以上の整数'),
  @('chronicCareBedCount', 'int32', '✓', '療養病床数。0以上の整数'),
  @('psychiatricBedCount', 'int32', '✓', '精神病床数。0以上の整数'),
  @('infectiousTuberculosisBedCount', 'int32', '✓', '感染症・結核病床数。0以上の整数')
)

$ShipFacilityUpsertResponseRows = $ShipFacilitySummaryRows + @(
  @('createdAt', 'datetime', '✓', '作成日時（`facilities.created_at`）')
)

$ShipFacilityExportColumnRows = @(
  @('医療機関コード', 'medicalInstitutionCode', '`facilities.facility_code`'),
  @('施設名', 'facilityName', '`facilities.facility_name`'),
  @('経営主体', 'establishmentName', '`establishments.establishment_name`'),
  @('都道府県', 'prefecture', '`facilities.prefecture`'),
  @('市区町村', 'city', '`facility_details.city`'),
  @('二次医療圏名', 'secondaryMedicalAreaName', '`facility_details.secondary_medical_area_name`'),
  @('建替年度', 'rebuildFiscalYear', '`facility_details.rebuild_fiscal_year`'),
  @('建物面積', 'buildingArea', '`facility_details.building_area`'),
  @('救命救急センター認定', 'emergencyCenterCertified', '`facility_details.emergency_center_certified`'),
  @('２次救急・３次救急病院認定', 'emergencyHospitalCertificationType', '`facility_details.emergency_hospital_certification_type`'),
  @('周産期母子医療センター 認定（総合・地域）', 'perinatalCenterCertificationType', '`facility_details.perinatal_center_certification_type`'),
  @('災害拠点病院認定', 'disasterBaseHospitalCertified', '`facility_details.disaster_base_hospital_certified`'),
  @('がん診療連携拠点病院認定（国指定）', 'cancerRegionalBaseHospitalCertified', '`facility_details.cancer_regional_base_hospital_certified`'),
  @('地域医療支援病院認定', 'regionalMedicalSupportHospitalCertified', '`facility_details.regional_medical_support_hospital_certified`'),
  @('救急初療室数', 'emergencyInitialCareRoomCount', '`facility_details.emergency_initial_care_room_count`'),
  @('中央処置ベッド数', 'centralTreatmentBedCount', '`facility_details.central_treatment_bed_count`'),
  @('化学療法ベッド数', 'chemotherapyBedCount', '`facility_details.chemotherapy_bed_count`'),
  @('分娩室数', 'deliveryRoomCount', '`facility_details.delivery_room_count`'),
  @('内視鏡室数', 'endoscopyRoomCount', '`facility_details.endoscopy_room_count`'),
  @('人工透析ベッド数', 'dialysisBedCount', '`facility_details.dialysis_bed_count`'),
  @('手術室数', 'operatingRoomCount', '`facility_details.operating_room_count`'),
  @('中央採血台数', 'centralBloodCollectionUnitCount', '`facility_details.central_blood_collection_unit_count`'),
  @('総病床数', 'totalBedCount', '`facilities.bed_count`'),
  @('救急病棟', 'emergencyWardBedCount', '`facility_details.emergency_ward_bed_count`'),
  @('E-ICU (遠隔集中治療室)', 'eicuBedCount', '`facility_details.eicu_bed_count`'),
  @('ICU (集中治療室)', 'icuBedCount', '`facility_details.icu_bed_count`'),
  @('HCU (ハイケアユニット)', 'hcuBedCount', '`facility_details.hcu_bed_count`'),
  @('G-ICU (総合集中治療室)', 'gicuBedCount', '`facility_details.gicu_bed_count`'),
  @('CCU (冠疾患集中治療室)', 'ccuBedCount', '`facility_details.ccu_bed_count`'),
  @('SCU (脳卒中ケアユニット)', 'scuBedCount', '`facility_details.scu_bed_count`'),
  @('NICU (新生児集中治療室)', 'nicuBedCount', '`facility_details.nicu_bed_count`'),
  @('GCU (新生児回復治療室)', 'gcuBedCount', '`facility_details.gcu_bed_count`'),
  @('MFICU (母体･胎児集中治療室)', 'mficuBedCount', '`facility_details.mficu_bed_count`'),
  @('一般病床', 'generalBedCount', '`facility_details.general_bed_count`'),
  @('一般病床 (無菌病棟)', 'cleanRoomBedCount', '`facility_details.clean_room_bed_count`'),
  @('一般病床 (緩和ケア)', 'palliativeCareBedCount', '`facility_details.palliative_care_bed_count`'),
  @('一般病床 (回復期リハ)', 'rehabilitationBedCount', '`facility_details.rehabilitation_bed_count`'),
  @('一般病床 (地域包括ケア)', 'communityCareBedCount', '`facility_details.community_care_bed_count`'),
  @('療養病床', 'chronicCareBedCount', '`facility_details.chronic_care_bed_count`'),
  @('精神病床', 'psychiatricBedCount', '`facility_details.psychiatric_bed_count`'),
  @('感染症･結核病床', 'infectiousTuberculosisBedCount', '`facility_details.infectious_tuberculosis_bed_count`')
)

@{
  TemplatePath = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')) 'api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')) 'api\Fix\API設計書_SHIP施設マスタ.docx'
  ScreenLabel = 'SHIP施設マスタ'
  CoverDateText = '2026年6月5日'
  RevisionDateText = '2026/6/5'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、SHIP施設マスタ画面（`/ship-facility-master`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '一覧表示および絞り込み条件の I/F',
      '経営主体候補取得と新規経営主体登録ルール',
      '施設マスタの新規作成・更新・削除 I/F',
      'エクスポート処理の I/F',
      '権限・バリデーション・エラーレスポンス'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = 'SHIP施設マスタは、医療機関コード、施設名、経営主体、所在地、認定情報、諸室情報、病床情報を固定カラムとして参照・管理する画面である。ヘッダーの表示件数、一覧絞り込み、エクスポート、新規作成、編集、削除を提供する。' },
    @{ Type = 'Paragraph'; Text = '経営主体は `establishments.establishment_name` を画面表示名として扱う。既存候補から選択でき、新規名称が入力された場合は `establishments` 登録後に施設へ紐づける。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('SHIP施設マスタ', 'SHIP側で参照・管理する施設マスタ画面およびその対象データ'),
      @('経営主体', '施設の上位組織。保存元は `establishments` であり、画面・API上は経営主体として扱う'),
      @('施設マスタ', '医療機関コード、施設名、都道府県、総病床数などを保持する `facilities` と、認定情報・諸室情報・病床内訳を保持する `facility_details` の業務概念'),
      @('施設詳細', 'SHIP施設マスタ画面の固定カラムのうち `facilities` に含まれない詳細属性を1施設1行で保持する `facility_details`'),
      @('作業対象施設', '認可判定の基準となる選択中施設。Bearer トークン上のコンテキストとして扱う')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('項目', '内容'); Rows = @(
      @('画面名', '18. SHIP施設マスタ画面'),
      @('画面URL', '/ship-facility-master'),
      @('主機能', '施設一覧の検索、経営主体候補取得、エクスポート、施設作成、更新、削除')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、SHIP施設マスタ画面の一覧参照、経営主体候補取得、エクスポート、施設登録、施設更新、施設削除を提供する。権限管理画面のAPIは権限管理 API 設計書で扱い、本書の対象外とする。' },
    @{ Type = 'Paragraph'; Text = '画面は `facilities`、`facility_details`、`establishments` を参照する。登録・更新では `facilities` と `facility_details` を同一トランザクションで保存し、経営主体の新規入力時のみ `establishments` の作成を伴う。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      '画面初期表示およびフィルタ変更時に施設マスタ一覧取得 API を呼び出す',
      '経営主体コンボボックス表示時に経営主体候補取得 API を呼び出す',
      'エクスポート押下時にエクスポート API を呼び出す',
      '新規作成モーダルの登録押下時に施設マスタ新規作成 API を呼び出す',
      '編集モーダルの更新押下時に施設マスタ更新 API を呼び出す',
      '削除確認モーダルの OK 押下時に施設マスタ削除 API を呼び出す'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '用途', '主な利用カラム'); Rows = @(
      @('establishments', '経営主体候補表示、新規経営主体登録', 'establishment_id, establishment_name'),
      @('facilities', '一覧表示、施設登録、施設更新、施設削除、作業対象施設の存在確認と論理削除判定', 'facility_id, establishment_id, facility_code（医療機関コード）, facility_name, prefecture, bed_count（総病床数）, system_contract_status, deleted_at'),
      @('facility_details', '一覧表示、施設詳細登録、施設詳細更新', 'facility_id, city, secondary_medical_area_name, rebuild_fiscal_year, building_area, 認定情報, 諸室情報, 病床内訳, created_at, updated_at'),
      @('users', '共有システム管理者アカウント判定、監査記録の実行ユーザー解決', 'user_id, account_type'),
      @('user_facility_assignments', '通常アカウントの作業対象施設割当判定', 'user_id, facility_id, is_active, valid_from, valid_to'),
      @('facility_feature_settings', '通常アカウントの作業対象施設における `facility_master_list` / `facility_master_edit` 提供有無判定', 'facility_id, feature_code, is_enabled'),
      @('user_facility_feature_settings', '通常アカウントのユーザー×作業対象施設単位の `facility_master_list` / `facility_master_edit` 利用可否判定', 'user_facility_assignment_id, feature_code, is_enabled')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON（エクスポートAPIを除く）',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-17T00:00:00Z`）',
      '論理削除済みデータは対象外とする。`facilities.deleted_at` が設定済みの施設は一覧・エクスポート・施設認可判定対象外とし、`establishments.deleted_at` が設定済みの経営主体は経営主体候補対象外とする',
      '施設論理削除時も関連する担当施設割当・認可・他施設公開設定は保持し、施設復活時は既存設定を再利用する',
      '共有システム管理者アカウントは、作業対象施設が未削除である限り通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする',
      '医療機関コードは `facilities.facility_code` に保持し、論理削除済み施設を含む `facilities` 全件で一意とし、再利用しない',
      'SHIP施設マスタ画面の一覧固定カラムはすべて必須値として扱い、登録・更新リクエストで未指定または空値の場合は `VALIDATION_ERROR` を返却する',
      '`facility_details` は `facilities.facility_id` と同値の `facility_id` をPK兼FKとして1施設1行で保持する',
      '本API稼働時点では未削除 `facilities` 全件に対応する `facility_details` が存在する前提とする。欠落を検知した場合はデータ不整合として 500 `INTERNAL_SERVER_ERROR` を返却し、一覧・エクスポートから当該施設だけを除外して正常応答しない'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は以下の通りとする。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、`facility_master_list` / `facility_master_edit` を有効として扱う。削除済み施設は `/auth/me`、`/auth/context`、業務 API の対象外とする。' },
    @{ Type = 'Table'; Headers = @('管理単位名', 'feature_code', '対象処理'); Rows = @(
      @('施設マスタ / 一覧', '`facility_master_list`', '一覧表示、経営主体候補取得、エクスポート'),
      @('施設マスタ / 新規作成・編集', '`facility_master_edit`', '新規作成、更新、削除')
    ) },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('一覧表示 / 経営主体候補取得 / エクスポート', '`facility_master_list`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities`', '一覧参照系の処理'),
      @('新規作成 / 更新 / 削除', '`facility_master_edit`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities`', '施設マスタ管理処理')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設を認可コンテキストとして扱い、作業対象施設が存在しない、または `facilities.deleted_at IS NOT NULL` の場合は 404 とする',
      '通常アカウントでは、作業対象施設に対する実効 `feature_code` を都度再判定する。共有システム管理者アカウントでは、作業対象施設が未削除であれば通常判定をバイパスする',
      '一覧・エクスポートの返却対象は施設マスタ全件とし、個票データ閲覧で用いる他施設公開設定は適用しない',
      '新規作成・更新・削除の対象施設は作業対象施設と一致している必要はない。作業対象施設は認可基準、`facilityId` は施設マスタ上の更新対象として扱う',
      '通常アカウントで作業対象施設に対して必要な実効 `feature_code` がない場合は 403 を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '検索・絞り込み仕様' },
    @{ Type = 'Bullets'; Items = @(
      '都道府県、経営主体、医療機関コード、施設名は AND 条件で絞り込む',
      '文字列検索は部分一致とする',
      '表示件数は絞り込み後件数をそのまま返却する',
      '画面要件上ページングは定義しない'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Heading2'; Text = 'SHIP施設マスタ（/ship-facility-master）' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('施設マスタ一覧取得', 'GET', '/ship-facility-master/facilities', '施設一覧と表示件数を取得する', '要'),
      @('経営主体候補取得', 'GET', '/ship-facility-master/establishments', '経営主体コンボボックス用の候補を取得する', '要'),
      @('施設マスタエクスポート', 'GET', '/ship-facility-master/facilities/export', '現在の絞り込み条件で Excel を出力する', '要'),
      @('施設マスタ新規作成', 'POST', '/ship-facility-master/facilities', '施設マスタを新規登録する', '要'),
      @('施設マスタ更新', 'PUT', '/ship-facility-master/facilities/{facilityId}', '施設マスタを更新する', '要'),
      @('施設マスタ削除', 'DELETE', '/ship-facility-master/facilities/{facilityId}', '施設マスタを削除する', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 SHIP施設マスタ機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '施設マスタ一覧取得（/ship-facility-master/facilities）'
        Overview = 'SHIP施設マスタ一覧と表示件数を取得する。都道府県、経営主体、医療機関コード、施設名で絞り込み可能とする。'
        Method = 'GET'
        Path = '/ship-facility-master/facilities'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('prefecture', 'query', 'string', '-', '都道府県の部分一致条件'),
          @('establishmentName', 'query', 'string', '-', '経営主体名（`establishments.establishment_name`）の部分一致条件'),
          @('medicalInstitutionCode', 'query', 'string', '-', '医療機関コード（`facilities.facility_code`）の部分一致条件'),
          @('facilityName', 'query', 'string', '-', '施設名の部分一致条件')
        )
        PermissionLines = @(
          '認可条件: Bearer トークンが有効であること',
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_list` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_list` が有効であること'
        )
        ProcessingLines = @(
          '作業対象施設が存在し、未削除であることを確認する',
          '`facilities.deleted_at IS NULL` のみを対象にする',
          '`establishments` を結合して経営主体名を取得する',
          '`facility_details` を `facilities.facility_id = facility_details.facility_id` で結合し、固定カラムの詳細属性を取得する',
          '未削除施設に対応する `facility_details` が存在しない場合は、データ不整合として 500 `INTERNAL_SERVER_ERROR` を返却する',
          '都道府県・経営主体・医療機関コード・施設名は AND 条件で絞り込む',
          '画面要件上ページングは定義しない'
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
            Rows = $ShipFacilitySummaryRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipFacilityListResponse'),
          @('400', '不正な検索条件', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `facility_master_list` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '経営主体候補取得（/ship-facility-master/establishments）'
        Overview = '施設マスタ新規作成/編集モーダルの経営主体コンボボックスで使用する既存候補を取得する。'
        Method = 'GET'
        Path = '/ship-facility-master/establishments'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('keyword', 'query', 'string', '-', '経営主体名（`establishments.establishment_name`）の部分一致検索条件')
        )
        PermissionLines = @(
          '認可条件: Bearer トークンが有効であること',
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_list` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_list` が有効であること'
        )
        ProcessingLines = @(
          '作業対象施設が存在し、未削除であることを確認する',
          '`establishments.deleted_at IS NULL` のみを対象にする',
          'keyword 指定時は経営主体名を部分一致で絞り込む'
        )
        ResponseTitle = 'レスポンス（200：EstablishmentCandidateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '返却候補件数'),
          @('items', 'EstablishmentOption[]', '✓', '経営主体候補一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（EstablishmentOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('establishmentId', 'int64', '✓', '経営主体ID（`establishments.establishment_id`）'),
              @('establishmentName', 'string', '✓', '経営主体名（`establishments.establishment_name`）')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'EstablishmentCandidateResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `facility_master_list` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、または削除済み', 'ErrorResponse'),
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
          @('establishmentName', 'query', 'string', '-', '経営主体名（`establishments.establishment_name`）の部分一致条件'),
          @('medicalInstitutionCode', 'query', 'string', '-', '医療機関コード（`facilities.facility_code`）の部分一致条件'),
          @('facilityName', 'query', 'string', '-', '施設名の部分一致条件')
        )
        PermissionLines = @(
          '認可条件: Bearer トークンが有効であること',
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_list` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_list` が有効であること'
        )
        ProcessingLines = @(
          '作業対象施設が存在し、未削除であることを確認する',
          '一覧取得と同じ絞り込み条件を適用する',
          '出力対象は `facilities.deleted_at IS NULL` の未削除施設のみとする',
          '`establishments` と `facility_details` を結合し、SHIP施設マスタ画面の固定カラムを一覧表示順で出力する',
          '未削除施設に対応する `facility_details` が存在しない場合は、データ不整合として 500 `INTERNAL_SERVER_ERROR` を返却する'
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
          },
          @{
            Title = '出力列'
            Headers = @('列名', '対応APIフィールド', '保存元')
            Rows = $ShipFacilityExportColumnRows
          }
        )
        ResponseLines = @(
          'Body: フィルタ適用後の施設マスタ一覧を Excel バイナリで返却する。',
          '出力列はSHIP施設マスタ画面の一覧固定カラムと同一とし、基本情報、認定情報、諸室情報、病床情報の順で出力する。'
        )
        StatusRows = @(
          @('200', '出力成功', 'Excel File'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `facility_master_list` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設マスタ新規作成（/ship-facility-master/facilities）'
        Overview = '施設マスタを新規登録する。経営主体は既存候補選択または新規名称入力のいずれかを受け付け、一覧固定カラムをすべて必須入力として登録する。'
        Method = 'POST'
        Path = '/ship-facility-master/facilities'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（FacilityCreateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = $ShipFacilityInputRows
        PermissionLines = @(
          '認可条件: Bearer トークンが有効であること',
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_edit` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '作業対象施設が存在し、未削除であることを確認する',
          '`establishmentId` と `newEstablishmentName` はどちらか一方を必須とし、両方指定・両方未指定は入力エラーとする',
          '既存の経営主体が選択された場合は、`establishments.deleted_at IS NULL` の未削除経営主体だけを有効とし、存在しないまたは削除済みなら 404 `ESTABLISHMENT_NOT_FOUND` とする',
          '既存の経営主体が選択された場合は、その経営主体IDを `facilities.establishment_id` に設定して施設を登録する',
          '新規の経営主体名が入力され、未削除の `establishments` に同一名称（完全一致）が存在する場合は既存の `establishment_id` を利用し、新規登録しない',
          '新規の経営主体名が入力され、未削除の同一名称（完全一致）が存在しない場合のみ `establishments` に新規登録後、そのIDを施設へ紐づける',
          '`medicalInstitutionCode` は `facilities.facility_code` として保持し、論理削除済み施設を含む `facilities` 全件で一意とする。重複する場合は登録エラーとする',
          '一覧固定カラムの入力項目はすべて必須とし、未指定、空文字、数値項目の負数、区分値の不正値は 400 `VALIDATION_ERROR` とする',
          'boolean 認定項目は true/false の明示指定を必須とし、未認定は false とする',
          '2次救急・3次救急病院認定区分は `NONE` / `SECONDARY` / `TERTIARY` / `SECONDARY_TERTIARY` のいずれかを必須とする',
          '周産期母子医療センター認定区分は `NONE` / `GENERAL` / `REGIONAL` のいずれかを必須とする',
          '諸室数・病床数は0以上の整数を必須とし、0は明示的になしとして扱う。NULLは許可しない',
          '`facilities` と `facility_details` を同一トランザクションで登録する。`facility_details.facility_id` は登録した `facilities.facility_id` と同値のPK兼FKとする',
          '`facilities.deleted_at` は `NULL` で登録する'
        )
        ResponseTitle = 'レスポンス（201：FacilityUpsertResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $ShipFacilityUpsertResponseRows
        StatusRows = @(
          @('201', '登録成功', 'FacilityUpsertResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `facility_master_edit` なし', 'ErrorResponse'),
          @('404', '作業対象施設または指定した経営主体が存在しない/削除済み', 'ErrorResponse'),
          @('409', '医療機関コード重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設マスタ更新（/ship-facility-master/facilities/{facilityId}）'
        Overview = '既存の施設マスタを更新する。経営主体変更時は既存候補への付け替え、または新規経営主体登録後の付け替えを行い、一覧固定カラムをすべて必須入力として更新する。'
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
        RequestRows = $ShipFacilityInputRows
        PermissionLines = @(
          '認可条件: Bearer トークンが有効であること',
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_edit` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '作業対象施設が存在し、未削除であることを確認する',
          '対象施設が存在し、未削除であることを確認する',
          '`establishmentId` と `newEstablishmentName` はどちらか一方を必須とし、両方指定・両方未指定は入力エラーとする',
          '経営主体が既存候補へ変更された場合は、`establishments.deleted_at IS NULL` の未削除経営主体だけを有効とし、存在しないまたは削除済みなら 404 `ESTABLISHMENT_NOT_FOUND` とする',
          '経営主体が既存候補へ変更された場合は、施設の紐づけ先のみ更新する',
          '経営主体が新規名称へ変更され、未削除の `establishments` に同一名称（完全一致）が存在する場合は既存の `establishment_id` へ紐づけ先を更新し、新規登録しない',
          '経営主体が新規名称へ変更され、未削除の同一名称（完全一致）が存在しない場合のみ `establishments` 登録後に施設の紐づけ先を更新する',
          '`medicalInstitutionCode` は `facilities.facility_code` として保持し、論理削除済み施設を含む `facilities` 全件で一意とする。自身以外の他レコードと重複する場合は更新エラーとする',
          '一覧固定カラムの入力項目はすべて必須とし、未指定、空文字、数値項目の負数、区分値の不正値は 400 `VALIDATION_ERROR` とする',
          'boolean 認定項目は true/false の明示指定を必須とし、未認定は false とする',
          '2次救急・3次救急病院認定区分は `NONE` / `SECONDARY` / `TERTIARY` / `SECONDARY_TERTIARY` のいずれかを必須とする',
          '周産期母子医療センター認定区分は `NONE` / `GENERAL` / `REGIONAL` のいずれかを必須とする',
          '諸室数・病床数は0以上の整数を必須とし、0は明示的になしとして扱う。NULLは許可しない',
          '`facilities` と `facility_details` を同一トランザクションで更新する。既存施設に `facility_details` が存在しない場合は、必須入力値を用いて同一 `facility_id` の詳細行を作成する',
          '`facilities.updated_at` と `facility_details.updated_at` を更新する'
        )
        ResponseTitle = 'レスポンス（200：FacilityUpsertResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $ShipFacilityUpsertResponseRows
        StatusRows = @(
          @('200', '更新成功', 'FacilityUpsertResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `facility_master_edit` なし', 'ErrorResponse'),
          @('404', '作業対象施設、対象施設、または指定した経営主体が存在しない/削除済み', 'ErrorResponse'),
          @('409', '医療機関コード重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設マスタ削除（/ship-facility-master/facilities/{facilityId}）'
        Overview = '指定した施設マスタを削除する。施設レコードは論理削除とし、経営主体自体は削除しない。'
        Method = 'DELETE'
        Path = '/ship-facility-master/facilities/{facilityId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'path', 'int64', '✓', '削除対象の施設ID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークンが有効であること',
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_edit` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '作業対象施設が存在し、未削除であることを確認する',
          '対象施設が存在し、未削除であることを確認する',
          '`facilities.deleted_at` に削除日時を設定する',
          '`facility_details` は削除せず、施設削除状態は `facilities.deleted_at` で一元管理する',
          '関連する担当施設割当・認可・他施設公開設定は本APIで更新・削除しない',
          '`establishments` は削除対象としない',
          '削除済み施設は施設一覧・施設エクスポート・施設認可判定・業務データ参照の対象外とする。経営主体候補の除外条件は `establishments.deleted_at IS NOT NULL` とする',
          '再契約等で施設を復活させる場合は、既存施設レコードの `deleted_at` を解除して再利用する'
        )
        ResponseTitle = 'レスポンス'
        ResponseLines = @(
          'Body: なし'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `facility_master_edit` なし', 'ErrorResponse'),
          @('404', '作業対象施設または対象施設が存在しない/削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('一覧表示', '`facility_master_list`', '通常アカウントは作業対象施設に対して実効 `facility_master_list` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可', '施設一覧と表示件数を参照する'),
      @('経営主体候補取得', '`facility_master_list`', '通常アカウントは作業対象施設に対して実効 `facility_master_list` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可', '既存経営主体候補を取得する'),
      @('エクスポート', '`facility_master_list`', '通常アカウントは作業対象施設に対して実効 `facility_master_list` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可', '絞り込み結果を Excel で取得する'),
      @('新規作成 / 更新 / 削除', '`facility_master_edit`', '通常アカウントは作業対象施設に対して実効 `facility_master_edit` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可', '施設マスタを管理する')
    ) },
    @{ Type = 'Heading2'; Text = '経営主体登録ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`establishmentId` と `newEstablishmentName` は排他的必須とし、両方指定・両方未指定は `VALIDATION_ERROR` とする',
      '既存経営主体ID指定時は `establishments.deleted_at IS NULL` の未削除経営主体のみ有効とし、存在しないまたは削除済みの場合は `ESTABLISHMENT_NOT_FOUND` を返す',
      '既存経営主体を選択した場合は、選択した `establishments.establishment_id` を施設へ紐づける',
      '新規名称が入力された場合、未削除の `establishments` に同一名称（完全一致）が存在すれば既存レコードを利用し、存在しない場合のみ `establishments` を登録して施設へ紐づける',
      '更新時に経営主体が変更された場合も同じルールを適用する'
    ) },
    @{ Type = 'Heading2'; Text = '医療機関コード管理ルール' },
    @{ Type = 'Bullets'; Items = @(
      '医療機関コードは `facilities.facility_code` として保持し、論理削除済み施設を含む `facilities` 全件で一意とする',
      '施設論理削除後も医療機関コードは再利用しない',
      '再契約等で施設を復活させる場合は、既存施設レコードの `deleted_at` を解除して再利用する'
    ) },
    @{ Type = 'Heading2'; Text = '削除ルール' },
    @{ Type = 'Bullets'; Items = @(
      '削除対象は `facilities` のみとし、`establishments` は削除しない',
      '削除は論理削除（`deleted_at` 更新）とする',
      '関連する担当施設割当・認可・他施設公開設定は削除・無効化しない',
      '論理削除済み施設は施設一覧、施設エクスポート、施設認可判定、業務データ参照の対象外とする。経営主体候補の除外条件は `establishments.deleted_at IS NOT NULL` とする',
      '再契約等で施設を復活させる場合は既存施設レコードの `deleted_at` を解除し、保持済み設定を再利用する'
    ) },
    @{ Type = 'Heading2'; Text = 'エクスポート出力ルール' },
    @{ Type = 'Bullets'; Items = @(
      'エクスポート API の出力列はSHIP施設マスタ画面の一覧固定カラムと同一とし、基本情報、認定情報、諸室情報、病床情報の順とする',
      '検索条件、認可条件、論理削除済み施設の除外条件は一覧取得 API と同一とする'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '入力不正、条件付き必須不足、形式不正'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_FACILITY_MASTER_LIST_DENIED', '403', '通常アカウントで作業対象施設に対する実効 `facility_master_list` がない。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
      @('AUTH_403_FACILITY_MASTER_EDIT_DENIED', '403', '通常アカウントで作業対象施設に対する実効 `facility_master_edit` がない。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
      @('FACILITY_NOT_FOUND', '404', '作業対象施設または対象施設が存在しない、または削除済み'),
      @('ESTABLISHMENT_NOT_FOUND', '404', '指定した経営主体が存在しない、または削除済み'),
      @('MEDICAL_INSTITUTION_CODE_DUPLICATE', '409', '論理削除済み施設を含めて医療機関コードが重複している'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'マスタ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '医療機関コードの一意性を維持し、論理削除後も再利用しない',
      '新規経営主体名が未削除の既存経営主体名と完全一致する場合は既存レコードを利用し、重複行を作成しない',
      '施設更新・削除後は一覧 API の返却結果に即時反映する'
    ) },
    @{ Type = 'Heading2'; Text = 'エクスポート運用' },
    @{ Type = 'Bullets'; Items = @(
      'エクスポート対象は呼び出し時点の絞り込み結果とする',
      'ファイル名は `SHIP施設マスタ_YYYYMMDD.xlsx` とする',
      'エクスポートは同期応答で生成し、一覧取得 API と同一の検索条件・認可条件・論理削除除外条件を適用する'
    ) }
  )
}

