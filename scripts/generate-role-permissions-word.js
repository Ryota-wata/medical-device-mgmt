const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  VerticalAlign,
  PageBreak,
} = require('docx');
const fs = require('fs');
const path = require('path');

// 共通のセル境界線スタイル
const borders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

// ヘッダーセルのスタイル
const headerShading = {
  fill: '2c3e50',
  type: ShadingType.CLEAR,
  color: 'auto',
};

// サブヘッダーセルのスタイル
const subHeaderShading = {
  fill: 'ecf0f1',
  type: ShadingType.CLEAR,
  color: 'auto',
};

// ヘッダーセル作成
function createHeaderCell(text, width) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 20 })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: headerShading,
    borders,
    width: { size: width, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
  });
}

// 通常セル作成
function createCell(text, width, options = {}) {
  const { bold = false, center = false, shading = null } = options;
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 18 })],
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      }),
    ],
    shading: shading || undefined,
    borders,
    width: { size: width, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
  });
}

// セクションタイトル
function sectionTitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 200 },
  });
}

// サブセクションタイトル
function subSectionTitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 300, after: 150 },
  });
}

// 本文
function bodyText(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20 })],
    spacing: { after: 100 },
  });
}

// ドキュメント作成
const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        // タイトル
        new Paragraph({
          children: [new TextRun({ text: 'ロール別権限定義書', bold: true, size: 48 })],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        new Paragraph({
          children: [new TextRun({ text: '医療機器管理システム', size: 24, color: '666666' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [new TextRun({ text: `作成日: ${new Date().toLocaleDateString('ja-JP')}`, size: 20, color: '666666' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),

        // 1. 概要
        sectionTitle('1. 概要'),
        bodyText('本システムでは6つのロールを定義し、各ロールに応じた画面・機能へのアクセス制御を行う。'),

        // 2. ロール一覧
        sectionTitle('2. ロール一覧'),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell('ロール', 15),
                createHeaderCell('ラベル', 18),
                createHeaderCell('所属', 10),
                createHeaderCell('説明', 57),
              ],
            }),
            new TableRow({
              children: [
                createCell('admin', 15, { bold: true }),
                createCell('システム管理者', 18),
                createCell('SHIP', 10, { center: true }),
                createCell('システム全体の管理権限を持つ', 57),
              ],
            }),
            new TableRow({
              children: [
                createCell('consultant', 15, { bold: true }),
                createCell('SHRCコンサル', 18),
                createCell('SHIP', 10, { center: true }),
                createCell('担当施設の資産閲覧・個体管理リスト作成・タスク管理が主業務', 57),
              ],
            }),
            new TableRow({
              children: [
                createCell('sales', 15, { bold: true }),
                createCell('GHS営業', 18),
                createCell('SHIP', 10, { center: true }),
                createCell('閲覧のみ（営業活動のための情報確認用）', 57),
              ],
            }),
            new TableRow({
              children: [
                createCell('office_admin', 15, { bold: true }),
                createCell('事務管理者', 18),
                createCell('病院', 10, { center: true }),
                createCell('事務担当者の権限 + マスタ管理・ユーザー管理', 57),
              ],
            }),
            new TableRow({
              children: [
                createCell('office_staff', 15, { bold: true }),
                createCell('事務担当者', 18),
                createCell('病院', 10, { center: true }),
                createCell('タスク管理画面での業務が中心', 57),
              ],
            }),
            new TableRow({
              children: [
                createCell('clinical_staff', 15, { bold: true }),
                createCell('臨床スタッフ', 18),
                createCell('病院', 10, { center: true }),
                createCell('現場での申請作成・点検実施・貸出実施', 57),
              ],
            }),
          ],
        }),

        // 3. 権限レベル
        sectionTitle('3. 権限レベルの定義'),

        new Table({
          width: { size: 50, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell('記号', 20),
                createHeaderCell('意味', 80),
              ],
            }),
            new TableRow({
              children: [
                createCell('F', 20, { center: true, bold: true }),
                createCell('フルアクセス（全操作可能）', 80),
              ],
            }),
            new TableRow({
              children: [
                createCell('W', 20, { center: true, bold: true }),
                createCell('閲覧 + 編集', 80),
              ],
            }),
            new TableRow({
              children: [
                createCell('R', 20, { center: true, bold: true }),
                createCell('閲覧のみ', 80),
              ],
            }),
            new TableRow({
              children: [
                createCell('C', 20, { center: true, bold: true }),
                createCell('作成 + 自分の申請の閲覧', 80),
              ],
            }),
            new TableRow({
              children: [
                createCell('✕', 20, { center: true, bold: true }),
                createCell('アクセス不可', 80),
              ],
            }),
          ],
        }),

        // ページ区切り
        new Paragraph({ children: [new PageBreak()] }),

        // 4. 権限マトリクス
        sectionTitle('4. 権限マトリクス'),

        // 権限マトリクステーブル
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // ヘッダー行
            new TableRow({
              children: [
                createHeaderCell('カテゴリ', 13),
                createHeaderCell('機能', 21),
                createHeaderCell('admin', 11),
                createHeaderCell('consultant', 11),
                createHeaderCell('sales', 11),
                createHeaderCell('office_admin', 11),
                createHeaderCell('office_staff', 11),
                createHeaderCell('clinical_staff', 11),
              ],
            }),
            // データ行
            ...createPermissionRows(),
          ],
        }),

        // ページ区切り
        new Paragraph({ children: [new PageBreak()] }),

        // 5. メイン画面ボタン表示
        sectionTitle('5. メイン画面ボタン表示制御'),
        bodyText('メイン画面のメニューボタンは、ユーザーのロールに応じて表示/非表示を切り替える。'),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell('ボタン', 22),
                createHeaderCell('admin', 13),
                createHeaderCell('consultant', 13),
                createHeaderCell('sales', 13),
                createHeaderCell('office_admin', 13),
                createHeaderCell('office_staff', 13),
                createHeaderCell('clinical_staff', 13),
              ],
            }),
            ...createMainButtonRows(),
          ],
        }),

        // ページ区切り
        new Paragraph({ children: [new PageBreak()] }),

        // 6. ロール別サマリー
        sectionTitle('6. ロール別サマリー'),

        // admin
        subSectionTitle('6.1 admin（システム管理者）'),
        bodyText('【できること】'),
        bodyText('・全機能へのフルアクセス'),
        bodyText('【できないこと】'),
        bodyText('・なし'),

        // consultant
        subSectionTitle('6.2 consultant（SHRCコンサル）'),
        bodyText('【できること】'),
        bodyText('・担当施設の資産閲覧'),
        bodyText('・個体管理リスト作成'),
        bodyText('・タスク管理画面（購入管理・購入見積依頼以外すべて）'),
        bodyText('・現有資産調査フロー'),
        bodyText('・棚卸管理'),
        bodyText('・QRコード発行・印刷'),
        bodyText('・資産インポート・データマッチング'),
        bodyText('・SHIPマスタの閲覧'),
        bodyText('【できないこと】'),
        bodyText('・担当施設の資産編集'),
        bodyText('・メイン画面の「保守点検」「貸出管理」「修理申請」'),
        bodyText('・購入管理（見積書管理・見積処理）'),
        bodyText('・ユーザー管理'),
        bodyText('・個別施設マスタの編集'),
        bodyText('【制約】'),
        bodyText('・user.accessibleFacilities に含まれる施設のみアクセス可能'),

        // sales
        subSectionTitle('6.3 sales（GHS営業）'),
        bodyText('【できること】'),
        bodyText('・資産の閲覧'),
        bodyText('・修理タスク・貸出タスクの閲覧'),
        bodyText('・見積書管理・保守見積の閲覧'),
        bodyText('【できないこと】'),
        bodyText('・編集・作成系すべて'),
        bodyText('・タスク管理画面での操作'),
        bodyText('・マスタ管理・ユーザー管理'),
        bodyText('・QRコード発行'),
        bodyText('・現有資産調査・棚卸'),

        // office_admin
        subSectionTitle('6.4 office_admin（事務管理者）'),
        bodyText('【できること】'),
        bodyText('・事務担当者の全権限'),
        bodyText('・個別施設マスタのCRUD（作成・編集・削除）'),
        bodyText('・ユーザー管理（所属施設のユーザーのみ）'),
        bodyText('【できないこと】'),
        bodyText('・個体管理リスト作成'),
        bodyText('・SHIPマスタの編集'),
        bodyText('・資産インポート・データマッチング'),

        // office_staff
        subSectionTitle('6.5 office_staff（事務担当者）'),
        bodyText('【できること】'),
        bodyText('・タスク管理画面での業務（購入管理、修理タスク、貸出タスク、点検、保守、廃棄）'),
        bodyText('・資産詳細の編集'),
        bodyText('・現有資産調査フロー'),
        bodyText('・棚卸管理'),
        bodyText('・QRコード発行・印刷'),
        bodyText('・個別施設マスタの閲覧'),
        bodyText('【できないこと】'),
        bodyText('・個体管理リスト作成'),
        bodyText('・マスタ管理（編集）'),
        bodyText('・ユーザー管理'),
        bodyText('・資産インポート・データマッチング'),

        // clinical_staff
        subSectionTitle('6.6 clinical_staff（臨床スタッフ）'),
        bodyText('【できること】'),
        bodyText('・各種申請の作成 + 自分の申請の閲覧（修理依頼など）'),
        bodyText('・点検実施（日常点検）'),
        bodyText('・貸出実施'),
        bodyText('・現有資産調査フロー'),
        bodyText('・資産の閲覧'),
        bodyText('・棚卸の閲覧'),
        bodyText('・点検結果の閲覧'),
        bodyText('・貸出可能機器の閲覧'),
        bodyText('【できないこと】'),
        bodyText('・タスク管理画面へのアクセス'),
        bodyText('・個体管理リスト作成'),
        bodyText('・資産編集'),
        bodyText('・QRコード発行'),
        bodyText('・マスタ管理・ユーザー管理'),
        bodyText('・購入管理・保守管理・廃棄タスク'),

        // 7. 補足事項
        sectionTitle('7. 補足事項'),

        subSectionTitle('7.1 担当施設の制御'),
        bodyText('・consultant ロールは user.accessibleFacilities 配列に含まれる施設のみアクセス可能'),
        bodyText('・office_admin のユーザー管理は user.hospital に所属するユーザーのみ対象'),

        subSectionTitle('7.2 更新履歴'),
        new Table({
          width: { size: 50, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell('日付', 30),
                createHeaderCell('内容', 70),
              ],
            }),
            new TableRow({
              children: [
                createCell('2026-02-19', 30, { center: true }),
                createCell('初版作成', 70),
              ],
            }),
          ],
        }),
      ],
    },
  ],
});

