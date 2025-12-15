const XLSX = require('xlsx');

// 機能一覧データ（クリティカルパス順）
// 順番: 共通基盤 → 認証 → マスタ → 現有品調査 → データマッチング → 見積・調達 → 申請管理 → 資産検索 → 履歴
const features = [
  // ========== Phase 1: 共通基盤（他機能の前提） ==========
  { id: 'F-001', large: '共通', mid: 'Store', small: 'authStore', desc: '認証状態管理', impl: 1, test: 0.5 },
  { id: 'F-002', large: '共通', mid: 'Store', small: 'masterStore', desc: 'マスタ状態管理', impl: 1, test: 0.5 },
  { id: 'F-003', large: '共通', mid: 'Store', small: 'assetStore', desc: '資産状態管理', impl: 1, test: 0.5 },
  { id: 'F-004', large: '共通', mid: 'Store', small: 'userStore', desc: 'ユーザー状態管理', impl: 1, test: 0.5 },
  { id: 'F-005', large: '共通', mid: 'Store', small: 'hospitalFacilityStore', desc: '施設状態管理', impl: 1, test: 0.5 },
  { id: 'F-006', large: '共通', mid: 'Store', small: 'applicationStore', desc: '申請状態管理', impl: 1, test: 0.5 },
  { id: 'F-007', large: '共通', mid: 'Store', small: 'individualStore', desc: '個体状態管理', impl: 1, test: 0.5 },
  { id: 'F-008', large: '共通', mid: 'Store', small: 'remodelProjectStore', desc: 'リモデルプロジェクト管理', impl: 1, test: 0.5 },
  { id: 'F-009', large: '共通', mid: 'UI部品', small: 'Header', desc: '共通ヘッダーコンポーネント', impl: 1, test: 0.5 },
  { id: 'F-010', large: '共通', mid: 'UI部品', small: 'SearchableSelect', desc: '検索可能ドロップダウン', impl: 1.5, test: 0.5 },
  { id: 'F-011', large: '共通', mid: 'UI部品', small: 'ColumnSettingsModal', desc: 'カラム設定モーダル', impl: 1, test: 0.5 },
  { id: 'F-012', large: '共通', mid: 'UI部品', small: 'レスポンシブ対応', desc: 'PC/モバイル表示切替', impl: 2, test: 1 },
  { id: 'F-013', large: '共通', mid: 'Hooks', small: 'useAssetFilter', desc: '資産フィルターフック', impl: 1, test: 0.5 },
  { id: 'F-014', large: '共通', mid: 'Hooks', small: 'useAssetTable', desc: '資産テーブルフック', impl: 1, test: 0.5 },
  { id: 'F-015', large: '共通', mid: 'Hooks', small: 'useResponsive', desc: 'レスポンシブフック', impl: 0.5, test: 0.25 },

  // ========== Phase 2: 認証（システム利用の前提） ==========
  { id: 'F-016', large: '認証', mid: 'ログイン', small: 'ログインフォーム', desc: 'メールアドレス・パスワード入力フォーム', impl: 1, test: 0.5 },
  { id: 'F-017', large: '認証', mid: 'ログイン', small: 'バリデーション', desc: '入力値のバリデーション処理', impl: 0.5, test: 0.5 },
  { id: 'F-018', large: '認証', mid: 'ログイン', small: '認証処理', desc: 'ログイン認証・セッション管理', impl: 1, test: 1 },
  { id: 'F-019', large: '認証', mid: 'パスワード再設定', small: 'メール送信フォーム', desc: 'パスワード再設定メール送信', impl: 0.5, test: 0.5 },
  { id: 'F-020', large: '認証', mid: 'パスワード再設定', small: 'パスワード変更', desc: '新パスワード設定処理', impl: 0.5, test: 0.5 },

  // ========== Phase 3: ダッシュボード ==========
  { id: 'F-021', large: 'ダッシュボード', mid: 'メイン画面', small: 'メニュー表示', desc: '機能メニューボタン一覧表示', impl: 1, test: 0.5 },
  { id: 'F-022', large: 'ダッシュボード', mid: 'メイン画面', small: 'ユーザータイプ判定', desc: 'コンサル/病院ユーザーの権限判定', impl: 0.5, test: 0.5 },
  { id: 'F-023', large: 'ダッシュボード', mid: 'メイン画面', small: '施設選択モーダル', desc: 'リモデル管理用施設選択ダイアログ', impl: 1, test: 0.5 },
  { id: 'F-024', large: 'ダッシュボード', mid: 'メイン画面', small: 'ログアウト', desc: 'ログアウト処理', impl: 0.5, test: 0.25 },

  // ========== Phase 4: マスタ管理（他機能のデータ基盤） ==========
  // SHIP施設マスタ
  { id: 'F-025', large: 'マスタ管理', mid: 'SHIP施設マスタ', small: '一覧表示', desc: '施設一覧テーブル表示', impl: 1, test: 0.5 },
  { id: 'F-026', large: 'マスタ管理', mid: 'SHIP施設マスタ', small: 'フィルター機能', desc: '施設コード・施設名・都道府県・市区町村フィルター', impl: 1, test: 0.5 },
  { id: 'F-027', large: 'マスタ管理', mid: 'SHIP施設マスタ', small: '新規作成モーダル', desc: '施設新規登録フォーム', impl: 1, test: 0.5 },
  { id: 'F-028', large: 'マスタ管理', mid: 'SHIP施設マスタ', small: '編集モーダル', desc: '施設情報編集フォーム', impl: 1, test: 0.5 },
  { id: 'F-029', large: 'マスタ管理', mid: 'SHIP施設マスタ', small: '削除機能', desc: '施設削除処理', impl: 0.5, test: 0.5 },
  { id: 'F-030', large: 'マスタ管理', mid: 'SHIP施設マスタ', small: 'レスポンシブ表示', desc: 'PC:テーブル/モバイル:カード切替', impl: 1, test: 0.5 },

  // SHIP資産マスタ
  { id: 'F-031', large: 'マスタ管理', mid: 'SHIP資産マスタ', small: '一覧表示', desc: '資産マスタ一覧テーブル表示', impl: 1, test: 0.5 },
  { id: 'F-032', large: 'マスタ管理', mid: 'SHIP資産マスタ', small: 'フィルター機能', desc: 'Category・大分類・中分類フィルター', impl: 1, test: 0.5 },
  { id: 'F-033', large: 'マスタ管理', mid: 'SHIP資産マスタ', small: '新規作成モーダル', desc: '資産マスタ新規登録フォーム', impl: 1, test: 0.5 },
  { id: 'F-034', large: 'マスタ管理', mid: 'SHIP資産マスタ', small: '編集モーダル', desc: '資産マスタ編集フォーム', impl: 1, test: 0.5 },
  { id: 'F-035', large: 'マスタ管理', mid: 'SHIP資産マスタ', small: '削除機能', desc: '資産マスタ削除処理', impl: 0.5, test: 0.5 },
  { id: 'F-036', large: 'マスタ管理', mid: 'SHIP資産マスタ', small: '別ウィンドウ選択', desc: '親ウィンドウへの資産選択送信(postMessage)', impl: 1.5, test: 1 },

  // ユーザー管理
  { id: 'F-037', large: 'マスタ管理', mid: 'ユーザー管理', small: '一覧表示', desc: 'ユーザー一覧テーブル表示', impl: 1, test: 0.5 },
  { id: 'F-038', large: 'マスタ管理', mid: 'ユーザー管理', small: 'フィルター機能', desc: 'ユーザー名・メール・所属病院・ロールフィルター', impl: 1, test: 0.5 },
  { id: 'F-039', large: 'マスタ管理', mid: 'ユーザー管理', small: '新規作成モーダル', desc: 'ユーザー新規登録フォーム', impl: 1, test: 0.5 },
  { id: 'F-040', large: 'マスタ管理', mid: 'ユーザー管理', small: '編集モーダル', desc: 'ユーザー編集フォーム', impl: 1, test: 0.5 },
  { id: 'F-041', large: 'マスタ管理', mid: 'ユーザー管理', small: '削除機能', desc: 'ユーザー削除処理', impl: 0.5, test: 0.5 },
  { id: 'F-042', large: 'マスタ管理', mid: 'ユーザー管理', small: 'ロールバッジ表示', desc: 'ユーザーロール別バッジ表示', impl: 0.5, test: 0.25 },

  // 個別施設マスタ
  { id: 'F-043', large: 'マスタ管理', mid: '個別施設マスタ', small: '一覧表示', desc: '施設マッピング一覧表示', impl: 1, test: 0.5 },
  { id: 'F-044', large: 'マスタ管理', mid: '個別施設マスタ', small: 'フィルター機能', desc: '階・部門・室フィルター', impl: 1, test: 0.5 },
  { id: 'F-045', large: 'マスタ管理', mid: '個別施設マスタ', small: '新規作成モーダル', desc: '現状→新居マッピング登録', impl: 1.5, test: 0.5 },
  { id: 'F-046', large: 'マスタ管理', mid: '個別施設マスタ', small: '編集モーダル', desc: 'マッピング編集フォーム', impl: 1, test: 0.5 },
  { id: 'F-047', large: 'マスタ管理', mid: '個別施設マスタ', small: 'ステータス管理', desc: 'draft/mapped/completedステータス表示', impl: 0.5, test: 0.5 },
  { id: 'F-048', large: 'マスタ管理', mid: '個別施設マスタ', small: '別ウィンドウ自動クローズ', desc: '親ウィンドウ連携・自動クローズ', impl: 0.5, test: 0.5 },

  // ========== Phase 5: QRコード・ラベル管理（調査準備） ==========
  { id: 'F-049', large: 'QR・ラベル管理', mid: 'QRコード発行', small: '新規発行タブ', desc: 'QRコード新規発行フォーム', impl: 1, test: 0.5 },
  { id: 'F-050', large: 'QR・ラベル管理', mid: 'QRコード発行', small: '再発行タブ', desc: 'QRコード再発行フォーム', impl: 1, test: 0.5 },
  { id: 'F-051', large: 'QR・ラベル管理', mid: 'QRコード発行', small: '番号範囲指定', desc: '発行番号範囲の指定', impl: 0.5, test: 0.25 },
  { id: 'F-052', large: 'QR・ラベル管理', mid: 'QRコード発行', small: 'テンプレート選択', desc: 'QR/バーコードテンプレート選択', impl: 1, test: 0.5 },
  { id: 'F-053', large: 'QR・ラベル管理', mid: 'QRコード発行', small: 'フッター文字入力', desc: 'ラベルフッター文字設定', impl: 0.5, test: 0.25 },
  { id: 'F-054', large: 'QR・ラベル管理', mid: 'QRコード発行', small: '発行番号計算', desc: '発行予定番号の自動計算', impl: 0.5, test: 0.25 },
  { id: 'F-055', large: 'QR・ラベル管理', mid: 'QRコード印刷', small: 'QR番号リスト生成', desc: '印刷対象QR番号リスト生成', impl: 0.5, test: 0.25 },
  { id: 'F-056', large: 'QR・ラベル管理', mid: 'QRコード印刷', small: 'プリンター選択', desc: '出力プリンター選択', impl: 0.5, test: 0.25 },
  { id: 'F-057', large: 'QR・ラベル管理', mid: 'QRコード印刷', small: 'シール紙サイズ選択', desc: '用紙サイズ選択', impl: 0.5, test: 0.25 },
  { id: 'F-058', large: 'QR・ラベル管理', mid: 'QRコード印刷', small: 'プレビュー表示', desc: '印刷プレビュー表示', impl: 1.5, test: 0.5 },
  { id: 'F-059', large: 'QR・ラベル管理', mid: 'QRコード印刷', small: '印刷実行', desc: '印刷処理実行', impl: 1, test: 0.5 },

  // ========== Phase 6: 現有品調査（データ収集） ==========
  // 調査準備
  { id: 'F-060', large: '現有品調査', mid: '調査準備', small: '調査日表示', desc: '調査実施日の表示', impl: 0.25, test: 0.25 },
  { id: 'F-061', large: '現有品調査', mid: '調査準備', small: '施設情報選択', desc: '棟・階・部門・部署のドロップダウン選択', impl: 1, test: 0.5 },
  { id: 'F-062', large: '現有品調査', mid: '調査準備', small: 'Category選択', desc: '調査対象カテゴリー選択', impl: 0.5, test: 0.25 },
  { id: 'F-063', large: '現有品調査', mid: '調査準備', small: 'バリデーション', desc: '必須項目バリデーション', impl: 0.5, test: 0.5 },

  // オフライン準備
  { id: 'F-064', large: '現有品調査', mid: 'オフライン準備', small: 'マスタダウンロード', desc: 'マスタデータのオフライン保存', impl: 2, test: 1 },
  { id: 'F-065', large: '現有品調査', mid: 'オフライン準備', small: 'ダウンロード状態表示', desc: 'ダウンロード進捗・完了表示', impl: 0.5, test: 0.25 },
  { id: 'F-066', large: '現有品調査', mid: 'オフライン準備', small: 'データ送信', desc: '未送信データのサーバー送信', impl: 1.5, test: 1 },
  { id: 'F-067', large: '現有品調査', mid: 'オフライン準備', small: '接続状態表示', desc: 'オンライン/オフライン状態表示', impl: 0.5, test: 0.25 },

  // 資産詳細入力
  { id: 'F-068', large: '現有品調査', mid: '資産詳細入力', small: 'Stickyヘッダー', desc: 'ラベル番号・室名の固定ヘッダー', impl: 0.5, test: 0.25 },
  { id: 'F-069', large: '現有品調査', mid: '資産詳細入力', small: 'ラベル番号入力', desc: 'ラベル番号入力フォーム', impl: 0.5, test: 0.25 },
  { id: 'F-070', large: '現有品調査', mid: '資産詳細入力', small: '室名入力', desc: '室名入力フォーム', impl: 0.5, test: 0.25 },
  { id: 'F-071', large: '現有品調査', mid: '資産詳細入力', small: 'QRコード読取', desc: 'QRコードスキャン機能', impl: 2, test: 1 },
  { id: 'F-072', large: '現有品調査', mid: '資産詳細入力', small: '写真撮影', desc: 'カメラ撮影・画像保存', impl: 2, test: 1 },
  { id: 'F-073', large: '現有品調査', mid: '資産詳細入力', small: '資産情報入力フォーム', desc: '資産番号・シリアルNo等入力', impl: 1.5, test: 0.5 },
  { id: 'F-074', large: '現有品調査', mid: '資産詳細入力', small: '分類選択', desc: '大分類・中分類・品目・メーカー・型式選択', impl: 1.5, test: 0.5 },
  { id: 'F-075', large: '現有品調査', mid: '資産詳細入力', small: '寸法入力', desc: 'W・D・H寸法入力フォーム', impl: 0.5, test: 0.25 },
  { id: 'F-076', large: '現有品調査', mid: '資産詳細入力', small: 'リース・貸出品トグル', desc: 'リース・貸出品フラグ切替', impl: 0.5, test: 0.25 },
  { id: 'F-077', large: '現有品調査', mid: '資産詳細入力', small: '一括登録モード', desc: '開始〜終了ラベルNoの一括登録', impl: 1.5, test: 1 },
  { id: 'F-078', large: '現有品調査', mid: '資産詳細入力', small: '履歴表示', desc: '調査履歴一覧表示', impl: 0.5, test: 0.25 },

  // 調査内容修正
  { id: 'F-079', large: '現有品調査', mid: '調査内容修正', small: 'フィルター機能', desc: '棟・階・部門・部署・担当者等フィルター', impl: 1, test: 0.5 },
  { id: 'F-080', large: '現有品調査', mid: '調査内容修正', small: 'テーブル表示', desc: '調査データ一覧テーブル', impl: 1, test: 0.5 },
  { id: 'F-081', large: '現有品調査', mid: '調査内容修正', small: '行選択', desc: 'チェックボックスによる行選択', impl: 0.5, test: 0.25 },
  { id: 'F-082', large: '現有品調査', mid: '調査内容修正', small: 'インライン編集', desc: '行データのインライン編集', impl: 1.5, test: 1 },
  { id: 'F-083', large: '現有品調査', mid: '調査内容修正', small: '写真表示モーダル', desc: '写真拡大表示・ドラッグ移動', impl: 1, test: 0.5 },
  { id: 'F-084', large: '現有品調査', mid: '調査内容修正', small: '写真削除', desc: '写真削除機能', impl: 0.5, test: 0.5 },
  { id: 'F-085', large: '現有品調査', mid: '調査内容修正', small: 'マスタ紐付け状態表示', desc: '紐付け状態の色分け表示', impl: 0.5, test: 0.25 },
  { id: 'F-086', large: '現有品調査', mid: '調査内容修正', small: '資産マスタ選択(別窓)', desc: '別ウィンドウでの資産マスタ選択', impl: 1.5, test: 1 },
  { id: 'F-087', large: '現有品調査', mid: '調査内容修正', small: '行確定処理', desc: '個別行の確定処理', impl: 0.5, test: 0.5 },
  { id: 'F-088', large: '現有品調査', mid: '調査内容修正', small: '一括確定処理', desc: '複数行の一括確定', impl: 0.5, test: 0.5 },

  // ========== Phase 7: データマッチング（調査後の突合） ==========
  // ファイルインポート
  { id: 'F-089', large: 'データマッチング', mid: 'ファイルインポート', small: 'ファイルタイプ選択', desc: '固定資産/その他台帳選択', impl: 0.5, test: 0.25 },
  { id: 'F-090', large: 'データマッチング', mid: 'ファイルインポート', small: 'ドラッグ&ドロップ', desc: 'ファイルD&Dアップロード', impl: 1, test: 0.5 },
  { id: 'F-091', large: 'データマッチング', mid: 'ファイルインポート', small: 'ファイルバリデーション', desc: 'ファイル形式・サイズチェック', impl: 0.5, test: 0.5 },
  { id: 'F-092', large: 'データマッチング', mid: 'ファイルインポート', small: 'アップロード済み一覧', desc: 'アップロードファイル一覧表示', impl: 0.5, test: 0.25 },
  { id: 'F-093', large: 'データマッチング', mid: 'ファイルインポート', small: '進捗表示', desc: '突き合わせ進捗表示', impl: 0.5, test: 0.25 },
  { id: 'F-094', large: 'データマッチング', mid: 'ファイルインポート', small: 'ファイル削除', desc: 'アップロードファイル削除', impl: 0.5, test: 0.25 },

  // 資産突き合わせ
  { id: 'F-095', large: 'データマッチング', mid: '資産突き合わせ', small: 'フィルター機能', desc: '部門・部署・Category等フィルター', impl: 1, test: 0.5 },
  { id: 'F-096', large: 'データマッチング', mid: '資産突き合わせ', small: 'テーブル表示', desc: 'マッチングデータ一覧表示', impl: 1, test: 0.5 },
  { id: 'F-097', large: 'データマッチング', mid: '資産突き合わせ', small: 'インライン編集', desc: '行データのインライン編集', impl: 1.5, test: 1 },
  { id: 'F-098', large: 'データマッチング', mid: '資産突き合わせ', small: 'AI推奨機能', desc: 'AI候補の表示・適用', impl: 2, test: 1 },
  { id: 'F-099', large: 'データマッチング', mid: '資産突き合わせ', small: '親子関係自動更新', desc: 'フィールド変更時の連動更新', impl: 1, test: 0.5 },
  { id: 'F-100', large: 'データマッチング', mid: '資産突き合わせ', small: '確定機能', desc: 'マッチング確定処理', impl: 0.5, test: 0.5 },

  // 調査データマッチング
  { id: 'F-101', large: 'データマッチング', mid: '調査データマッチング', small: 'フィルター機能', desc: '複合条件フィルター', impl: 1, test: 0.5 },
  { id: 'F-102', large: 'データマッチング', mid: '調査データマッチング', small: '台帳ウィンドウ別開き', desc: '台帳データの別ウィンドウ表示', impl: 1.5, test: 1 },
  { id: 'F-103', large: 'データマッチング', mid: '調査データマッチング', small: 'フィルター同期', desc: 'ウィンドウ間フィルター同期', impl: 1.5, test: 1 },
  { id: 'F-104', large: 'データマッチング', mid: '調査データマッチング', small: 'ステータス管理', desc: '完全一致/部分一致/不一致等表示', impl: 1, test: 0.5 },
  { id: 'F-105', large: 'データマッチング', mid: '調査データマッチング', small: '編集モーダル', desc: 'マッチングデータ編集', impl: 1, test: 0.5 },
  { id: 'F-106', large: 'データマッチング', mid: '調査データマッチング', small: '一括確定', desc: '複数データ一括確定', impl: 0.5, test: 0.5 },

  // 台帳ウィンドウ
  { id: 'F-107', large: 'データマッチング', mid: '台帳ウィンドウ', small: 'フィルター受信', desc: '親ウィンドウからのフィルター受信', impl: 0.5, test: 0.5 },
  { id: 'F-108', large: 'データマッチング', mid: '台帳ウィンドウ', small: '台帳データ表示', desc: '台帳データテーブル表示', impl: 1, test: 0.5 },
  { id: 'F-109', large: 'データマッチング', mid: '台帳ウィンドウ', small: '複数選択', desc: 'チェックボックスによる複数選択', impl: 0.5, test: 0.25 },
  { id: 'F-110', large: 'データマッチング', mid: '台帳ウィンドウ', small: '選択情報送信', desc: '親ウィンドウへの選択データ送信', impl: 0.5, test: 0.5 },

  // ========== Phase 8: 見積・調達（申請の前提） ==========
  // 見積管理
  { id: 'F-111', large: '見積・調達', mid: '見積管理', small: 'タブ切り替え', desc: '見積依頼グループ/受領見積タブ', impl: 0.5, test: 0.25 },
  { id: 'F-112', large: '見積・調達', mid: '見積管理', small: '見積依頼グループ一覧', desc: '見積依頼グループCRUD', impl: 1.5, test: 0.5 },
  { id: 'F-113', large: '見積・調達', mid: '見積管理', small: 'ステータスフィルター', desc: '新規/処理中/完了フィルター', impl: 0.5, test: 0.25 },
  { id: 'F-114', large: '見積・調達', mid: '見積管理', small: '受領見積一覧', desc: '受領見積一覧表示', impl: 1, test: 0.5 },
  { id: 'F-115', large: '見積・調達', mid: '見積管理', small: '見積書登録モーダル', desc: '見積書登録ウィザード', impl: 1.5, test: 0.5 },
  { id: 'F-116', large: '見積・調達', mid: '見積管理', small: 'PDF読み込み', desc: '見積書PDFアップロード', impl: 1.5, test: 0.5 },
  { id: 'F-117', large: '見積・調達', mid: '見積管理', small: 'OCR処理', desc: '見積書OCR解析', impl: 3, test: 1.5 },
  { id: 'F-118', large: '見積・調達', mid: '見積管理', small: '資産マスタ紐付け', desc: 'OCR結果と資産マスタ紐付け', impl: 1.5, test: 1 },
  { id: 'F-119', large: '見積・調達', mid: '見積管理', small: 'AI推奨機能', desc: 'AI候補マッチング', impl: 2, test: 1 },

  // 見積処理
  { id: 'F-120', large: '見積・調達', mid: '見積処理', small: 'OCR抽出ステップ', desc: 'Step1: OCR結果表示', impl: 1, test: 0.5 },
  { id: 'F-121', large: '見積・調達', mid: '見積処理', small: 'マッチング確認ステップ', desc: 'Step2: マッチング結果確認', impl: 1, test: 0.5 },
  { id: 'F-122', large: '見積・調達', mid: '見積処理', small: 'OCR結果編集', desc: 'OCR抽出結果の編集', impl: 1, test: 0.5 },
  { id: 'F-123', large: '見積・調達', mid: '見積処理', small: '候補表示', desc: 'マッチング候補スコア表示', impl: 1, test: 0.5 },
  { id: 'F-124', large: '見積・調達', mid: '見積処理', small: '確定処理', desc: 'マッチング確定', impl: 0.5, test: 0.5 },

  // ========== Phase 9: 申請管理（メイン業務フロー） ==========
  // 申請一覧
  { id: 'F-125', large: '申請管理', mid: '申請一覧', small: 'フィルター機能', desc: '申請種別・ステータス・日付等フィルター', impl: 1, test: 0.5 },
  { id: 'F-126', large: '申請管理', mid: '申請一覧', small: 'テーブル表示', desc: '申請一覧テーブル表示', impl: 1, test: 0.5 },
  { id: 'F-127', large: '申請管理', mid: '申請一覧', small: '複数選択', desc: 'チェックボックス複数選択', impl: 0.5, test: 0.25 },
  { id: 'F-128', large: '申請管理', mid: '申請一覧', small: '申請詳細表示', desc: '申請詳細モーダル表示', impl: 1, test: 0.5 },
  { id: 'F-129', large: '申請管理', mid: '申請一覧', small: '申請編集', desc: '申請内容編集', impl: 1, test: 0.5 },
  { id: 'F-130', large: '申請管理', mid: '申請一覧', small: '申請削除', desc: '申請削除処理', impl: 0.5, test: 0.5 },
  { id: 'F-131', large: '申請管理', mid: '申請一覧', small: '個体登録', desc: '資産個体登録機能', impl: 1.5, test: 0.5 },
  { id: 'F-132', large: '申請管理', mid: '申請一覧', small: 'ステータスバッジ', desc: 'ステータス別バッジ表示', impl: 0.5, test: 0.25 },

  // リモデル申請
  { id: 'F-133', large: '申請管理', mid: 'リモデル申請', small: '申請情報入力フォーム', desc: '申請基本情報入力', impl: 1, test: 0.5 },
  { id: 'F-134', large: '申請管理', mid: 'リモデル申請', small: '位置情報選択', desc: '棟・階・部門・部署・室名選択', impl: 1, test: 0.5 },
  { id: 'F-135', large: '申請管理', mid: 'リモデル申請', small: '資産選択', desc: '申請対象資産選択', impl: 1, test: 0.5 },
  { id: 'F-136', large: '申請管理', mid: 'リモデル申請', small: '新規申請モーダル', desc: '新規申請登録フォーム', impl: 1.5, test: 0.5 },
  { id: 'F-137', large: '申請管理', mid: 'リモデル申請', small: '増設申請モーダル', desc: '増設申請登録フォーム', impl: 1, test: 0.5 },
  { id: 'F-138', large: '申請管理', mid: 'リモデル申請', small: '更新申請モーダル', desc: '更新申請登録フォーム', impl: 1, test: 0.5 },
  { id: 'F-139', large: '申請管理', mid: 'リモデル申請', small: '移動申請モーダル', desc: '移動申請登録フォーム', impl: 1, test: 0.5 },
  { id: 'F-140', large: '申請管理', mid: 'リモデル申請', small: '廃棄申請モーダル', desc: '廃棄申請登録フォーム', impl: 1, test: 0.5 },
  { id: 'F-141', large: '申請管理', mid: 'リモデル申請', small: '保留設定', desc: '申請保留設定', impl: 0.5, test: 0.25 },
  { id: 'F-142', large: '申請管理', mid: 'リモデル申請', small: '見積依頼グループ登録', desc: '見積依頼グループ作成', impl: 1, test: 0.5 },
  { id: 'F-143', large: '申請管理', mid: 'リモデル申請', small: '見積紐付けモーダル', desc: '見積と申請の紐付け', impl: 1.5, test: 0.5 },
  { id: 'F-144', large: '申請管理', mid: 'リモデル申請', small: '原本登録モーダル', desc: '原本ドキュメント登録', impl: 1.5, test: 0.5 },
  { id: 'F-145', large: '申請管理', mid: 'リモデル申請', small: '廃棄執行モーダル', desc: '廃棄執行処理', impl: 1, test: 0.5 },
  { id: 'F-146', large: '申請管理', mid: 'リモデル申請', small: '移動執行モーダル', desc: '移動執行処理', impl: 1, test: 0.5 },
  { id: 'F-147', large: '申請管理', mid: 'リモデル申請', small: 'リモデルクローズ', desc: 'リモデル完了処理', impl: 1, test: 0.5 },
  { id: 'F-148', large: '申請管理', mid: 'リモデル申請', small: 'ビュー切替', desc: 'リスト/カード表示切替', impl: 0.5, test: 0.25 },
  { id: 'F-149', large: '申請管理', mid: 'リモデル申請', small: 'カラム設定', desc: '表示カラム設定', impl: 1, test: 0.5 },
  { id: 'F-150', large: '申請管理', mid: 'リモデル申請', small: '進捗表示', desc: '未申請/申請中/執行済み進捗表示', impl: 1, test: 0.5 },

  // リモデル申請一覧
  { id: 'F-151', large: '申請管理', mid: 'リモデル申請一覧', small: 'フィルター機能', desc: '棟・階・部門等フィルター', impl: 1, test: 0.5 },
  { id: 'F-152', large: '申請管理', mid: 'リモデル申請一覧', small: 'テーブル表示', desc: '申請一覧テーブル', impl: 1, test: 0.5 },
  { id: 'F-153', large: '申請管理', mid: 'リモデル申請一覧', small: '複数選択', desc: 'チェックボックス複数選択', impl: 0.5, test: 0.25 },
  { id: 'F-154', large: '申請管理', mid: 'リモデル申請一覧', small: '別ウィンドウで開く', desc: '別ウィンドウ表示機能', impl: 0.5, test: 0.25 },
  { id: 'F-155', large: '申請管理', mid: 'リモデル申請一覧', small: '見積依頼グループ登録', desc: '見積依頼グループ作成', impl: 1, test: 0.5 },
  { id: 'F-156', large: '申請管理', mid: 'リモデル申請一覧', small: '見積紐付け', desc: '見積と申請の紐付け', impl: 1, test: 0.5 },
  { id: 'F-157', large: '申請管理', mid: 'リモデル申請一覧', small: '原本登録', desc: '原本ドキュメント登録', impl: 1, test: 0.5 },
  { id: 'F-158', large: '申請管理', mid: 'リモデル申請一覧', small: '廃棄執行', desc: '廃棄執行処理', impl: 1, test: 0.5 },
  { id: 'F-159', large: '申請管理', mid: 'リモデル申請一覧', small: '移動執行', desc: '移動執行処理', impl: 1, test: 0.5 },

  // ========== Phase 10: 資産検索・詳細（参照機能） ==========
  { id: 'F-160', large: '資産検索', mid: '検索結果', small: 'テーブル表示', desc: '検索結果テーブル表示', impl: 1, test: 0.5 },
  { id: 'F-161', large: '資産検索', mid: '検索結果', small: 'ビュー切替', desc: 'リスト/カード表示切替', impl: 0.5, test: 0.25 },
  { id: 'F-162', large: '資産検索', mid: '検索結果', small: '複数選択', desc: 'チェックボックス複数選択', impl: 0.5, test: 0.25 },
  { id: 'F-163', large: '資産検索', mid: '検索結果', small: '新規申請モーダル', desc: '検索結果からの新規申請', impl: 1, test: 0.5 },
  { id: 'F-164', large: '資産検索', mid: '検索結果', small: 'カラム設定', desc: '表示カラム設定', impl: 1, test: 0.5 },
  { id: 'F-165', large: '資産検索', mid: '検索結果', small: 'フィルター機能', desc: '検索条件フィルター', impl: 1, test: 0.5 },

  // 資産詳細
  { id: 'F-166', large: '資産検索', mid: '資産詳細', small: 'QRコード検索', desc: 'QRコードによる資産検索', impl: 0.5, test: 0.25 },
  { id: 'F-167', large: '資産検索', mid: '資産詳細', small: '資産情報表示', desc: '資産詳細情報表示', impl: 1, test: 0.5 },
  { id: 'F-168', large: '資産検索', mid: '資産詳細', small: '写真表示', desc: '資産写真表示', impl: 0.5, test: 0.25 },
  { id: 'F-169', large: '資産検索', mid: '資産詳細', small: '写真スライドショー', desc: '写真前後ナビゲーション', impl: 0.5, test: 0.25 },
  { id: 'F-170', large: '資産検索', mid: '資産詳細', small: '写真アップロード', desc: '資産写真アップロード', impl: 1, test: 0.5 },
  { id: 'F-171', large: '資産検索', mid: '資産詳細', small: '写真削除', desc: '資産写真削除', impl: 0.5, test: 0.25 },
  { id: 'F-172', large: '資産検索', mid: '資産詳細', small: '編集モード', desc: '資産情報編集モード', impl: 1, test: 0.5 },
  { id: 'F-173', large: '資産検索', mid: '資産詳細', small: '読み取り専用モード', desc: '閲覧のみモード', impl: 0.5, test: 0.25 },

  // ========== Phase 11: 履歴・サポート（補助機能） ==========
  { id: 'F-174', large: '履歴・サポート', mid: '調査履歴', small: '履歴カード表示', desc: '調査履歴カード一覧', impl: 1, test: 0.5 },
  { id: 'F-175', large: '履歴・サポート', mid: '調査履歴', small: '複数選択', desc: 'チェックボックス複数選択', impl: 0.5, test: 0.25 },
  { id: 'F-176', large: '履歴・サポート', mid: '調査履歴', small: '修正機能', desc: '調査データ修正遷移', impl: 0.5, test: 0.25 },
  { id: 'F-177', large: '履歴・サポート', mid: '調査履歴', small: '再利用機能', desc: '調査データ再利用', impl: 0.5, test: 0.25 },
];

