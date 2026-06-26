import { create } from 'zustand';

// 契約種別
export type ContractType = '保守契約' | '定期点検' | 'スポット契約' | '借用契約' | 'その他';

// 進行ステップ
export type MaintenanceStep = 1 | 2 | 3 | 4 | 'completed';

// 保守契約データ型（契約グループ単位）
export interface MaintenanceContract {
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
  warrantyEndDate: string;
  comment: string;
  currentStep: MaintenanceStep;
  reviewStartDate?: string;
}

const initialContracts: MaintenanceContract[] = [
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
    warrantyEndDate: '2026-05-15',
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
    warrantyEndDate: '2026-09-30',
    comment: '次回点検: 2026年9月',
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
    warrantyEndDate: '2026-12-31',
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
    warrantyEndDate: '2026-03-31',
    comment: '契約更新要検討',
    currentStep: 3,
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
    warrantyEndDate: '2027-01-31',
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
    warrantyEndDate: '2028-03-31',
    comment: '',
    currentStep: 1,
  },
];

export interface ContractGroupAsset {
  id: number;
  managementDept: string;
  installDept: string;
  qrLabel: string;
  itemName: string;
  maker: string;
  model: string;
  inspectionGroupName: string;
  inspectionType: string;
  inspectionCycle: string;
  warrantyStart: string;
  warrantyEnd: string;
  partsExemption: boolean;
  exemptionAmount: string;
  onCall: boolean;
  remote: boolean;
  legalInspection: boolean;
  legalInspectionBasis: string;
  comment: string;
  // REQ-101: 機器毎の概算保守金額 (任意・会計非連動・ライフサイクルコスト把握用)
  estimatedMaintenanceCost: string;
}

// 契約グループごとの個体管理品目 初期データ (旧 MaintenanceContractsTab.MOCK_GROUP_ASSETS を集約)
const emptyInspection = {
  inspectionGroupName: '', inspectionType: '', inspectionCycle: '',
  warrantyStart: '', warrantyEnd: '', partsExemption: false, exemptionAmount: '',
  onCall: false, remote: false, legalInspection: false, legalInspectionBasis: '',
  comment: '', estimatedMaintenanceCost: '',
};
const initialContractAssets: Record<string, ContractGroupAsset[]> = {
  '1': [
    { id: 1, managementDept: '臨床工学部', installDept: '放射線科', qrLabel: 'QR-2025-0101', itemName: 'CT装置', maker: 'シーメンス', model: 'SOMATOM go.Top', ...emptyInspection, warrantyStart: '2025/04/01' },
  ],
  '2': [
    { id: 2, managementDept: '臨床工学部', installDept: '外科', qrLabel: 'QR-2025-0001', itemName: '超音波診断装置', maker: 'GEヘルスケア', model: 'LOGIQ E10', ...emptyInspection, warrantyStart: '2025/04/01' },
    { id: 3, managementDept: '臨床工学部', installDept: 'ICU', qrLabel: 'QR-2025-0016', itemName: '超音波診断装置', maker: 'GEヘルスケア', model: 'LOGIQ E10', ...emptyInspection, warrantyStart: '2025/04/01' },
  ],
  '3': [
    { id: 4, managementDept: '臨床工学部', installDept: '手術室', qrLabel: 'QR-2025-0030', itemName: '電気手術器', maker: 'オリンパス', model: 'ESG-400', ...emptyInspection, warrantyStart: '2025/04/01' },
    { id: 5, managementDept: '臨床工学部', installDept: '手術室', qrLabel: 'QR-2025-0031', itemName: '電気手術器', maker: 'オリンパス', model: 'ESG-400', ...emptyInspection, warrantyStart: '2025/04/01' },
  ],
  '4': [
    { id: 6, managementDept: '臨床工学部', installDept: '透析室', qrLabel: 'QR-2025-0050', itemName: '透析装置', maker: '日機装', model: 'DBG-03', ...emptyInspection, warrantyStart: '2024/04/01' },
    { id: 7, managementDept: '臨床工学部', installDept: '透析室', qrLabel: 'QR-2025-0051', itemName: '透析装置', maker: '日機装', model: 'DBG-03', ...emptyInspection, warrantyStart: '2024/04/01' },
    { id: 8, managementDept: '臨床工学部', installDept: '透析室', qrLabel: 'QR-2025-0052', itemName: '透析装置', maker: '日機装', model: 'DBG-03', ...emptyInspection, warrantyStart: '2024/04/01' },
  ],
  '5': [
    { id: 9, managementDept: '臨床工学部', installDept: '放射線科', qrLabel: 'QR-2025-0070', itemName: 'MRI装置', maker: 'フィリップス', model: 'Ingenia Ambition', ...emptyInspection, warrantyStart: '2026/02/01' },
  ],
  '6': [
    { id: 10, managementDept: '施設管理部', installDept: '本館', qrLabel: 'QR-2025-0090', itemName: 'エレベーター', maker: '三菱電機', model: 'NEXIEZ-MR', ...emptyInspection, warrantyStart: '2025/04/01', legalInspection: true, legalInspectionBasis: '資産M' },
    { id: 11, managementDept: '施設管理部', installDept: '別館', qrLabel: 'QR-2025-0091', itemName: 'エレベーター', maker: '三菱電機', model: 'NEXIEZ-MR', ...emptyInspection, warrantyStart: '2025/04/01', legalInspection: true, legalInspectionBasis: '資産M' },
  ],
};