// 権限マトリクスの行を生成
function createPermissionRows() {
  const data = [
    ['メイン画面', 'メイン画面表示', 'F', 'W', 'R', 'W', 'W', 'R'],
    ['資産関連', '資産検索・閲覧', 'F', 'R', 'R', 'W', 'R', 'R'],
    ['', '資産詳細表示', 'F', 'R', 'R', 'W', 'W', 'R'],
    ['', '資産編集', 'F', '✕', '✕', 'W', 'W', '✕'],
    ['', '個体管理リスト作成', 'F', 'W', '✕', '✕', '✕', '✕'],
    ['現有資産調査', 'オフライン準備', 'F', 'W', '✕', 'W', 'W', 'W'],
    ['', '調査場所選択', 'F', 'W', '✕', 'W', 'W', 'W'],
    ['', '資産調査入力', 'F', 'W', '✕', 'W', 'W', 'W'],
    ['', '調査履歴', 'F', 'W', '✕', 'W', 'W', 'W'],
    ['棚卸', '棚卸管理', 'F', 'W', '✕', 'W', 'W', 'R'],
    ['QRコード', 'QR発行・印刷', 'F', 'W', '✕', 'W', 'W', '✕'],
    ['購入管理', '見積書管理', 'F', '✕', 'R', 'W', 'W', '✕'],
    ['', '見積処理', 'F', '✕', 'R', 'W', 'W', '✕'],
    ['修理', '修理依頼（申請）', 'F', '✕', '✕', 'W', 'W', 'C'],
    ['', '修理タスク管理', 'F', 'W', 'R', 'W', 'W', '✕'],
    ['貸出', '貸出可能機器一覧', 'F', '✕', 'R', 'W', 'W', 'R'],
    ['', '貸出実施', 'F', '✕', '✕', 'W', 'W', 'W'],
    ['', '貸出タスク管理', 'F', 'W', 'R', 'W', 'W', '✕'],
    ['点検', '日常点検実施', 'F', '✕', '✕', 'W', 'W', 'W'],
    ['', '点検準備', 'F', 'W', '✕', 'W', 'W', '✕'],
    ['', '点検結果', 'F', 'W', '✕', 'W', 'W', 'R'],
    ['保守', '保守見積登録', 'F', '✕', 'R', 'W', 'W', '✕'],
    ['', 'メーカー保守結果', 'F', 'W', 'R', 'W', 'W', '✕'],
    ['廃棄', '廃棄タスク', 'F', 'W', '✕', 'W', 'W', '✕'],
    ['マスタ管理', '資産マスタ（SHIP）', 'F', 'R', '✕', '✕', '✕', '✕'],
    ['', '施設マスタ（SHIP）', 'F', 'R', '✕', '✕', '✕', '✕'],
    ['', '部門マスタ（SHIP）', 'F', 'R', '✕', '✕', '✕', '✕'],
    ['', '個別施設マスタ', 'F', 'R', '✕', 'W', 'R', '✕'],
    ['ユーザー管理', 'ユーザー管理', 'F', '✕', '✕', 'W', '✕', '✕'],
    ['データ管理', '資産インポート', 'F', 'W', '✕', 'W', '✕', '✕'],
    ['', 'データマッチング', 'F', 'W', '✕', 'W', '✕', '✕'],
  ];

  return data.map((row, index) => {
    const isNewCategory = row[0] !== '';
    return new TableRow({
      children: [
        createCell(row[0], 13, { bold: isNewCategory, shading: isNewCategory ? subHeaderShading : null }),
        createCell(row[1], 21),
        createCell(row[2], 11, { center: true }),
        createCell(row[3], 11, { center: true }),
        createCell(row[4], 11, { center: true }),
        createCell(row[5], 11, { center: true }),
        createCell(row[6], 11, { center: true }),
        createCell(row[7], 11, { center: true }),
      ],
    });
  });
}

