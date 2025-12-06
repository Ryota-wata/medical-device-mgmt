import { create } from 'zustand';
import { Application } from '@/lib/types';

interface ApplicationState {
  applications: Application[];
  addApplication: (application: Omit<Application, 'id'>) => void;
  updateApplication: (id: number, application: Partial<Application>) => void;
  deleteApplication: (id: number) => void;
  getApplicationById: (id: number) => Application | undefined;
}

// テストデータ
const testApplications: Application[] = [
  {
    id: 1,
    applicationNo: 'APP-2025-001',
    applicationDate: '2025-01-10',
    applicationType: '更新申請',
    facility: {
      facilityNo: '001',
      building: '本館',
      floor: '3F',
      department: '放射線科',
      section: 'MRI室'
    },
    roomName: 'MRI検査室1',
    asset: {
      assetNo: 'AST-001',
      name: 'MRI装置',
      model: 'MAGNETOM Altea 1.5T'
    },
    vendor: 'シーメンスヘルスケア',
    quantity: 1,
    unit: '台',
    currentConnectionStatus: '電源接続',
    currentConnectionDestination: '専用電源',
    requestConnectionStatus: '電源接続',
    requestConnectionDestination: '専用電源',
    applicationReason: '老朽化による更新',
    executionYear: '2025',
    rfqNo: 'RFQ-20250110-0001',
    quotationInfo: [
      {
        quotationId: '001-2025-01-001',
        quotationDate: '2025-01-15',
        vendor: '株式会社メディカルサプライ',
        ocrItemName: 'MRI装置 MAGNETOM Altea',
        assetMaster: {
          itemId: '5',
          itemName: 'MRI装置',
          largeName: '画像診断機器',
          mediumName: 'MRI'
        },
        quantity: 1,
        unitPrice: 100000000,
        amount: 100000000
      },
      {
        quotationId: '001-2025-01-001',
        quotationDate: '2025-01-15',
        vendor: '株式会社メディカルサプライ',
        ocrItemName: 'MRI用頭部コイル',
        assetMaster: {
          itemId: '',
          itemName: '',
          largeName: '',
          mediumName: ''
        },
        quantity: 2,
        unitPrice: 1800000,
        amount: 3600000
      },
      {
        quotationId: '001-2025-01-001',
        quotationDate: '2025-01-15',
        vendor: '株式会社メディカルサプライ',
        ocrItemName: '設置工事費',
        assetMaster: {
          itemId: '',
          itemName: '',
          largeName: '',
          mediumName: ''
        },
        quantity: 1,
        unitPrice: 5000000,
        amount: 5000000
      }
    ]
  },
  {
    id: 2,
    applicationNo: 'APP-2025-002',
    applicationDate: '2025-01-11',
    applicationType: '新規申請',
    facility: {
      facilityNo: '001',
      building: '本館',
      floor: '2F',
      department: '循環器科',
      section: '検査室'
    },
    roomName: '心臓カテーテル室',
    asset: {
      assetNo: 'AST-002',
      name: '血管造影装置',
      model: 'Azurion 7'
    },
    vendor: 'フィリップス',
    quantity: 1,
    unit: '台',
    applicationReason: '新規導入',
    executionYear: '2025',
    quotationInfo: []
  },
  {
    id: 3,
    applicationNo: 'APP-2025-003',
    applicationDate: '2025-01-12',
    applicationType: '更新申請',
    facility: {
      facilityNo: '001',
      building: '本館',
      floor: '3F',
      department: '放射線科',
      section: 'CT室'
    },
    roomName: 'CT検査室1',
    asset: {
      assetNo: 'AST-003',
      name: 'CT装置',
      model: 'Aquilion ONE'
    },
    vendor: 'キヤノンメディカル',
    quantity: 1,
    unit: '台',
    applicationReason: '老朽化による更新',
    executionYear: '2025',
    rfqNo: 'RFQ-20250110-0001',
    quotationInfo: [
      {
        quotationId: '001-2025-01-002',
        quotationDate: '2025-01-16',
        vendor: '東日本メディカル株式会社',
        ocrItemName: 'CT装置 Aquilion ONE',
        assetMaster: {
          itemId: '3',
          itemName: 'CT装置',
          largeName: '画像診断機器',
          mediumName: 'CT'
        },
        quantity: 1,
        unitPrice: 75000000,
        amount: 75000000
      },
      {
        quotationId: '001-2025-01-002',
        quotationDate: '2025-01-16',
        vendor: '東日本メディカル株式会社',
        ocrItemName: '設置工事費',
        assetMaster: {
          itemId: '',
          itemName: '',
          largeName: '',
          mediumName: ''
        },
        quantity: 1,
        unitPrice: 3000000,
        amount: 3000000
      }
    ]
  },
  {
    id: 4,
    applicationNo: 'APP-2025-004',
    applicationDate: '2025-01-13',
    applicationType: '増設申請',
    facility: {
      facilityNo: '001',
      building: '本館',
      floor: '1F',
      department: '検査科',
      section: '生化学検査室'
    },
    roomName: '生化学検査室',
    asset: {
      assetNo: 'AST-004',
      name: '自動分析装置',
      model: 'JCA-BM8000'
    },
    vendor: '日本電子',
    quantity: 1,
    unit: '台',
    applicationReason: '検査数増加対応',
    executionYear: '2025',
    quotationInfo: []
  },
  {
    id: 5,
    applicationNo: 'APP-2025-005',
    applicationDate: '2025-01-14',
    applicationType: '更新申請',
    facility: {
      facilityNo: '001',
      building: '本館',
      floor: '4F',
      department: '手術室',
      section: '中央手術室'
    },
    roomName: '手術室1',
    asset: {
      assetNo: 'AST-005',
      name: '手術台',
      model: 'ALPHAMAXX'
    },
    vendor: 'マッケ',
    quantity: 1,
    unit: '台',
    applicationReason: '老朽化による更新',
    executionYear: '2025',
    quotationInfo: []
  }
];

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: testApplications,

  addApplication: (application) => {
    const newId = get().applications.length > 0
      ? Math.max(...get().applications.map(a => a.id)) + 1
      : 1;

    const newApplication: Application = {
      ...application,
      id: newId,
    };

    set((state) => ({
      applications: [...state.applications, newApplication],
    }));
  },

  updateApplication: (id, updates) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id ? { ...app, ...updates } : app
      ),
    }));
  },

  deleteApplication: (id) => {
    set((state) => ({
      applications: state.applications.filter((app) => app.id !== id),
    }));
  },

  getApplicationById: (id) => {
    return get().applications.find((app) => app.id === id);
  },
}));
