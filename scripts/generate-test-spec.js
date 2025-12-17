const XLSX = require('xlsx');
const path = require('path');

// テストケースデータ（1行1テストケース形式）
const testCases = {
  // メイン画面
  'メイン画面': [
    { id: 'IT-001', category: '正常系', viewpoint: '画面表示', precondition: 'アプリにアクセス', operation: 'メイン画面を開く', input: '-', expected: 'メイン画面が表示される' },
    { id: 'IT-002', category: '正常系', viewpoint: '画面表示', precondition: 'メイン画面表示', operation: '各ボタンの表示確認', input: '-', expected: '全ての機能ボタンが表示される' },
    { id: 'IT-003', category: '正常系', viewpoint: '画面遷移', precondition: 'メイン画面表示', operation: 'リモデル申請ボタンをクリック', input: '-', expected: 'リモデル申請画面に遷移する' },
    { id: 'IT-004', category: '正常系', viewpoint: '画面遷移', precondition: 'メイン画面表示', operation: '現有品調査ボタンをクリック', input: '-', expected: '現有品調査画面に遷移する' },
    { id: 'IT-005', category: '正常系', viewpoint: '画面遷移', precondition: 'メイン画面表示', operation: 'SHIP資産マスタボタンをクリック', input: '-', expected: 'SHIP資産マスタ画面に遷移する' },
    { id: 'IT-006', category: '正常系', viewpoint: '画面遷移', precondition: 'メイン画面表示', operation: '施設マスタボタンをクリック', input: '-', expected: '施設マスタ画面に遷移する' },
    { id: 'IT-007', category: '正常系', viewpoint: '画面遷移', precondition: 'メイン画面表示', operation: '個別施設マスタボタンをクリック', input: '-', expected: '個別施設マスタ画面に遷移する' },
    { id: 'IT-008', category: '正常系', viewpoint: '画面遷移', precondition: 'メイン画面表示', operation: '見積管理ボタンをクリック', input: '-', expected: '見積管理画面に遷移する' },
    { id: 'IT-009', category: '正常系', viewpoint: '画面遷移', precondition: 'メイン画面表示', operation: 'データマッチングボタンをクリック', input: '-', expected: 'データマッチング画面に遷移する' },
    { id: 'IT-010', category: '正常系', viewpoint: '画面遷移', precondition: '各画面表示', operation: '戻るボタンをクリック', input: '-', expected: 'メイン画面に戻る' },
  ],

  // リモデル申請
  'リモデル申請': [
    // 画面表示
    { id: 'IT-101', category: '正常系', viewpoint: '画面表示', precondition: 'リモデル申請画面表示', operation: '申請一覧を確認', input: '-', expected: '申請一覧がテーブル形式で表示される' },
    { id: 'IT-102', category: '正常系', viewpoint: '画面表示', precondition: 'リモデル申請画面表示', operation: '新規申請ボタンの表示確認', input: '-', expected: '新規申請ボタンが表示される' },
    { id: 'IT-103', category: '正常系', viewpoint: '画面表示', precondition: 'リモデル申請画面表示', operation: 'フィルターエリアの表示確認', input: '-', expected: 'フィルター項目が表示される' },
    // 新規登録
    { id: 'IT-104', category: '正常系', viewpoint: '新規登録', precondition: 'リモデル申請画面表示', operation: '新規申請ボタンをクリック', input: '-', expected: '新規申請モーダルが表示される' },
    { id: 'IT-105', category: '正常系', viewpoint: '新規登録', precondition: '新規申請モーダル表示', operation: '品名を入力', input: 'テスト機器', expected: '入力欄に値が反映される' },
    { id: 'IT-106', category: '正常系', viewpoint: '新規登録', precondition: '新規申請モーダル表示', operation: '型番を入力', input: 'MODEL-001', expected: '入力欄に値が反映される' },
    { id: 'IT-107', category: '正常系', viewpoint: '新規登録', precondition: '新規申請モーダル表示', operation: '申請種別を選択', input: '新規申請', expected: 'プルダウンで選択できる' },
    { id: 'IT-108', category: '正常系', viewpoint: '新規登録', precondition: '新規申請モーダル表示', operation: '業者名を入力', input: 'テスト業者', expected: '入力欄に値が反映される' },
    { id: 'IT-109', category: '正常系', viewpoint: '新規登録', precondition: '新規申請モーダル表示', operation: '数量を入力', input: '1', expected: '入力欄に値が反映される' },
    { id: 'IT-110', category: '正常系', viewpoint: '新規登録', precondition: '新規申請モーダル表示', operation: '施設情報を選択', input: '棟、階、部門、部屋', expected: '各プルダウンで選択できる' },
    { id: 'IT-111', category: '正常系', viewpoint: '新規登録', precondition: '必須項目入力済み', operation: '登録ボタンをクリック', input: '-', expected: '申請が登録され一覧に表示される' },
    { id: 'IT-112', category: '異常系', viewpoint: '必須チェック', precondition: '新規申請モーダル表示', operation: '品名を空のまま登録', input: '空欄', expected: 'エラーメッセージが表示される' },
    { id: 'IT-113', category: '異常系', viewpoint: '必須チェック', precondition: '新規申請モーダル表示', operation: '業者名を空のまま登録', input: '空欄', expected: 'エラーメッセージが表示される' },
    { id: 'IT-114', category: '正常系', viewpoint: '新規登録', precondition: '新規申請モーダル表示', operation: 'キャンセルボタンをクリック', input: '-', expected: 'モーダルが閉じる（データ未保存）' },
    // 編集
    { id: 'IT-115', category: '正常系', viewpoint: '編集', precondition: '申請データが存在', operation: '一覧から申請行をクリック', input: '-', expected: '申請詳細モーダルが表示される' },
    { id: 'IT-116', category: '正常系', viewpoint: '編集', precondition: '詳細モーダル表示', operation: '品名を変更', input: '変更後品名', expected: '入力欄に値が反映される' },
    { id: 'IT-117', category: '正常系', viewpoint: '編集', precondition: '詳細モーダル表示', operation: '更新ボタンをクリック', input: '-', expected: '申請が更新され一覧に反映される' },
    // 削除
    { id: 'IT-118', category: '正常系', viewpoint: '削除', precondition: '詳細モーダル表示', operation: '削除ボタンをクリック', input: '-', expected: '確認ダイアログが表示される' },
    { id: 'IT-119', category: '正常系', viewpoint: '削除', precondition: '確認ダイアログ表示', operation: 'OKをクリック', input: '-', expected: '申請が削除され一覧から消える' },
    { id: 'IT-120', category: '正常系', viewpoint: '削除', precondition: '確認ダイアログ表示', operation: 'キャンセルをクリック', input: '-', expected: 'ダイアログが閉じ削除されない' },
    // フィルター
    { id: 'IT-121', category: '正常系', viewpoint: 'フィルター', precondition: '複数申請データ存在', operation: '申請種別で絞り込み', input: '新規申請', expected: '新規申請のみ表示される' },
    { id: 'IT-122', category: '正常系', viewpoint: 'フィルター', precondition: '複数申請データ存在', operation: 'ステータスで絞り込み', input: '承認待ち', expected: '承認待ちのみ表示される' },
    { id: 'IT-123', category: '正常系', viewpoint: 'フィルター', precondition: '複数申請データ存在', operation: '施設で絞り込み', input: '施設名', expected: '該当施設のみ表示される' },
    { id: 'IT-124', category: '正常系', viewpoint: 'フィルター', precondition: '絞り込み適用中', operation: 'クリアボタンをクリック', input: '-', expected: 'フィルターが解除される' },
    { id: 'IT-125', category: '境界値', viewpoint: 'フィルター', precondition: 'データなし', operation: '存在しない条件で絞り込み', input: '-', expected: '0件表示、メッセージ表示' },
    // 見積依頼グループ
    { id: 'IT-126', category: '正常系', viewpoint: '見積依頼グループ', precondition: '複数申請データ存在', operation: '複数行にチェック', input: '-', expected: 'チェックした行が選択状態になる' },
    { id: 'IT-127', category: '正常系', viewpoint: '見積依頼グループ', precondition: '複数行選択済み', operation: '見積依頼グループ登録をクリック', input: '-', expected: 'グループ登録モーダルが表示される' },
    { id: 'IT-128', category: '正常系', viewpoint: '見積依頼グループ', precondition: 'グループモーダル表示', operation: 'グループ名を入力して登録', input: 'テストグループ', expected: 'グループが作成される' },
    { id: 'IT-129', category: '正常系', viewpoint: '見積依頼グループ', precondition: 'グループ作成済み', operation: 'グループ編集ボタンをクリック', input: '-', expected: 'グループ編集モーダルが表示される' },
    { id: 'IT-130', category: '正常系', viewpoint: '見積依頼グループ', precondition: 'グループ編集モーダル', operation: 'グループを削除', input: '-', expected: 'グループが削除される' },
    // 別ウィンドウ
    { id: 'IT-131', category: '正常系', viewpoint: '別ウィンドウ', precondition: '申請データ存在', operation: '別ウィンドウで開くボタンをクリック', input: '-', expected: '新しいウィンドウで詳細が開く' },
    // ソート
    { id: 'IT-132', category: '正常系', viewpoint: 'ソート', precondition: '複数申請データ存在', operation: 'ヘッダー「申請No」をクリック', input: '-', expected: '申請Noで昇順ソートされる' },
    { id: 'IT-133', category: '正常系', viewpoint: 'ソート', precondition: 'ソート済み', operation: '同じヘッダーを再クリック', input: '-', expected: '降順ソートに切り替わる' },
  ],

  // 現有品調査
  '現有品調査': [
    // 画面表示
    { id: 'IT-201', category: '正常系', viewpoint: '画面表示', precondition: '現有品調査画面表示', operation: '施設選択欄を確認', input: '-', expected: '施設選択プルダウンが表示される' },
    { id: 'IT-202', category: '正常系', viewpoint: '画面表示', precondition: '施設未選択', operation: '画面を確認', input: '-', expected: '施設選択を促すメッセージが表示される' },
    // 施設選択
    { id: 'IT-203', category: '正常系', viewpoint: '施設選択', precondition: '現有品調査画面表示', operation: '施設を選択', input: '施設名', expected: '選択した施設の調査一覧が表示される' },
    { id: 'IT-204', category: '正常系', viewpoint: '施設選択', precondition: '施設選択済み', operation: '別の施設を選択', input: '別の施設名', expected: '一覧が切り替わる' },
    // 調査確定
    { id: 'IT-205', category: '正常系', viewpoint: '調査確定', precondition: '調査データ存在', operation: '調査行をクリック', input: '-', expected: '編集モーダルが表示される' },
    { id: 'IT-206', category: '正常系', viewpoint: '調査確定', precondition: '編集モーダル表示', operation: '購入年月日をクリック', input: '-', expected: 'ドラムロールピッカーが表示される' },
    { id: 'IT-207', category: '正常系', viewpoint: '調査確定', precondition: 'ドラムロール表示', operation: '年を選択', input: '2024', expected: '年が選択される' },
    { id: 'IT-208', category: '正常系', viewpoint: '調査確定', precondition: 'ドラムロール表示', operation: '月を選択', input: '1', expected: '月が選択される' },
    { id: 'IT-209', category: '正常系', viewpoint: '調査確定', precondition: 'ドラムロール表示', operation: '日を選択', input: '15', expected: '日が選択される' },
    { id: 'IT-210', category: '正常系', viewpoint: '調査確定', precondition: 'ドラムロール表示', operation: '決定ボタンをクリック', input: '-', expected: '選択した日付が反映される' },
    { id: 'IT-211', category: '正常系', viewpoint: '調査確定', precondition: 'ドラムロール表示', operation: 'クリアボタンをクリック', input: '-', expected: '日付がクリアされスクロール位置もリセット' },
    { id: 'IT-212', category: '正常系', viewpoint: '調査確定', precondition: '編集モーダル表示', operation: '利用状況を選択', input: '使用中', expected: '利用状況が選択される' },
    { id: 'IT-213', category: '正常系', viewpoint: '調査確定', precondition: '編集モーダル表示', operation: '確定ボタンをクリック', input: '-', expected: '調査が確定状態になる' },
    // 一括確定
    { id: 'IT-214', category: '正常系', viewpoint: '一括確定', precondition: '複数調査データ存在', operation: '複数行にチェック', input: '-', expected: 'チェックした行が選択状態になる' },
    { id: 'IT-215', category: '正常系', viewpoint: '一括確定', precondition: '複数行選択済み', operation: '一括確定ボタンをクリック', input: '-', expected: '選択した行が一括で確定される' },
    { id: 'IT-216', category: '正常系', viewpoint: '一括確定', precondition: '全選択', operation: '全選択チェックボックスをクリック', input: '-', expected: '全行が選択される' },
    // フィルター
    { id: 'IT-217', category: '正常系', viewpoint: 'フィルター', precondition: '複数調査データ存在', operation: '確定状況で絞り込み', input: '未確定', expected: '未確定のみ表示される' },
    { id: 'IT-218', category: '正常系', viewpoint: 'フィルター', precondition: '複数調査データ存在', operation: '階で絞り込み', input: '3F', expected: '3Fのデータのみ表示される' },
    { id: 'IT-219', category: '正常系', viewpoint: 'フィルター', precondition: '複数調査データ存在', operation: '部門で絞り込み', input: '手術部門', expected: '手術部門のデータのみ表示される' },
    // 編集
    { id: 'IT-220', category: '正常系', viewpoint: '編集', precondition: '確定済みデータ', operation: '確定済み行をクリック', input: '-', expected: '編集モーダルが表示される' },
    { id: 'IT-221', category: '正常系', viewpoint: '編集', precondition: '編集モーダル表示', operation: '内容を変更して更新', input: '変更後データ', expected: 'データが更新される' },
  ],

  // SHIP資産マスタ
  'SHIP資産マスタ': [
    // 画面表示
    { id: 'IT-301', category: '正常系', viewpoint: '画面表示', precondition: 'SHIP資産マスタ画面表示', operation: '資産一覧を確認', input: '-', expected: '資産マスタ一覧が表示される' },
    { id: 'IT-302', category: '正常系', viewpoint: '画面表示', precondition: 'SHIP資産マスタ画面表示', operation: 'ヘッダー項目を確認', input: '-', expected: '資産No、品名、型番等が表示される' },
    // 検索
    { id: 'IT-303', category: '正常系', viewpoint: '検索', precondition: '資産データ存在', operation: '品名で検索', input: '超音波', expected: '該当する資産のみ表示される' },
    { id: 'IT-304', category: '正常系', viewpoint: '検索', precondition: '資産データ存在', operation: '型番で検索', input: 'MODEL', expected: '該当する資産のみ表示される' },
    { id: 'IT-305', category: '正常系', viewpoint: '検索', precondition: '検索結果表示中', operation: '検索欄をクリア', input: '-', expected: '全件表示に戻る' },
    { id: 'IT-306', category: '境界値', viewpoint: '検索', precondition: '資産データ存在', operation: '存在しないキーワードで検索', input: 'XXXXX', expected: '0件表示、メッセージ表示' },
    // ソート
    { id: 'IT-307', category: '正常系', viewpoint: 'ソート', precondition: '資産データ存在', operation: '品名ヘッダーをクリック', input: '-', expected: '品名で昇順ソートされる' },
    { id: 'IT-308', category: '正常系', viewpoint: 'ソート', precondition: 'ソート済み', operation: '同じヘッダーを再クリック', input: '-', expected: '降順ソートに切り替わる' },
    // 詳細
    { id: 'IT-309', category: '正常系', viewpoint: '詳細', precondition: '資産データ存在', operation: '資産行をクリック', input: '-', expected: '資産詳細モーダルが表示される' },
    { id: 'IT-310', category: '正常系', viewpoint: '詳細', precondition: '詳細モーダル表示', operation: '閉じるボタンをクリック', input: '-', expected: 'モーダルが閉じる' },
  ],

  // 施設マスタ
  '施設マスタ': [
    // 画面表示
    { id: 'IT-401', category: '正常系', viewpoint: '画面表示', precondition: '施設マスタ画面表示', operation: '施設一覧を確認', input: '-', expected: '施設マスタ一覧が表示される' },
    { id: 'IT-402', category: '正常系', viewpoint: '画面表示', precondition: '施設マスタ画面表示', operation: '新規作成ボタンの表示確認', input: '-', expected: '新規作成ボタンが表示される' },
    // 新規登録
    { id: 'IT-403', category: '正常系', viewpoint: '新規登録', precondition: '施設マスタ画面表示', operation: '新規作成ボタンをクリック', input: '-', expected: '新規作成モーダルが表示される' },
    { id: 'IT-404', category: '正常系', viewpoint: '新規登録', precondition: '新規作成モーダル表示', operation: '施設名を入力', input: 'テスト病院', expected: '入力欄に値が反映される' },
    { id: 'IT-405', category: '正常系', viewpoint: '新規登録', precondition: '新規作成モーダル表示', operation: '住所を入力', input: '東京都xxx', expected: '入力欄に値が反映される' },
    { id: 'IT-406', category: '正常系', viewpoint: '新規登録', precondition: '必須項目入力済み', operation: '登録ボタンをクリック', input: '-', expected: '施設が登録され一覧に表示される' },
    { id: 'IT-407', category: '異常系', viewpoint: '必須チェック', precondition: '新規作成モーダル表示', operation: '施設名を空のまま登録', input: '空欄', expected: 'エラーメッセージが表示される' },
    // 編集
    { id: 'IT-408', category: '正常系', viewpoint: '編集', precondition: '施設データ存在', operation: '編集ボタンをクリック', input: '-', expected: '編集モーダルが表示される' },
    { id: 'IT-409', category: '正常系', viewpoint: '編集', precondition: '編集モーダル表示', operation: '施設名を変更', input: '変更後施設名', expected: '入力欄に値が反映される' },
    { id: 'IT-410', category: '正常系', viewpoint: '編集', precondition: '編集モーダル表示', operation: '更新ボタンをクリック', input: '-', expected: '施設情報が更新される' },
    // 削除
    { id: 'IT-411', category: '正常系', viewpoint: '削除', precondition: '施設データ存在', operation: '削除ボタンをクリック', input: '-', expected: '確認ダイアログが表示される' },
    { id: 'IT-412', category: '正常系', viewpoint: '削除', precondition: '確認ダイアログ表示', operation: 'OKをクリック', input: '-', expected: '施設が削除される' },
    // 検索
    { id: 'IT-413', category: '正常系', viewpoint: '検索', precondition: '複数施設データ存在', operation: '施設名で検索', input: '病院', expected: '該当施設のみ表示される' },
  ],

  // 個別施設マスタ
  '個別施設マスタ': [
    // 画面表示
    { id: 'IT-501', category: '正常系', viewpoint: '画面表示', precondition: '個別施設マスタ画面表示', operation: '施設選択欄を確認', input: '-', expected: '施設選択プルダウンが表示される' },
    { id: 'IT-502', category: '正常系', viewpoint: '画面表示', precondition: '施設未選択', operation: '画面を確認', input: '-', expected: '施設選択を促すメッセージが表示される' },
    // 施設選択
    { id: 'IT-503', category: '正常系', viewpoint: '施設選択', precondition: '個別施設マスタ画面表示', operation: '施設を選択', input: '施設名', expected: '選択した施設の個別施設一覧が表示される' },
    // 新規登録
    { id: 'IT-504', category: '正常系', viewpoint: '新規登録', precondition: '施設選択済み', operation: '新規作成ボタンをクリック', input: '-', expected: '新規作成モーダルが表示される' },
    { id: 'IT-505', category: '正常系', viewpoint: '新規登録', precondition: '新規作成モーダル表示', operation: '現状-階を入力', input: '3F', expected: '入力欄に値が反映される' },
    { id: 'IT-506', category: '正常系', viewpoint: '新規登録', precondition: '新規作成モーダル表示', operation: '現状-部門を入力', input: '手術部門', expected: '入力欄に値が反映される' },
    { id: 'IT-507', category: '正常系', viewpoint: '新規登録', precondition: '新規作成モーダル表示', operation: '現状-部屋名を入力', input: '手術室1', expected: '入力欄に値が反映される' },
    { id: 'IT-508', category: '正常系', viewpoint: '新規登録', precondition: '新規作成モーダル表示', operation: '新居-階を入力', input: '4F', expected: '入力欄に値が反映される' },
    { id: 'IT-509', category: '正常系', viewpoint: '新規登録', precondition: '新規作成モーダル表示', operation: '新居-部門を入力', input: '手術部門', expected: '入力欄に値が反映される' },
    { id: 'IT-510', category: '正常系', viewpoint: '新規登録', precondition: '新規作成モーダル表示', operation: '新居-部屋名を入力', input: '手術室A', expected: '入力欄に値が反映される' },
    { id: 'IT-511', category: '正常系', viewpoint: '新規登録', precondition: '入力完了', operation: '登録ボタンをクリック', input: '-', expected: '個別施設が登録される' },
    // 編集
    { id: 'IT-512', category: '正常系', viewpoint: '編集', precondition: '個別施設データ存在', operation: '編集ボタンをクリック', input: '-', expected: '編集モーダルが表示される' },
    { id: 'IT-513', category: '正常系', viewpoint: '編集', precondition: '編集モーダル表示', operation: '新居情報を変更', input: '変更後データ', expected: '入力欄に値が反映される' },
    { id: 'IT-514', category: '正常系', viewpoint: '編集', precondition: '編集モーダル表示', operation: '更新ボタンをクリック', input: '-', expected: '個別施設情報が更新される' },
    // 削除
    { id: 'IT-515', category: '正常系', viewpoint: '削除', precondition: '個別施設データ存在', operation: '削除ボタンをクリック', input: '-', expected: '確認ダイアログが表示される' },
    { id: 'IT-516', category: '正常系', viewpoint: '削除', precondition: '確認ダイアログ表示', operation: 'OKをクリック', input: '-', expected: '個別施設が削除される' },
    // フィルター
    { id: 'IT-517', category: '正常系', viewpoint: 'フィルター', precondition: '複数データ存在', operation: '現状-階で絞り込み', input: '3F', expected: '3Fのデータのみ表示される' },
    { id: 'IT-518', category: '正常系', viewpoint: 'フィルター', precondition: '複数データ存在', operation: '現状-部門で絞り込み', input: '手術部門', expected: '手術部門のデータのみ表示される' },
    { id: 'IT-519', category: '正常系', viewpoint: 'フィルター', precondition: '複数データ存在', operation: '新居-階で絞り込み', input: '4F', expected: '4Fのデータのみ表示される' },
    { id: 'IT-520', category: '正常系', viewpoint: 'フィルター', precondition: '複数データ存在', operation: '新居-部門で絞り込み', input: '手術部門', expected: '手術部門のデータのみ表示される' },
  ],

  // 見積管理
  '見積管理': [
    // 画面表示
    { id: 'IT-601', category: '正常系', viewpoint: '画面表示', precondition: '見積管理画面表示', operation: '見積一覧を確認', input: '-', expected: '見積一覧が表示される' },
    { id: 'IT-602', category: '正常系', viewpoint: '画面表示', precondition: '見積管理画面表示', operation: '新規登録ボタンの表示確認', input: '-', expected: '新規登録ボタンが表示される' },
    // 見積登録
    { id: 'IT-603', category: '正常系', viewpoint: '見積登録', precondition: '見積管理画面表示', operation: '新規登録ボタンをクリック', input: '-', expected: '見積登録モーダルが表示される' },
    { id: 'IT-604', category: '正常系', viewpoint: '見積登録', precondition: '見積登録モーダル表示', operation: '業者を入力', input: 'テスト業者', expected: '入力欄に値が反映される' },
    { id: 'IT-605', category: '正常系', viewpoint: '見積登録', precondition: '見積登録モーダル表示', operation: '金額を入力', input: '1000000', expected: '入力欄に値が反映される' },
    { id: 'IT-606', category: '正常系', viewpoint: '見積登録', precondition: '見積登録モーダル表示', operation: '見積日を入力', input: '2024/01/15', expected: '入力欄に値が反映される' },
    { id: 'IT-607', category: '正常系', viewpoint: '見積登録', precondition: '入力完了', operation: '登録ボタンをクリック', input: '-', expected: '見積が登録される' },
    { id: 'IT-608', category: '異常系', viewpoint: '入力チェック', precondition: '見積登録モーダル表示', operation: '金額に文字を入力', input: 'abc', expected: '数値のみ入力可能' },
    // OCR取込
    { id: 'IT-609', category: '正常系', viewpoint: 'OCR取込', precondition: '見積管理画面表示', operation: 'OCR取込ボタンをクリック', input: '-', expected: 'ファイル選択ダイアログが表示される' },
    { id: 'IT-610', category: '正常系', viewpoint: 'OCR取込', precondition: 'ファイル選択ダイアログ', operation: '見積書PDFを選択', input: 'PDFファイル', expected: 'OCR処理が実行される' },
    { id: 'IT-611', category: '正常系', viewpoint: 'OCR取込', precondition: 'OCR処理完了', operation: 'OCR結果を確認', input: '-', expected: '読み取り結果が表示される' },
    { id: 'IT-612', category: '正常系', viewpoint: 'OCR取込', precondition: 'OCR結果表示', operation: '結果を編集', input: '修正データ', expected: '編集した内容が反映される' },
    { id: 'IT-613', category: '異常系', viewpoint: 'OCR取込', precondition: 'ファイル選択', operation: '非対応ファイルを選択', input: 'テキストファイル', expected: 'エラーメッセージが表示される' },
    // 編集・削除
    { id: 'IT-614', category: '正常系', viewpoint: '編集', precondition: '見積データ存在', operation: '編集ボタンをクリック', input: '-', expected: '編集モーダルが表示される' },
    { id: 'IT-615', category: '正常系', viewpoint: '編集', precondition: '編集モーダル表示', operation: '金額を変更して更新', input: '2000000', expected: '見積が更新される' },
    { id: 'IT-616', category: '正常系', viewpoint: '削除', precondition: '見積データ存在', operation: '削除ボタンをクリック', input: '-', expected: '確認ダイアログが表示される' },
    { id: 'IT-617', category: '正常系', viewpoint: '削除', precondition: '確認ダイアログ', operation: 'OKをクリック', input: '-', expected: '見積が削除される' },
  ],

  // データマッチング
  'データマッチング': [
    // 画面表示
    { id: 'IT-701', category: '正常系', viewpoint: '画面表示', precondition: 'データマッチング画面表示', operation: '画面を確認', input: '-', expected: 'ファイルアップロードエリアが表示される' },
    { id: 'IT-702', category: '正常系', viewpoint: '画面表示', precondition: 'データマッチング画面表示', operation: 'ファイルタイプ選択を確認', input: '-', expected: 'ラジオボタンが表示される' },
    // ファイルアップロード
    { id: 'IT-703', category: '正常系', viewpoint: 'ファイルアップロード', precondition: 'データマッチング画面表示', operation: 'ファイルタイプを選択', input: '固定資産管理台帳', expected: 'ファイルタイプが選択される' },
    { id: 'IT-704', category: '正常系', viewpoint: 'ファイルアップロード', precondition: 'ファイルタイプ選択済み', operation: 'ファイルをドラッグ&ドロップ', input: 'Excelファイル', expected: 'ファイルがアップロードされる' },
    { id: 'IT-705', category: '正常系', viewpoint: 'ファイルアップロード', precondition: 'ファイルタイプ選択済み', operation: 'ファイル選択ボタンをクリック', input: '-', expected: 'ファイル選択ダイアログが表示される' },
    { id: 'IT-706', category: '正常系', viewpoint: 'ファイルアップロード', precondition: 'ファイルタイプ選択済み', operation: 'その他台帳を選択', input: '-', expected: 'その他台帳が選択される' },
    { id: 'IT-707', category: '異常系', viewpoint: 'ファイル形式チェック', precondition: 'データマッチング画面表示', operation: '不正なファイルをアップロード', input: 'テキストファイル', expected: 'エラーメッセージが表示される' },
    { id: 'IT-708', category: '境界値', viewpoint: 'ファイルサイズ', precondition: 'データマッチング画面表示', operation: '大容量ファイルをアップロード', input: '100MB超', expected: 'サイズ制限エラーが表示される' },
    // アップロード一覧
    { id: 'IT-709', category: '正常系', viewpoint: 'アップロード一覧', precondition: 'ファイルアップロード済み', operation: 'アップロード一覧を確認', input: '-', expected: 'アップロードしたファイルが表示される' },
    { id: 'IT-710', category: '正常系', viewpoint: 'アップロード一覧', precondition: 'ファイル一覧表示', operation: '削除ボタンをクリック', input: '-', expected: 'ファイルが削除される' },
    // マッチング実行
    { id: 'IT-711', category: '正常系', viewpoint: 'マッチング実行', precondition: 'ファイルアップロード済み', operation: 'マッチング実行ボタンをクリック', input: '-', expected: 'マッチング処理が開始される' },
    { id: 'IT-712', category: '正常系', viewpoint: 'マッチング実行', precondition: 'マッチング処理中', operation: '進捗を確認', input: '-', expected: '進捗バーが表示される' },
    { id: 'IT-713', category: '正常系', viewpoint: 'マッチング実行', precondition: 'マッチング完了', operation: '結果を確認', input: '-', expected: 'マッチング結果が表示される' },
    { id: 'IT-714', category: '正常系', viewpoint: 'マッチング結果', precondition: '結果表示', operation: '一致データを確認', input: '-', expected: '一致したデータが表示される' },
    { id: 'IT-715', category: '正常系', viewpoint: 'マッチング結果', precondition: '結果表示', operation: '不一致データを確認', input: '-', expected: '不一致データが表示される' },
  ],

  // レスポンシブ
  'レスポンシブ': [
    // PC表示
    { id: 'IT-801', category: '正常系', viewpoint: 'PC表示', precondition: 'PCブラウザ（1920px）', operation: 'メイン画面を確認', input: '-', expected: 'PC用レイアウトで表示される' },
    { id: 'IT-802', category: '正常系', viewpoint: 'PC表示', precondition: 'PCブラウザ', operation: 'リモデル申請画面を確認', input: '-', expected: 'テーブル形式で表示される' },
    { id: 'IT-803', category: '正常系', viewpoint: 'PC表示', precondition: 'PCブラウザ', operation: '現有品調査画面を確認', input: '-', expected: 'テーブル形式で表示される' },
    // タブレット表示
    { id: 'IT-804', category: '正常系', viewpoint: 'タブレット表示', precondition: 'タブレット（768px）', operation: 'メイン画面を確認', input: '-', expected: 'タブレット用レイアウトで表示される' },
    { id: 'IT-805', category: '正常系', viewpoint: 'タブレット表示', precondition: 'タブレット', operation: 'リモデル申請画面を確認', input: '-', expected: '適切にレイアウト調整される' },
    { id: 'IT-806', category: '正常系', viewpoint: 'タブレット表示', precondition: 'タブレット', operation: '現有品調査画面を確認', input: '-', expected: '適切にレイアウト調整される' },
    // モバイル表示
    { id: 'IT-807', category: '正常系', viewpoint: 'モバイル表示', precondition: 'スマートフォン（375px）', operation: 'メイン画面を確認', input: '-', expected: 'モバイル用レイアウトで表示される' },
    { id: 'IT-808', category: '正常系', viewpoint: 'モバイル表示', precondition: 'スマートフォン', operation: 'リモデル申請画面を確認', input: '-', expected: 'カード形式で表示される' },
    { id: 'IT-809', category: '正常系', viewpoint: 'モバイル表示', precondition: 'スマートフォン', operation: '現有品調査画面を確認', input: '-', expected: 'カード形式で表示される' },
    { id: 'IT-810', category: '正常系', viewpoint: 'モバイル表示', precondition: 'スマートフォン', operation: 'モーダルを確認', input: '-', expected: 'フルスクリーンモーダルで表示される' },
    // 画面回転
    { id: 'IT-811', category: '正常系', viewpoint: '画面回転', precondition: 'タブレット/スマホ', operation: '画面を縦→横に回転', input: '-', expected: 'レイアウトが適切に調整される' },
    { id: 'IT-812', category: '正常系', viewpoint: '画面回転', precondition: 'タブレット/スマホ', operation: '画面を横→縦に回転', input: '-', expected: 'レイアウトが適切に調整される' },
  ],
};

