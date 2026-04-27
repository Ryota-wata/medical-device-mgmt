# 認証認可 実装イメージ整理（フロントエンド・バックエンド）

本メモは、[authz-table-proposal.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/docs/authz-table-proposal.md) を前提に、実際に DB・フロントエンド・バックエンドを構築する際に、どこで何をどのように提供するかを整理したものである。  
目的は、UI の表示制御と実処理認可を同じ正本で成立させる実装イメージを明確にすることにある。

## 1. 全体方針

- 権限の正本は `feature_code` / `column_code` とし、フロントエンドの表示制御とバックエンドの実処理認可の両方で同じコードを使う。
- フロントエンドは「見せない」「押させない」を担う。
- バックエンドは「実行させない」「返さない」を担う。
- ブラウザ上の DOM は利用者が変更できるため、security boundary は常にバックエンド側に置く。
- 他施設閲覧は、閲覧者側の利用可否と、公開元施設側の公開可否を両方満たした場合のみ許可する。

## 2. フロントエンドで提供するもの

### 2-1. ログイン後の基本状態

- ログイン後に保持する基本情報:
  - ログインユーザー
  - `accountType`
  - 担当施設一覧
  - 現在の作業対象施設 (`actingFacilityId`)
  - 現在の作業対象施設に対する実効機能一覧
  - 現在の作業対象施設に対する実効カラム一覧
- 実装系フロントエンドでは、上記を認証状態として保持する。

### 2-2. 施設選択画面

- 役割:
  - ログインユーザーに割り当てられた担当施設一覧を表示する
  - ユーザーに `actingFacilityId` を選ばせる
  - 選択後に `GET /auth/context?actingFacilityId=...` を呼び、当該施設における実効機能・実効カラムを取得する
- 病院ユーザーのように担当施設が 1 つしかない場合は自動選択して次画面へ進める

### 2-3. 認可コンテキストの保持

- フロントエンドでは `auth context` を共通 state として保持する
- 想定する保持内容:
  - `actingFacilityId`
  - `features: string[]`
  - `columns: string[]`
  - `menuGroups: string[]`
- この state をもとに `can(featureCode)` / `canColumn(columnCode)` のような共通ヘルパーを提供する
- フロントエンドはロール固定表ではなく、「サーバーから返された実効権限を参照するヘルパー」で表示制御を行う

### 2-4. 画面・メニュー・ボタンの表示制御

- 制御方針:
  - メニュー表示: `feature_code` が有効なものだけ表示する
  - 画面遷移導線: `feature_code` が無効ならリンクやボタンを出さない
  - 画面内ボタン: `feature_code` が無効なら描画しない
  - カラム表示: `column_code` が無効なら列定義に含めない
- 「機能を使えない = ボタン自体を表示しない」を基本とする
- ただし、見えなくするのは UX のためであり、最終的な認可はバックエンドに委ねる

### 2-5. ルートガード

- 各ページでは表示前に必要機能を確認する
- 例:
  - ユーザー管理画面は `user_list_view` を前提とし、編集操作ごとに `user_edit` / `user_facility_assignment_edit` を追加判定する
  - QRコード発行画面は `qr_issue`
  - 資産一覧・カルテ画面は `original_list_view`
  - 棚卸し画面は `inventory`、完了操作は `inventory_complete`
- 無効な場合は、トップ画面へ戻すか 403 相当の案内画面を出す

### 2-6. 画面内データ取得

- 業務 API 呼び出し時は、必ず `actingFacilityId` を送る
- 例:
  - 資産一覧: `GET /assets?actingFacilityId=10`
  - 棚卸し完了: `POST /inventories/complete?actingFacilityId=10`
- フロントエンドはレスポンスに含まれたデータだけを描画する
- 価格カラムなどは、画面側で列を出さないことに加え、バックエンドからも返さない前提とする

### 2-7. 設定管理画面

