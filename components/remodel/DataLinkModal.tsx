'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Asset } from '@/lib/types';
import { AssetMaster, VendorMaster } from '@/lib/types/master';
import { ReceivedQuotationGroup, ReceivedQuotationItem } from '@/lib/types/quotation';
import { RfqGroup } from '@/lib/types/rfqGroup';

// ============================
// 型定義
// ============================

type DataSource = '資産Master' | '業者Master' | '原本リスト' | '見積DB';
type LinkKey = '資産Master ID' | 'QRコード' | '部署ID' | '事業者ID' | '見積依頼No.';

/** ソース側カラム1件の定義 */
interface SourceColumn {
  sourceKey: string;
  label: string;
  targetKey?: string;
  group: string;
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
  rfqGroups: RfqGroup[];
  onExecute: (updates: Map<number, Partial<Asset>>) => void;
  onAddNewAssets: (newAssets: Asset[]) => void;
}

// ヒアリング結果保護対象フィールド（見積DB適用時のみ）
const HEARING_PROTECTED_FIELDS = [
  'newBuilding', 'newFloor', 'newDepartment', 'newSection', 'newRoomName',
  'executionFiscalYear', 'purchaseCategory', 'comment',
  'item', 'maker', 'model', 'category', 'largeClass', 'mediumClass',
];

// ============================
// データソースごとの使用可能キー
// ============================

const SOURCE_AVAILABLE_KEYS: Record<Exclude<DataSource, '見積DB'>, LinkKey[]> = {
  '資産Master': ['資産Master ID'],
  '業者Master': ['事業者ID'],
  '原本リスト': ['QRコード', '資産Master ID'],
};

// ============================
// データソースごとのカラム定義
// ============================

const ASSET_MASTER_COLUMNS: SourceColumn[] = [
  { sourceKey: 'classificationCode', label: '類別コード', group: 'JMDN分類' },
  { sourceKey: 'classificationName', label: '類別名称', group: 'JMDN分類' },
  { sourceKey: 'jmdnSubCategory', label: 'JMDN中分類名', group: 'JMDN分類' },
  { sourceKey: 'generalName', label: '一般的名称', group: 'JMDN分類' },
  { sourceKey: 'jmdnCode', label: 'JMDNコード', group: 'JMDN分類' },
  { sourceKey: 'tradeName', label: '販売名', targetKey: 'name', group: '販売情報' },
  { sourceKey: 'manufacturer', label: '製造販売業者等', group: '販売情報' },
  { sourceKey: 'assetMasterId', label: '資産マスタID', targetKey: 'assetMasterId', group: 'SHIP資産マスタ' },
  { sourceKey: 'category', label: 'Category', targetKey: 'category', group: 'SHIP資産マスタ' },
  { sourceKey: 'largeClass', label: '大分類', targetKey: 'largeClass', group: 'SHIP資産マスタ' },
  { sourceKey: 'mediumClass', label: '中分類', targetKey: 'mediumClass', group: 'SHIP資産マスタ' },
  { sourceKey: 'item', label: '品目', targetKey: 'item', group: 'SHIP資産マスタ' },
  { sourceKey: 'maker', label: 'メーカー名', targetKey: 'maker', group: 'SHIP資産マスタ' },
  { sourceKey: 'model', label: '型式', targetKey: 'model', group: 'SHIP資産マスタ' },
  { sourceKey: 'packageInsertDocument', label: '添付文書Document', group: 'ドキュメント' },
  { sourceKey: 'catalogDocument', label: 'カタログDocument', group: 'ドキュメント' },
  { sourceKey: 'otherDocument', label: 'その他Document', group: 'ドキュメント' },
  { sourceKey: 'unitPrice', label: '単価', targetKey: 'acquisitionCost', group: 'システム管理' },
  { sourceKey: 'depreciationYears', label: '耐用年数', targetKey: 'legalServiceLife', group: 'システム管理' },
  { sourceKey: 'maintenanceCycle', label: '保守周期', group: 'システム管理' },
];

const VENDOR_MASTER_COLUMNS: SourceColumn[] = [
  { sourceKey: 'vendorName', label: '業者名', targetKey: 'rfqVendor', group: '業者情報' },
  { sourceKey: 'invoiceNumber', label: 'インボイス登録番号', group: '業者情報' },
  { sourceKey: 'address', label: '住所', group: '業者情報' },
  { sourceKey: 'contactPerson', label: '担当者名', group: '担当者情報' },
  { sourceKey: 'position', label: '役職', group: '担当者情報' },
  { sourceKey: 'role', label: '役割', group: '担当者情報' },
  { sourceKey: 'phone', label: '連絡先', group: '担当者情報' },
  { sourceKey: 'email', label: 'メール', group: '担当者情報' },
];

