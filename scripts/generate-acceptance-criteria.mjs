import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// データ定義
// ============================================================

const DOC_INFO = {
  title: '検収基準書',
  project: '医療機器管理システム',
  phase: 'システム開発①（全63画面）',
  version: '1.0',
  date: '2026年3月28日',
  author: 'C-Tech Studio',
};

const DELIVERABLES = [
  { no: 1, name: '画面設計書', summary: '全63画面の画面レイアウト・項目定義・操作仕様', format: 'Excel', qty: '1式' },
  { no: 2, name: '画面遷移設計書', summary: '全画面間の遷移定義・条件分岐', format: 'Excel', qty: '1式' },
  { no: 3, name: 'DB設計書', summary: 'テーブル定義・ER図・インデックス定義', format: 'Word + PlantUML/SVG', qty: '1式' },
  { no: 4, name: 'API設計書', summary: '全APIのエンドポイント・リクエスト/レスポンス定義', format: 'Word', qty: '1式' },
  { no: 5, name: 'ソフトウェア一式', summary: 'システム開発①スコープ完成分ソースコード', format: 'ZIP', qty: '1式' },
  { no: 6, name: 'テスト仕様書及びエビデンス', summary: 'テスト項目・手順・実施結果・スクリーンショット', format: 'Excel', qty: '1式' },
  { no: 7, name: '運用ドキュメント', summary: '障害時復旧手順書・VPNClient導入手順書等', format: 'Word/PDF', qty: '1式' },
];