- フロントエンド側で必要になる管理画面:
  - 施設提供機能管理
  - 施設提供カラム管理
  - ユーザー施設別機能管理
  - ユーザー施設別カラム管理
  - 施設協業グループ管理
  - 他施設公開データ管理
  - 他施設公開カラム管理
- これらは実装系フロントエンドで新たに設計・実装する前提とする

## 3. バックエンドで提供するもの

### 3-1. 認証 API

- `POST /auth/login`
  - 認証処理を行う
  - セッションまたはトークンを発行する
- `POST /auth/logout`
  - セッション破棄を行う
- `GET /auth/me`
  - ログインユーザー基本情報
  - `accountType`
  - 担当施設一覧
  - 既定施設
  - アカウント状態
  - 監査用の最終ログイン日時
  - を返す
- `GET /auth/context?actingFacilityId=...`
  - 指定施設に対する実効 `feature_code` 一覧
  - 指定施設に対する実効 `column_code` 一覧
  - 必要ならメニュー表示グループ情報
  - を返す

### 3-2. 認可サービス

- バックエンドは共通の `AuthorizationService` を持つ
- 役割:
  - 自施設利用可否の判定
  - 他施設閲覧可否の判定
  - カラム表示可否の判定
  - 実効権限一覧の組み立て
- 判定元テーブル:
  - `user_facility_assignments`
  - `facility_feature_settings`
  - `facility_column_settings`
  - `user_facility_feature_settings`
  - `user_facility_column_settings`
  - `facility_collaboration_groups`
  - `facility_collaboration_group_facilities`
  - `facility_external_view_settings`
  - `facility_external_column_settings`

### 3-3. 設定変更 API

- バックエンド側で必要になる管理 API:
  - 施設提供機能更新 API
  - 施設提供カラム更新 API
  - ユーザー施設別機能更新 API
  - ユーザー施設別カラム更新 API
  - 担当施設割当 API
  - 施設協業グループ作成・更新 API
  - 他施設公開データ更新 API
  - 他施設公開カラム更新 API
- これらの API は、DB 制約で守れない業務ルールをチェックする
- 例:
  - `config_scope='FACILITY_USER'` の機能は施設提供機能更新 API で施設提供可否を管理し、ユーザー施設別機能更新 API でユーザーごとの利用可否を管理する
  - 施設側で OFF の機能をユーザー側だけ ON にできない
  - `usage_context='EXTERNAL'` ではない機能を他施設公開設定へ登録できない

### 3-4. 業務 API の認可

- すべての業務 API は、フロントエンド表示制御とは独立して毎回認可判定を行う
- 例:
  - 資産一覧 API は `original_list_view` を判定する
  - 資産一覧の管理部署一括更新 API は `original_list_view` と `management_department_edit` を合わせて判定し、`original_list_edit` では代替しない
  - ユーザー管理 API は `user_list_view` / `user_edit` / `user_facility_assignment_edit` を処理単位で判定する
  - 購入管理タブのSHIPへ一括依頼 API は `normal_ship_request` を判定し、`normal_purchase` だけでは実行できない。`normal_ship_request` は `config_scope='FACILITY_USER'` とし、施設提供設定とユーザー施設別設定の両方が ON の場合だけ許可する
  - 貸出返却画面の使用中/使用済みモーダル・ボタン API は `lending_checkout` と `lending_in_use_used` の両方を判定し、どちらか一方だけでは使用中/使用済みフローを実行できない。`lending_in_use_used` は `config_scope='FACILITY_USER'` とし、施設提供設定とユーザー施設別設定の両方が ON で、かつ親機能 `lending_checkout` の実効権限も有効な場合だけ許可する。施設提供設定で `lending_in_use_used` を OFF にする場合は、`lending_devices.asset_ledger_id` から `asset_ledgers.facility_id` を参照して対象施設の貸出機器に限定し、現在状態または `returned_on IS NULL` の未返却履歴に `使用中` / `使用済` 状態が残っていないことを保存時に検証する。ユーザー施設別設定で `lending_in_use_used` を OFF にする場合は当該ユーザーの権限だけを無効化し、既存の使用中/使用済みデータは権限を持つ別ユーザーまたは再付与後の同一ユーザーが後続処理する
  - QRコード発行 API は `qr_issue` を判定する
  - 棚卸し完了 API は `inventory` と `inventory_complete` を合わせて判定する