const ORIGINAL_LIST_COLUMNS: SourceColumn[] = [
  { sourceKey: 'shipDivision', label: '部門名', targetKey: 'shipDivision', group: '共通部署マスタ' },
  { sourceKey: 'shipDepartment', label: '部署名', targetKey: 'shipDepartment', group: '共通部署マスタ' },
  { sourceKey: 'building', label: '棟', targetKey: 'building', group: '設置場所' },
  { sourceKey: 'floor', label: '階', targetKey: 'floor', group: '設置場所' },
  { sourceKey: 'department', label: '部門', targetKey: 'department', group: '設置場所' },
  { sourceKey: 'section', label: '部署', targetKey: 'section', group: '設置場所' },
  { sourceKey: 'roomName', label: '室名', targetKey: 'roomName', group: '設置場所' },
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
  { sourceKey: 'serialNumber', label: 'シリアルNo.', targetKey: 'serialNumber', group: '取得情報・契約' },
  { sourceKey: 'purchaseDate', label: '購入年月日', targetKey: 'purchaseDate', group: '取得情報・契約' },
  { sourceKey: 'lease', label: 'リース', targetKey: 'lease', group: '取得情報・契約' },
  { sourceKey: 'rental', label: '貸出品', targetKey: 'rental', group: '取得情報・契約' },
  { sourceKey: 'contractName', label: '契約･見積名称', targetKey: 'contractName', group: '取得情報・契約' },
  { sourceKey: 'contractNo', label: '契約番号', targetKey: 'contractNo', group: '取得情報・契約' },
  { sourceKey: 'contractDate', label: '契約･発注日', targetKey: 'contractDate', group: '取得情報・契約' },
  { sourceKey: 'deliveryDate', label: '納品日', targetKey: 'deliveryDate', group: '取得情報・契約' },
  { sourceKey: 'inspectionDate', label: '検収日', targetKey: 'inspectionDate', group: '取得情報・契約' },
  { sourceKey: 'acquisitionCost', label: '取得価格', targetKey: 'acquisitionCost', group: '財務・耐用年数' },
  { sourceKey: 'legalServiceLife', label: '耐用年数（法定）', targetKey: 'legalServiceLife', group: '財務・耐用年数' },
  { sourceKey: 'recommendedServiceLife', label: '使用年数（メーカー推奨）', targetKey: 'recommendedServiceLife', group: '財務・耐用年数' },
  { sourceKey: 'endOfService', label: 'End of service', targetKey: 'endOfService', group: '財務・耐用年数' },
  { sourceKey: 'endOfSupport', label: 'End of support', targetKey: 'endOfSupport', group: '財務・耐用年数' },
];

const QUOTATION_DB_COLUMNS: SourceColumn[] = [
  { sourceKey: 'vendorName', label: '見積業者', targetKey: 'rfqVendor', group: '見積ヘッダー' },
  { sourceKey: 'receivedQuotationNo', label: '見積番号', targetKey: 'rfqGroupName', group: '見積ヘッダー' },
  { sourceKey: 'quotationDate', label: '見積日', group: '見積ヘッダー' },
  { sourceKey: 'phase', label: '見積フェーズ', group: '見積ヘッダー' },
  { sourceKey: 'itemType', label: '登録区分', group: '明細分類' },
  { sourceKey: 'category', label: 'Category', targetKey: 'category', group: '明細分類' },
  { sourceKey: 'largeClass', label: '大分類', targetKey: 'largeClass', group: '明細分類' },
  { sourceKey: 'middleClass', label: '中分類', targetKey: 'mediumClass', group: '明細分類' },
  { sourceKey: 'itemName', label: '個体管理品目', targetKey: 'item', group: '明細分類' },
  { sourceKey: 'manufacturer', label: 'メーカー', targetKey: 'maker', group: '明細分類' },
  { sourceKey: 'model', label: '型式', targetKey: 'model', group: '明細分類' },
  { sourceKey: 'listPriceUnit', label: '定価単価', group: '価格情報（原本）' },
  { sourceKey: 'listPriceTotal', label: '定価金額', group: '価格情報（原本）' },
  { sourceKey: 'purchasePriceUnit', label: '購入単価', group: '価格情報（原本）' },
  { sourceKey: 'purchasePriceTotal', label: '購入金額', group: '価格情報（原本）' },
  { sourceKey: 'allocListPriceUnit', label: '按分定価単価', group: '価格情報（按分）' },
  { sourceKey: 'allocListPriceTotal', label: '按分定価金額', group: '価格情報（按分）' },
  { sourceKey: 'allocPriceUnit', label: '按分単価（税別）', group: '価格情報（按分）' },
  { sourceKey: 'allocDiscount', label: '値引率', group: '価格情報（按分）' },
  { sourceKey: 'allocTaxRate', label: '消費税率', group: '価格情報（按分）' },
  { sourceKey: 'allocTaxTotal', label: '税込金額', targetKey: 'rfqAmount', group: '価格情報（按分）' },
  { sourceKey: 'accountTitle', label: '勘定科目', group: '会計' },
  { sourceKey: 'rfqNo', label: '見積依頼No.', targetKey: 'rfqNo', group: '見積依頼' },
];