const CRITERIA = [
  // 1. 画面設計書
  { deliverable: '画面設計書', category: '形式要件', item: '全63画面分の設計書が存在すること', basis: '画面設計書の目次と各画面シートを照合し、63画面すべてが含まれていることを確認する' },
  { deliverable: '画面設計書', category: '内容要件', item: '画面レイアウト図・項目定義表・操作仕様が各画面に含まれること', basis: '任意の5画面をサンプリングし、レイアウト図・項目定義表・操作仕様の3点が揃っていることを確認する' },
  { deliverable: '画面設計書', category: '内容要件', item: '項目名・型・桁数・必須/任意が定義されていること', basis: '項目定義表に項目名・データ型・桁数・必須/任意の各列が存在し、全項目に値が記載されていることを確認する' },
  { deliverable: '画面設計書', category: '内容要件', item: 'バリデーションルール・エラーメッセージが定義されていること', basis: '入力項目を持つ画面にバリデーションルールとエラーメッセージの定義が記載されていることを確認する' },
  { deliverable: '画面設計書', category: '品質要件', item: '設計書の記載と実装が一致すること', basis: '任意の3画面について、設計書の記載内容と実装画面を比較し、差異がないことを確認する' },
  { deliverable: '画面設計書', category: '品質要件', item: '画面間の項目名・データ型に矛盾がないこと', basis: '同一データを扱う複数画面間で項目名・データ型が統一されていることを確認する' },
  { deliverable: '画面設計書', category: '内容要件', item: '権限による表示/非表示の定義があること', basis: 'ロール別の表示/非表示・操作可否が各画面設計書に記載されていることを確認する' },

  // 2. 画面遷移設計書
  { deliverable: '画面遷移設計書', category: '形式要件', item: '全画面間の遷移が網羅されていること', basis: '全63画面が遷移図に含まれ、孤立した画面がないことを確認する' },
  { deliverable: '画面遷移設計書', category: '内容要件', item: '遷移元・遷移先・トリガー・遷移条件が定義されていること', basis: '各遷移に対して遷移元・遷移先・トリガー（ボタン名等）・遷移条件が明記されていることを確認する' },
  { deliverable: '画面遷移設計書', category: '内容要件', item: 'ロール別アクセス可否が明記されていること', basis: '6ロールそれぞれについてアクセス可能画面が定義されていることを確認する' },
  { deliverable: '画面遷移設計書', category: '品質要件', item: '実装と設計書が一致すること', basis: '任意の5遷移パターンについて、実装の画面遷移と設計書の記載を比較し一致することを確認する' },
  { deliverable: '画面遷移設計書', category: '品質要件', item: '到達不能な画面がないこと', basis: 'ログイン画面から全63画面に到達可能なパスが存在することを遷移図上で確認する' },

  // 3. DB設計書
  { deliverable: 'DB設計書', category: '形式要件', item: 'ER図とテーブル定義書が含まれること', basis: 'ER図（PlantUML/SVG）およびテーブル定義書（Word）が納品物に含まれていることを確認する' },
  { deliverable: 'DB設計書', category: '形式要件', item: '全テーブル（94テーブル+ビュー）の定義が存在すること', basis: 'テーブル定義書の目次と各テーブル定義を照合し、94テーブル+ビューすべてが含まれていることを確認する' },
  { deliverable: 'DB設計書', category: '内容要件', item: 'カラム名・データ型・制約が定義されていること', basis: '各テーブルにカラム名・データ型・NOT NULL等の制約が記載されていることを確認する' },
  { deliverable: 'DB設計書', category: '内容要件', item: '外部キー・インデックスが定義されていること', basis: '外部キー制約およびインデックス定義が各テーブルに記載されていることを確認する' },
  { deliverable: 'DB設計書', category: '品質要件', item: 'リレーション定義がER図と整合すること', basis: 'テーブル定義書の外部キーとER図のリレーション線が一致することを確認する' },
  { deliverable: 'DB設計書', category: '品質要件', item: '画面項目がDBにマッピング可能であること', basis: '画面設計書の主要項目がDBテーブルのカラムにマッピングできることを確認する' },
  { deliverable: 'DB設計書', category: '品質要件', item: '正規化が適切であること（第3正規形以上）', basis: '主要テーブルが第3正規形を満たしていることを確認する' },

  // 4. API設計書
  { deliverable: 'API設計書', category: '形式要件', item: '全API機能の設計書が存在すること（不要4件除く）', basis: 'API一覧と各API設計書を照合し、対象APIすべての設計書が含まれていることを確認する' },
  { deliverable: 'API設計書', category: '内容要件', item: 'エンドポイント（URL, HTTPメソッド）が定義されていること', basis: '各APIにエンドポイントURL・HTTPメソッド（GET/POST/PUT/DELETE等）が明記されていることを確認する' },
  { deliverable: 'API設計書', category: '内容要件', item: 'リクエスト/レスポンス定義が含まれること', basis: '各APIにリクエストパラメータ・レスポンスボディの定義（項目名・型・必須/任意）が記載されていることを確認する' },
  { deliverable: 'API設計書', category: '内容要件', item: '認証・認可要件が各APIに明記されていること', basis: '各APIに必要な認証方式・必要ロールが記載されていることを確認する' },
  { deliverable: 'API設計書', category: '内容要件', item: 'エラーコード一覧があること', basis: 'HTTPステータスコード・エラーコード・エラーメッセージの一覧が定義されていることを確認する' },
  { deliverable: 'API設計書', category: '品質要件', item: 'DB設計書のテーブル参照と整合すること', basis: 'API設計書で参照するテーブル・カラムがDB設計書に存在することを確認する' },
  { deliverable: 'API設計書', category: '品質要件', item: '画面操作がAPI設計でカバーされていること', basis: '画面設計書の主要操作（CRUD）に対応するAPIが設計されていることを確認する' },

  // 5. ソフトウェア一式
  { deliverable: 'ソフトウェア一式', category: '形式要件', item: 'ソースコード一式がZIPファイルで提出されていること', basis: 'ZIPファイルを展開し、プロジェクトのディレクトリ構成・ソースコードが格納されていることを確認する' },
  { deliverable: 'ソフトウェア一式', category: '形式要件', item: 'README（環境構築・起動手順）が含まれること', basis: 'READMEファイルに環境構築手順・起動手順が記載されていることを確認する' },
  { deliverable: 'ソフトウェア一式', category: '内容要件', item: '全63画面が実装され表示・操作可能であること', basis: '全63画面にアクセスし、画面が表示され基本的な操作が可能であることを確認する' },
  { deliverable: 'ソフトウェア一式', category: '内容要件', item: 'ログイン〜各機能の基本操作フローが動作すること', basis: 'ログイン後、各機能（リモデル申請・現有品調査等）の基本フローが動作することを確認する' },
  { deliverable: 'ソフトウェア一式', category: '内容要件', item: 'ロール別権限制御が実装されていること（6ロール）', basis: '6ロールそれぞれでログインし、権限に応じた表示/非表示・操作可否が正しく動作することを確認する' },
  { deliverable: 'ソフトウェア一式', category: '内容要件', item: 'レスポンシブ対応（PC/タブレット/スマホ）であること', basis: 'PC（1920x1080）、タブレット（1024x768）、スマホ（375x812）で表示崩れがないことを確認する' },
  { deliverable: 'ソフトウェア一式', category: '品質要件', item: '`npm run build` がエラーなく完了すること', basis: 'npm run buildを実行し、エラーなくビルドが完了することを確認する' },
  { deliverable: 'ソフトウェア一式', category: '品質要件', item: 'TypeScript型エラーがないこと', basis: 'TypeScriptコンパイルを実行し、型エラーが0件であることを確認する' },
  { deliverable: 'ソフトウェア一式', category: '品質要件', item: '主要ブラウザ（Chrome, Edge, Safari）で表示崩れがないこと', basis: 'Chrome・Edge・Safariの最新版で主要画面を表示し、レイアウト崩れがないことを確認する' },

  // 6. テスト仕様書及びエビデンス
  { deliverable: 'テスト仕様書及びエビデンス', category: '形式要件', item: 'テスト仕様書（項目・手順・期待結果）が存在すること', basis: 'テスト仕様書にテスト項目・操作手順・期待結果が記載されていることを確認する' },
  { deliverable: 'テスト仕様書及びエビデンス', category: '形式要件', item: '実施結果（日・実施者・結果・エビデンス）が記録されていること', basis: '各テスト項目に実施日・実施者・結果（合格/不合格）・エビデンス（スクリーンショット等）が記録されていることを確認する' },
  { deliverable: 'テスト仕様書及びエビデンス', category: '内容要件', item: '全63画面の画面表示テストが含まれること', basis: '63画面すべてに対して画面表示テストが定義・実施されていることを確認する' },
  { deliverable: 'テスト仕様書及びエビデンス', category: '内容要件', item: '主要業務フローの結合テストが含まれること', basis: 'リモデル申請・現有品調査等の主要業務フローについて結合テストが定義・実施されていることを確認する' },
  { deliverable: 'テスト仕様書及びエビデンス', category: '内容要件', item: 'ロール別アクセス制御テストが含まれること', basis: '6ロールそれぞれについて画面アクセス・操作制御のテストが定義・実施されていることを確認する' },
  { deliverable: 'テスト仕様書及びエビデンス', category: '内容要件', item: '異常系テストが含まれること', basis: 'バリデーションエラー・権限エラー等の異常系テストが定義・実施されていることを確認する' },
  { deliverable: 'テスト仕様書及びエビデンス', category: '品質要件', item: '全項目の実施率100%、不合格項目は対応状況記録ありであること', basis: '全テスト項目が実施済み（実施率100%）であり、不合格項目がある場合は対応状況（修正済み/対応予定等）が記録されていることを確認する' },

  // 7. 運用ドキュメント
  { deliverable: '運用ドキュメント', category: '形式要件', item: '障害時復旧手順書が存在すること', basis: '障害時復旧手順書がWord/PDF形式で納品物に含まれていることを確認する' },
  { deliverable: '運用ドキュメント', category: '形式要件', item: 'VPNClient導入手順書が存在すること', basis: 'VPNClient導入手順書がWord/PDF形式で納品物に含まれていることを確認する' },
  { deliverable: '運用ドキュメント', category: '内容要件', item: '想定障害パターンと復旧手順が記載されていること', basis: '障害復旧手順書に想定障害パターン（サーバー停止・DB障害等）と具体的な復旧手順が記載されていることを確認する' },
  { deliverable: '運用ドキュメント', category: '内容要件', item: 'インストール〜接続確認までの手順が記載されていること', basis: 'VPNClient導入手順書にインストール・設定・接続確認までの手順が記載されていることを確認する' },
  { deliverable: '運用ドキュメント', category: '内容要件', item: 'スクリーンショットまたは図が含まれていること', basis: '手順書に操作画面のスクリーンショットまたは説明図が含まれていることを確認する' },
  { deliverable: '運用ドキュメント', category: '品質要件', item: '手順書に従って操作した場合に目的達成可能であること', basis: '手順書の記載に従って操作を行い、目的（復旧/VPN接続）が達成できることを確認する' },
];

