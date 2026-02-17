'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useMasterStore } from '@/lib/stores';
import { MaintenanceContractRegistrationModal, MaintenanceContractFormData } from './MaintenanceContractRegistrationModal';

interface MaintenanceContractsTabProps {
  isMobile?: boolean;
}

// 保守契約ステータス（ワークフロー）
type ContractStatus = '保守・点検申請' | '見積依頼済' | '登録済' | '廃棄申請';

// 契約グループ内の資産詳細
interface ContractAsset {
  qrLabel: string;
  managementDepartment: string;
  installationDepartment: string;
  item: string;
  maker: string;
  model: string;
  maintenanceType: string;
  acceptanceDate: string;
  contractStartDate: string;
  contractEndDate: string;
  inspectionCountPerYear: number;
  partsExemption: string;
  onCall: boolean;
  hasRemote: boolean;
  comment: string;
}

// 保守契約データ型（契約グループ単位）
interface MaintenanceContract {
  id: string;
  // 契約グループ
  contractGroupName: string;
  // 部署情報（代表）
  managementDepartment: string;
  installationDepartment: string;
  // 保守種別
  maintenanceType: string;
  // 検収年月日
  acceptanceDate: string;
  // 保守契約期間
  contractStartDate: string;
  contractEndDate: string;
  // 業者情報
  contractorName: string;
  contractorPerson: string;
  contractorEmail: string;
  contractorPhone: string;
  // 契約金額（税別）
  contractAmount: number;
  // ステータス
  status: ContractStatus;
  // 保証期間終了日
  warrantyEndDate: string;
  // 期限（日数: 負の値は期限超過）
  deadlineDays: number | null;
  // フリーコメント
  comment: string;
  // フィルター用
  category: string;
  largeClass: string;
  mediumClass: string;
  item: string;
  maker: string;
  hasRemoteMaintenance: boolean;
  // 契約グループ内の資産一覧
  assets: ContractAsset[];
}