// Excelワークブック作成
const wb = XLSX.utils.book_new();

// 表紙シート
const coverData = [
  ['総合テスト仕様書'],
  [''],
  ['プロジェクト名', '医療機器管理システム'],
  ['作成日', new Date().toLocaleDateString('ja-JP')],
  ['作成者', ''],
  ['バージョン', '1.0'],
  [''],
  ['【シート構成】'],
  ['シート名', '内容', 'テストケース数'],
];

Object.entries(testCases).forEach(([name, cases]) => {
  coverData.push([name, `${name}のテストケース`, `${cases.length}件`]);
});

const totalCount = Object.values(testCases).flat().length;
coverData.push(['']);
coverData.push(['合計', '', `${totalCount}件`]);

const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
coverSheet['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 15 }];
XLSX.utils.book_append_sheet(wb, coverSheet, '表紙');

// テスト一覧シート
const summaryHeader = ['テストID', 'テスト区分', '対象機能', 'テスト観点', '前提条件', '操作内容', '入力値', '期待結果', '結果', '実行日', '実行者', '備考'];
const summaryData = [summaryHeader];

Object.entries(testCases).forEach(([feature, cases]) => {
  cases.forEach(tc => {
    summaryData.push([tc.id, tc.category, feature, tc.viewpoint, tc.precondition, tc.operation, tc.input, tc.expected, '', '', '', '']);
  });
});

const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
summarySheet['!cols'] = [
  { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 15 },
  { wch: 25 }, { wch: 35 }, { wch: 20 }, { wch: 35 },
  { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 25 }
];
XLSX.utils.book_append_sheet(wb, summarySheet, 'テスト一覧');

// 各機能別シート（1つのテーブル形式）
Object.entries(testCases).forEach(([sheetName, cases]) => {
  const header = ['テストID', 'テスト区分', 'テスト観点', '前提条件', '操作内容', '入力値', '期待結果', '結果', '実行日', '実行者', '備考'];
  const sheetData = [header];

  cases.forEach(tc => {
    sheetData.push([tc.id, tc.category, tc.viewpoint, tc.precondition, tc.operation, tc.input, tc.expected, '', '', '', '']);
  });

  const sheet = XLSX.utils.aoa_to_sheet(sheetData);
  sheet['!cols'] = [
    { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 25 },
    { wch: 35 }, { wch: 20 }, { wch: 35 },
    { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, sheet, sheetName);
});

// ファイル出力
const outputPath = path.join(__dirname, '..', 'docs', '総合テスト仕様書.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`総合テスト仕様書を作成しました: ${outputPath}`);
console.log(`テストケース数: ${totalCount}件`);