- 他施設公開の枠組みはテーブル設計上は維持するが、最新の `権限管理単位一覧` シートには external 専用 `feature_code` / `column_code` が含まれていないため、具体コードの追加は別途設計とする

### 3-5. レスポンス整形

- 業務 API は、許可されていないデータやカラムをレスポンスに含めない
- 例:
  - `original_price_column` が無効なら原本価格列を返さない
  - `normal_ship_column` または `remodel_ship_column` が無効なら該当の SHIP 列を返さない
- CSV / Excel 出力も同じルールを適用する
- これにより、フロントエンドで無理に列を復活させてもデータ自体は取得できない

### 3-6. 監査・履歴

- 設定系更新 API は、変更主体と変更内容を監査ログへ残す
- 少なくとも保持したい内容:
  - 更新者ユーザーID
  - 更新対象テーブル
  - 更新対象キー
  - 変更前値
  - 変更後値
  - 更新日時
- 権限変更に起因する問い合わせ対応は、原則この監査情報で追跡する

## 4. フロントエンドとバックエンドの連携フロー

### 4-1. ログインからメイン画面まで

1. フロントエンドが `POST /auth/login` を呼ぶ
2. バックエンドが認証成功後、セッションを発行する
3. フロントエンドが `GET /auth/me` を呼び、担当施設一覧を取得する
4. フロントエンドが施設選択画面で `actingFacilityId` を決定する
5. フロントエンドが `GET /auth/context?actingFacilityId=...` を呼ぶ
6. バックエンドが当該施設における実効 `feature_code` / `column_code` を返す
7. フロントエンドがそれを使ってメニューとボタンを描画する

### 4-2. 資産一覧・カルテ閲覧

1. フロントエンドが `can('original_list_view')` を見て画面遷移導線を表示する
2. ユーザーが一覧画面へ遷移する
3. フロントエンドが `GET /assets?actingFacilityId=...` を呼ぶ
4. バックエンドが `original_list_view` と必要な `column_code` を再判定する
5. バックエンドが許可されたデータ・カラムのみ返す

### 4-3. 棚卸し完了

1. フロントエンドが `can('inventory')` を見て棚卸し画面の導線を表示する
2. ユーザーが棚卸し画面へ遷移する
3. フロントエンドが `can('inventory_complete')` を見て完了ボタンと Excel 出力ボタンを表示する
4. ユーザーが完了操作を実行し、`POST /inventories/complete?actingFacilityId=...` を呼ぶ
5. バックエンドが `inventory` と `inventory_complete` を再判定し、許可された場合だけ完了処理と出力処理を実行する

## 5. モックの位置づけ

- モックは、クライアントとの画面イメージ・表示要件・操作要件の認識合わせに使う参照資料として扱う。
- 実装はモックのコードを流用・改修する前提ではなく、別途フロントエンド・バックエンドを設計して開発する前提とする。
- したがって、本メモで示すフロントエンド・バックエンドの責務分担は、モック置換手順ではなく、本番実装の責務整理として読む。
- 画面の見え方、入力項目、操作導線はモックを要件確認の根拠として参照しつつ、認証認可の実装は本メモと [authz-table-proposal.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/docs/authz-table-proposal.md) をベースに別途構築する。

## 6. 判断基準

- フロントエンドでやること:
  - 見せるか
  - 押させるか
  - 遷移させるか
- バックエンドでやること:
  - 実行させるか
  - データを返すか
  - カラムを返すか
- DBでやること:
  - 矛盾データを入れさせないか
  - 変更履歴を追えるか

この分担を守れば、UI 表示制御と実処理認可を同じ正本で運用できる。