// メイン画面ボタンの行を生成
function createMainButtonRows() {
  const data = [
    ['資産リスト', '○', '○', '○', '○', '○', '○'],
    ['編集リスト', '○', '○', '✕', '✕', '✕', '✕'],
    ['購入管理', '○', '✕', '○', '○', '○', '✕'],
    ['保守点検', '○', '✕', '✕', '○', '○', '○'],
    ['貸出管理', '○', '✕', '○', '○', '○', '○'],
    ['修理申請', '○', '✕', '✕', '○', '○', '○'],
    ['現有資産調査', '○', '○', '✕', '○', '○', '○'],
    ['マスタ管理', '○', '○', '✕', '○', '○', '✕'],
    ['ユーザー管理', '○', '✕', '✕', '○', '✕', '✕'],
  ];

  return data.map((row) => {
    return new TableRow({
      children: [
        createCell(row[0], 22, { bold: true }),
        createCell(row[1], 13, { center: true }),
        createCell(row[2], 13, { center: true }),
        createCell(row[3], 13, { center: true }),
        createCell(row[4], 13, { center: true }),
        createCell(row[5], 13, { center: true }),
        createCell(row[6], 13, { center: true }),
      ],
    });
  });
}

// ファイル出力
const outputPath = path.join(__dirname, '..', 'docs', 'ロール別権限定義書.docx');

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Word file created: ${outputPath}`);
});