// モック契約データ
const MOCK_CONTRACTS: MaintenanceContract[] = [
  {
    id: '1',
    managementDepartment: '臨床工学部',
    installationDepartment: '外科',
    contractGroupName: '',
    maintenanceType: '',
    acceptanceDate: '2025/04/01',
    contractStartDate: '',
    contractEndDate: '',
    contractorName: '',
    contractorPerson: '',
    contractorEmail: 'info@philips.co.jp',
    contractorPhone: '03-1234-5678',
    contractAmount: 0,
    status: '保守・点検申請',
    warrantyEndDate: '2026/03/31',
    deadlineDays: 42, // 保証期間42日前
    comment: '',
    category: '医療機器',
    largeClass: '人工呼吸器',
    mediumClass: '集中治療用',
    item: '人工呼吸器',
    maker: 'フィリップス',
    hasRemoteMaintenance: false,
    assets: [
      { qrLabel: 'QR-2025-0001', managementDepartment: '臨床工学部', installationDepartment: '外科', item: '人工呼吸器', maker: 'フィリップス', model: 'V680', maintenanceType: '', acceptanceDate: '2025/04/01', contractStartDate: '', contractEndDate: '', inspectionCountPerYear: 0, partsExemption: '', onCall: false, hasRemote: false, comment: '' },
      { qrLabel: 'QR-2025-0016', managementDepartment: '臨床工学部', installationDepartment: 'ICU', item: '人工呼吸器', maker: 'フィリップス', model: 'V680', maintenanceType: '', acceptanceDate: '2025/04/01', contractStartDate: '', contractEndDate: '', inspectionCountPerYear: 0, partsExemption: '', onCall: false, hasRemote: false, comment: '' },
    ],
  },
  {
    id: '2',
    managementDepartment: '放射線部',
    installationDepartment: '内科',
    contractGroupName: '超音波診断装置保守',
    maintenanceType: '',
    acceptanceDate: '2024/04/01',
    contractStartDate: '',
    contractEndDate: '',
    contractorName: 'GEヘルスケアジャパン',
    contractorPerson: '',
    contractorEmail: 'service@ge.com',
    contractorPhone: '03-2345-6789',
    contractAmount: 0,
    status: '見積依頼済',
    warrantyEndDate: '2025/03/31',
    deadlineDays: null, // 見積依頼済は期限表示なし
    comment: '見積回答待ち',
    category: '医療機器',
    largeClass: '検査機器',
    mediumClass: '超音波診断装置',
    item: '超音波診断装置',
    maker: 'GEヘルスケア',
    hasRemoteMaintenance: false,
    assets: [
      { qrLabel: 'QR-2025-0002', managementDepartment: '放射線部', installationDepartment: '内科', item: '超音波診断装置', maker: 'GEヘルスケア', model: 'LOGIQ E10', maintenanceType: '', acceptanceDate: '2024/04/01', contractStartDate: '', contractEndDate: '', inspectionCountPerYear: 0, partsExemption: '', onCall: false, hasRemote: false, comment: '' },
    ],
  },
  {
    id: '3',
    managementDepartment: '臨床工学部',
    installationDepartment: '外科',
    contractGroupName: '電気手術器保守契約',
    maintenanceType: 'フルメンテナンス',
    acceptanceDate: '2023/06/01',
    contractStartDate: '2024/06/01',
    contractEndDate: '2026/05/31',
    contractorName: 'オリンパスメディカルサービス',
    contractorPerson: '鈴木一郎',
    contractorEmail: 'suzuki@olympus.co.jp',
    contractorPhone: '03-3456-7890',
    contractAmount: 500000,
    status: '登録済',
    warrantyEndDate: '2024/05/31',
    deadlineDays: 75, // 契約期限75日前
    comment: '',
    category: '医療機器',
    largeClass: '手術関連機器',
    mediumClass: '電気メス 双極',
    item: '電気手術器',
    maker: 'オリンパス',
    hasRemoteMaintenance: false,
    assets: [
      { qrLabel: 'QR-2025-0013', managementDepartment: '臨床工学部', installationDepartment: '外科', item: '電気手術器', maker: 'オリンパス', model: 'ESG-400', maintenanceType: 'フルメンテナンス', acceptanceDate: '2023/06/01', contractStartDate: '2024/06/01', contractEndDate: '2026/05/31', inspectionCountPerYear: 2, partsExemption: '50万', onCall: true, hasRemote: false, comment: '' },
    ],
  },
  {
    id: '4',
    managementDepartment: '放射線部',
    installationDepartment: '放射線科',
    contractGroupName: 'CTスキャナー保守契約2024',
    maintenanceType: 'フルメンテナンス',
    acceptanceDate: '2021/04/01',
    contractStartDate: '2024/04/01',
    contractEndDate: '2026/03/31',
    contractorName: 'シーメンスヘルスケア',
    contractorPerson: '田中次郎',
    contractorEmail: 'tanaka@siemens.com',
    contractorPhone: '03-4567-8901',
    contractAmount: 3500000,
    status: '登録済',
    warrantyEndDate: '2022/03/31',
    deadlineDays: 30, // 契約期限30日前
    comment: '契約更新検討時期',
    category: '医療機器',
    largeClass: '画像診断機器',
    mediumClass: 'CT関連',
    item: 'CTスキャナー',
    maker: 'シーメンス',
    hasRemoteMaintenance: true,
    assets: [
      { qrLabel: 'QR-2025-0014', managementDepartment: '放射線部', installationDepartment: '放射線科', item: 'CTスキャナー', maker: 'シーメンス', model: 'SOMATOM Drive', maintenanceType: 'フルメンテナンス', acceptanceDate: '2021/04/01', contractStartDate: '2024/04/01', contractEndDate: '2026/03/31', inspectionCountPerYear: 4, partsExemption: '200万', onCall: true, hasRemote: true, comment: 'ソフトバージョンアップ込み' },
    ],
  },
  {
    id: '5',
    managementDepartment: '臨床工学部',
    installationDepartment: '透析センター',
    contractGroupName: '透析装置保守契約2024',
    maintenanceType: '定期点検',
    acceptanceDate: '2022/04/01',
    contractStartDate: '2023/04/01',
    contractEndDate: '2025/03/31',
    contractorName: '日機装',
    contractorPerson: '高橋三郎',
    contractorEmail: 'takahashi@nikkiso.co.jp',
    contractorPhone: '03-5678-9012',
    contractAmount: 600000,
    status: '廃棄申請',
    warrantyEndDate: '2023/03/31',
    deadlineDays: null, // 廃棄申請は「至急対応」表示
    comment: '機器廃棄に伴い契約変更要',
    category: '医療機器',
    largeClass: '透析関連機器',
    mediumClass: '血液透析装置',
    item: '個人用透析装置',
    maker: '日機装',
    hasRemoteMaintenance: false,
    assets: [
      { qrLabel: 'QR-2025-0011', managementDepartment: '臨床工学部', installationDepartment: '透析センター', item: '個人用透析装置', maker: '日機装', model: 'DCS-200Si', maintenanceType: '定期点検', acceptanceDate: '2022/04/01', contractStartDate: '2023/04/01', contractEndDate: '2025/03/31', inspectionCountPerYear: 2, partsExemption: '30万', onCall: false, hasRemote: false, comment: '' },
    ],
  },
  {
    id: '6',
    managementDepartment: '施設管理部',
    installationDepartment: '本館',
    contractGroupName: 'エレベーター保守契約',
    maintenanceType: 'POG契約',
    acceptanceDate: '2019/01/01',
    contractStartDate: '2024/01/01',
    contractEndDate: '2026/12/31',
    contractorName: '三菱電機ビルソリューションズ',
    contractorPerson: '山田太郎',
    contractorEmail: 'yamada@meltec.co.jp',
    contractorPhone: '03-6789-0123',
    contractAmount: 480000,
    status: '登録済',
    warrantyEndDate: '2020/12/31',
    deadlineDays: 320, // 契約期限320日前
    comment: '',
    category: '建物設備',
    largeClass: '搬送設備',
    mediumClass: 'エレベーター',
    item: '乗用エレベーター',
    maker: '三菱電機',
    hasRemoteMaintenance: true,
    assets: [
      { qrLabel: 'EV-001', managementDepartment: '施設管理部', installationDepartment: '本館', item: '乗用エレベーター', maker: '三菱電機', model: 'NEXIEZ-MR', maintenanceType: 'POG契約', acceptanceDate: '2019/01/01', contractStartDate: '2024/01/01', contractEndDate: '2026/12/31', inspectionCountPerYear: 12, partsExemption: '', onCall: true, hasRemote: true, comment: '' },
      { qrLabel: 'EV-002', managementDepartment: '施設管理部', installationDepartment: '本館', item: '乗用エレベーター', maker: '三菱電機', model: 'NEXIEZ-MR', maintenanceType: 'POG契約', acceptanceDate: '2019/01/01', contractStartDate: '2024/01/01', contractEndDate: '2026/12/31', inspectionCountPerYear: 12, partsExemption: '', onCall: true, hasRemote: true, comment: '' },
    ],
  },
];

