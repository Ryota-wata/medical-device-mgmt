# 日常点検 API内部設計

## 第1章 概要

### 本書の目的

本書は、日常点検オフライン準備画面（`/inspection-prep`）、日常点検画面（`/daily-inspection`）、点検結果画面（`/inspection-result`）で利用する API の設計内容を整理し、画面要件、DB 設計、点検管理タブとの責務境界を一致させることを目的とする。

特に以下を明確にする。

- 日常点検PWAで利用する資産・QR識別子・点検メニュー・資産別日常点検設定の取得 I/F
- 未送信の日常点検結果をサーバーへ同期する I/F
- QR コードを起点とした端末内ローカルデータによる対象資産・日常点検メニュー解決方針
- 日常点検結果の登録、貸出状態更新、修理申請連携用の結果 ID 返却方針
- 点検結果画面および報告書出力データ取得 I/F

### 対象システム概要

日常点検は、医療機器を QR コードで特定し、使用前・使用中・使用後のタイミングに応じた点検メニューを実施し、結果を記録する業務である。`/inspection-prep` を日常点検PWAの入口とし、オンライン状態で有効QR識別子付き点検対象資産、QR識別子、日常点検メニュー、点検項目、点検管理タブで有効な資産別日常点検設定行を端末内に全量ダウンロードした上で、点検開始後はダウンロード済みデータを用いてQR読取から点検実施までを継続する。

点検結果は端末内の未送信キューに保持し、オンライン復帰後に同期する。オンライン状態で即時登録する場合も、PWA上で利用したダウンロード済みメニューと項目スナップショットを保持し、同期APIと同じ検証・永続化ルールを適用する。

点検メニュー登録、資産一覧画面の選択資産から起動する点検管理登録、日常点検設定行の一覧表示・設定変更・設定解除、点検予定表 CSV 出力、定期点検実施、メーカー保守結果登録は No.30 点検管理タブ API 設計書の対象とし、本書では日常点検の準備・実施・結果参照を対象とする。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| 日常点検 | QR 読取した資産に対して、使用前・使用中・使用後のいずれかのタイミングで実施する点検 |
| 日常点検タイミング | `BEFORE` / `DURING` / `AFTER`。画面表示では `使用前` / `使用中` / `使用後` とする |
| 日常点検メニュー | `inspection_menus.menu_type='DAILY'` の点検メニュー。`daily_timing` と資産分類により選択する |
| 資産別日常点検設定 | `inspection_tasks.inspection_type='日常点検'`、`is_active=true` の1資産1有効行。`daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` に使用前・使用中・使用後メニューを保持する |
| 日常点検PWAパッケージ | `/inspection-prep/master/download` で全量取得し、端末内ストレージへ置換保存する有効QR識別子付き点検対象資産、QR識別子、日常点検メニュー、点検項目、有効な資産別日常点検設定行の集合。設定未登録資産もQR照合と警告表示のため資産側に含める |
| 点検結果明細 | 点検項目ごとの入力値。`inspection_results.result_details_json` に JSON として保持する |

### 対象画面

| 画面名 | 画面パス | 利用目的 |
| --- | --- | --- |
| 日常点検オフライン準備画面 | /inspection-prep | 日常点検PWAの入口。オンラインでPWAパッケージを取得し、未送信点検結果を同期する |
| 日常点検画面 | /daily-inspection | ダウンロード済みPWAパッケージを用いたQR読取、点検タイミング選択、点検項目入力、点検結果一時保存/登録、修理申請連携 |
| 点検結果画面 | /inspection-result | 点検結果の確認、報告書出力データ取得、次の点検または修理申請への後続導線 |

## 第2章 システム全体構成

### API の位置づけ

本 API 群は、日常点検担当者が対象施設内の資産をPWAで点検するためのサーバー I/F を提供する。QR読取後の対象資産特定と点検メニュー選択は、通常経路では `/inspection-prep/master/download` で取得した端末内PWAパッケージを用いてクライアント側で実行する。画面表示制御と API 実行可否は `daily_inspection` の実効 `feature_code` を正本として判定する。

点検管理タブで作成された点検メニューと、資産一覧画面の点検管理登録導線で登録された資産別日常点検設定を参照するが、メニュー CRUD、点検タスク登録、日程調整、スキップ、点検予定表 CSV 出力は本書の対象外とする。

### 画面と API の関係

