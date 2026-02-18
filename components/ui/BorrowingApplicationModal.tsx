'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { useMasterStore } from '@/lib/stores';

interface BorrowingApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SelectedBorrowingAsset {
  item: string;
  maker: string;
  model: string;
  quantity: number;
  unit: string;
}

type CostBurdenValue = '' | 'lender' | 'borrower';

interface CostBurdens {
  installation: CostBurdenValue;
  removal: CostBurdenValue;
  maintenance: CostBurdenValue;
  consumables: CostBurdenValue;
  other: CostBurdenValue;
}

interface BorrowingPurposes {
  demo: boolean;
  clinicalTrial: boolean;
  emergency: boolean;
  accident: boolean;
  training: boolean;
  research: boolean;
  deliveryDelay: boolean;
  other: boolean;
}

// 借用申請履歴の型
interface BorrowingApplicationHistory {
  id: number;
  applicationDate: string;
  companyName: string;
  contactPerson: string;
  contactInfo: string;
  email: string;
  managementDepartment: string;
  applicantName: string;
  installationDivision: string;
  installationDepartment: string;
  installationRoom: string;
  purposes: BorrowingPurposes;
  desiredDeliveryYear: number;
  desiredDeliveryMonth: number;
  returnYear: number;
  returnMonth: number;
  casesPerMonth: string;
  assets: SelectedBorrowingAsset[];
  costBurdens: CostBurdens;
  comment: string;
}

// モック履歴データ
const MOCK_BORROWING_HISTORY: BorrowingApplicationHistory[] = [
  {
    id: 1,
    applicationDate: '2025-12-01',
    companyName: 'オリンパス株式会社',
    contactPerson: '山田 太郎',
    contactInfo: '03-1234-5678',
    email: 'yamada@olympus.co.jp',
    managementDepartment: '手術部',
    applicantName: '手術 紺太郎',
    installationDivision: '診療部門',
    installationDepartment: '手術部',
    installationRoom: '手術室A',
    purposes: {
      demo: true,
      clinicalTrial: true,
      emergency: false,
      accident: false,
      training: false,
      research: false,
      deliveryDelay: false,
      other: false,
    },
    desiredDeliveryYear: 2026,
    desiredDeliveryMonth: 1,
    returnYear: 2026,
    returnMonth: 3,
    casesPerMonth: '10',
    assets: [
      { item: '腹腔鏡', maker: 'オリンパス', model: 'OTV-S400', quantity: 1, unit: '台' },
    ],
    costBurdens: {
      installation: 'lender',
      removal: 'lender',
      maintenance: 'lender',
      consumables: 'borrower',
      other: '',
    },
    comment: '新型機種の試用評価のため',
  },
  {
    id: 2,
    applicationDate: '2025-11-15',
    companyName: 'テルモ株式会社',
    contactPerson: '鈴木 花子',
    contactInfo: '03-9876-5432',
    email: 'suzuki@terumo.co.jp',
    managementDepartment: 'MEセンター',
    applicantName: 'ME 技師',
    installationDivision: '診療部門',
    installationDepartment: '循環器内科',
    installationRoom: 'カテーテル室',
    purposes: {
      demo: false,
      clinicalTrial: false,
      emergency: false,
      accident: true,
      training: false,
      research: false,
      deliveryDelay: false,
      other: false,
    },
    desiredDeliveryYear: 2025,
    desiredDeliveryMonth: 11,
    returnYear: 2025,
    returnMonth: 12,
    casesPerMonth: '5',
    assets: [
      { item: 'IABP', maker: 'テルモ', model: 'BA-100', quantity: 1, unit: '台' },
    ],
    costBurdens: {
      installation: 'lender',
      removal: 'lender',
      maintenance: 'lender',
      consumables: 'lender',
      other: 'lender',
    },
    comment: '既存機器故障対応のため緊急貸出',
  },
  {
    id: 3,
    applicationDate: '2025-10-20',
    companyName: 'GEヘルスケア・ジャパン',
    contactPerson: '佐藤 一郎',
    contactInfo: '03-5555-1234',
    email: 'sato@ge.com',
    managementDepartment: '放射線科',
    applicantName: '放射線 技師',
    installationDivision: '診療部門',
    installationDepartment: '放射線科',
    installationRoom: 'CT室',
    purposes: {
      demo: true,
      clinicalTrial: false,
      emergency: false,
      accident: false,
      training: true,
      research: false,
      deliveryDelay: false,
      other: false,
    },
    desiredDeliveryYear: 2025,
    desiredDeliveryMonth: 11,
    returnYear: 2026,
    returnMonth: 2,
    casesPerMonth: '50',
    assets: [
      { item: 'CT装置', maker: 'GE', model: 'Revolution CT', quantity: 1, unit: '台' },
    ],
    costBurdens: {
      installation: 'lender',
      removal: 'lender',
      maintenance: 'lender',
      consumables: 'borrower',
      other: 'borrower',
    },
    comment: '新型CT装置のデモ及びスタッフ研修',
  },
];

