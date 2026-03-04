'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Asset } from '@/lib/types';
import { AssetMaster, VendorMaster } from '@/lib/types/master';
import { ReceivedQuotationGroup, ReceivedQuotationItem } from '@/lib/types/quotation';

// ============================
// 型定義
// ============================

type DataSource = '資産Master' | '業者Master' | '原本リスト' | '見積DB（全体）';
type LinkKey = '資産Master ID' | 'QRコード' | '部署ID' | '事業者ID' | '見積依頼No.';

/** ソース側カラム1件の定義 */
interface SourceColumn {
  sourceKey: string;   // ソースデータ上のフィールド名
  label: string;       // 表示ラベル
  targetKey?: string;  // Asset 側に書き込むキー（undefinedなら紐づけ不可）
  group: string;       // グループ名
}

interface DataLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssets: Asset[];
  baseAssets: Asset[];
  assetMasters: AssetMaster[];
  vendors: VendorMaster[];
  quotationGroups: ReceivedQuotationGroup[];
  quotationItems: ReceivedQuotationItem[];
  onExecute: (updates: Map<number, Partial<Asset>>) => void;
}

// ============================
// データソースごとの使用可能キー
// ============================

const SOURCE_AVAILABLE_KEYS: Record<DataSource, LinkKey[]> = {
  '資産Master': ['資産Master ID'],
  '業者Master': ['事業者ID'],
  '原本リスト': ['QRコード', '資産Master ID'],
  '見積DB（全体）': ['資産Master ID', '見積依頼No.'],
};

// ============================
// データソースごとのカラム定義
// ============================

const ASSET_MASTER_COLUMNS: SourceColumn[] = [
  // JMDN分類・一般名称
  { sourceKey: 'classificationCode', label: '類別コード', group: 'JMDN分類' },
  { sourceKey: 'classificationName', label: '類別名称', group: 'JMDN分類' },
  { sourceKey: 'jmdnSubCategory', label: 'JMDN中分類名', group: 'JMDN分類' },
  { sourceKey: 'generalName', label: '一般的名称', group: 'JMDN分類' },
  { sourceKey: 'jmdnCode', label: 'JMDNコード', group: 'JMDN分類' },
  // 販売情報
  { sourceKey: 'tradeName', label: '販売名', targetKey: 'name', group: '販売情報' },
  { sourceKey: 'manufacturer', label: '製造販売業者等', group: '販売情報' },
  // SHIP資産マスタ
  { sourceKey: 'assetMasterId', label: '資産マスタID', targetKey: 'assetMasterId', group: 'SHIP資産マスタ' },
  { sourceKey: 'category', label: 'Category', targetKey: 'category', group: 'SHIP資産マスタ' },
  { sourceKey: 'largeClass', label: '大分類', targetKey: 'largeClass', group: 'SHIP資産マスタ' },
  { sourceKey: 'mediumClass', label: '中分類', targetKey: 'mediumClass', group: 'SHIP資産マスタ' },
  { sourceKey: 'item', label: '品目', targetKey: 'item', group: 'SHIP資産マスタ' },
  { sourceKey: 'maker', label: 'メーカー名', targetKey: 'maker', group: 'SHIP資産マスタ' },
  { sourceKey: 'model', label: '型式', targetKey: 'model', group: 'SHIP資産マスタ' },
  // ドキュメント
  { sourceKey: 'packageInsertDocument', label: '添付文書Document', group: 'ドキュメント' },
  { sourceKey: 'catalogDocument', label: 'カタログDocument', group: 'ドキュメント' },
  { sourceKey: 'otherDocument', label: 'その他Document', group: 'ドキュメント' },
  // システム管理
  { sourceKey: 'unitPrice', label: '単価', targetKey: 'acquisitionCost', group: 'システム管理' },
  { sourceKey: 'depreciationYears', label: '耐用年数', targetKey: 'legalServiceLife', group: 'システム管理' },
  { sourceKey: 'maintenanceCycle', label: '保守周期', group: 'システム管理' },
];