interface SelectedAsset {
  qrCode: string;
  item: string;
  maker: string;
  model: string;
  department: string;
  section: string;
}

interface MaintenanceContractStore {
  contracts: MaintenanceContract[];
  contractAssets: Record<string, ContractGroupAsset[]>;
  addContract: (data: {
    contractGroupName: string;
    contractType: ContractType;
    otherContractName: string;
    // 契約終了日 (API設計準拠: 契約期間終了日に一本化)
    endDate: string;
    comment: string;
    selectedAssets: SelectedAsset[];
  }) => void;
  updateContract: (id: string, data: Partial<MaintenanceContract>) => void;
  deleteContract: (id: string) => void;
  setContractAssets: (contractId: string, assets: ContractGroupAsset[]) => void;
}

export const useMaintenanceContractStore = create<MaintenanceContractStore>((set) => ({
  contracts: initialContracts,
  contractAssets: initialContractAssets,

  addContract: (data) => {
    const contractId = `MC-${Date.now()}`;
    const newContract: MaintenanceContract = {
      id: contractId,
      applicationNo: `MC-2026-${String(Date.now()).slice(-3)}`,
      contractGroupName: data.contractGroupName,
      contractType: data.contractType,
      contractTypeNote: data.contractType === 'その他' ? data.otherContractName : '',
      contractDate: '',
      contractStartDate: '',
      contractEndDate: data.endDate,
      contractAmount: 0,
      annualAmount: 0,
      contractorName: '',
      contractorPerson: '',
      contractorPhone: '',
      warrantyEndDate: '',
      comment: data.comment,
      currentStep: 1,
    };

    const assets: ContractGroupAsset[] = data.selectedAssets.map((a, i) => ({
      id: Date.now() + i,
      managementDept: a.department || '',
      installDept: a.section || '',
      qrLabel: a.qrCode,
      itemName: a.item,
      maker: a.maker,
      model: a.model,
      inspectionGroupName: '',
      inspectionType: '',
      inspectionCycle: '',
      warrantyStart: '',
      warrantyEnd: '',
      partsExemption: false,
      exemptionAmount: '',
      onCall: false,
      remote: false,
      legalInspection: false,
      legalInspectionBasis: '',
      comment: '',
      estimatedMaintenanceCost: '',
    }));

    set((state) => ({
      contracts: [...state.contracts, newContract],
      contractAssets: { ...state.contractAssets, [contractId]: assets },
    }));
  },

  updateContract: (id, data) => {
    set((state) => ({
      contracts: state.contracts.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  },

  deleteContract: (id) => {
    set((state) => ({ contracts: state.contracts.filter((c) => c.id !== id) }));
  },

  setContractAssets: (contractId, assets) => {
    set((state) => ({
      contractAssets: { ...state.contractAssets, [contractId]: assets },
    }));
  },
}));