// Excelデータ作成
const data = [
  ['機能ID', '大機能', '中機能', '小機能', '機能概要', '実装工数(人日)', 'テスト工数(人日)', '合計工数(人日)', '備考']
];

features.forEach(f => {
  const total = f.impl + f.test;
  data.push([
    f.id,
    f.large,
    f.mid,
    f.small,
    f.desc,
    f.impl,
    f.test,
    total,
    ''
  ]);
});

// 合計行
const totals = features.reduce((acc, f) => {
  acc.impl += f.impl;
  acc.test += f.test;
  return acc;
}, { impl: 0, test: 0 });

data.push([]);
data.push(['', '', '', '', '【合計】', totals.impl, totals.test, totals.impl + totals.test, '']);

// ワークブック作成
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// 列幅設定
ws['!cols'] = [
  { wch: 8 },   // 機能ID
  { wch: 15 },  // 大機能
  { wch: 20 },  // 中機能
  { wch: 25 },  // 小機能
  { wch: 40 },  // 機能概要
  { wch: 14 },  // 実装工数
  { wch: 14 },  // テスト工数
  { wch: 14 },  // 合計工数
  { wch: 30 },  // 備考
];

XLSX.utils.book_append_sheet(wb, ws, '機能一覧');

// ファイル出力
XLSX.writeFile(wb, 'docs/機能一覧_工数見積.xlsx');

console.log('Excel file created: docs/機能一覧_工数見積.xlsx');
console.log(`Total features: ${features.length}`);
console.log(`Implementation: ${totals.impl} days, Test: ${totals.test} days`);
console.log(`Total: ${totals.impl + totals.test} days`);