const VENDOR_MASTER_COLUMNS: SourceColumn[] = [
  // 業者情報
  { sourceKey: 'vendorName', label: '業者名', targetKey: 'rfqVendor', group: '業者情報' },
  { sourceKey: 'invoiceNumber', label: 'インボイス登録番号', group: '業者情報' },
  { sourceKey: 'address', label: '住所', group: '業者情報' },
  // 担当者情報
  { sourceKey: 'contactPerson', label: '担当者名', group: '担当者情報' },
  { sourceKey: 'position', label: '役職', group: '担当者情報' },
  { sourceKey: 'role', label: '役割', group: '担当者情報' },
  { sourceKey: 'phone', label: '連絡先', group: '担当者情報' },
  { sourceKey: 'email', label: 'メール', group: '担当者情報' },
];

const ORIGINAL_LIST_COLUMNS: SourceColumn[] = [
  // 共通部署マスタ
  { sourceKey: 'shipDivision', label: '部門名', targetKey: 'shipDivision', group: '共通部署マスタ' },
  { sourceKey: 'shipDepartment', label: '部署名', targetKey: 'shipDepartment', group: '共通部署マスタ' },
  // 設置場所
  { sourceKey: 'building', label: '棟', targetKey: 'building', group: '設置場所' },
  { sourceKey: 'floor', label: '階', targetKey: 'floor', group: '設置場所' },
  { sourceKey: 'department', label: '部門', targetKey: 'department', group: '設置場所' },
  { sourceKey: 'section', label: '部署', targetKey: 'section', group: '設置場所' },
  { sourceKey: 'roomName', label: '室名', targetKey: 'roomName', group: '設置場所' },
  // 識別・分類
  { sourceKey: 'managementDept', label: '管理部署', targetKey: 'managementDept', group: '識別・分類' },
  { sourceKey: 'qrCode', label: 'QRコード', targetKey: 'qrCode', group: '識別・分類' },
  { sourceKey: 'assetNo', label: '台帳番号', targetKey: 'assetNo', group: '識別・分類' },
  { sourceKey: 'assetMasterId', label: '資産マスタID', targetKey: 'assetMasterId', group: '識別・分類' },
  { sourceKey: 'category', label: 'Category', targetKey: 'category', group: '識別・分類' },
  { sourceKey: 'largeClass', label: '大分類', targetKey: 'largeClass', group: '識別・分類' },
  { sourceKey: 'mediumClass', label: '中分類', targetKey: 'mediumClass', group: '識別・分類' },
  { sourceKey: 'detailCategory', label: '明細区分', targetKey: 'detailCategory', group: '識別・分類' },
  { sourceKey: 'parentItem', label: '明細親機', targetKey: 'parentItem', group: '識別・分類' },
  { sourceKey: 'item', label: '個体管理品目', targetKey: 'item', group: '識別・分類' },
  { sourceKey: 'maker', label: 'メーカー名', targetKey: 'maker', group: '識別・分類' },
  { sourceKey: 'model', label: '型式', targetKey: 'model', group: '識別・分類' },
  // 取得情報・契約
  { sourceKey: 'serialNumber', label: 'シリアルNo.', targetKey: 'serialNumber', group: '取得情報・契約' },
  { sourceKey: 'purchaseDate', label: '購入年月日', targetKey: 'purchaseDate', group: '取得情報・契約' },
  { sourceKey: 'lease', label: 'リース', targetKey: 'lease', group: '取得情報・契約' },
  { sourceKey: 'rental', label: '貸出品', targetKey: 'rental', group: '取得情報・契約' },
  { sourceKey: 'contractName', label: '契約･見積名称', targetKey: 'contractName', group: '取得情報・契約' },
  { sourceKey: 'contractNo', label: '契約番号', targetKey: 'contractNo', group: '取得情報・契約' },
  { sourceKey: 'contractDate', label: '契約･発注日', targetKey: 'contractDate', group: '取得情報・契約' },
  { sourceKey: 'deliveryDate', label: '納品日', targetKey: 'deliveryDate', group: '取得情報・契約' },
  { sourceKey: 'inspectionDate', label: '検収日', targetKey: 'inspectionDate', group: '取得情報・契約' },
  // 財務・耐用年数
  { sourceKey: 'acquisitionCost', label: '取得価格', targetKey: 'acquisitionCost', group: '財務・耐用年数' },
  { sourceKey: 'legalServiceLife', label: '耐用年数（法定）', targetKey: 'legalServiceLife', group: '財務・耐用年数' },
  { sourceKey: 'recommendedServiceLife', label: '使用年数（メーカー推奨）', targetKey: 'recommendedServiceLife', group: '財務・耐用年数' },
  { sourceKey: 'endOfService', label: 'End of service', targetKey: 'endOfService', group: '財務・耐用年数' },
  { sourceKey: 'endOfSupport', label: 'End of support', targetKey: 'endOfSupport', group: '財務・耐用年数' },
];