| 画面操作 | API | 補足 |
| --- | --- | --- |
| `/inspection-prep` 初期表示 | `GET /inspection-prep/context` | ダウンロード状況、対象件数、最終同期情報を取得する |
| データをダウンロード | `GET /inspection-prep/master/download` | 有効QR識別子付き資産、QR識別子、日常点検メニュー、点検項目、有効な資産別日常点検設定行を全量取得し、端末側ストレージへ置換保存する。設定未登録資産もQR照合と警告表示のため資産側に含める |
| 点検結果を送信 | `POST /inspection-prep/results/sync` | 端末側に保持した未送信日常点検結果を一括送信する |
| QR 読取または手入力後の対象資産特定 | APIなし（端末内PWAパッケージを検索） | ダウンロード済みQR識別子、資産、資産別日常点検設定、日常点検メニューから対象資産と点検メニューを決定する。設定行または対象タイミングのメニューがない場合は点検入力画面へ遷移しない |
| オンライン時のQR再検証 | `GET /daily-inspection/assets/by-qr/{qrCode}` | PWAパッケージ不整合、未登録警告、オンライン補助確認が必要な場合だけ利用する補助API |
| 確認ステップの完了または修理申請連携 | `POST /daily-inspection/results` | オンライン実施結果を登録し、修理申請連携用 seed を返す |
| `/inspection-result` 表示または報告書出力 | `GET /inspection-result/reports/{inspectionResultId}` | 日常点検結果の表示と報告書出力に必要なデータを取得する。定期点検結果の参照は No.30 点検管理タブ API 設計書で扱う |

### 使用テーブル

| テーブル名 | 利用種別 | 用途 |
| --- | --- | --- |
| `asset_ledgers` | READ | 点検対象資産の属性取得、施設スコープ判定、管理機器番号による手入力補助検索 |
| `qr_codes` | READ | QR 識別子から資産台帳 ID を解決する |
| `inspection_menus` | READ | 日常点検メニューの取得、タイミング別メニュー判定 |
| `inspection_menu_items` | READ | 点検項目、入力方式、評価方式、選択肢の取得 |
| `inspection_tasks` | READ | 資産別日常点検設定の解決、点検結果の親タスク参照 |
| `inspection_results` | CREATE | 日常点検結果の登録、オフライン同期結果の保存 |
| `inspection_results` | READ | 点検結果画面/報告書データの取得、`clientResultId` 再送検出 |
| `application_documents` | READ | 点検結果報告書や添付資料のファイルメタデータ取得。ファイル実体は Amazon S3 に保存し、DB には `file_path` として S3 オブジェクトキーを保持する |
| `lending_devices` | READ / UPDATE | 貸出管理対象機器の場合の点検後ステータス更新 |
| `lending_device_status_definitions` | READ | 貸出管理機器ステータスの許容値確認 |
| `lending_device_status_transitions` | READ | 貸出管理対象機器の点検後ステータス更新可否確認 |
| `users` | READ | 実施者ユーザーIDと表示名の解決 |
| `facilities` | READ | 作業対象施設の存在確認、契約状態、論理削除確認 |

`inspection_results.inspection_task_id` は DB 定義上必須であるため、日常点検結果は `inspection_tasks.inspection_type='日常点検'`、`is_active=true` の資産別日常点検設定行へ紐づけて登録する。端末内PWAパッケージまたはオンラインQR再検証で対象タイミングの `inspectionTaskId` を解決できない場合、点検入力画面へ遷移させず、結果登録 API は `DAILY_INSPECTION_TASK_REQUIRED` または `DAILY_TIMING_MENU_REQUIRED` を返し、点検管理タブで日常点検設定を登録・変更させる。

## 第3章 共通仕様

### API 共通仕様

- 通信方式: HTTPS
- データ形式: JSON
- 文字コード: UTF-8
- 日時形式: ISO 8601（例: `2026-05-16T00:00:00Z`）
- 日付形式: `YYYY-MM-DD`
- 認証済み API は Bearer トークンを `Authorization` ヘッダーに付与する
- 一覧・ダウンロード系 API は Bearer トークン上の作業対象施設を基準に自施設データのみ返却する
- QR コードの値は `qr_codes.qr_identifier` を正本とする資産特定用の識別子であり、認証情報・ユーザー情報・権限情報を含めない

### 認証方式

ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。

### 権限モデル

本 API 群で使用する `feature_code` は以下の通りとする。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。