const CONTRACT_STATUSES: ContractStatus[] = ['保守・点検申請', '見積依頼済', '登録済', '廃棄申請'];

export function MaintenanceContractsTab({ isMobile = false }: MaintenanceContractsTabProps) {
  const router = useRouter();
  const { assets, departments } = useMasterStore();

  // マスタデータからユニーク値を抽出
  const categories = useMemo(() => [...new Set(['医療機器', '建物設備', ...assets.map((a) => a.category)])], [assets]);
  const largeClasses = useMemo(() => [...new Set(assets.map((a) => a.largeClass))], [assets]);
  const mediumClassesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    assets.forEach((a) => {
      if (!map[a.largeClass]) map[a.largeClass] = [];
      if (!map[a.largeClass].includes(a.mediumClass)) {
        map[a.largeClass].push(a.mediumClass);
      }
    });
    return map;
  }, [assets]);
  const itemsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    assets.forEach((a) => {
      if (!map[a.mediumClass]) map[a.mediumClass] = [];
      if (!map[a.mediumClass].includes(a.item)) {
        map[a.mediumClass].push(a.item);
      }
    });
    return map;
  }, [assets]);
  // 全中分類リスト
  const allMediumClasses = useMemo(() => [...new Set(assets.map((a) => a.mediumClass))], [assets]);
  // 全品目リスト
  const allItems = useMemo(() => [...new Set(assets.map((a) => a.item))], [assets]);
  // 中分類→大分類の逆引き
  const mediumToLargeMap = useMemo(() => {
    const map: Record<string, string> = {};
    assets.forEach((a) => {
      if (!map[a.mediumClass]) map[a.mediumClass] = a.largeClass;
    });
    return map;
  }, [assets]);
  // 品目→中分類の逆引き
  const itemToMediumMap = useMemo(() => {
    const map: Record<string, string> = {};
    assets.forEach((a) => {
      if (!map[a.item]) map[a.item] = a.mediumClass;
    });
    return map;
  }, [assets]);
  const makers = useMemo(() => [...new Set(assets.map((a) => a.maker))], [assets]);
  const departmentNames = useMemo(() => [...new Set(departments.map((d) => d.department))], [departments]);
  const contractGroupNames = useMemo(
    () => [...new Set(MOCK_CONTRACTS.filter((c) => c.contractGroupName).map((c) => c.contractGroupName))],
    []
  );

  // 契約データ（登録で追加される）
  const [contracts, setContracts] = useState<MaintenanceContract[]>(MOCK_CONTRACTS);

  // モーダル状態
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedContractForDetail, setSelectedContractForDetail] = useState<MaintenanceContract | null>(null);

  // フィルター状態
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    deadline: '', // 期限フィルター: 'near' = 3ヶ月以内
    managementDepartment: '',
    installationDepartment: '',
    contractGroupName: '',
    largeClass: '',
    mediumClass: '',
    item: '',
    maker: '',
    remoteMaintenance: '', // 'yes' | 'no' | ''
  });

  // フィルタリング
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      if (filters.category && contract.category !== filters.category) return false;
      if (filters.status && contract.status !== filters.status) return false;
      if (filters.deadline === 'near') {
        // 期限90日以内または廃棄申請
        const isNearDeadline =
          (contract.deadlineDays !== null && contract.deadlineDays <= 90) ||
          contract.status === '廃棄申請';
        if (!isNearDeadline) return false;
      }
      if (filters.managementDepartment && contract.managementDepartment !== filters.managementDepartment) return false;
      if (filters.installationDepartment && contract.installationDepartment !== filters.installationDepartment)
        return false;
      if (filters.contractGroupName && contract.contractGroupName !== filters.contractGroupName) return false;
      if (filters.largeClass && contract.largeClass !== filters.largeClass) return false;
      if (filters.mediumClass && contract.mediumClass !== filters.mediumClass) return false;
      if (filters.item && contract.item !== filters.item) return false;
      if (filters.maker && contract.maker !== filters.maker) return false;
      if (filters.remoteMaintenance === 'yes' && !contract.hasRemoteMaintenance) return false;
      if (filters.remoteMaintenance === 'no' && contract.hasRemoteMaintenance) return false;
      return true;
    });
  }, [contracts, filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      // 品目選択時は中分類・大分類を自動設定
      if (field === 'item' && value) {
        const mc = itemToMediumMap[value];
        if (mc) {
          newFilters.mediumClass = mc;
          const lc = mediumToLargeMap[mc];
          if (lc) newFilters.largeClass = lc;
        }
      }
      // 中分類選択時は大分類を自動設定
      if (field === 'mediumClass' && value) {
        const lc = mediumToLargeMap[value];
        if (lc) newFilters.largeClass = lc;
      }
      // 大分類変更時は中分類・品目をリセット
      if (field === 'largeClass') {
        newFilters.mediumClass = '';
        newFilters.item = '';
      }
      return newFilters;
    });
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      status: '',
      deadline: '',
      managementDepartment: '',
      installationDepartment: '',
      contractGroupName: '',
      largeClass: '',
      mediumClass: '',
      item: '',
      maker: '',
      remoteMaintenance: '',
    });
  };

  // 保守契約登録
  const handleRegisterContract = (data: MaintenanceContractFormData) => {
    // 1契約グループ = 1レコード（複数資産を内包）
    const firstAsset = data.selectedAssets[0];

    // 保証期間終了日を1年後として設定（仮）
    const warrantyEnd = new Date();
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 1);
    const warrantyEndDate = `${warrantyEnd.getFullYear()}/${String(warrantyEnd.getMonth() + 1).padStart(2, '0')}/${String(warrantyEnd.getDate()).padStart(2, '0')}`;

    // 保証期間までの日数を計算
    const today = new Date();
    const deadlineDays = Math.ceil((warrantyEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const newContract: MaintenanceContract = {
      id: `new-${Date.now()}`,
      managementDepartment: data.managementDepartment,
      installationDepartment: firstAsset?.section || '',
      contractGroupName: data.contractGroupName,
      maintenanceType: data.maintenanceType,
      acceptanceDate: `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`,
      contractStartDate: '',
      contractEndDate: '',
      contractorName: '',
      contractorPerson: '',
      contractorEmail: '',
      contractorPhone: '',
      contractAmount: 0,
      status: '保守・点検申請' as ContractStatus,
      warrantyEndDate,
      deadlineDays,
      comment: data.hasLegalInspection ? '法令点検あり' : '',
      category: firstAsset?.category || '',
      largeClass: firstAsset?.largeClass || '',
      mediumClass: firstAsset?.mediumClass || '',
      item: firstAsset?.item || '',
      maker: firstAsset?.maker || '',
      hasRemoteMaintenance: false,
      assets: data.selectedAssets.map((asset) => ({
        qrLabel: asset.qrCode,
        managementDepartment: data.managementDepartment,
        installationDepartment: asset.section,
        item: asset.item,
        maker: asset.maker,
        model: asset.model,
        maintenanceType: data.maintenanceType,
        acceptanceDate: '',
        contractStartDate: '',
        contractEndDate: '',
        inspectionCountPerYear: 0,
        partsExemption: '',
        onCall: false,
        hasRemote: false,
        comment: '',
      })),
    };
    setContracts((prev) => [...prev, newContract]);
    alert(`契約グループ「${data.contractGroupName}」を登録しました（${data.selectedAssets.length}件の資産）\n\nステータス: 保守・点検申請\n次のタスク: 見積依頼（mail送信）`);
  };

  const getStatusStyle = (status: ContractStatus): React.CSSProperties => {
    switch (status) {
      case '保守・点検申請':
        return { backgroundColor: '#e74c3c', color: 'white' };
      case '見積依頼済':
        return { backgroundColor: '#f39c12', color: 'white' };
      case '登録済':
        return { backgroundColor: '#27ae60', color: 'white' };
      case '廃棄申請':
        return { backgroundColor: '#34495e', color: 'white' };
      default:
        return { backgroundColor: '#95a5a6', color: 'white' };
    }
  };

  // 期限表示の生成
  const getDeadlineDisplay = (contract: MaintenanceContract): { text: string; style: React.CSSProperties } => {
    switch (contract.status) {
      case '保守・点検申請':
        if (contract.deadlineDays !== null) {
          const isUrgent = contract.deadlineDays <= 30;
          return {
            text: `保証期間${contract.deadlineDays}日前`,
            style: { color: isUrgent ? '#e74c3c' : '#f39c12', fontWeight: isUrgent ? 'bold' : 'normal' },
          };
        }
        return { text: '-', style: {} };
      case '見積依頼済':
        return { text: '-', style: { color: '#999' } };
      case '登録済':
        if (contract.deadlineDays !== null) {
          const isUrgent = contract.deadlineDays <= 30;
          return {
            text: `契約期限${contract.deadlineDays}日前`,
            style: { color: isUrgent ? '#e74c3c' : '#f39c12', fontWeight: isUrgent ? 'bold' : 'normal' },
          };
        }
        return { text: '-', style: {} };
      case '廃棄申請':
        return { text: '至急対応', style: { color: '#e74c3c', fontWeight: 'bold' } };
      default:
        return { text: '-', style: {} };
    }
  };

  // 操作ボタンの生成
  const getActionButton = (contract: MaintenanceContract): { label: string; style: React.CSSProperties; onClick: () => void } => {
    switch (contract.status) {
      case '保守・点検申請':
        return {
          label: '見積依頼',
          style: { backgroundColor: '#3498db' },
          onClick: () => handleQuoteRequest(contract),
        };
      case '見積依頼済':
        return {
          label: '見積登録',
          style: { backgroundColor: '#27ae60' },
          onClick: () => handleQuoteRegistration(contract),
        };
      case '登録済':
        return {
          label: '見積依頼',
          style: { backgroundColor: '#3498db' },
          onClick: () => handleQuoteRequest(contract),
        };
      case '廃棄申請':
        return {
          label: '契約内容見直し',
          style: { backgroundColor: '#e74c3c' },
          onClick: () => handleContractReview(contract),
        };
      default:
        return {
          label: '詳細',
          style: { backgroundColor: '#95a5a6' },
          onClick: () => setSelectedContractForDetail(contract),
        };
    }
  };

  // 見積依頼（メール送信）
  const handleQuoteRequest = (contract: MaintenanceContract) => {
    const email = contract.contractorEmail || '';
    if (!email) {
      alert('業者のメールアドレスが登録されていません');
      return;
    }

    const subject = encodeURIComponent(`【見積依頼】${contract.item} 保守契約について`);
    const body = encodeURIComponent(
      `${contract.contractorName || '担当者'} 様\n\n` +
      `お世話になっております。\n\n` +
      `下記機器の保守契約につきまして、見積をお願いいたします。\n\n` +
      `■対象機器\n` +
      `・品目: ${contract.item}\n` +
      `・メーカー: ${contract.maker}\n` +
      `・管理部署: ${contract.managementDepartment}\n` +
      `・台数: ${contract.assets.length}台\n` +
      (contract.warrantyEndDate ? `・保証期間終了日: ${contract.warrantyEndDate}\n` : '') +
      `\n` +
      `お忙しいところ恐れ入りますが、ご対応のほどよろしくお願いいたします。`
    );

    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');

    // ステータスを見積依頼済に更新
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contract.id
          ? { ...c, status: '見積依頼済' as ContractStatus, deadlineDays: null }
          : c
      )
    );

    alert('メーラーを起動しました。送信後、ステータスが「見積依頼済」に更新されました。');
  };

  // 見積登録
  const handleQuoteRegistration = (contract: MaintenanceContract) => {
    // 見積登録画面へ遷移（contractデータをsessionStorageに保存）
    sessionStorage.setItem('maintenanceContract', JSON.stringify(contract));
    router.push(`/maintenance-quote-registration?id=${contract.id}`);
  };

  // 契約内容見直し登録
  const handleContractReview = (contract: MaintenanceContract) => {
    const confirmed = confirm(
      `「${contract.contractGroupName || contract.item}」の契約内容を見直しますか？\n\n` +
      `廃棄申請があるため、以下の対応が必要です:\n` +
      `・対象機器の削除\n` +
      `・契約金額の見直し\n` +
      `・契約期間の変更`
    );

    if (!confirmed) return;

    // 見直し後の契約金額を入力
    const newAmount = prompt('見直し後の契約金額（税別）を入力してください:', contract.contractAmount.toString());
    if (newAmount === null) return;

    const amount = parseInt(newAmount, 10);
    if (isNaN(amount) || amount < 0) {
      alert('正しい金額を入力してください');
      return;
    }

    // ステータスを登録済に更新（廃棄対応完了）
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contract.id
          ? {
              ...c,
              status: '登録済' as ContractStatus,
              contractAmount: amount,
              comment: `${c.comment}（廃棄対応済）`,
              // 契約期限を再計算
              deadlineDays: c.contractEndDate
                ? Math.ceil(
                    (new Date(c.contractEndDate.replace(/\//g, '-')).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null,
            }
          : c
      )
    );

    alert('契約内容の見直しを完了しました。');
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: isMobile ? '12px' : '24px',
    },
    filterSection: {
      padding: '16px',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#f8f9fa',
    },
    filterHeader: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: '12px',
    },
    filterRow: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '12px',
    },
    filterItem: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      minWidth: '100px',
      flex: '1 1 100px',
      maxWidth: '130px',
    },
    filterLabel: {
      fontSize: '12px',
      color: '#7f8c8d',
    },
    select: {
      padding: '8px 12px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '14px',
      backgroundColor: 'white',
    },
    buttonGroup: {
      display: 'flex',
      gap: '8px',
      marginTop: '12px',
    },
    clearButton: {
      padding: '8px 16px',
      backgroundColor: '#95a5a6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    actionButtonGroup: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      flexWrap: 'wrap' as const,
    },
    actionButton: {
      padding: '10px 20px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
    },
    secondaryButton: {
      padding: '10px 20px',
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
    },
    tableContainer: {
      overflowX: 'auto' as const,
      border: '1px solid #dee2e6',
      borderRadius: '8px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '13px',
    },
    th: {
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '10px 12px',
      textAlign: 'left' as const,
      fontWeight: 500,
      whiteSpace: 'nowrap' as const,
      borderBottom: '2px solid #dee2e6',
    },
    thGroup: {
      backgroundColor: '#e9ecef',
      color: '#2c3e50',
      padding: '6px 12px',
      textAlign: 'center' as const,
      fontWeight: 600,
      fontSize: '12px',
      borderLeft: '2px solid #dee2e6',
    },
    thFirstInGroup: {
      backgroundColor: '#2c3e50',
      borderLeft: '2px solid #dee2e6',
    },
    td: {
      padding: '10px 12px',
      borderBottom: '1px solid #eee',
      whiteSpace: 'nowrap' as const,
    },
    tdFirstInGroup: {
      borderLeft: '2px solid #dee2e6',
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 500,
      display: 'inline-block',
    },
    rowEven: {
      backgroundColor: '#ffffff',
    },
    rowOdd: {
      backgroundColor: '#f8f9fa',
    },
    remoteBadge: {
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 500,
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '48px 24px',
      color: '#7f8c8d',
    },
    editButton: {
      padding: '4px 8px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
    },
  };

  return (
    <div style={styles.container}>
      {/* フィルターセクション */}
      <div style={styles.filterSection}>
        <div style={styles.filterHeader}>
          <button style={styles.actionButton} onClick={() => setIsRegistrationModalOpen(true)}>
            保守契約登録
          </button>
        </div>
        <div style={styles.filterRow}>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>category</label>
            <select
              style={styles.select}
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">すべて</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>ステータス</label>
            <select
              style={styles.select}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">すべて</option>
              {CONTRACT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>期限</label>
            <select
              style={styles.select}
              value={filters.deadline}
              onChange={(e) => handleFilterChange('deadline', e.target.value)}
            >
              <option value="">すべて</option>
              <option value="near">3ヶ月以内に期限到来</option>
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>管理部署</label>
            <SearchableSelect
              options={departmentNames}
              value={filters.managementDepartment}
              onChange={(v) => handleFilterChange('managementDepartment', v)}
              placeholder="選択してください"
            />
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>設置部署</label>
            <SearchableSelect
              options={departmentNames}
              value={filters.installationDepartment}
              onChange={(v) => handleFilterChange('installationDepartment', v)}
              placeholder="選択してください"
            />
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>契約グループ名称</label>
            <SearchableSelect
              options={contractGroupNames}
              value={filters.contractGroupName}
              onChange={(v) => handleFilterChange('contractGroupName', v)}
              placeholder="選択してください"
            />
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>大分類</label>
            <SearchableSelect
              options={largeClasses}
              value={filters.largeClass}
              onChange={(v) => handleFilterChange('largeClass', v)}
              placeholder="選択してください"
            />
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>中分類</label>
            <SearchableSelect
              options={filters.largeClass ? mediumClassesMap[filters.largeClass] || [] : allMediumClasses}
              value={filters.mediumClass}
              onChange={(v) => handleFilterChange('mediumClass', v)}
              placeholder="全て"
            />
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>品目</label>
            <SearchableSelect
              options={filters.mediumClass ? itemsMap[filters.mediumClass] || [] : allItems}
              value={filters.item}
              onChange={(v) => handleFilterChange('item', v)}
              placeholder="全て"
            />
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>メーカー</label>
            <SearchableSelect
              options={makers}
              value={filters.maker}
              onChange={(v) => handleFilterChange('maker', v)}
              placeholder="選択してください"
            />
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>リモートメンテ</label>
            <select
              style={styles.select}
              value={filters.remoteMaintenance}
              onChange={(e) => handleFilterChange('remoteMaintenance', e.target.value)}
            >
              <option value="">すべて</option>
              <option value="yes">あり</option>
              <option value="no">なし</option>
            </select>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.clearButton} onClick={handleClearFilters}>
            条件をクリア
          </button>
        </div>
      </div>

      {/* 結果件数 */}
      <div style={{ marginBottom: '12px', fontSize: '14px', color: '#7f8c8d' }}>
        {filteredContracts.length}件表示
      </div>

      {/* テーブル */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            {/* グループヘッダー */}
            <tr>
              <th style={{ ...styles.thGroup }} colSpan={2}>部署情報</th>
              <th style={{ ...styles.thGroup }} rowSpan={2}>契約グループ</th>
              <th style={{ ...styles.thGroup }} rowSpan={2}>保守種別</th>
              <th style={{ ...styles.thGroup }} rowSpan={2}>検収年月日</th>
              <th style={{ ...styles.thGroup }} rowSpan={2}>保守契約期間</th>
              <th style={{ ...styles.thGroup }} colSpan={4}>業者情報（導入業者）</th>
              <th style={{ ...styles.thGroup }} rowSpan={2}>契約金額（税別）</th>
              <th style={{ ...styles.thGroup }} rowSpan={2}>ステータス</th>
              <th style={{ ...styles.thGroup }} rowSpan={2}>期限</th>
              <th style={{ ...styles.thGroup }} rowSpan={2}>操作</th>
              <th style={{ ...styles.thGroup }} rowSpan={2}>フリーコメント</th>
            </tr>
            {/* カラムヘッダー */}
            <tr>
              <th style={styles.th}>管理部署</th>
              <th style={styles.th}>設置部署</th>
              <th style={{ ...styles.th, ...styles.thFirstInGroup }}>契約業者</th>
              <th style={styles.th}>担当</th>
              <th style={styles.th}>mail</th>
              <th style={styles.th}>連絡先</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.length === 0 ? (
              <tr>
                <td colSpan={15} style={styles.emptyState}>
                  条件に一致する契約がありません
                </td>
              </tr>
            ) : (
              filteredContracts.map((contract, index) => (
                <tr
                  key={contract.id}
                  style={{ ...(index % 2 === 0 ? styles.rowEven : styles.rowOdd), cursor: 'pointer' }}
                  onDoubleClick={() => setSelectedContractForDetail(contract)}
                >
                  <td style={styles.td}>{contract.managementDepartment}</td>
                  <td style={styles.td}>{contract.installationDepartment}</td>
                  <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>{contract.contractGroupName || '-'}</td>
                  <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>{contract.maintenanceType || '-'}</td>
                  <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>{contract.acceptanceDate || '-'}</td>
                  <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>
                    {contract.contractStartDate && contract.contractEndDate
                      ? `${contract.contractStartDate}～${contract.contractEndDate}`
                      : '-'}
                  </td>
                  <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>{contract.contractorName || '-'}</td>
                  <td style={styles.td}>{contract.contractorPerson || '-'}</td>
                  <td style={styles.td}>{contract.contractorEmail || '-'}</td>
                  <td style={styles.td}>{contract.contractorPhone || '-'}</td>
                  <td style={{ ...styles.td, ...styles.tdFirstInGroup, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {contract.contractAmount > 0 ? contract.contractAmount.toLocaleString() : '-'}
                  </td>
                  <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>
                    <span style={{ ...styles.statusBadge, ...getStatusStyle(contract.status) }}>{contract.status}</span>
                  </td>
                  <td style={{ ...styles.td, ...styles.tdFirstInGroup, ...getDeadlineDisplay(contract).style, whiteSpace: 'nowrap' }}>
                    {getDeadlineDisplay(contract).text}
                  </td>
                  <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>
                    {(() => {
                      const action = getActionButton(contract);
                      return (
                        <button
                          style={{ ...styles.editButton, ...action.style, whiteSpace: 'nowrap' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick();
                          }}
                        >
                          {action.label}
                        </button>
                      );
                    })()}
                  </td>
                  <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>{contract.comment || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 保守契約登録モーダル */}
      <MaintenanceContractRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onRegister={handleRegisterContract}
      />

      {/* 契約グループ詳細モーダル */}
      {selectedContractForDetail && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedContractForDetail(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '95%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#2c3e50' }}>
                契約グループ詳細: {selectedContractForDetail.contractGroupName || '未設定'}
              </span>
              <button
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d' }}
                onClick={() => setSelectedContractForDetail(null)}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '24px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ ...styles.thGroup }} colSpan={2}>部署情報</th>
                    <th style={{ ...styles.thGroup }} colSpan={4}>商品情報</th>
                    <th style={{ ...styles.thGroup }} rowSpan={2}>保守種別</th>
                    <th style={{ ...styles.thGroup }} rowSpan={2}>検収年月日</th>
                    <th style={{ ...styles.thGroup }} rowSpan={2}>保守契約期間</th>
                    <th style={{ ...styles.thGroup }} rowSpan={2}>点検回数／年</th>
                    <th style={{ ...styles.thGroup }} rowSpan={2}>部品免責</th>
                    <th style={{ ...styles.thGroup }} rowSpan={2}>オンコール</th>
                    <th style={{ ...styles.thGroup }} rowSpan={2}>リモート</th>
                    <th style={{ ...styles.thGroup }} rowSpan={2}>フリーコメント</th>
                  </tr>
                  <tr>
                    <th style={styles.th}>管理部署</th>
                    <th style={styles.th}>設置部署</th>
                    <th style={{ ...styles.th, ...styles.thFirstInGroup }}>QRラベル</th>
                    <th style={styles.th}>品目</th>
                    <th style={styles.th}>メーカー</th>
                    <th style={styles.th}>型式</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedContractForDetail.assets.length === 0 ? (
                    <tr>
                      <td colSpan={14} style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                        登録された資産がありません
                      </td>
                    </tr>
                  ) : (
                    selectedContractForDetail.assets.map((asset, idx) => (
                      <tr key={idx} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                        <td style={styles.td}>{asset.managementDepartment}</td>
                        <td style={styles.td}>{asset.installationDepartment}</td>
                        <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>{asset.qrLabel}</td>
                        <td style={styles.td}>{asset.item}</td>
                        <td style={styles.td}>{asset.maker}</td>
                        <td style={styles.td}>{asset.model}</td>
                        <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>{asset.maintenanceType || '-'}</td>
                        <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>{asset.acceptanceDate || '-'}</td>
                        <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>
                          {asset.contractStartDate && asset.contractEndDate
                            ? `${asset.contractStartDate}～${asset.contractEndDate}`
                            : '-'}
                        </td>
                        <td style={{ ...styles.td, ...styles.tdFirstInGroup, textAlign: 'center' }}>
                          {asset.inspectionCountPerYear > 0 ? `${asset.inspectionCountPerYear}回` : '-'}
                        </td>
                        <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>{asset.partsExemption || '-'}</td>
                        <td style={{ ...styles.td, ...styles.tdFirstInGroup, textAlign: 'center' }}>
                          {asset.onCall ? '○' : '×'}
                        </td>
                        <td style={{ ...styles.td, ...styles.tdFirstInGroup, textAlign: 'center' }}>
                          {asset.hasRemote ? '○' : '×'}
                        </td>
                        <td style={{ ...styles.td, ...styles.tdFirstInGroup }}>{asset.comment || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => alert('点検管理リストに登録しました')}
              >
                点検管理リストに登録
              </button>
              <button
                style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setSelectedContractForDetail(null)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