const QUOTATION_DB_COLUMNS: SourceColumn[] = [
  // 見積ヘッダー情報（グループから取得）
  { sourceKey: 'vendorName', label: '見積業者', targetKey: 'rfqVendor', group: '見積ヘッダー' },
  { sourceKey: 'receivedQuotationNo', label: '見積番号', targetKey: 'rfqGroupName', group: '見積ヘッダー' },
  { sourceKey: 'quotationDate', label: '見積日', group: '見積ヘッダー' },
  { sourceKey: 'phase', label: '見積フェーズ', group: '見積ヘッダー' },
  // 明細分類
  { sourceKey: 'itemType', label: '登録区分', group: '明細分類' },
  { sourceKey: 'category', label: 'Category', targetKey: 'category', group: '明細分類' },
  { sourceKey: 'largeClass', label: '大分類', targetKey: 'largeClass', group: '明細分類' },
  { sourceKey: 'middleClass', label: '中分類', targetKey: 'mediumClass', group: '明細分類' },
  { sourceKey: 'itemName', label: '個体管理品目', targetKey: 'item', group: '明細分類' },
  { sourceKey: 'manufacturer', label: 'メーカー', targetKey: 'maker', group: '明細分類' },
  { sourceKey: 'model', label: '型式', targetKey: 'model', group: '明細分類' },
  // 価格情報（原本）
  { sourceKey: 'listPriceUnit', label: '定価単価', group: '価格情報（原本）' },
  { sourceKey: 'listPriceTotal', label: '定価金額', group: '価格情報（原本）' },
  { sourceKey: 'purchasePriceUnit', label: '購入単価', group: '価格情報（原本）' },
  { sourceKey: 'purchasePriceTotal', label: '購入金額', group: '価格情報（原本）' },
  // 価格情報（按分）
  { sourceKey: 'allocListPriceUnit', label: '按分定価単価', group: '価格情報（按分）' },
  { sourceKey: 'allocListPriceTotal', label: '按分定価金額', group: '価格情報（按分）' },
  { sourceKey: 'allocPriceUnit', label: '按分単価（税別）', group: '価格情報（按分）' },
  { sourceKey: 'allocDiscount', label: '値引率', group: '価格情報（按分）' },
  { sourceKey: 'allocTaxRate', label: '消費税率', group: '価格情報（按分）' },
  { sourceKey: 'allocTaxTotal', label: '税込金額', targetKey: 'rfqAmount', group: '価格情報（按分）' },
  // 会計
  { sourceKey: 'accountTitle', label: '勘定科目', group: '会計' },
  // 見積依頼
  { sourceKey: 'rfqNo', label: '見積依頼No.', targetKey: 'rfqNo', group: '見積依頼' },
];

const SOURCE_COLUMNS: Record<DataSource, SourceColumn[]> = {
  '資産Master': ASSET_MASTER_COLUMNS,
  '業者Master': VENDOR_MASTER_COLUMNS,
  '原本リスト': ORIGINAL_LIST_COLUMNS,
  '見積DB（全体）': QUOTATION_DB_COLUMNS,
};