| 管理単位名 | feature_code | 対象処理 |
| --- | --- | --- |
| 日常点検・オフライン準備 | `daily_inspection` | 準備状況取得、PWAパッケージ取得、結果同期、オンラインQR再検証、日常点検結果登録、結果/報告書データ取得 |

| 処理 | 必要 feature_code | 判定テーブル | 説明 |
| --- | --- | --- | --- |
| 日常点検 API 全般 | `daily_inspection` | 通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` / 共有システム管理者: `users.account_type`, `facilities.deleted_at` | 作業対象施設内の日常点検準備・実施・結果参照を許可する |

### 作業対象施設ベースの認可

- 共有システム管理者アカウントでは、Bearer トークン上の作業対象施設が未削除であることを確認し、実効 `daily_inspection` の施設別・ユーザー別 ON/OFF 判定は行わない
- 通常アカウントでは、各 API が Bearer トークン上の作業対象施設に対する実効 `daily_inspection` を都度再判定する
- 資産を指定する API は、対象 `asset_ledgers.facility_id` が作業対象施設 ID と一致することを確認する
- 日常点検対象資産は原則 `asset_ledgers.status='ACTIVE'` とする。`REPAIR` / `RETIRED` / `LOST` など ACTIVE 以外の資産は、オンラインQR再検証では対象資産情報と警告を返すが、結果登録は拒否する
- 点検結果を指定する API は、`inspection_results -> inspection_tasks -> asset_ledgers` をたどって作業対象施設内の結果であることを確認する
- 日常点検は自施設業務として扱い、協業グループや他施設公開設定は適用しない

### オフライン同期方針

- オフラインパッケージは作業対象施設内の有効QR識別子付き点検対象資産、QR識別子、日常点検メニュー、点検項目、有効な資産別日常点検設定行を含める
- 有効QR識別子付き点検対象資産は、日常点検設定行の有無にかかわらず含める。これにより、QRは資産に紐づくが日常点検メニューが未設定である状態を、QR未登録エラーと区別して表示できる
- QR削除・再割当・資産状態変更を安全に反映するため、PWAパッケージ取得は差分マージではなく全量取得結果による端末内データ置換を正とする
- 初回、期限切れ、または未ダウンロードの場合は、オンラインでパッケージを取得するまで点検開始を許可しない
- 点検開始後のQR照合と点検メニュー解決は端末内PWAパッケージを正とし、サーバー照会を必須にしない
- 端末側は `clientResultId` を生成し、同期 API は同一 `clientResultId` の再送を検出する。現行 DB では専用一意制約を持てないため、同時送信の完全な一意保証は今後拡張事項とする
- 同期 API は結果 1 件ごとに成功/失敗を返し、失敗した結果は端末側で未送信として残せるようにする
- サーバー保存済みの点検結果は `inspectionResultId` を返却し、修理申請起票時の連携キーとして利用する

### PWAクライアント処理境界

- `/inspection-prep` は日常点検PWAの入口として、オンライン時にPWAパッケージを取得し、端末内ストレージへ保存する
- `/daily-inspection` はQR読取後、端末内PWAパッケージのQR識別子、資産、資産別日常点検設定、日常点検メニュー、点検項目を検索する。資産別日常点検設定行がない場合、または選択タイミングのメニューが未設定の場合は警告を表示し、点検実施画面へ進めない
- 点検結果は端末内の未送信キューへ保存し、`/inspection-prep/results/sync` が成功するまで削除しない
- 端末内キャッシュ、Service Worker、IndexedDBの実装詳細はフロントエンド実装範囲とし、サーバーDBには保存しない

### 点検結果明細 JSON 方針

`inspection_results.result_details_json` は、点検項目 ID、表示順、入力方式、評価方式、入力値、表示値、単位、判定を保持する。合否入力は画面の `○` / `×` を保存時に `PASS` / `FAIL` へ正規化し、表示用に `displayValue` も保持する。単位入力は数値と単位を分けて保持し、フリー入力は文字列を保持する。

#### 基本エラーレスポンス（ErrorResponse）

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けエラーメッセージ |
| details | string[] | - | 入力エラーや補足情報 |

## 第4章 API 一覧

### 日常点検オフライン準備（/inspection-prep）

| No | API名 | メソッド | パス | 用途 | 権限 |
| --- | --- | --- | --- | --- | --- |
| 1 | 準備状況取得 | GET | /inspection-prep/context | 点検対象件数、点検メニュー件数、最終同期情報、未送信件数を取得する | `daily_inspection` |
| 2 | PWAパッケージ取得 | GET | /inspection-prep/master/download | オフライン日常点検に必要な有効QR識別子付き資産・QR識別子・点検メニュー・項目・資産別設定を全量取得する | `daily_inspection` |
| 3 | 日常点検結果同期 | POST | /inspection-prep/results/sync | オフライン端末に保存された未送信点検結果を一括送信する | `daily_inspection` |

### 日常点検実施（/daily-inspection）

| No | API名 | メソッド | パス | 用途 | 権限 |
| --- | --- | --- | --- | --- | --- |
| 4 | オンラインQR資産再検証 | GET | /daily-inspection/assets/by-qr/{qrCode} | PWAパッケージ不整合時またはオンライン補助時にQR読取結果を再検証する | `daily_inspection` |
| 5 | 日常点検結果登録 | POST | /daily-inspection/results | 日常点検結果を登録し、必要に応じて貸出状態を更新する | `daily_inspection` |

### 点検結果（/inspection-result）

| No | API名 | メソッド | パス | 用途 | 権限 |
| --- | --- | --- | --- | --- | --- |
| 6 | 点検結果報告データ取得 | GET | /inspection-result/reports/{inspectionResultId} | 点検結果画面表示および報告書出力に必要なデータを取得する | `daily_inspection` |

## 第5章 日常点検機能設計

### getInspectionPrepContext

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `daily_inspection` が有効であること

#### 処理仕様

1. 作業対象施設の `facilities.deleted_at IS NULL` を確認する
2. `asset_ledgers.facility_id` が作業対象施設 ID と一致し、`status='ACTIVE'` かつ有効な `qr_codes` が紐づく資産件数を取得する
3. `inspection_tasks` から作業対象施設内の `inspection_type='日常点検'` かつ `is_active=true` の資産別日常点検設定件数を取得する
4. 有効な資産別日常点検設定行から参照される `inspection_menus.menu_type='DAILY'` のメニュー件数を取得する
5. サーバー管理の同期履歴がある場合は `clientDeviceId` と認証ユーザーに対応する最終ダウンロード日時・最終送信日時を返す
6. サーバーは端末内の未送信件数を保持しないため、`serverUnsyncedCount` は常に 0 とし、画面の未送信件数はクライアント側ストレージの件数を優先表示する

### getInspectionPrepMasterDownload

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `daily_inspection` が有効であること

#### 処理仕様

1. 作業対象施設の `facilities.deleted_at IS NULL` を確認する
2. `asset_ledgers.facility_id` が作業対象施設 ID と一致し、`status='ACTIVE'` かつ有効な `qr_codes` が1件以上紐づく資産を、日常点検設定行の有無にかかわらず取得する
3. `qr_codes.facility_id` が作業対象施設 ID と一致し、`deleted_at IS NULL`、`asset_ledger_id IS NOT NULL` のQR識別子を取得し、対象資産に紐づけて返す
4. `inspection_tasks` から、取得対象資産に紐づく `inspection_type='日常点検'`、`is_active=true` の資産別日常点検設定行を取得する。`status`、`last_inspection_on`、`next_inspection_on` は日常点検では使用しない
5. PWAへ配信する `inspection_menus` は、取得した有効な資産別日常点検設定行の `daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` から参照される有効な日常点検メニューに限定する。設定行から参照されない日常点検メニューは、メニュー候補や管理用データとして配信しない
6. 取得対象メニューに紐づく `inspection_menu_items` を `display_order ASC` で取得する
7. 資産に有効な日常点検設定行がない場合、資産データは返すが `settings` には含めない。クライアントはQR読取後に該当設定がないことを検出し、点検入力画面へ遷移させない
8. レスポンスは常に全量パッケージとし、クライアントは既存の端末内PWAパッケージをマージせず置換する
9. 同期履歴に最終ダウンロード日時を記録できる場合は `clientDeviceId` と認証ユーザーに紐づけて更新する。サーバー側同期履歴テーブルを持たない構成では端末側の最終ダウンロード日時を画面表示の正とする

### postInspectionPrepResultsSync

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `daily_inspection` が有効であること

#### 処理仕様

1. 各結果について `inspectionTaskId` が `inspection_type='日常点検'`、`status IS NULL` の日常点検設定行として存在し、紐づく `asset_ledgers.facility_id` が作業対象施設 ID と一致し、`asset_ledgers.status='ACTIVE'` であることを検証する
2. オフライン同期では、対象日常点検設定行が同期時点で `is_active=false` でも、`masterDownloadedAt` 時点でPWAパッケージに含まれ、かつ `deleted_at IS NULL` または `inspectedAt <= deleted_at` の場合は実施済み結果として登録を許可する。`masterDownloadedAt` が解除後、または `inspectedAt` が解除後の場合は `DAILY_INSPECTION_TASK_REQUIRED` とする
3. `assetLedgerId` が `inspection_tasks.asset_ledger_id` と一致することを検証する
4. `inspectionMenuId` が対象設定行の `daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` の指定タイミングと一致することを検証する。対象タイミングのメニューIDが `NULL` の場合は `DAILY_TIMING_MENU_REQUIRED` とする
5. `inspection_menus.menu_type='DAILY'` と `daily_timing` を検証する。オフライン同期ではダウンロード後に `is_active=false` へ変更されたメニューでも、メニュー ID と項目 ID が存在し、対象タスクの該当日常メニュー ID と一致する場合は登録を許可する
6. `resultDetails[*].inspectionMenuItemId` が対象メニュー配下の `inspection_menu_items` であることを検証する
7. 未登録の `clientResultId` は `inspection_results` に登録し、登録済みの `clientResultId` は既存 `inspectionResultId` を返す。現行 DB に `clientResultId` 専用カラムがないため、Phase1 では `clientDeviceId`、認証ユーザー、`clientResultId` の組み合わせをアプリケーションロックし、`result_details_json.clientResultId` を検索して再送を検出する。DB 一意制約による完全な同時実行保証は今後拡張事項とする
8. 合格時に対象資産が `lending_devices` に存在する場合は、`lending_device_status_transitions` で現在ステータスから `貸出可` への遷移が許可される場合のみ `status='貸出可'` へ更新する
9. 異常あり時に対象資産が `lending_devices` に存在する場合は、`lending_device_status_transitions` で現在ステータスから `使用不可` への遷移が許可される場合のみ `status='使用不可'` へ更新する
10. 貸出ステータス遷移が未定義の場合、点検結果登録自体は成功させ、レスポンスの `lendingStatusUpdateStatus` に `SKIPPED_TRANSITION_NOT_ALLOWED` を返す
11. 結果 1 件ごとに DB トランザクションを分け、1 件の失敗が他結果の保存を妨げないようにする
12. 同期完了後、成功件数が 1 件以上あれば最終同期日時を更新する

#### 永続化マッピング

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `inspection_results` | `inspection_task_id` | リクエスト `inspectionTaskId` | DB 必須 FK |
| `inspection_results` | `inspected_on` | リクエスト `inspectedOn` | 点検日 |
| `inspection_results` | `inspector_user_id` / `inspector_name` | 認証ユーザー ID / リクエスト `inspectorName` | 業務上の表示名は入力値を保持する |
| `inspection_results` | `overall_result` | `PASS` または `REPAIR_REQUEST` | 画面の `異常あり` は修理申請導線を持つため `REPAIR_REQUEST` に正規化する |
| `inspection_results` | `result_details_json` | 点検項目結果、`clientResultId`、`masterDownloadedAt`、`packageVersion`、`inspectedAt`、`dailyTiming`、`inspectionMenuId`、実施時点のメニュー/項目スナップショットを JSON 保存 | 項目別結果は正規化テーブルを持たない |
| `inspection_results` | `remarks` | リクエスト `remarks` | 備考 |
| `lending_devices` | `status` / `updated_at` | 合格時 `貸出可`、異常時 `使用不可` / 現在時刻 | `lending_device_status_transitions` で許可される場合のみ |

### getDailyInspectionAssetsByQrByQrCode

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `daily_inspection` が有効であること

#### 処理仕様

1. 通常フローでは、端末内PWAパッケージの `assets[*].qrIdentifiers` を検索して対象資産を決定する。本 API はオンライン再検証用であり、点検開始の必須条件にしない
2. QR コードを `qr_codes.qr_identifier` として解決し、`qr_codes.facility_id` が作業対象施設 ID と一致し、`qr_codes.deleted_at IS NULL`、`qr_codes.asset_ledger_id IS NOT NULL` であることを確認する
3. 対象資産の `facility_id` が作業対象施設 ID と一致することを確認する
4. 対象資産の `status` が `ACTIVE` 以外の場合は、資産情報を返しつつ `canRegisterResult=false`、`warningCode=DAILY_INSPECTION_ASSET_NOT_TARGET` とする
5. 対象資産に紐づく `inspection_tasks` のうち、`inspection_type='日常点検'`、`is_active=true` の日常点検設定行を取得する
6. `dailyTiming` 指定時は対応する `daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` のメニューを返す
7. 資産別設定がない場合でも、資産の大分類・中分類・品目に一致する有効な日常点検メニュー候補を返す。ただし結果登録には `inspectionTaskId` が必要であるため、`canRegisterResult=false`、`warningCode=DAILY_INSPECTION_TASK_REQUIRED` とし、画面は点検入力画面へ遷移しない。一致する日常点検メニュー候補もない場合は `warningCode=NO_DAILY_MENU` とする
8. 資産別設定行はあるが `dailyTiming` に対応するメニューIDが `NULL` の場合は、`canRegisterResult=false`、`warningCode=DAILY_TIMING_MENU_REQUIRED` とし、該当タイミングの点検入力画面へ遷移しない
9. メニュー候補は `inspection_menus.menu_type='DAILY'`、`is_active=true`、資産の大分類/中分類/品目一致、`daily_timing` 一致で絞り込む
10. 条件一致メニューがない場合は 200 で資産情報と空のメニュー配列を返し、画面側で警告を表示できるようにする

### postDailyInspectionResults

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `daily_inspection` が有効であること

#### 処理仕様

1. `inspectionTaskId`、`assetLedgerId`、`inspectionMenuId`、`dailyTiming` の整合を検証する。`inspectionTaskId` は `inspection_type='日常点検'`、`is_active=true`、`status IS NULL` の日常点検設定行でなければならない
2. 対象資産が作業対象施設内に存在し、`asset_ledgers.status='ACTIVE'` であることを検証する
3. 対象メニューが日常点検メニューであり、タイミングが一致することを検証する。対象タイミングの `daily_menu_*_id` が `NULL` の場合は `DAILY_TIMING_MENU_REQUIRED` とする
4. 点検項目結果が対象メニュー配下の項目と一致し、必須項目に入力値があることを検証する
5. `clientResultId` が指定された場合は同期APIと同じ冪等判定を行い、再送であれば既存 `inspectionResultId` を返す
6. `inspection_results` に点検結果を登録する
7. 対象資産が `lending_devices` に存在する場合、合格は `貸出可`、異常は `使用不可` への更新を試行する。ただし `lending_device_status_transitions` で現在ステータスから遷移先ステータスへの遷移が許可される場合のみ更新する
8. 貸出ステータス遷移が未定義の場合、点検結果登録自体は成功させ、レスポンスの `lendingStatusUpdateStatus` に `SKIPPED_TRANSITION_NOT_ALLOWED` を返す
9. 登録後は `inspectionResultId` と修理申請連携用の `repairRequestSeed` を返す
10. 日常点検実施画面から結果画面を利用する場合は、返却された `inspectionResultId` を用いて点検結果報告データ取得 API を呼び出す

### getInspectionResultReportsByInspectionResultId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `daily_inspection` が有効であること

#### 処理仕様

1. `inspection_results`、`inspection_tasks`、`asset_ledgers` を結合し、対象結果が作業対象施設内の資産に紐づくことを確認する
2. 対象 `inspection_tasks` が `inspection_type='日常点検'` の日常点検設定行であることを確認する。定期点検結果の場合は本 API の対象外として 403 を返す
3. `result_details_json` から点検メニュー ID、日常点検タイミング、項目結果を復元する
4. `application_documents.owner_type='INSPECTION_RESULT'`、`inspection_result_id=:inspectionResultId`、`document_category<>'PHOTO'`、`deleted_at IS NULL` に一致する点検結果報告書がある場合はメタデータを返す。`file_path` は Amazon S3 のオブジェクトキーとして保持し、バケット名や HTTPS URL は DB に保存しない
5. 日常点検結果の `returnTo` は `/inspection-prep` を返す
6. 報告書ファイルをサーバー側で生成済みの場合は、`application_documents.file_path` の S3 オブジェクトキーから認可済みダウンロード URL を発行し、`reportDocument.downloadUrl` として返す。S3 オブジェクトキーはレスポンスで直接返却しない。未生成の場合は画面側または帳票基盤で生成できるデータ一式を返す

## 第6章 権限・業務ルール

### 必要権限

| 処理 | 必要 feature_code | 判定基準 | 説明 |
| --- | --- | --- | --- |
| 日常点検準備・実施・結果参照 API 全般 | `daily_inspection` | 通常アカウントは作業対象施設に対する実効 `daily_inspection` を持つこと。共有システム管理者アカウントは作業対象施設が未削除であること | 日常点検担当者が実施する準備、点検、同期、結果参照 |

### 点検管理タブとの責務境界

- 点検メニュー登録・更新・削除は No.30 点検管理タブ API 設計書で扱う
- 資産一覧画面の選択資産から起動する点検管理登録による `inspection_tasks` 作成・更新は No.30 点検管理タブ API 設計書で扱う。日常点検では `inspection_type='日常点検'`、`is_active=true` の設定行に保持された `daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` がPWAパッケージの資産別日常点検設定として配信される
- 日常点検設定行の一覧表示、設定変更、一部解除、設定解除は No.30 点検管理タブ API 設計書で扱う
- 本 API は No.30 で登録された日常点検メニューと資産別日常点検設定行を参照する
- 点検予定表 CSV 出力は No.30 の責務であり、本書では扱わない

### 日常点検結果登録ルール

- `inspection_results.inspection_task_id` は必須であるため、日常点検結果は `inspection_type='日常点検'`、`is_active=true` の資産別日常点検設定行に紐づける
- 端末内PWAパッケージまたはオンラインQR再検証で `canRegisterResult=false` となった場合、画面は点検入力画面へ遷移せず、点検結果登録 API も呼び出さない。点検管理タブで日常点検設定が必要であることを表示する
- 画面表示の `合格` は `PASS`、`異常あり` は `REPAIR_REQUEST` として保存する
- 日常点検では `inspection_tasks.status`、`last_inspection_on`、`next_inspection_on` を更新しない。定期点検タスクの状態更新は No.30 の責務とする
- 貸出管理対象機器の場合、合格時は `貸出可`、異常あり時は `使用不可` への更新を行う。ただし `lending_device_status_transitions` で許可されない遷移は実行せず、点検結果登録は成功させた上でレスポンスに警告状態を返す

### オフライン同期ルール

- 同期 API は結果単位で成否を返し、部分成功を許可する
- 同一 `clientResultId` の再送を検出できた場合は二重登録せず、既存 `inspectionResultId` を返す
- 点検開始後のQR照合と点検メニュー解決は端末内PWAパッケージを用いて行う。オンラインQR資産再検証APIは補助用途であり、オフライン点検の必須経路にしない
- 同期時点でメニューまたは点検項目が無効化されていても、端末がダウンロード時に取得した `inspectionMenuId` と項目 ID が存在する場合は結果登録を許可し、実施時点のスナップショットを `result_details_json` に保持する
- 同期時点で日常点検設定行が設定解除済みでも、ダウンロード時点でPWAパッケージに含まれ、実施日時が解除日時以前であれば実施済み結果として登録を許可する
- 同期時点で資産が他施設へ移動済み、削除済み、または作業対象施設外になった場合は登録を拒否する

### 設計判断・制約

- 現行 DB にはオフライン同期用の専用履歴テーブルおよび `clientResultId` カラムがないため、本版では `result_details_json.clientResultId` に保持し、アプリケーションロックで同一端末・同一利用者・同一 `clientResultId` の同時登録を直列化する。DB 一意制約による完全な冪等保証は専用カラム追加時の拡張事項とし、その場合は `client_device_id` / `client_result_id` に一意制約を設ける
- `inspection_type='日常点検'` は点検予定日・ステータス遷移を持たない資産別日常点検設定行として扱う。日常点検結果登録時は `inspection_tasks.status`、`last_inspection_on`、`next_inspection_on` を更新せず、履歴は `inspection_results` に保存する
- PWAの端末内キャッシュ、未送信キュー、Service Worker、IndexedDBはクライアント実装責務であり、サーバーDBのテーブルとしては定義しない

## 第7章 エラーコード一覧

| エラーコード | HTTP | 説明 | 発生条件 |
| --- | --- | --- | --- |
| UNAUTHORIZED | 401 | 認証トークン未付与または無効 | Bearer トークン未付与、期限切れ、署名不正 |
| AUTH_403_DAILY_INSPECTION_DENIED | 403 | 通常アカウントで作業対象施設に対する実効 `daily_inspection` がない、または対象施設不一致 | 通常アカウントの施設割当なし、施設/ユーザー機能設定 OFF、対象資産が作業対象施設外 |
| DAILY_INSPECTION_400_INVALID_INPUT | 400 | 入力形式、必須項目、日付形式が不正 | 必須不足、列挙値外、日付/日時形式不正、`results` 空 |
| DAILY_INSPECTION_404_ASSET_NOT_FOUND | 404 | QR コードに一致する資産が存在しない | `qr_codes.qr_identifier` に一致する有効QRがない |
| DAILY_INSPECTION_404_TASK_NOT_FOUND | 404 | 点検タスクが存在しない | 指定 `inspectionTaskId` が存在しない、または作業対象施設外 |
| DAILY_INSPECTION_404_MENU_NOT_FOUND | 404 | 日常点検メニューが存在しない | 指定 `inspectionMenuId` が存在しない、または `menu_type<>DAILY` |
| DAILY_INSPECTION_404_RESULT_NOT_FOUND | 404 | 点検結果が存在しない | 指定 `inspectionResultId` が存在しない、または作業対象施設外 |
| NO_DAILY_MENU | 200 | 資産分類に一致する日常点検メニュー候補が存在しない | オンラインQR再検証で、資産別設定がなく、かつ大分類・中分類・品目に一致する有効な日常点検メニュー候補もない |
| DAILY_INSPECTION_ASSET_NOT_TARGET | 409 | 日常点検対象外の資産 | `asset_ledgers.status` が `ACTIVE` ではない資産に対して結果登録しようとした |
| DAILY_INSPECTION_TASK_REQUIRED | 409 | 日常点検結果登録に必要な資産別日常点検設定が未登録 | 端末内PWAパッケージまたはオンラインQR再検証で対象タイミングの `inspectionTaskId` を解決できない |
| DAILY_TIMING_MENU_REQUIRED | 409 | 対象タイミングの日常点検メニューが未設定 | 資産別日常点検設定行は存在するが、指定 `dailyTiming` に対応する `daily_menu_*_id` が `NULL` |
| DAILY_INSPECTION_MENU_MISMATCH | 409 | 指定タイミングのメニューが資産別日常点検設定と一致しない | 指定 `dailyTiming` と `inspection_tasks.daily_menu_*_id` が一致しない |
| DAILY_INSPECTION_422_RESULT_DETAIL_INVALID | 422 | 点検結果明細の項目、入力方式、評価方式がメニュー定義と一致しない | 点検項目 ID 不一致、入力方式不一致、必須入力不足 |
| DAILY_INSPECTION_502_S3_URL_SIGN_FAILED | 502 | 点検結果報告書の Amazon S3 ダウンロード URL 発行に失敗した | `application_documents.file_path` の S3 オブジェクトキーに対する認可済みダウンロード URL 発行失敗 |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー | 想定外例外 |

## 第8章 運用・保守方針

### マスタ保守方針

- 日常点検メニューの正本は `inspection_menus` と `inspection_menu_items` とし、登録・編集は点検管理タブ側 API で行う。資産へ適用できるメニューは対象資産の大分類・中分類・品目と一致する有効メニューに限定する
- 資産別日常点検設定の正本は `inspection_tasks.inspection_type='日常点検'`、`is_active=true` の1資産1有効行とし、`daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` を保持する。作成・変更・解除は点検管理タブ側 API で行い、同分類の全資産へ自動展開しない
- 日常点検実施画面は、オンライン状態で事前取得したPWAパッケージを用いてQR照合とメニュー解決を行う。オフライン実施ではダウンロード時点のメニューと項目スナップショットに基づいて記録する

### 今後拡張時の留意点

- オフライン同期の冪等性を強化する場合は、`inspection_results` に `client_result_id` と `client_device_id` を追加し、一意制約を設定する
- `inspection_type='日常点検'` にステータスや予定日を追加する場合は、点検管理タブの一覧表示、PWA配信対象、ステータス定義・遷移定義に影響するため No.30 と同時に見直す
- 点検結果報告書をサーバー生成する場合は、ファイル実体を Amazon S3 へ PutObject し、`application_documents.owner_type='INSPECTION_RESULT'` と `file_path` の S3 オブジェクトキーを保存する。DB にバケット名や HTTPS URL は保存せず、取得 API の `reportDocument.downloadUrl` では認可済みダウンロード URL を返す
- 修理申請 API 実装時は、日常点検結果登録 API が返す `inspectionResultId` を `repair_request_details.inspection_result_id` へ引き継ぐ
