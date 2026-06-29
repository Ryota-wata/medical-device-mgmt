'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMaintenanceContractStore } from '@/lib/stores';
import { ContractReviewModal } from './ContractReviewModal';
import { EmptyState } from '@/components/ui/EmptyState';

// 契約種別
type ContractType = '保守契約' | '定期点検' | 'スポット契約' | '借用契約' | 'その他';

// 進行ステップ
type MaintenanceStep = 1 | 2 | 3 | 4 | 'completed';

// 保守契約データ型（契約グループ単位）
interface MaintenanceContract {
  id: string;
  applicationNo: string;
  contractGroupName: string;
  contractType: ContractType;
  contractTypeNote: string;
  contractDate: string;
  contractStartDate: string;
  contractEndDate: string;
  contractAmount: number;
  annualAmount: number;
  contractorName: string;
  contractorPerson: string;
  contractorPhone: string;
  comment: string;
  currentStep: MaintenanceStep;
  reviewStartDate?: string;
}

// 個体管理品目データ型
interface ContractGroupAsset {
  id: number;
  managementDept: string;
  installDept: string;
  qrLabel: string;
  itemName: string;
  maker: string;
  model: string;
  // 点検情報（編集可能）
  inspectionGroupName: string;
  inspectionType: string;
  inspectionCycle: string;
  partsExemption: boolean;
  exemptionAmount: string;
  onCall: boolean;
  remote: boolean;
  legalInspection: boolean;
  legalInspectionBasis: string;
  comment: string;
  // REQ-101: 機器毎の概算保守金額 (任意・会計非連動)
  estimatedMaintenanceCost: string;
}

// ステータス表示の算出結果
interface StatusDisplay {
  label: string;
  color: string;
  fontWeight?: string;
  sortValue: number;
}

interface MaintenanceContractsTabProps {
  isMobile?: boolean;
}

// ステータス算出ロジック (API設計準拠: 契約終了日基準。6ヶ月以内を「契約更新 Nヶ月前」)
const calcStatus = (contract: MaintenanceContract): StatusDisplay => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (contract.contractEndDate) {
    const contractEnd = new Date(contract.contractEndDate);
    contractEnd.setHours(0, 0, 0, 0);
    const diffMs = contractEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.ceil(diffDays / 30);

    if (diffMonths <= 6) {
      return {
        label: `契約更新 ${diffMonths}ヶ月前`,
        color: diffMonths <= 2 ? '#DA0000' : '#4A4A4A',
        fontWeight: diffMonths <= 2 ? 'bold' : 'normal',
        sortValue: diffDays,
      };
    }
  }

  return { label: '-', color: '#8A8A8A', sortValue: 9999 };
};