const COPY_SOURCE_COLUMNS: Record<Exclude<DataSource, '見積DB'>, SourceColumn[]> = {
  '資産Master': ASSET_MASTER_COLUMNS,
  '業者Master': VENDOR_MASTER_COLUMNS,
  '原本リスト': ORIGINAL_LIST_COLUMNS,
};

// ============================
// ユーティリティ
// ============================

function groupColumns(columns: SourceColumn[]) {
  const map = new Map<string, SourceColumn[]>();
  for (const col of columns) {
    if (!map.has(col.group)) map.set(col.group, []);
    map.get(col.group)!.push(col);
  }
  return Array.from(map.entries()).map(([group, cols]) => ({ group, cols }));
}

// 見積明細の表示用レコード
interface QuotationDisplayRecord {
  id: string;
  qi: ReceivedQuotationItem;
  qg: ReceivedQuotationGroup | undefined;
  displayLabel: string;
  displaySub: string;
  displayPrice: string;
  raw: Record<string, unknown>;
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
  rfqGroups,
  onExecute,
  onAddNewAssets,
}) => {
  const [dataSource, setDataSource] = useState<DataSource | ''>('');

  // === コピーモード（資産/業者/原本）の状態 ===
  const [linkKey, setLinkKey] = useState<LinkKey | ''>('');
  const [checkedColumns, setCheckedColumns] = useState<Set<string>>(new Set());
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ matched: number; unmatched: number; added: number } | null>(null);

  // === 見積DB紐付けモードの状態 ===
  const [protectHearing, setProtectHearing] = useState(true);
  const [pairings, setPairings] = useState<Map<number, string>>(new Map()); // assetNo -> quotationItemId
  const [activeLeftNo, setActiveLeftNo] = useState<number | null>(null);
  const [qSearch, setQSearch] = useState('');
  const [qCheckedColumns, setQCheckedColumns] = useState<Set<string>>(new Set());
  const [addTargets, setAddTargets] = useState<Set<string>>(new Set()); // 新規追加する見積明細ID
  const [inheritSourceNo, setInheritSourceNo] = useState<number | null>(null); // ヒアリング引き継ぎ元

  // データソース変更時リセット
  const handleDataSourceChange = useCallback((source: DataSource | '') => {
    setDataSource(source);
    setCheckedColumns(new Set());
    setQCheckedColumns(new Set());
    setResult(null);
    setPairings(new Map());
    setActiveLeftNo(null);
    setQSearch('');
    setAddTargets(new Set());
    setInheritSourceNo(null);
    if (source && source !== '見積DB') {
      const keys = SOURCE_AVAILABLE_KEYS[source];
      setLinkKey(keys.length === 1 ? keys[0] : '');
    } else {
      setLinkKey('');
    }
  }, []);

  const isQuotationMode = dataSource === '見積DB';

  // ============================
  // コピーモード用（資産/業者/原本）
  // ============================

  const copyGroups = useMemo(() => {
    if (!dataSource || isQuotationMode) return [];
    return groupColumns(COPY_SOURCE_COLUMNS[dataSource as Exclude<DataSource, '見積DB'>]);
  }, [dataSource, isQuotationMode]);

  const copyLinkableKeys = useMemo(() => {
    if (!dataSource || isQuotationMode) return new Set<string>();
    return new Set(COPY_SOURCE_COLUMNS[dataSource as Exclude<DataSource, '見積DB'>].filter(c => c.targetKey).map(c => c.sourceKey));
  }, [dataSource, isQuotationMode]);

  // ============================
  // 見積DB用
  // ============================

  // 選択レコードに紐づくRFQグループのrfqNoを取得
  const relatedRfqNos = useMemo(() => {
    const nos = new Set<string>();
    for (const asset of selectedAssets) {
      if (asset.rfqNo) nos.add(asset.rfqNo);
    }
    return nos;
  }, [selectedAssets]);

  // RFQグループでフィルタした見積明細
  const filteredQuotationRecords: QuotationDisplayRecord[] = useMemo(() => {
    if (!isQuotationMode) return [];
    // rfqNoで紐づく見積明細を取得
    const relevantGroupIds = new Set<number>();
    for (const qg of quotationGroups) {
      if (qg.rfqNo && relatedRfqNos.has(qg.rfqNo)) {
        relevantGroupIds.add(qg.id);
      }
    }
    // 紐づくグループがなければ全件表示
    const items = relevantGroupIds.size > 0
      ? quotationItems.filter(qi => relevantGroupIds.has(qi.quotationGroupId))
      : quotationItems;

    return items.map(qi => {
      const qg = quotationGroups.find(g => g.id === qi.quotationGroupId);
      const price = qi.allocTaxTotal ?? qi.purchasePriceTotal ?? qi.listPriceTotal;
      return {
        id: String(qi.id),
        qi,
        qg,
        displayLabel: `${qi.itemName || qi.originalItemName || '-'} / ${qi.manufacturer || '-'}`,
        displaySub: `${qi.model || '-'} [${qg?.vendorName || '-'}]`,
        displayPrice: price != null ? `¥${price.toLocaleString()}` : '-',
        raw: {
          ...qi,
          vendorName: qg?.vendorName,
          receivedQuotationNo: qg?.receivedQuotationNo,
          quotationDate: qg?.quotationDate,
          phase: qg?.phase,
        } as unknown as Record<string, unknown>,
      };
    });
  }, [isQuotationMode, quotationItems, quotationGroups, relatedRfqNos]);

  // 検索フィルタ済み
  const searchedQuotationRecords = useMemo(() => {
    if (!qSearch) return filteredQuotationRecords;
    const q = qSearch.toLowerCase();
    return filteredQuotationRecords.filter(r =>
      r.displayLabel.toLowerCase().includes(q) ||
      r.displaySub.toLowerCase().includes(q)
    );
  }, [filteredQuotationRecords, qSearch]);

  // 紐付け済みの見積明細IDセット
  const pairedQIds = useMemo(() => new Set(pairings.values()), [pairings]);

  // 未紐付けの見積明細
  const unpairedQuotationRecords = useMemo(() => {
    return filteredQuotationRecords.filter(r => !pairedQIds.has(r.id));
  }, [filteredQuotationRecords, pairedQIds]);

  // 見積DBカラムグループ
  const quotationColumnGroups = useMemo(() => groupColumns(QUOTATION_DB_COLUMNS), []);
  const quotationLinkableKeys = useMemo(() =>
    new Set(QUOTATION_DB_COLUMNS.filter(c => c.targetKey).map(c => c.sourceKey)), []);

  // ============================
  // 共通カラム操作
  // ============================

  const activeColumns = isQuotationMode ? qCheckedColumns : checkedColumns;
  const setActiveColumns = isQuotationMode ? setQCheckedColumns : setCheckedColumns;
  const activeGroups = isQuotationMode ? quotationColumnGroups : copyGroups;
  const activeLinkableKeys = isQuotationMode ? quotationLinkableKeys : copyLinkableKeys;

  const handleSelectAll = useCallback(() => {
    setActiveColumns(new Set(activeLinkableKeys));
  }, [activeLinkableKeys, setActiveColumns]);

  const handleDeselectAll = useCallback(() => {
    setActiveColumns(new Set());
  }, [setActiveColumns]);

  const handleToggleGroup = useCallback((groupName: string) => {
    const group = activeGroups.find(g => g.group === groupName);
    if (!group) return;
    const linkableCols = group.cols.filter(c => c.targetKey);
    if (linkableCols.length === 0) return;

    const allChecked = linkableCols.every(c => activeColumns.has(c.sourceKey));
    const next = new Set(activeColumns);
    if (allChecked) {
      linkableCols.forEach(c => next.delete(c.sourceKey));
    } else {
      linkableCols.forEach(c => next.add(c.sourceKey));
    }
    setActiveColumns(next);
  }, [activeGroups, activeColumns, setActiveColumns]);

  const handleToggleColumn = useCallback((sourceKey: string) => {
    setActiveColumns(prev => {
      const next = new Set(prev);
      if (next.has(sourceKey)) next.delete(sourceKey);
      else next.add(sourceKey);
      return next;
    });
  }, [setActiveColumns]);

  // グループごとのチェック数
  const groupCheckedCounts = useMemo(() => {
    const counts: Record<string, { checked: number; total: number }> = {};
    for (const { group, cols } of activeGroups) {
      const linkable = cols.filter(c => c.targetKey);
      counts[group] = {
        checked: linkable.filter(c => activeColumns.has(c.sourceKey)).length,
        total: linkable.length,
      };
    }
    return counts;
  }, [activeGroups, activeColumns]);

  // ============================
  // コピー実行（資産/業者/原本）
  // ============================
  const handleCopyExecute = useCallback(() => {
    if (!dataSource || isQuotationMode || !linkKey || checkedColumns.size === 0) return;

    setExecuting(true);
    setResult(null);

    const columns = COPY_SOURCE_COLUMNS[dataSource as Exclude<DataSource, '見積DB'>];
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
      }

      if (found && Object.keys(patch).length > 0) {
        updates.set(asset.no, patch);
        matched++;
      } else {
        unmatched++;
      }
    }

    onExecute(updates);
    setResult({ matched, unmatched, added: 0 });
    setExecuting(false);
  }, [dataSource, isQuotationMode, linkKey, checkedColumns, selectedAssets, assetMasters, vendors, baseAssets, onExecute]);

  // ============================
  // 見積DB紐付け実行
  // ============================
  const handleQuotationExecute = useCallback(() => {
    if (pairings.size === 0 && addTargets.size === 0) return;

    setExecuting(true);
    setResult(null);

    const fieldMapping = new Map<string, string>();
    for (const col of QUOTATION_DB_COLUMNS) {
      if (qCheckedColumns.has(col.sourceKey) && col.targetKey) {
        fieldMapping.set(col.sourceKey, col.targetKey);
      }
    }

    // 1. 紐付け済みレコードの更新
    const updates = new Map<number, Partial<Asset>>();
    let matched = 0;

    for (const [assetNo, qId] of pairings) {
      const asset = selectedAssets.find(a => a.no === assetNo);
      const qRec = filteredQuotationRecords.find(r => r.id === qId);
      if (!asset || !qRec) continue;

      const patch: Partial<Asset> = {};
      for (const [srcKey, tgtKey] of fieldMapping) {
        if (protectHearing && HEARING_PROTECTED_FIELDS.includes(tgtKey)) {
          const existing = (asset as unknown as Record<string, unknown>)[tgtKey];
          if (existing !== undefined && existing !== null && existing !== '') continue;
        }
        const val = qRec.raw[srcKey];
        if (val !== undefined) {
          (patch as unknown as Record<string, unknown>)[tgtKey] = val;
        }
      }

      if (Object.keys(patch).length > 0) {
        updates.set(assetNo, patch);
        matched++;
      }
    }

    if (updates.size > 0) {
      onExecute(updates);
    }

    // 2. 新規行追加
    const newAssets: Asset[] = [];
    if (addTargets.size > 0) {
      const maxNo = Math.max(...selectedAssets.map(a => a.no), 0);
      const inheritAsset = inheritSourceNo ? selectedAssets.find(a => a.no === inheritSourceNo) : null;
      let idx = 0;

      for (const qId of addTargets) {
        const qRec = filteredQuotationRecords.find(r => r.id === qId);
        if (!qRec) continue;

        const newAsset: Asset = {
          no: maxNo + 1 + idx,
          qrCode: '',
          assetNo: '',
          managementNo: '',
          serialNumber: '',
          item: '',
          maker: '',
          model: '',
          purchaseCategory: '新規',
          sourceType: 'added',
          // ヒアリング引き継ぎ
          newBuilding: inheritAsset?.newBuilding || '',
          newFloor: inheritAsset?.newFloor || '',
          newDepartment: inheritAsset?.newDepartment || '',
          newSection: inheritAsset?.newSection || '',
          newRoomName: inheritAsset?.newRoomName || '',
          executionFiscalYear: inheritAsset?.executionFiscalYear || '',
          comment: '',
        } as Asset;

        // 見積明細のカラムを転記
        for (const [srcKey, tgtKey] of fieldMapping) {
          const val = qRec.raw[srcKey];
          if (val !== undefined) {
            (newAsset as unknown as Record<string, unknown>)[tgtKey] = val;
          }
        }

        newAssets.push(newAsset);
        idx++;
      }

      if (newAssets.length > 0) {
        onAddNewAssets(newAssets);
      }
    }

    setResult({ matched, unmatched: selectedAssets.length - matched, added: newAssets.length });
    setExecuting(false);
  }, [pairings, addTargets, qCheckedColumns, selectedAssets, filteredQuotationRecords, protectHearing, onExecute, onAddNewAssets, inheritSourceNo]);

  if (!isOpen) return null;

  const canCopyExecute = dataSource && !isQuotationMode && linkKey && checkedColumns.size > 0 && !executing;
  const canQuotationExecute = (pairings.size > 0 || addTargets.size > 0) && qCheckedColumns.size > 0 && !executing;

  // ============================
  // カラム選択パネル（共通）
  // ============================
  const renderColumnSelector = (groups: { group: string; cols: SourceColumn[] }[], checked: Set<string>, linkable: Set<string>) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {groups.map(({ group, cols }) => {
        const counts = groupCheckedCounts[group];
        if (!counts) return null;
        const linkableCols = cols.filter(c => c.targetKey);
        const hasLinkable = linkableCols.length > 0;
        const allChecked = hasLinkable && linkableCols.every(c => checked.has(c.sourceKey));

        return (
          <div key={group} style={{ border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
            <div
              onClick={() => hasLinkable && handleToggleGroup(group)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px',
                background: allChecked ? '#eaf7ed' : hasLinkable ? '#fafafa' : '#f5f5f5',
                cursor: hasLinkable ? 'pointer' : 'default',
                borderBottom: '1px solid #e0e0e0',
                userSelect: 'none',
              }}
            >
              <input type="checkbox" checked={allChecked} disabled={!hasLinkable}
                onChange={() => handleToggleGroup(group)} onClick={(e) => e.stopPropagation()}
                style={{ width: 16, height: 16, accentColor: '#27ae60' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{group}</span>
              <span style={{ fontSize: 12, color: counts.checked > 0 ? '#27ae60' : '#999', fontWeight: counts.checked > 0 ? 600 : 400 }}>
                ({counts.checked}/{counts.total})
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', padding: '6px 14px' }}>
              {cols.map(col => {
                const isLinkable = Boolean(col.targetKey);
                const isChecked = checked.has(col.sourceKey);
                return (
                  <label key={col.sourceKey} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                    minWidth: '33%', cursor: isLinkable ? 'pointer' : 'default',
                    opacity: isLinkable ? 1 : 0.4,
                    background: isChecked ? '#eaf7ed' : 'transparent', borderRadius: 4,
                    fontSize: 13,
                  }}>
                    <input type="checkbox" checked={isChecked} disabled={!isLinkable}
                      onChange={() => handleToggleColumn(col.sourceKey)}
                      style={{ width: 14, height: 14, accentColor: '#27ae60' }} />
                    {col.label}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ============================
  // 完了画面
  // ============================
  if (result) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
        <div style={{ background: 'white', borderRadius: 12, width: '90%', maxWidth: 540, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ background: '#8e44ad', color: 'white', padding: '16px 24px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Data Link</h2>
            <button onClick={onClose} aria-label="閉じる" style={{ background: 'transparent', border: 'none', color: 'white', fontSize: 22, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>&times;</button>
          </div>
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
              background: result.matched > 0 || result.added > 0 ? '#27ae60' : '#f39c12',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 32, color: 'white' }}>{result.matched > 0 || result.added > 0 ? '\u2713' : '!'}</span>
            </div>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
              {isQuotationMode ? '見積データの適用が完了しました' : 'カラムコピーが完了しました'}
            </h3>
            <div style={{ width: '100%', maxWidth: 360, margin: '0 auto', border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', textAlign: 'left' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: '#555' }}>更新件数</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#27ae60', fontVariantNumeric: 'tabular-nums' }}>{result.matched}件</span>
              </div>
              {result.unmatched > 0 && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#555' }}>未マッチ</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#e67e22', fontVariantNumeric: 'tabular-nums' }}>{result.unmatched}件</span>
                </div>
              )}
              {result.added > 0 && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#555' }}>新規追加</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1565c0', fontVariantNumeric: 'tabular-nums' }}>{result.added}件</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <button onClick={() => setResult(null)} style={{
              padding: '10px 24px', fontSize: 14, fontWeight: 600,
              background: 'transparent', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', color: '#666',
            }}>続けて操作</button>
            <button onClick={onClose} style={{
              padding: '10px 28px', fontSize: 14, fontWeight: 700,
              background: '#8e44ad', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer',
            }}>閉じる</button>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // メインUI
  // ============================
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{
        background: 'white', borderRadius: 12,
        width: isQuotationMode ? '95%' : '90%',
        maxWidth: isQuotationMode ? 1100 : 800,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* ヘッダー */}
        <div style={{
          background: '#8e44ad', color: 'white', padding: '16px 24px',
          borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Data Link</h2>
          <button onClick={onClose} aria-label="閉じる" style={{
            background: 'transparent', border: 'none', color: 'white',
            fontSize: 22, cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
          }}>&times;</button>
        </div>

        {/* データソース選択 */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0', background: '#f8f9fa', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>Data Link</label>
            <select value={dataSource} onChange={(e) => handleDataSourceChange(e.target.value as DataSource | '')} style={{
              padding: '6px 12px', fontSize: 13, border: '2px solid #8e44ad', borderRadius: 4, minWidth: 160, fontWeight: 600,
            }}>
              <option value="">選択してください</option>
              <option value="資産Master">資産Master</option>
              <option value="業者Master">業者Master</option>
              <option value="原本リスト">原本リスト</option>
              <option value="見積DB">見積DB</option>
            </select>
          </div>
          {/* コピーモード: 紐づけキー */}
          {dataSource && !isQuotationMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>紐づけキー</label>
              <select value={linkKey} onChange={(e) => setLinkKey(e.target.value as LinkKey | '')} style={{
                padding: '6px 12px', fontSize: 13, border: '2px solid #8e44ad', borderRadius: 4, minWidth: 160, fontWeight: 600,
              }}>
                <option value="">選択してください</option>
                {SOURCE_AVAILABLE_KEYS[dataSource as Exclude<DataSource, '見積DB'>].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#555' }}>
            対象: <strong>{selectedAssets.length}件</strong>
          </div>
        </div>

        {/* コンテンツ */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {!dataSource ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#999', fontSize: 14 }}>
              Data Linkを選択してください
            </div>
          ) : isQuotationMode ? (
            /* ============================
               見積DB: 手動紐付けモード
               ============================ */
            <>
              {/* ヒアリング保護 */}
              <div style={{
                padding: '12px 16px', marginBottom: 16,
                background: protectHearing ? '#fff8e1' : '#f8f9fa',
                border: `1px solid ${protectHearing ? '#f39c12' : '#e0e0e0'}`,
                borderRadius: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
                  <input type="checkbox" checked={protectHearing} onChange={(e) => setProtectHearing(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#f39c12' }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>ヒアリング結果を保護</span>
                </label>
                <div style={{ fontSize: 12, color: '#777', lineHeight: 1.6 }}>
                  保護対象: 新設置先(棟/階/部門/部署/室名)、実施年度、購入区分、コメント、品目、メーカー、型式、分類<br />
                  既に値が入力済みのカラムは見積データで上書きしません
                </div>
              </div>

              {/* 紐付けステータス */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>手動紐付け</span>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#555' }}>
                  <span>紐付け済み: <strong style={{ fontVariantNumeric: 'tabular-nums', color: '#27ae60' }}>{pairings.size}</strong> / {selectedAssets.length}</span>
                  {relatedRfqNos.size > 0 && (
                    <span style={{ color: '#888' }}>RFQ: {Array.from(relatedRfqNos).join(', ')}</span>
                  )}
                </div>
              </div>

              {/* 紐付けパネル: 左右 */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, minHeight: 220 }}>
                {/* 左: 編集リストレコード */}
                <div style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '8px 12px', background: '#e3f2fd', borderBottom: '1px solid #e0e0e0', fontSize: 13, fontWeight: 700, color: '#1565c0' }}>
                    編集リスト（{selectedAssets.length}件）
                  </div>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    {selectedAssets.map(asset => {
                      const isPaired = pairings.has(asset.no);
                      const isActive = activeLeftNo === asset.no;
                      const pairedRec = isPaired ? filteredQuotationRecords.find(r => r.id === pairings.get(asset.no)) : null;
                      const hasHearing = Boolean(asset.newRoomName || asset.newBuilding || asset.comment);
                      return (
                        <div
                          key={asset.no}
                          onClick={() => setActiveLeftNo(isActive ? null : asset.no)}
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            background: isActive ? '#bbdefb' : isPaired ? '#e8f5e9' : 'white',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                                No.{asset.no} {asset.item || '-'} / {asset.maker || '-'}
                              </div>
                              <div style={{ fontSize: 11, color: '#888' }}>
                                {asset.model || '-'}
                              </div>
                              {hasHearing && (
                                <div style={{ fontSize: 11, color: '#f39c12', marginTop: 2 }}>
                                  {[asset.newRoomName, asset.newFloor, asset.newBuilding].filter(Boolean).join(' ')}
                                  {asset.comment && ` / ${asset.comment}`}
                                </div>
                              )}
                            </div>
                            {isPaired && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPairings(prev => { const next = new Map(prev); next.delete(asset.no); return next; });
                                }}
                                aria-label="紐付け解除"
                                style={{
                                  padding: '2px 6px', fontSize: 11, fontWeight: 700, flexShrink: 0,
                                  background: '#e74c3c', color: 'white', border: 'none',
                                  borderRadius: 4, cursor: 'pointer', lineHeight: 1.2,
                                }}
                              >&times;</button>
                            )}
                          </div>
                          {isPaired && pairedRec && (
                            <div style={{ fontSize: 11, color: '#27ae60', marginTop: 4, paddingLeft: 12, borderLeft: '2px solid #27ae60' }}>
                              &rarr; {pairedRec.displayLabel} / {pairedRec.qi.model || '-'} {pairedRec.displayPrice}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 右: 見積明細 */}
                <div style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '8px 12px', background: '#fce4ec', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#c62828' }}>見積明細（{filteredQuotationRecords.length}件）</span>
                    <input
                      type="text"
                      placeholder="検索..."
                      value={qSearch}
                      onChange={(e) => setQSearch(e.target.value)}
                      style={{ flex: 1, padding: '4px 8px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4 }}
                    />
                  </div>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    {activeLeftNo === null ? (
                      <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 13 }}>
                        左のレコードを選択してから、右の見積明細をクリックして紐付けます
                      </div>
                    ) : (
                      searchedQuotationRecords.map(rec => {
                        const isPaired = pairedQIds.has(rec.id);
                        return (
                          <div
                            key={rec.id}
                            onClick={() => {
                              if (activeLeftNo === null) return;
                              setPairings(prev => {
                                const next = new Map(prev);
                                next.set(activeLeftNo, rec.id);
                                return next;
                              });
                              const nextUnpaired = selectedAssets.find(a => a.no !== activeLeftNo && !pairings.has(a.no));
                              setActiveLeftNo(nextUnpaired?.no ?? null);
                            }}
                            style={{
                              padding: '8px 12px',
                              borderBottom: '1px solid #f0f0f0',
                              cursor: 'pointer',
                              background: isPaired ? '#f3e5f5' : 'white',
                              opacity: isPaired ? 0.5 : 1,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{rec.displayLabel}</div>
                                <div style={{ fontSize: 11, color: '#888' }}>{rec.displaySub}</div>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#333', flexShrink: 0 }}>
                                {rec.displayPrice}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* 未紐付けの見積明細 → 新規行追加 */}
              {unpairedQuotationRecords.length > 0 && (
                <div style={{ marginBottom: 16, border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 14px', background: '#fff3e0', borderBottom: '1px solid #e0e0e0', fontSize: 13, fontWeight: 700, color: '#e65100' }}>
                    未紐付けの見積明細（{unpairedQuotationRecords.length}件）
                  </div>
                  <div>
                    {unpairedQuotationRecords.map(rec => {
                      const isAdding = addTargets.has(rec.id);
                      return (
                        <div key={rec.id} style={{
                          padding: '8px 14px', borderBottom: '1px solid #f0f0f0',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: isAdding ? '#e8f5e9' : 'white',
                        }}>
                          <div>
                            <div style={{ fontSize: 13, color: '#333' }}>{rec.displayLabel}</div>
                            <div style={{ fontSize: 11, color: '#888' }}>{rec.displaySub} {rec.displayPrice}</div>
                          </div>
                          <button
                            onClick={() => {
                              setAddTargets(prev => {
                                const next = new Set(prev);
                                if (next.has(rec.id)) next.delete(rec.id);
                                else next.add(rec.id);
                                return next;
                              });
                            }}
                            style={{
                              padding: '4px 12px', fontSize: 12, fontWeight: 600,
                              background: isAdding ? '#e74c3c' : '#1565c0',
                              color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isAdding ? '追加取消' : '新規行として追加'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {/* ヒアリング引き継ぎ元 */}
                  {addTargets.size > 0 && (
                    <div style={{ padding: '8px 14px', background: '#fff8e1', borderTop: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span style={{ color: '#666' }}>ヒアリング情報の引き継ぎ元:</span>
                      <select
                        value={inheritSourceNo ?? ''}
                        onChange={(e) => setInheritSourceNo(e.target.value ? Number(e.target.value) : null)}
                        style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4 }}
                      >
                        <option value="">引き継がない</option>
                        {selectedAssets.map(a => (
                          <option key={a.no} value={a.no}>
                            No.{a.no} {a.item || '-'} {a.newRoomName ? `(${a.newRoomName})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* 転記カラム選択 */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>転記カラム選択</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleSelectAll} style={{
                      padding: '4px 10px', fontSize: 12, fontWeight: 600,
                      background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer',
                    }}>全て選択</button>
                    <button onClick={handleDeselectAll} style={{
                      padding: '4px 10px', fontSize: 12, fontWeight: 600,
                      background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer',
                    }}>全て解除</button>
                  </div>
                </div>
                {renderColumnSelector(quotationColumnGroups, qCheckedColumns, quotationLinkableKeys)}
              </div>
            </>
          ) : (
            /* ============================
               コピーモード（資産/業者/原本）
               ============================ */
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSelectAll} style={{
                    padding: '6px 14px', fontSize: 13, fontWeight: 600,
                    background: dataSource ? '#27ae60' : '#ccc', color: 'white',
                    border: 'none', borderRadius: 4, cursor: dataSource ? 'pointer' : 'default',
                  }}>全て選択</button>
                  <button onClick={handleDeselectAll} style={{
                    padding: '6px 14px', fontSize: 13, fontWeight: 600,
                    background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer',
                  }}>全て解除</button>
                </div>
                <div style={{ padding: '8px 12px', background: '#f8f9fa', borderRadius: 4, fontSize: 13, color: '#555' }}>
                  対象レコード: <strong>{selectedAssets.length}件</strong>
                  {!linkKey && <span style={{ marginLeft: 12, color: '#999' }}>紐づけキーを選択してください</span>}
                </div>
              </div>
              {renderColumnSelector(copyGroups, checkedColumns, copyLinkableKeys)}
            </>
          )}
        </div>

        {/* フッター */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{
            padding: '10px 24px', fontSize: 14, fontWeight: 600,
            background: 'transparent', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', color: '#666',
          }}>閉じる</button>
          {isQuotationMode ? (
            <button onClick={handleQuotationExecute} disabled={!canQuotationExecute} style={{
              padding: '10px 28px', fontSize: 14, fontWeight: 700,
              background: canQuotationExecute ? '#f39c12' : '#ccc',
              color: canQuotationExecute ? '#333' : '#999',
              border: 'none', borderRadius: 6, cursor: canQuotationExecute ? 'pointer' : 'default', minWidth: 160,
            }}>
              {executing ? '適用中...' : `適用する（${pairings.size}件更新${addTargets.size > 0 ? ` + ${addTargets.size}件追加` : ''}）`}
            </button>
          ) : (
            <button onClick={handleCopyExecute} disabled={!canCopyExecute} style={{
              padding: '10px 28px', fontSize: 14, fontWeight: 700,
              background: canCopyExecute ? '#8e44ad' : '#ccc',
              color: canCopyExecute ? 'white' : '#999',
              border: 'none', borderRadius: 6, cursor: canCopyExecute ? 'pointer' : 'default', minWidth: 140,
            }}>{executing ? '実行中...' : 'コピー実行'}</button>
          )}
        </div>
      </div>
    </div>
  );
};