// ============================
// ユーティリティ
// ============================

/** SourceColumn[] → グループ別に構造化 */
function groupColumns(columns: SourceColumn[]) {
  const map = new Map<string, SourceColumn[]>();
  for (const col of columns) {
    if (!map.has(col.group)) map.set(col.group, []);
    map.get(col.group)!.push(col);
  }
  return Array.from(map.entries()).map(([group, cols]) => ({ group, cols }));
}

// ============================
// コンポーネント
// ============================

export const DataLinkModal: React.FC<DataLinkModalProps> = ({
  isOpen,
  onClose,
  selectedAssets,
  baseAssets,
  assetMasters,
  vendors,
  quotationGroups,
  quotationItems,
  onExecute,
}) => {
  const [dataSource, setDataSource] = useState<DataSource | ''>('');
  const [linkKey, setLinkKey] = useState<LinkKey | ''>('');
  const [checkedColumns, setCheckedColumns] = useState<Set<string>>(new Set());
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ matched: number; unmatched: number } | null>(null);

  // データソース変更時にリセット
  const handleDataSourceChange = useCallback((source: DataSource | '') => {
    setDataSource(source);
    setCheckedColumns(new Set());
    setResult(null);
    if (source) {
      const keys = SOURCE_AVAILABLE_KEYS[source];
      setLinkKey(keys.length === 1 ? keys[0] : '');
    } else {
      setLinkKey('');
    }
  }, []);

  // 現在のカラムグループ
  const currentGroups = useMemo(() => {
    if (!dataSource) return [];
    return groupColumns(SOURCE_COLUMNS[dataSource]);
  }, [dataSource]);

  // 紐づけ可能なカラム（targetKeyがあるもの）のsourceKeyセット
  const linkableSourceKeys = useMemo(() => {
    if (!dataSource) return new Set<string>();
    return new Set(SOURCE_COLUMNS[dataSource].filter(c => c.targetKey).map(c => c.sourceKey));
  }, [dataSource]);

  // グループごとのチェック数
  const groupCheckedCounts = useMemo(() => {
    const counts: Record<string, { checked: number; total: number }> = {};
    for (const { group, cols } of currentGroups) {
      const linkable = cols.filter(c => c.targetKey);
      counts[group] = {
        checked: linkable.filter(c => checkedColumns.has(c.sourceKey)).length,
        total: linkable.length,
      };
    }
    return counts;
  }, [currentGroups, checkedColumns]);

  // 全選択
  const handleSelectAll = useCallback(() => {
    setCheckedColumns(new Set(linkableSourceKeys));
  }, [linkableSourceKeys]);

  // 全解除
  const handleDeselectAll = useCallback(() => {
    setCheckedColumns(new Set());
  }, []);

  // グループ単位トグル
  const handleToggleGroup = useCallback((groupName: string) => {
    const group = currentGroups.find(g => g.group === groupName);
    if (!group) return;
    const linkableCols = group.cols.filter(c => c.targetKey);
    if (linkableCols.length === 0) return;
    const allChecked = linkableCols.every(c => checkedColumns.has(c.sourceKey));
    const next = new Set(checkedColumns);
    if (allChecked) {
      linkableCols.forEach(c => next.delete(c.sourceKey));
    } else {
      linkableCols.forEach(c => next.add(c.sourceKey));
    }
    setCheckedColumns(next);
  }, [currentGroups, checkedColumns]);

  // 個別カラムトグル
  const handleToggleColumn = useCallback((sourceKey: string) => {
    setCheckedColumns(prev => {
      const next = new Set(prev);
      if (next.has(sourceKey)) next.delete(sourceKey);
      else next.add(sourceKey);
      return next;
    });
  }, []);

  // ============================
  // 紐づけ実行ロジック
  // ============================
  const handleExecute = useCallback(() => {
    if (!dataSource || !linkKey || checkedColumns.size === 0) return;

    setExecuting(true);
    setResult(null);

    const columns = SOURCE_COLUMNS[dataSource];
    // checkedColumns(sourceKey) → targetKey のマッピングを構築
    const fieldMapping = new Map<string, string>();
    for (const col of columns) {
      if (checkedColumns.has(col.sourceKey) && col.targetKey) {
        fieldMapping.set(col.sourceKey, col.targetKey);
      }
    }

    const updates = new Map<number, Partial<Asset>>();
    let matched = 0;
    let unmatched = 0;

    for (const asset of selectedAssets) {
      const patch: Partial<Asset> = {};
      let found = false;

      if (dataSource === '資産Master') {
        const master = assetMasters.find(m => m.assetMasterId === asset.assetMasterId);
        if (master) {
          found = true;
          for (const [srcKey, tgtKey] of fieldMapping) {
            const val = (master as unknown as Record<string, unknown>)[srcKey];
            if (val !== undefined) {
              (patch as unknown as Record<string, unknown>)[tgtKey] = val;
            }
          }
        }
      } else if (dataSource === '業者Master') {
        const vendor = vendors.find(v => v.id === asset.rfqVendor || v.vendorName === asset.rfqVendor);
        if (vendor) {
          found = true;
          for (const [srcKey, tgtKey] of fieldMapping) {
            const val = (vendor as unknown as Record<string, unknown>)[srcKey];
            if (val !== undefined) {
              (patch as unknown as Record<string, unknown>)[tgtKey] = val;
            }
          }
        }
      } else if (dataSource === '原本リスト') {
        let base: Asset | undefined;
        if (linkKey === 'QRコード') {
          base = baseAssets.find(b => b.qrCode !== '' && b.qrCode === asset.qrCode);
        } else if (linkKey === '資産Master ID') {
          base = baseAssets.find(b => b.assetMasterId && b.assetMasterId === asset.assetMasterId);
        }
        if (base) {
          found = true;
          for (const [srcKey, tgtKey] of fieldMapping) {
            const val = (base as unknown as Record<string, unknown>)[srcKey];
            if (val !== undefined) {
              (patch as unknown as Record<string, unknown>)[tgtKey] = val;
            }
          }
        }
      } else if (dataSource === '見積DB（全体）') {
        let matchedItems: ReceivedQuotationItem[] = [];
        if (linkKey === '資産Master ID' && asset.assetMasterId) {
          matchedItems = quotationItems.filter(qi => qi.assetMasterId === asset.assetMasterId);
        } else if (linkKey === '見積依頼No.' && asset.rfqNo) {
          matchedItems = quotationItems.filter(qi => qi.rfqNo === asset.rfqNo);
        }
        if (matchedItems.length > 0) {
          found = true;
          const qi = matchedItems[0];
          const qg = quotationGroups.find(g => g.id === qi.quotationGroupId);

          // 見積DBはヘッダー+明細を統合した仮想レコードを構築
          const merged: Record<string, unknown> = {
            // 明細
            ...qi,
            // ヘッダー（明細と重複するキーは明細優先）
            vendorName: qg?.vendorName,
            receivedQuotationNo: qg?.receivedQuotationNo,
            quotationDate: qg?.quotationDate,
            phase: qg?.phase,
          };

          for (const [srcKey, tgtKey] of fieldMapping) {
            const val = merged[srcKey];
            if (val !== undefined) {
              (patch as unknown as Record<string, unknown>)[tgtKey] = val;
            }
          }
        }
      }

      if (found && Object.keys(patch).length > 0) {
        updates.set(asset.no, patch);
        matched++;
      } else {
        unmatched++;
      }
    }

    onExecute(updates);
    setResult({ matched, unmatched });
    setExecuting(false);
  }, [dataSource, linkKey, checkedColumns, selectedAssets, assetMasters, vendors, baseAssets, quotationItems, quotationGroups, onExecute]);

  if (!isOpen) return null;

  const canExecute = dataSource && linkKey && checkedColumns.size > 0 && !executing;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }}>
      <div style={{
        background: 'white', borderRadius: 12, width: '90%', maxWidth: 800,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* ヘッダー */}
        <div style={{
          background: '#8e44ad', color: 'white', padding: '16px 24px',
          borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Data Link</h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            style={{
              background: 'transparent', border: 'none', color: 'white',
              fontSize: 22, cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* コンテンツ: 結果画面 or 設定画面 */}
        {result ? (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 24 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: result.matched > 0 ? '#27ae60' : '#f39c12',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 36, color: 'white' }}>
                  {result.matched > 0 ? '\u2713' : '!'}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
                紐づけが完了しました
              </h3>
              <div style={{
                width: '100%', maxWidth: 400,
                border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    <strong>{dataSource}</strong> &rarr; <strong>{linkKey}</strong> で紐づけ
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, color: '#555' }}>対象レコード</span>
                    <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{selectedAssets.length}件</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, color: '#555' }}>マッチ成功</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#27ae60', fontVariantNumeric: 'tabular-nums' }}>{result.matched}件</span>
                  </div>
                  {result.unmatched > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 14, color: '#555' }}>マッチなし</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#e67e22', fontVariantNumeric: 'tabular-nums' }}>{result.unmatched}件</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: '#555' }}>更新カラム数</span>
                    <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{checkedColumns.size}項目</span>
                  </div>
                </div>
              </div>
              {result.unmatched > 0 && (
                <p style={{ margin: 0, fontSize: 13, color: '#888', maxWidth: 400, textAlign: 'center', textWrap: 'pretty' }}>
                  マッチしなかったレコードは、キー項目（{linkKey}）が未設定か、{dataSource}に該当データがありません。
                </p>
              )}
            </div>
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #e0e0e0',
              display: 'flex', justifyContent: 'space-between', gap: 12,
            }}>
              <button
                onClick={() => setResult(null)}
                style={{
                  padding: '10px 24px', fontSize: 14, fontWeight: 600,
                  background: 'transparent', border: '1px solid #ddd',
                  borderRadius: 6, cursor: 'pointer', color: '#666',
                }}
              >
                続けて紐づける
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 28px', fontSize: 14, fontWeight: 700,
                  background: '#8e44ad', color: 'white',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                }}
              >
                閉じる
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 設定画面 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              {/* 上部コントロール */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 16, flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleSelectAll}
                    disabled={!dataSource}
                    style={{
                      padding: '6px 14px', fontSize: 13, fontWeight: 600,
                      background: dataSource ? '#27ae60' : '#ccc', color: 'white',
                      border: 'none', borderRadius: 4, cursor: dataSource ? 'pointer' : 'default',
                    }}
                  >
                    全て選択
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    style={{
                      padding: '6px 14px', fontSize: 13, fontWeight: 600,
                      background: '#f5f5f5', color: '#333',
                      border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer',
                    }}
                  >
                    全て解除
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>Data Link</label>
                    <select
                      value={dataSource}
                      onChange={(e) => handleDataSourceChange(e.target.value as DataSource | '')}
                      style={{
                        padding: '6px 12px', fontSize: 13, border: '2px solid #8e44ad',
                        borderRadius: 4, minWidth: 160, fontWeight: 600,
                      }}
                    >
                      <option value="">選択してください</option>
                      <option value="資産Master">資産Master</option>
                      <option value="業者Master">業者Master</option>
                      <option value="原本リスト">原本リスト</option>
                      <option value="見積DB（全体）">見積DB（全体）</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>紐づけるNo.</label>
                    <select
                      value={linkKey}
                      onChange={(e) => setLinkKey(e.target.value as LinkKey | '')}
                      disabled={!dataSource}
                      style={{
                        padding: '6px 12px', fontSize: 13, border: '2px solid #8e44ad',
                        borderRadius: 4, minWidth: 160, fontWeight: 600,
                        opacity: dataSource ? 1 : 0.5,
                      }}
                    >
                      <option value="">選択してください</option>
                      {dataSource && SOURCE_AVAILABLE_KEYS[dataSource].map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 対象件数 */}
              <div style={{
                padding: '8px 12px', background: '#f8f9fa', borderRadius: 4,
                fontSize: 13, color: '#555', marginBottom: 16,
              }}>
                対象レコード: <strong>{selectedAssets.length}件</strong>
                {!dataSource && (
                  <span style={{ marginLeft: 12, color: '#999' }}>Data Linkを選択してください</span>
                )}
              </div>

              {/* カラムグループ一覧（データソース別に動的表示） */}
              {currentGroups.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#999', fontSize: 14 }}>
                  Data Linkを選択すると、紐づけ可能なカラムが表示されます
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {currentGroups.map(({ group, cols }) => {
                    const counts = groupCheckedCounts[group];
                    if (!counts) return null;
                    const linkableCols = cols.filter(c => c.targetKey);
                    const hasLinkable = linkableCols.length > 0;
                    const allChecked = hasLinkable && linkableCols.every(c => checkedColumns.has(c.sourceKey));

                    return (
                      <div key={group} style={{
                        border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden',
                      }}>
                        {/* グループヘッダー */}
                        <div
                          onClick={() => hasLinkable && handleToggleGroup(group)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px',
                            background: allChecked ? '#eaf7ed' : hasLinkable ? '#fafafa' : '#f5f5f5',
                            cursor: hasLinkable ? 'pointer' : 'default',
                            borderBottom: '1px solid #e0e0e0',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={allChecked}
                            disabled={!hasLinkable}
                            onChange={() => handleToggleGroup(group)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: 16, height: 16, accentColor: '#27ae60' }}
                          />
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                            {group}
                          </span>
                          <span style={{
                            fontSize: 12,
                            color: counts.checked > 0 ? '#27ae60' : '#999',
                            fontWeight: counts.checked > 0 ? 600 : 400,
                          }}>
                            ({counts.checked}/{counts.total})
                          </span>
                        </div>

                        {/* カラム一覧 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', padding: '8px 14px' }}>
                          {cols.map(col => {
                            const isLinkable = Boolean(col.targetKey);
                            const isChecked = checkedColumns.has(col.sourceKey);

                            return (
                              <label
                                key={col.sourceKey}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  padding: '6px 12px',
                                  minWidth: '33%',
                                  cursor: isLinkable ? 'pointer' : 'default',
                                  opacity: isLinkable ? 1 : 0.4,
                                  background: isChecked ? '#eaf7ed' : 'transparent',
                                  borderRadius: 4,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={!isLinkable}
                                  onChange={() => handleToggleColumn(col.sourceKey)}
                                  style={{ width: 15, height: 15, accentColor: '#27ae60' }}
                                />
                                <span style={{ fontSize: 13, color: isLinkable ? '#333' : '#999' }}>
                                  {col.label}
                                </span>
                                {isLinkable && col.sourceKey !== col.targetKey && (
                                  <span style={{ fontSize: 10, color: '#aaa' }}>
                                    &rarr;{col.targetKey}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* フッター */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #e0e0e0',
              display: 'flex', justifyContent: 'flex-end', gap: 12,
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 24px', fontSize: 14, fontWeight: 600,
                  background: 'transparent', border: '1px solid #ddd',
                  borderRadius: 6, cursor: 'pointer', color: '#666',
                }}
              >
                閉じる
              </button>
              <button
                onClick={handleExecute}
                disabled={!canExecute}
                style={{
                  padding: '10px 28px', fontSize: 14, fontWeight: 700,
                  background: canExecute ? '#f39c12' : '#ccc',
                  color: canExecute ? '#333' : '#999',
                  border: 'none', borderRadius: 6,
                  cursor: canExecute ? 'pointer' : 'default',
                  minWidth: 140,
                }}
              >
                {executing ? '実行中...' : '紐づけの実行'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