// モック契約データ
const MOCK_CONTRACTS: MaintenanceContract[] = [
  {
    id: '1',
    applicationNo: 'MC-2026-001',
    contractGroupName: 'CT装置保守契約',
    contractType: '保守契約',
    contractTypeNote: 'フルメンテナンス',
    contractDate: '2025-04-01',
    contractStartDate: '2025-04-01',
    contractEndDate: '2026-03-31',
    contractAmount: 3500000,
    annualAmount: 3500000,
    contractorName: 'シーメンスヘルスケア',
    contractorPerson: '田中太郎',
    contractorPhone: '03-1234-5678',
    comment: '',
    currentStep: 1,
  },
  {
    id: '2',
    applicationNo: 'MC-2026-002',
    contractGroupName: '超音波診断装置 定期点検',
    contractType: '定期点検',
    contractTypeNote: '年2回実施',
    contractDate: '2025-06-01',
    contractStartDate: '2025-06-01',
    contractEndDate: '2027-05-31',
    contractAmount: 960000,
    annualAmount: 480000,
    contractorName: 'GEヘルスケアジャパン',
    contractorPerson: '佐藤花子',
    contractorPhone: '03-9876-5432',
    comment: '次回点検: 2026年4月',
    currentStep: 2,
  },
  {
    id: '3',
    applicationNo: 'MC-2026-003',
    contractGroupName: '電気手術器 スポット',
    contractType: 'スポット契約',
    contractTypeNote: '',
    contractDate: '2026-01-15',
    contractStartDate: '2026-01-15',
    contractEndDate: '2026-07-14',
    contractAmount: 500000,
    annualAmount: 1000000,
    contractorName: 'オリンパスメディカルサービス',
    contractorPerson: '鈴木一郎',
    contractorPhone: '03-5555-1234',
    comment: '',
    currentStep: 3,
  },
  {
    id: '4',
    applicationNo: 'MC-2026-004',
    contractGroupName: '透析装置保守契約2024',
    contractType: '保守契約',
    contractTypeNote: 'パーツ保証付',
    contractDate: '2024-04-01',
    contractStartDate: '2024-04-01',
    contractEndDate: '2026-03-31',
    contractAmount: 1200000,
    annualAmount: 600000,
    contractorName: '日機装',
    contractorPerson: '高橋次郎',
    contractorPhone: '03-3333-4444',
    comment: '契約更新要検討',
    currentStep: 4,
  },
  {
    id: '5',
    applicationNo: 'MC-2026-005',
    contractGroupName: 'MRI装置 借用契約',
    contractType: '借用契約',
    contractTypeNote: 'デモ機借用',
    contractDate: '2026-02-01',
    contractStartDate: '2026-02-01',
    contractEndDate: '2026-08-31',
    contractAmount: 0,
    annualAmount: 0,
    contractorName: 'フィリップスジャパン',
    contractorPerson: '中村三郎',
    contractorPhone: '03-2222-3333',
    comment: '',
    currentStep: 'completed',
  },
  {
    id: '6',
    applicationNo: 'MC-2026-006',
    contractGroupName: 'エレベーター保守',
    contractType: 'その他',
    contractTypeNote: '建物設備',
    contractDate: '2025-04-01',
    contractStartDate: '2025-04-01',
    contractEndDate: '2028-03-31',
    contractAmount: 1440000,
    annualAmount: 480000,
    contractorName: '三菱電機ビルソリューションズ',
    contractorPerson: '加藤四郎',
    contractorPhone: '03-6666-7777',
    comment: '',
    currentStep: 1,
  },
];

// 契約グループごとの個体管理品目データは maintenanceContractStore.contractAssets に集約済み
// (両画面で共有: タスク詳細モーダル / 明細登録画面)