// ============================================================
// スタイル定義
// ============================================================

const COLORS = {
  headerBg: '1F4E79',      // 濃紺
  headerFont: 'FFFFFF',     // 白
  subHeaderBg: 'D6E4F0',   // 薄青
  sectionBg: 'E2EFDA',     // 薄緑
  border: '4472C4',        // 青系ボーダー
  titleFont: '1F4E79',     // タイトル文字色
};

function headerStyle(cols) {
  return cols.reduce((acc, c) => {
    acc[c] = {
      font: { bold: true, color: { rgb: COLORS.headerFont }, sz: 11 },
      fill: { fgColor: { rgb: COLORS.headerBg } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: thinBorder(),
    };
    return acc;
  }, {});
}

function thinBorder() {
  const side = { style: 'thin', color: { rgb: '999999' } };
  return { top: side, bottom: side, left: side, right: side };
}

function cellStyle(overrides = {}) {
  return {
    alignment: { vertical: 'center', wrapText: true, ...overrides.alignment },
    border: thinBorder(),
    font: { sz: 10, ...overrides.font },
    fill: overrides.fill || undefined,
  };
}

// ============================================================
// シート1: 表紙
// ============================================================

function createCoverSheet(wb) {
  const rows = [
    [],
    [],
    [],
    [],
    [null, null, DOC_INFO.title],
    [],
    [],
    [null, null, `プロジェクト名: ${DOC_INFO.project}`],
    [null, null, `対象フェーズ: ${DOC_INFO.phase}`],
    [],
    [null, null, `バージョン: ${DOC_INFO.version}`],
    [null, null, `作成日: ${DOC_INFO.date}`],
    [null, null, `作成者: ${DOC_INFO.author}`],
    [],
    [],
    [],
    [null, null, '本書は、上記プロジェクトにおける納品物の検収基準を定めたものです。'],
    [null, null, '各納品物について、形式要件・内容要件・品質要件の観点から検収基準を設定し、'],
    [null, null, '合否判定のチェックリストとして使用します。'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 列幅
  ws['!cols'] = [{ wch: 4 }, { wch: 4 }, { wch: 60 }];

  // セル結合: タイトル行
  ws['!merges'] = [
    { s: { r: 4, c: 2 }, e: { r: 4, c: 4 } },
  ];

  // タイトルスタイル
  const titleCell = ws['C5'];
  if (titleCell) {
    titleCell.s = {
      font: { bold: true, sz: 24, color: { rgb: COLORS.titleFont } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  // 情報行スタイル
  ['C8', 'C9', 'C11', 'C12', 'C13'].forEach(addr => {
    if (ws[addr]) {
      ws[addr].s = {
        font: { sz: 12, color: { rgb: '333333' } },
        alignment: { vertical: 'center' },
      };
    }
  });

  // 説明行スタイル
  ['C17', 'C18', 'C19'].forEach(addr => {
    if (ws[addr]) {
      ws[addr].s = {
        font: { sz: 10, color: { rgb: '666666' } },
        alignment: { vertical: 'center' },
      };
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, '表紙');
}

// ============================================================
// シート2: 納品物一覧
// ============================================================

function createDeliverableSheet(wb) {
  const headers = ['No', '納品物名', '概要', '提出形式', '数量'];
  const rows = [headers];

  DELIVERABLES.forEach(d => {
    rows.push([d.no, d.name, d.summary, d.format, d.qty]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 列幅
  ws['!cols'] = [
    { wch: 5 },   // No
    { wch: 28 },  // 納品物名
    { wch: 52 },  // 概要
    { wch: 22 },  // 提出形式
    { wch: 8 },   // 数量
  ];

  // ヘッダースタイル
  const hdrCols = ['A1', 'B1', 'C1', 'D1', 'E1'];
  hdrCols.forEach(addr => {
    if (ws[addr]) {
      ws[addr].s = {
        font: { bold: true, color: { rgb: COLORS.headerFont }, sz: 11 },
        fill: { fgColor: { rgb: COLORS.headerBg } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: thinBorder(),
      };
    }
  });

  // データ行スタイル
  for (let r = 1; r <= DELIVERABLES.length; r++) {
    const row = r + 1;
    ['A', 'B', 'C', 'D', 'E'].forEach((col, ci) => {
      const addr = `${col}${row}`;
      if (ws[addr]) {
        ws[addr].s = cellStyle({
          alignment: {
            horizontal: ci === 0 || ci === 4 ? 'center' : 'left',
          },
        });
      }
    });
  }

  XLSX.utils.book_append_sheet(wb, ws, '納品物一覧');
}

// ============================================================
// シート3: 検収基準（詳細）
// ============================================================

function createCriteriaSheet(wb) {
  const headers = ['No', '納品物', 'カテゴリ', '検収基準項目', '判定基準', '合否', '備考'];
  const rows = [headers];

  let no = 1;
  CRITERIA.forEach(c => {
    rows.push([no++, c.deliverable, c.category, c.item, c.basis, '', '']);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 列幅
  ws['!cols'] = [
    { wch: 5 },   // No
    { wch: 22 },  // 納品物
    { wch: 12 },  // カテゴリ
    { wch: 48 },  // 検収基準項目
    { wch: 60 },  // 判定基準
    { wch: 8 },   // 合否
    { wch: 20 },  // 備考
  ];

  // ヘッダースタイル
  ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'].forEach(addr => {
    if (ws[addr]) {
      ws[addr].s = {
        font: { bold: true, color: { rgb: COLORS.headerFont }, sz: 11 },
        fill: { fgColor: { rgb: COLORS.headerBg } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: thinBorder(),
      };
    }
  });

  // データ行スタイル + カテゴリ色分け
  const categoryColors = {
    '形式要件': 'E2EFDA',  // 薄緑
    '内容要件': 'D6E4F0',  // 薄青
    '品質要件': 'FFF2CC',  // 薄黄
  };

  // 納品物ごとのセル結合用
  const mergeRanges = [];
  let currentDeliverable = null;
  let mergeStart = -1;

  for (let r = 1; r <= CRITERIA.length; r++) {
    const row = r + 1;
    const criterion = CRITERIA[r - 1];
    const catColor = categoryColors[criterion.category];

    // 納品物セル結合の追跡
    if (criterion.deliverable !== currentDeliverable) {
      if (currentDeliverable !== null && mergeStart < r) {
        mergeRanges.push({ s: { r: mergeStart, c: 1 }, e: { r: r, c: 1 } });
      }
      currentDeliverable = criterion.deliverable;
      mergeStart = r;
    }

    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col, ci) => {
      const addr = `${col}${row}`;
      if (ws[addr]) {
        const isCenter = ci === 0 || ci === 2 || ci === 5;
        ws[addr].s = cellStyle({
          alignment: { horizontal: isCenter ? 'center' : 'left' },
          fill: ci === 2 && catColor ? { fgColor: { rgb: catColor } } : undefined,
        });
      }
    });
  }

  // 最後の納品物グループの結合
  if (mergeStart < CRITERIA.length) {
    mergeRanges.push({ s: { r: mergeStart, c: 1 }, e: { r: CRITERIA.length, c: 1 } });
  }

  ws['!merges'] = mergeRanges;

  // 結合セルのスタイル（中央揃え）
  mergeRanges.forEach(range => {
    const addr = `B${range.s.r + 1}`;
    if (ws[addr]) {
      ws[addr].s = cellStyle({
        alignment: { horizontal: 'center', vertical: 'center' },
        font: { bold: true, sz: 10 },
      });
    }
  });

  // 行の高さ（自動的にはセットされないので大きめ設定）
  ws['!rows'] = [{ hpt: 30 }]; // ヘッダー行
  for (let r = 1; r <= CRITERIA.length; r++) {
    if (!ws['!rows'][r]) ws['!rows'][r] = {};
    ws['!rows'][r] = { hpt: 36 };
  }

  XLSX.utils.book_append_sheet(wb, ws, '検収基準');
}

// ============================================================
// メイン
// ============================================================

function main() {
  const wb = XLSX.utils.book_new();

  createCoverSheet(wb);
  createDeliverableSheet(wb);
  createCriteriaSheet(wb);

  const outPath = path.resolve(__dirname, '..', 'docs', '検収基準書.xlsx');
  XLSX.writeFile(wb, outPath);

  console.log(`検収基準書を生成しました: ${outPath}`);
  console.log(`  シート数: ${wb.SheetNames.length}`);
  console.log(`  シート: ${wb.SheetNames.join(', ')}`);
  console.log(`  検収基準項目数: ${CRITERIA.length}`);
}

main();