export function BorrowingApplicationModal({
  isOpen,
  onClose,
  onSuccess,
}: BorrowingApplicationModalProps) {
  const { departments } = useMasterStore();
  const divisionOptions = [...new Set(departments.map((d) => d.division))];
  const departmentOptions = [...new Set(departments.map((d) => d.department))];

  // 履歴選択モーダルの表示状態
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // 貸出元情報
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [email, setEmail] = useState('');

  // 申請日
  const [applicationDate, setApplicationDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // 管理部署・申請者
  const [managementDepartment, setManagementDepartment] = useState('');
  const [applicantName, setApplicantName] = useState('');

  // 設置部門・設置部署・設置室名
  const [installationDivision, setInstallationDivision] = useState('');
  const [installationDepartment, setInstallationDepartment] = useState('');
  const [installationRoom, setInstallationRoom] = useState('');

  // 貸出目的
  const [purposes, setPurposes] = useState<BorrowingPurposes>({
    demo: false,
    clinicalTrial: false,
    emergency: false,
    accident: false,
    training: false,
    research: false,
    deliveryDelay: false,
    other: false,
  });

  // 希望納期・返却日・症例数
  const currentYear = new Date().getFullYear();
  const [desiredDeliveryYear, setDesiredDeliveryYear] = useState(currentYear);
  const [desiredDeliveryMonth, setDesiredDeliveryMonth] = useState(
    new Date().getMonth() + 1
  );
  const [returnYear, setReturnYear] = useState(currentYear);
  const [returnMonth, setReturnMonth] = useState(
    new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2
  );
  const [casesPerMonth, setCasesPerMonth] = useState('');

  // 選択された資産
  const [selectedAssets, setSelectedAssets] = useState<SelectedBorrowingAsset[]>([]);

  // 費用負担（ラジオボタン）
  const [costBurdens, setCostBurdens] = useState<CostBurdens>({
    installation: '',
    removal: '',
    maintenance: '',
    consumables: '',
    other: '',
  });

  // コメント
  const [comment, setComment] = useState('');

  // 添付ファイル
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // 履歴から申請内容をセット
  const handleSelectHistory = (history: BorrowingApplicationHistory) => {
    setCompanyName(history.companyName);
    setContactPerson(history.contactPerson);
    setContactInfo(history.contactInfo);
    setEmail(history.email);
    setManagementDepartment(history.managementDepartment);
    setApplicantName(history.applicantName);
    setInstallationDivision(history.installationDivision);
    setInstallationDepartment(history.installationDepartment);
    setInstallationRoom(history.installationRoom);
    setPurposes(history.purposes);
    setDesiredDeliveryYear(history.desiredDeliveryYear);
    setDesiredDeliveryMonth(history.desiredDeliveryMonth);
    setReturnYear(history.returnYear);
    setReturnMonth(history.returnMonth);
    setCasesPerMonth(history.casesPerMonth);
    setSelectedAssets(history.assets.map(a => ({ ...a })));
    setCostBurdens(history.costBurdens);
    setComment(history.comment);
    setIsHistoryModalOpen(false);
  };

  // 資産マスタからの選択を受信
  const handleAssetMessage = useCallback((event: MessageEvent) => {
    // 同一オリジンからのメッセージのみ処理
    if (event.origin !== window.location.origin) return;

    if (event.data?.type === 'ASSET_SELECTED' && event.data?.assets) {
      const receivedAssets = event.data.assets;

      // 受信した資産をモーダルのテーブル形式に変換
      const newAssets: SelectedBorrowingAsset[] = receivedAssets.map((asset: {
        item?: string;
        maker?: string;
        model?: string;
      }) => ({
        item: asset.item || '',
        maker: asset.maker || '',
        model: asset.model || '',
        quantity: 1,
        unit: '台',
      }));

      setSelectedAssets((prev) => [...prev, ...newAssets]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('message', handleAssetMessage);
      return () => {
        window.removeEventListener('message', handleAssetMessage);
      };
    }
  }, [isOpen, handleAssetMessage]);

  if (!isOpen) return null;

  const handleRemoveAsset = (index: number) => {
    setSelectedAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleSubmit = () => {
    alert('記載内容を確認します');
    onSuccess?.();
    onClose();
  };

  const handleOpenAssetMaster = () => {
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    window.open(
      `${basePath}/asset-master?mode=simple`,
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleCostBurdenChange = (
    field: keyof CostBurdens,
    value: CostBurdenValue
  ) => {
    setCostBurdens((prev) => ({ ...prev, [field]: value }));
  };

  const costBurdenItems = [
    { key: 'installation' as const, label: '1. 当該医療機器具の設置' },
    { key: 'removal' as const, label: '2. 当該医療機器具の撤去' },
    { key: 'maintenance' as const, label: '3. 貸出期間中の保守・修理費' },
    { key: 'consumables' as const, label: '4. 貸出期間中の消耗品等' },
    { key: 'other' as const, label: '5. その他費用' },
  ];

  // 目的のラベルを取得
  const getPurposeLabels = (purposes: BorrowingPurposes): string[] => {
    const labels: string[] = [];
    if (purposes.demo) labels.push('デモ');
    if (purposes.clinicalTrial) labels.push('臨床試用');
    if (purposes.emergency) labels.push('緊急時対応');
    if (purposes.accident) labels.push('事故対応');
    if (purposes.training) labels.push('研修');
    if (purposes.research) labels.push('研究');
    if (purposes.deliveryDelay) labels.push('納期遅延');
    if (purposes.other) labels.push('その他');
    return labels;
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '8px',
            width: '95%',
            maxWidth: '950px',
            maxHeight: '90vh',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ヘッダー */}
          <div
            style={{
              background: '#4a6741',
              color: 'white',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
              借用申請 モーダル
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
              }}
              aria-label="閉じる"
            >
              ×
            </button>
          </div>

          {/* ボディ */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* 申請基本情報 */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    background: '#4a6741',
                    color: 'white',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  申請基本情報
                </div>
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  style={{
                    padding: '6px 16px',
                    background: '#4a6741',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  履歴から申請する
                </button>
              </div>

              {/* 貸出元 Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 1fr 1fr 1fr',
                  gap: '8px',
                  marginBottom: '12px',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#333',
                    fontWeight: 'bold',
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                  }}
                >
                  貸出元
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#666',
                      marginBottom: '2px',
                    }}
                  >
                    企業名
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#666',
                      marginBottom: '2px',
                    }}
                  >
                    担当者
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#666',
                      marginBottom: '2px',
                    }}
                  >
                    連絡先
                  </label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#666',
                      marginBottom: '2px',
                    }}
                  >
                    mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* 申請日 Row (右寄せ) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: '12px',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <label
                  style={{
                    fontSize: '12px',
                    color: '#333',
                    fontWeight: 'bold',
                  }}
                >
                  申請日
                </label>
                <input
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    width: '150px',
                  }}
                />
              </div>

              {/* 管理部署・申請者 Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 80px 1fr',
                  gap: '8px',
                  marginBottom: '12px',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#333',
                    fontWeight: 'bold',
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                  }}
                >
                  管理部署
                </div>
                <div>
                  <SearchableSelect
                    value={managementDepartment}
                    onChange={setManagementDepartment}
                    options={departmentOptions}
                    placeholder="選択"
                  />
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#333',
                    fontWeight: 'bold',
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                  }}
                >
                  申請者
                </div>
                <div>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* 設置部門・設置部署・設置室名 Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 80px 1fr 80px 1fr',
                  gap: '8px',
                  marginBottom: '12px',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#333',
                    fontWeight: 'bold',
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                  }}
                >
                  設置部門
                </div>
                <div>
                  <SearchableSelect
                    value={installationDivision}
                    onChange={setInstallationDivision}
                    options={divisionOptions}
                    placeholder="選択"
                  />
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#333',
                    fontWeight: 'bold',
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                  }}
                >
                  設置部署
                </div>
                <div>
                  <SearchableSelect
                    value={installationDepartment}
                    onChange={setInstallationDepartment}
                    options={departmentOptions}
                    placeholder="選択"
                  />
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#333',
                    fontWeight: 'bold',
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                  }}
                >
                  設置室名
                </div>
                <div>
                  <input
                    type="text"
                    value={installationRoom}
                    onChange={(e) => setInstallationRoom(e.target.value)}
                    placeholder="入力"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 貸出目的 */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#333',
                  fontWeight: 'bold',
                  background: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginBottom: '8px',
                }}
              >
                貸出目的
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, auto)',
                  gap: '8px 24px',
                  fontSize: '12px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={purposes.demo}
                    onChange={(e) => setPurposes((prev) => ({ ...prev, demo: e.target.checked }))}
                  />
                  デモ
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={purposes.clinicalTrial}
                    onChange={(e) => setPurposes((prev) => ({ ...prev, clinicalTrial: e.target.checked }))}
                  />
                  臨床試用（有効性・安全性、操作性等の確認）
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={purposes.emergency}
                    onChange={(e) => setPurposes((prev) => ({ ...prev, emergency: e.target.checked }))}
                  />
                  緊急時・災害時対応
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={purposes.accident}
                    onChange={(e) => setPurposes((prev) => ({ ...prev, accident: e.target.checked }))}
                  />
                  事故・故障対応
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={purposes.training}
                    onChange={(e) => setPurposes((prev) => ({ ...prev, training: e.target.checked }))}
                  />
                  研修
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={purposes.research}
                    onChange={(e) => setPurposes((prev) => ({ ...prev, research: e.target.checked }))}
                  />
                  研究目的・公益的研究活動
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={purposes.deliveryDelay}
                    onChange={(e) => setPurposes((prev) => ({ ...prev, deliveryDelay: e.target.checked }))}
                  />
                  納期遅延対応
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={purposes.other}
                    onChange={(e) => setPurposes((prev) => ({ ...prev, other: e.target.checked }))}
                  />
                  その他
                </label>
              </div>
            </div>

            {/* 希望納期・返却日・症例数 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>
                希望納期
              </span>
              <select
                value={desiredDeliveryYear}
                onChange={(e) => setDesiredDeliveryYear(Number(e.target.value))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '12px' }}>年</span>
              <select
                value={desiredDeliveryMonth}
                onChange={(e) => setDesiredDeliveryMonth(Number(e.target.value))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '12px' }}>月</span>

              <span style={{ fontSize: '12px', color: '#333', fontWeight: 'bold', marginLeft: '16px' }}>
                返却日
              </span>
              <select
                value={returnYear}
                onChange={(e) => setReturnYear(Number(e.target.value))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '12px' }}>年</span>
              <select
                value={returnMonth}
                onChange={(e) => setReturnMonth(Number(e.target.value))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '12px' }}>月</span>

              <span style={{ fontSize: '12px', color: '#333', fontWeight: 'bold', marginLeft: '16px' }}>
                症例数
              </span>
              <input
                type="text"
                value={casesPerMonth}
                onChange={(e) => setCasesPerMonth(e.target.value)}
                style={{
                  width: '60px',
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
              <span style={{ fontSize: '12px' }}>件/月</span>
            </div>

            {/* 貸出機器 */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#333',
                    fontWeight: 'bold',
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                  }}
                >
                  貸出機器
                </div>
                <button
                  onClick={handleOpenAssetMaster}
                  style={{
                    padding: '6px 16px',
                    background: '#4a6741',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  資産マスタから選択する
                </button>
              </div>

              {/* 貸出機器テーブル */}
              <div
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'left',
                          fontWeight: 600,
                        }}
                      >
                        品目
                      </th>
                      <th
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'left',
                          fontWeight: 600,
                        }}
                      >
                        メーカー
                      </th>
                      <th
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'left',
                          fontWeight: 600,
                        }}
                      >
                        型式
                      </th>
                      <th
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                          fontWeight: 600,
                          width: '70px',
                        }}
                      >
                        数量
                      </th>
                      <th
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                          fontWeight: 600,
                          width: '70px',
                        }}
                      >
                        単位
                      </th>
                      <th
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                          fontWeight: 600,
                          width: '50px',
                        }}
                      >
                        削除
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAssets.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            padding: '24px',
                            textAlign: 'center',
                            color: '#999',
                            border: '1px solid #ddd',
                          }}
                        >
                          貸出機器を資産マスタから選択してください
                        </td>
                      </tr>
                    ) : (
                      selectedAssets.map((asset, index) => (
                        <tr
                          key={index}
                          style={{ background: index % 2 === 0 ? 'white' : '#fafafa' }}
                        >
                          <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                            {asset.item}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                            {asset.maker}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                            {asset.model}
                          </td>
                          <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                            <input
                              type="number"
                              value={asset.quantity}
                              onChange={(e) => {
                                const newAssets = [...selectedAssets];
                                newAssets[index].quantity = Number(e.target.value) || 1;
                                setSelectedAssets(newAssets);
                              }}
                              min={1}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '12px',
                                textAlign: 'center',
                                boxSizing: 'border-box',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            />
                          </td>
                          <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                            <input
                              type="text"
                              value={asset.unit}
                              onChange={(e) => {
                                const newAssets = [...selectedAssets];
                                newAssets[index].unit = e.target.value;
                                setSelectedAssets(newAssets);
                              }}
                              placeholder="台"
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '12px',
                                textAlign: 'center',
                                boxSizing: 'border-box',
                              }}
                            />
                          </td>
                          <td
                            style={{
                              padding: '4px',
                              border: '1px solid #ddd',
                              textAlign: 'center',
                            }}
                          >
                            <button
                              onClick={() => handleRemoveAsset(index)}
                              style={{
                                padding: '4px 8px',
                                background: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                              }}
                              aria-label={`${asset.item}を削除`}
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 貸出期間中の費用負担 */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#333',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                }}
              >
                貸出期間中の費用負担
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {costBurdenItems.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '220px 1fr',
                      gap: '16px',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>{item.label}</span>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name={`cost-${item.key}`}
                          checked={costBurdens[item.key] === 'lender'}
                          onChange={() => handleCostBurdenChange(item.key, 'lender')}
                        />
                        貸出元負担
                      </label>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name={`cost-${item.key}`}
                          checked={costBurdens[item.key] === 'borrower'}
                          onChange={() => handleCostBurdenChange(item.key, 'borrower')}
                        />
                        貸出先負担
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* コメント */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '8px',
                }}
              >
                コメント（貸出希望理由他）
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 添付ファイル */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: '#4a6741',
                  color: 'white',
                  padding: '6px 12px',
                  display: 'inline-block',
                  marginBottom: '8px',
                }}
              >
                添付ファイル
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <label
                  style={{
                    padding: '6px 16px',
                    background: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  ファイルの選択
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {attachedFiles.length > 0
                    ? `${attachedFiles.length}件のファイルが選択されています`
                    : 'ファイルが選択されていません'}
                </span>
              </div>
              {attachedFiles.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#333',
                      }}
                    >
                      <span>📎 {file.name}</span>
                      <button
                        onClick={() =>
                          setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e74c3c',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                        aria-label={`${file.name}を削除`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                要望機種の見積書・修理不能証明など手持ちの書類を添付してください
              </p>
            </div>
          </div>

          {/* フッター */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid #ddd',
              background: '#f8f9fa',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={handleSubmit}
              style={{
                padding: '12px 48px',
                background: '#4a6741',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              記載内容を確認する
            </button>
          </div>
        </div>
      </div>

      {/* 履歴選択モーダル */}
      {isHistoryModalOpen && (
        <div
          onClick={() => setIsHistoryModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '80vh',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* 履歴モーダルヘッダー */}
            <div
              style={{
                background: '#4a6741',
                color: 'white',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                借用申請履歴から選択
              </span>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                }}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* 履歴リスト */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                過去の申請履歴を選択すると、その内容が申請フォームにセットされます。
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {MOCK_BORROWING_HISTORY.map((history) => (
                  <div
                    key={history.id}
                    onClick={() => handleSelectHistory(history)}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: '#fafafa',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e8f5e9';
                      e.currentTarget.style.borderColor = '#4a6741';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.borderColor = '#ddd';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        {history.companyName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', fontVariantNumeric: 'tabular-nums' }}>
                        申請日: {history.applicationDate}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px', color: '#666' }}>
                      <div>
                        <span style={{ color: '#999' }}>貸出機器: </span>
                        {history.assets.map(a => `${a.item} (${a.maker})`).join(', ')}
                      </div>
                      <div>
                        <span style={{ color: '#999' }}>設置場所: </span>
                        {history.installationDepartment} / {history.installationRoom}
                      </div>
                      <div>
                        <span style={{ color: '#999' }}>貸出目的: </span>
                        {getPurposeLabels(history.purposes).join(', ') || '-'}
                      </div>
                      <div>
                        <span style={{ color: '#999' }}>貸出期間: </span>
                        {history.desiredDeliveryYear}年{history.desiredDeliveryMonth}月 〜 {history.returnYear}年{history.returnMonth}月
                      </div>
                    </div>
                    {history.comment && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#888', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                        コメント: {history.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 履歴モーダルフッター */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #ddd',
                background: '#f8f9fa',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                style={{
                  padding: '8px 24px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