// テーブルスタイル (Figma 580:32040 border token #E1E1E1 統一)
const thGroupStyle: React.CSSProperties = {
  padding: '8px 6px',
  border: '1px solid #E1E1E1',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

const thSubStyle: React.CSSProperties = {
  padding: '6px 8px',
  border: '1px solid #E1E1E1',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '8px',
  border: '1px solid #E1E1E1',
  whiteSpace: 'nowrap',
  fontSize: '13px',
};

// === 契約グループ詳細モーダル ===
const ContractGroupDetailModal = ({
  isOpen,
  onClose,
  contract,
  assets,
  onContractRenewal,
}: {
  isOpen: boolean;
  onClose: () => void;
  contract: MaintenanceContract;
  assets: ContractGroupAsset[];
  onContractRenewal: (sourceContract: MaintenanceContract, sourceAssets: ContractGroupAsset[]) => void;
}) => {
  const [localAssets, setLocalAssets] = useState<ContractGroupAsset[]>(assets);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // assets が変わったら同期
  React.useEffect(() => {
    setLocalAssets(assets);
  }, [assets]);

  if (!isOpen) return null;

  // REQ-100: タスク詳細モーダルは閲覧のみ（点検情報の編集・資産追加はSTEP3明細登録へ移設）。
  // 完了レコードのみ「契約内容見直し」「契約更新」を表示 (ユーザー決定: 閲覧モーダル内に残す)。
  const isCompleted = contract.currentStep === 'completed';

  // モーダル内テーブルスタイル
  const mThGroup: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #aaa',
    fontWeight: 600,
    fontSize: '11px',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    verticalAlign: 'middle',
  };
  const mThSub: React.CSSProperties = {
    padding: '5px 6px',
    border: '1px solid #bbb',
    fontWeight: 600,
    fontSize: '11px',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  };
  const mTd: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #E1E1E1',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  };
  // ○/× 表示
  const boolDisplay = (val: boolean) => (
    <span style={{ color: val ? '#008C1D' : '#8A8A8A', fontWeight: val ? 'bold' : 'normal' }}>
      {val ? '○' : '×'}
    </span>
  );

  // 点検情報の表示 (REQ-100: 閲覧のみ。編集はSTEP3明細登録へ)
  const renderInspectionCells = (asset: ContractGroupAsset) => (
    <>
      <td style={mTd}>{asset.inspectionGroupName || '-'}</td>
      <td style={mTd}>{asset.inspectionType || '-'}</td>
      <td style={mTd}>{asset.inspectionCycle ? `${asset.inspectionCycle}ヶ月` : '-'}</td>
      <td style={{ ...mTd, textAlign: 'center' }}>{asset.partsExemption ? '有' : '-'}</td>
      <td style={mTd}>{asset.exemptionAmount || '-'}</td>
      <td style={{ ...mTd, textAlign: 'center' }}>{boolDisplay(asset.onCall)}</td>
      <td style={{ ...mTd, textAlign: 'center' }}>{boolDisplay(asset.remote)}</td>
      <td style={mTd}>{asset.comment || '-'}</td>
    </>
  );

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }}>
      <div data-element-id="mc-detail-modal" style={{
        background: 'white',
        borderRadius: '8px',
        width: '95%',
        maxWidth: '1400px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* ヘッダー */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E1E1E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h3 data-element-id="mc-detail-modal-title" style={{ margin: 0, fontSize: '15px', color: '#4A4A4A' }}>
              契約グループ詳細: {contract.contractGroupName || '未設定'}
            </h3>
          </div>
          <button
            data-element-id="mc-detail-modal-close-x"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#8A8A8A',
              padding: '4px 8px',
            }}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* テーブルコンテンツ */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          <table data-element-id="mc-detail-asset-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {/* グループヘッダー行 */}
              <tr>
                <th colSpan={2} style={{ ...mThGroup, background: '#E1E1E1', color: '#4A4A4A' }}>部署情報</th>
                <th colSpan={4} style={{ ...mThGroup, background: '#E1E1E1', color: '#4A4A4A' }}>商品情報</th>
                <th colSpan={8} style={{ ...mThGroup, background: '#FAFAFA', color: '#4A4A4A' }}>点検情報</th>
              </tr>
              {/* サブカラムヘッダー行 */}
              <tr>
                {/* 部署情報 */}
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>管理部署</th>
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>設置部署</th>
                {/* 商品情報 */}
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>QRラベル</th>
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>品目</th>
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>メーカー</th>
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>型式</th>
                {/* 点検情報 */}
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>点検グループ名</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>点検種別</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>点検周期</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>部品免責</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>免責金額</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>オンコール</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>リモート</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>コメント</th>
              </tr>
            </thead>
            <tbody>
              {localAssets.map((asset, idx) => (
                <tr key={asset.id} style={{ background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                  {/* 部署情報 */}
                  <td style={{ ...mTd, background: '#FAFAFA' }}>{asset.managementDept || '-'}</td>
                  <td style={{ ...mTd, background: '#FAFAFA' }}>{asset.installDept || '-'}</td>
                  {/* 商品情報 */}
                  <td style={{ ...mTd, background: '#FAFAFA', fontFamily: 'monospace', fontWeight: 600, color: '#087CB6' }}>{asset.qrLabel || '-'}</td>
                  <td style={{ ...mTd, background: '#FAFAFA' }}>{asset.itemName || '-'}</td>
                  <td style={{ ...mTd, background: '#FAFAFA' }}>{asset.maker || '-'}</td>
                  <td style={{ ...mTd, background: '#FAFAFA' }}>{asset.model || '-'}</td>
                  {/* 点検情報 (閲覧のみ) */}
                  {renderInspectionCells(asset)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* フッター */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #E1E1E1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* 完了レコードのみ: ③契約内容見直し(廃棄+追加) と ④契約更新(複製) */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {isCompleted && (
              <>
                <button
                  data-element-id="mc-review-btn"
                  onClick={() => setShowReviewModal(true)}
                  style={{
                    padding: '10px 20px',
                    background: '#DA0000',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  契約内容見直し
                </button>
                <button
                  data-element-id="mc-renewal-btn"
                  onClick={() => {
                    if (!confirm(`現在の契約「${contract.contractGroupName}」の部署情報・商品情報を複製して、新規の契約レコードを作成します。\n\n新レコードは見積依頼ステップから開始します。よろしいですか？`)) return;
                    onContractRenewal(contract, localAssets);
                    onClose();
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#087CB6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  契約更新
                </button>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              data-element-id="mc-detail-modal-close-btn"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#8A8A8A',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* 契約内容見直しモーダル */}
      <ContractReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        contract={{
          id: contract.id,
          contractGroupName: contract.contractGroupName,
          managementDepartment: '',
          installationDepartment: '',
          maintenanceType: contract.contractType,
          acceptanceDate: '',
          contractStartDate: contract.contractStartDate,
          contractEndDate: contract.contractEndDate,
          contractorName: contract.contractorName,
          contractorPerson: contract.contractorPerson,
          contractorEmail: '',
          contractorPhone: contract.contractorPhone,
          contractAmount: contract.contractAmount,
          status: '',
          deadlineDays: null,
          comment: contract.comment,
          category: '',
          largeClass: '',
          mediumClass: '',
          item: '',
          maker: '',
          hasRemoteMaintenance: false,
          assets: localAssets.map(a => ({
            qrLabel: a.qrLabel,
            managementDepartment: a.managementDept,
            installationDepartment: a.installDept,
            item: a.itemName,
            maker: a.maker,
            model: a.model,
            maintenanceType: a.inspectionType || '',
            acceptanceDate: '',
            contractStartDate: '',
            contractEndDate: '',
            inspectionCountPerYear: a.inspectionCycle ? Math.round(12 / Number(a.inspectionCycle)) : 0,
            partsExemption: a.partsExemption ? '有' : '無',
            onCall: a.onCall,
            hasRemote: a.remote,
            comment: a.comment,
          })),
        }}
        onSubmit={(contractId, result) => {
          alert(`契約「${contract.contractGroupName}」の見直しを登録しました\n除外資産: ${result.removedAssetQrLabels.length}件\n見直し後金額: ¥${result.newContractAmount.toLocaleString()}`);
          setShowReviewModal(false);
        }}
      />
    </div>
  );
};

export const MaintenanceContractsTab: React.FC<MaintenanceContractsTabProps> = () => {
  const router = useRouter();
  const { contracts: storeContracts, updateContract: storeUpdateContract, contractAssets: storeContractAssets, setContractAssets: storeSetContractAssets } = useMaintenanceContractStore();
  const [contracts, setContracts] = useState<MaintenanceContract[]>([]);

  // ストアのデータをローカルstateに同期
  React.useEffect(() => {
    setContracts(storeContracts as MaintenanceContract[]);
  }, [storeContracts]);

  // 契約グループ詳細モーダル
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailContract, setDetailContract] = useState<MaintenanceContract | null>(null);
  const [groupAssets, setGroupAssets] = useState<Record<string, ContractGroupAsset[]>>(storeContractAssets as Record<string, ContractGroupAsset[]>);

  React.useEffect(() => {
    setGroupAssets(storeContractAssets as Record<string, ContractGroupAsset[]>);
  }, [storeContractAssets]);

  // 一覧は API① 既定並び (申請No.昇順) をそのまま表示
  const sortedContracts = contracts;

  // 契約更新 (複製): 部署情報 + 商品情報のみ複製し、新契約タスクを生成
  const handleContractRenewal = (sourceContract: MaintenanceContract, sourceAssets: ContractGroupAsset[]) => {
    const newId = `renewal-${Date.now()}`;
    // 申請No. 採番 (MC-2026-0XX)
    const maxApplicationNo = Math.max(0, ...contracts
      .map(c => parseInt(c.applicationNo.replace(/[^0-9]/g, '').slice(-3), 10) || 0));
    const year = new Date().getFullYear();
    const newApplicationNo = `MC-${year}-${String(maxApplicationNo + 1).padStart(3, '0')}`;

    const newContract: MaintenanceContract = {
      ...sourceContract,
      id: newId,
      applicationNo: newApplicationNo,
      contractGroupName: `${sourceContract.contractGroupName}（更新）`,
      contractDate: '',
      contractStartDate: '',
      contractEndDate: '',
      contractAmount: 0,
      annualAmount: 0,
      comment: `${sourceContract.applicationNo} を複製して更新作成`,
      currentStep: 1, // 見積依頼から開始
      reviewStartDate: undefined,
    };
    // 商品情報 (部署・QR・品目・メーカー・型式) のみ複製、点検情報はクリア
    const newAssets: ContractGroupAsset[] = sourceAssets.map((a, idx) => ({
      ...a,
      id: idx + 1,
      // 点検情報はクリア
      inspectionGroupName: '',
      inspectionType: '',
      inspectionCycle: '',
      partsExemption: false,
      exemptionAmount: '',
      onCall: false,
      remote: false,
      legalInspection: false,
      legalInspectionBasis: '',
      comment: '',
      estimatedMaintenanceCost: '',
    }));
    setContracts(prev => [newContract, ...prev]);
    setGroupAssets(prev => ({ ...prev, [newId]: newAssets }));
    alert(`新規契約タスク「${newContract.contractGroupName}」(${newApplicationNo}) を作成しました。\n見積依頼ステップから開始してください。`);
  };

  // 契約グループ詳細モーダル
  const handleRowDoubleClick = (contract: MaintenanceContract) => {
    setDetailContract(contract);
    setShowDetailModal(true);
  };

  // 金額フォーマット
  const formatAmount = (amount: number) => {
    if (amount === 0) return '-';
    return amount.toLocaleString();
  };

  // 契約種別バッジ色 (Figma 580:32040 label/* tokens)
  const getContractTypeBadge = (type: ContractType) => {
    const colors: Record<ContractType, string> = {
      '保守契約': '#008C1D',      // primary light (緑)
      '定期点検': '#4E9440',      // label/仮登録 (緑)
      'スポット契約': '#F7A367',  // label/使用中 (橙)
      '借用契約': '#087CB6',      // label/依頼済 (青)
      'その他': '#8A8A8A',         // Sub (灰)
    };
    return (
      <span style={{
        padding: '3px 10px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 'bold',
        background: colors[type] || '#8A8A8A',
        color: 'white',
        whiteSpace: 'nowrap',
      }}>
        {type}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 情報バー */}
      <div data-element-id="mc-info-bar" style={{
        padding: '12px 16px',
        background: '#FAFAFA',
        borderBottom: '1px solid #E1E1E1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span data-element-id="mc-count-label" style={{ fontSize: '13px', color: '#4A4A4A' }}>
          <strong>{sortedContracts.length}件</strong>表示
        </span>
      </div>

      {/* テーブル */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table data-element-id="mc-contract-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            {/* グループヘッダー (Figma: 統一されたグレー背景、色帯なし) */}
            <tr data-element-id="mc-group-header-row" style={{ background: '#F1F1F1', color: '#4A4A4A' }}>
              <th colSpan={8} style={{ ...thGroupStyle, textAlign: 'center', background: '#F1F1F1', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約情報</th>
              <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center', background: '#F1F1F1', color: '#4A4A4A', borderColor: '#E1E1E1' }}>業者情報</th>
              <th
                data-element-id="mc-status-header"
                rowSpan={2}
                style={{ ...thGroupStyle, textAlign: 'center', background: '#F1F1F1', color: '#4A4A4A', borderColor: '#E1E1E1' }}
              >
                契約検討開始
              </th>
              <th colSpan={2} style={{ ...thGroupStyle, textAlign: 'center', background: '#F1F1F1', color: '#4A4A4A', borderColor: '#E1E1E1' }}>操作</th>
            </tr>
            {/* サブカラムヘッダー */}
            <tr data-element-id="mc-column-header-row" style={{ background: '#4A4A4A', color: 'white' }}>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>申請No.</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約グループ名</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約種別</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>種別備考</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約日</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約期間</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約金額</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>単年度金額</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約業者</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>担当者</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>連絡先</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>登録</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>フリーコメント</th>
            </tr>
          </thead>
          <tbody>
            {sortedContracts.map((contract, index) => {
              return (
                <tr
                  key={contract.id}
                  data-element-id={index === 0 ? 'mc-table-row-first' : undefined}
                  style={{ background: index % 2 === 0 ? 'white' : '#FAFAFA', verticalAlign: 'top', cursor: 'pointer' }}
                  onDoubleClick={() => handleRowDoubleClick(contract)}
                >
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>{contract.applicationNo}</td>
                  <td style={tdStyle}>{contract.contractGroupName}</td>
                  <td data-element-id={index === 0 ? 'mc-contract-type-badge-first' : undefined} style={{ ...tdStyle, textAlign: 'center' }}>{getContractTypeBadge(contract.contractType)}</td>
                  <td style={{ ...tdStyle, fontSize: '11px', color: '#555' }}>{contract.contractTypeNote || '-'}</td>
                  <td style={tdStyle} className="tabular-nums border border-stroke-input">{contract.contractDate}</td>
                  <td style={{ ...tdStyle, fontSize: '11px' }} className="tabular-nums border border-stroke-input">
                    {contract.contractStartDate && contract.contractEndDate
                      ? `${contract.contractStartDate}～${contract.contractEndDate}`
                      : '-'
                    }
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }} className="tabular-nums border border-stroke-input">{formatAmount(contract.contractAmount)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }} className="tabular-nums border border-stroke-input">{formatAmount(contract.annualAmount)}</td>
                  <td style={tdStyle}>{contract.contractorName || '-'}</td>
                  <td style={tdStyle}>{contract.contractorPerson || '-'}</td>
                  <td style={{ ...tdStyle, fontSize: '12px' }} className="tabular-nums border border-stroke-input">{contract.contractorPhone || '-'}</td>
                  <td data-element-id={index === 0 ? 'mc-status-cell-first' : undefined} style={tdStyle}>
                    {(() => {
                      const status = calcStatus(contract);
                      return (
                        <span style={{ color: status.color, fontWeight: status.fontWeight || 'normal' }}>
                          {status.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td data-element-id={index === 0 ? 'mc-register-cell-first' : undefined} style={{ ...tdStyle, textAlign: 'center' }}>
                    {(() => {
                      // 260524 統合: STEP④(完了登録)廃止。契約登録が最終ステップ
                      const stepConfig: Record<number, { label: string; color: string }> = {
                        1: { label: '見積依頼', color: '#4A4A4A' },
                        2: { label: '見積登録', color: '#4A4A4A' },
                        3: { label: '契約登録', color: '#087CB6' },
                      };
                      if (contract.currentStep === 'completed') {
                        return <span style={{ color: '#8A8A8A', fontSize: '12px' }}>完了</span>;
                      }
                      const cfg = stepConfig[contract.currentStep];
                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/maintenance-quote-registration?id=${contract.id}&step=${contract.currentStep}`); }}
                          style={{
                            padding: '6px 12px',
                            background: cfg.color,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })()}
                  </td>
                  <td data-element-id={index === 0 ? 'mc-free-comment-first' : undefined} style={{ ...tdStyle, fontSize: '11px', color: contract.comment ? '#4A4A4A' : '#bbb' }}>
                    {contract.comment || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedContracts.length === 0 && (
          <EmptyState
            title="該当する保守契約がありません"
            description="検索条件を変更するか、フィルターを見直してください"
          />
        )}
      </div>

      {/* 契約グループ詳細モーダル */}
      {detailContract && (
        <ContractGroupDetailModal
          isOpen={showDetailModal}
          onClose={() => { setShowDetailModal(false); setDetailContract(null); }}
          contract={detailContract}
          assets={groupAssets[detailContract.id] || []}
          onContractRenewal={handleContractRenewal}
        />
      )}
    </div>
  );
};
