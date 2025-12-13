import { create } from 'zustand';
import { ReceivedQuotationGroup, ReceivedQuotationItem } from '@/lib/types';

interface QuotationState {
  // 見積グループ（ヘッダー情報）
  quotationGroups: ReceivedQuotationGroup[];
  // 見積明細（個別レコード）
  quotationItems: ReceivedQuotationItem[];

  // グループ操作
  addQuotationGroup: (group: Omit<ReceivedQuotationGroup, 'id' | 'createdAt' | 'updatedAt'>) => number;
  updateQuotationGroup: (id: number, updates: Partial<ReceivedQuotationGroup>) => void;
  deleteQuotationGroup: (id: number) => void;
  getQuotationGroupById: (id: number) => ReceivedQuotationGroup | undefined;
  getQuotationGroupsByRfqGroupId: (rfqGroupId: number) => ReceivedQuotationGroup[];

  // 明細操作
  addQuotationItem: (item: Omit<ReceivedQuotationItem, 'id' | 'createdAt' | 'updatedAt'>) => number;
  addQuotationItems: (items: Omit<ReceivedQuotationItem, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  updateQuotationItem: (id: number, updates: Partial<ReceivedQuotationItem>) => void;
  deleteQuotationItem: (id: number) => void;
  getQuotationItemById: (id: number) => ReceivedQuotationItem | undefined;
  getQuotationItemsByGroupId: (quotationGroupId: number) => ReceivedQuotationItem[];
  linkItemToApplication: (itemId: number, applicationId: number) => void;
  unlinkItemFromApplication: (itemId: number, applicationId: number) => void;

  // ユーティリティ
  generateReceivedQuotationNo: (facilityNo?: string) => string;
}

// テストデータ
const testQuotationGroups: ReceivedQuotationGroup[] = [
  {
    id: 1,
    receivedQuotationNo: '001-2025-01-001',
    rfqGroupId: 1,
    rfqNo: 'RFQ-20250110-0001',
    vendorName: '株式会社メディカルサプライ',
    vendorNo: 'V-001',
    vendorContact: '営業部 田中',
    vendorEmail: 'tanaka@medical-supply.co.jp',
    quotationDate: '2025-01-15',
    validityPeriod: 3,
    deliveryPeriod: 2,
    phase: '確定見積',
    totalAmount: 119460000,
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z'
  },
  {
    id: 2,
    receivedQuotationNo: '001-2025-01-002',
    rfqGroupId: 1,
    rfqNo: 'RFQ-20250110-0001',
    vendorName: '東日本メディカル株式会社',
    vendorContact: '営業部 佐藤',
    quotationDate: '2025-01-16',
    validityPeriod: 3,
    deliveryPeriod: 3,
    phase: '確定見積',
    totalAmount: 85500000,
    createdAt: '2025-01-16T10:00:00.000Z',
    updatedAt: '2025-01-16T10:00:00.000Z'
  }
];

const testQuotationItems: ReceivedQuotationItem[] = [
  // 見積1の明細
  {
    id: 1,
    quotationGroupId: 1,
    receivedQuotationNo: '001-2025-01-001',
    // 商品情報（原本情報）
    rowNo: 1,
    originalItemName: 'MRI装置 MAGNETOM Altea',
    originalManufacturer: 'シーメンスヘルスケア',
    originalModel: 'MAGNETOM Altea 1.5T',
    originalQuantity: 1,
    // AI判定・資産マスタ情報
    itemType: 'C_個体管理品目',
    category: '01医療機器',
    largeClass: '10画像診断機器',
    middleClass: '02MRI',
    itemName: 'MRI装置 MAGNETOM Altea',
    manufacturer: 'シーメンスヘルスケア',
    model: 'MAGNETOM Altea 1.5T',
    aiQuantity: 1,
    // 見積依頼No・枝番
    rfqNo: 'RFQ-20250110-0001',
    branchNo: 1,
    // 価格情報（原本情報）
    unit: '台',
    listPriceUnit: 120000000,
    listPriceTotal: 120000000,
    purchasePriceUnit: 100000000,
    purchasePriceTotal: 100000000,
    remarks: '',
    // 価格情報（按分登録）
    allocListPriceUnit: 120000000,
    allocListPriceTotal: 120000000,
    allocPriceUnit: 100000000,
    allocDiscount: 16.7,
    allocTaxRate: 10,
    allocTaxTotal: 110000000,
    accountTitle: '医療機器',
    // その他
    assetMasterId: '5',
    linkedApplicationIds: [1],
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z'
  },
  {
    id: 2,
    quotationGroupId: 1,
    receivedQuotationNo: '001-2025-01-001',
    rowNo: 2,
    originalItemName: 'MRI用頭部コイル',
    originalManufacturer: 'シーメンスヘルスケア',
    originalModel: 'Head Coil 64ch',
    originalQuantity: 2,
    itemType: 'D_付属品',
    category: '01医療機器',
    largeClass: '10画像診断機器',
    middleClass: '02MRI(付属品)',
    itemName: 'MRI用頭部コイル',
    manufacturer: 'シーメンスヘルスケア',
    model: 'Head Coil 64ch',
    aiQuantity: 2,
    rfqNo: 'RFQ-20250110-0001',
    unit: '個',
    listPriceUnit: 2000000,
    listPriceTotal: 4000000,
    purchasePriceUnit: 1800000,
    purchasePriceTotal: 3600000,
    remarks: '',
    allocListPriceUnit: 2000000,
    allocListPriceTotal: 4000000,
    allocPriceUnit: 1800000,
    allocDiscount: 10,
    allocTaxRate: 10,
    allocTaxTotal: 3960000,
    accountTitle: '医療機器',
    linkedApplicationIds: [1],
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z'
  },
  {
    id: 3,
    quotationGroupId: 1,
    receivedQuotationNo: '001-2025-01-001',
    rowNo: 3,
    originalItemName: '設置工事費',
    originalQuantity: 1,
    itemType: 'E_その他役務',
    itemName: '設置工事費',
    manufacturer: '',
    model: '',
    aiQuantity: 1,
    rfqNo: 'RFQ-20250110-0001',
    unit: '式',
    listPriceUnit: 5000000,
    listPriceTotal: 5000000,
    purchasePriceUnit: 5000000,
    purchasePriceTotal: 5000000,
    remarks: '',
    allocListPriceUnit: 5000000,
    allocListPriceTotal: 5000000,
    allocPriceUnit: 5000000,
    allocDiscount: 0,
    allocTaxRate: 10,
    allocTaxTotal: 5500000,
    accountTitle: '委託費',
    linkedApplicationIds: [1],
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z'
  },
  // 見積2の明細
  {
    id: 4,
    quotationGroupId: 2,
    receivedQuotationNo: '001-2025-01-002',
    rowNo: 1,
    originalItemName: 'CT装置 Aquilion ONE',
    originalManufacturer: 'キヤノンメディカルシステムズ',
    originalModel: 'Aquilion ONE',
    originalQuantity: 1,
    itemType: 'C_個体管理品目',
    category: '01医療機器',
    largeClass: '10画像診断機器',
    middleClass: '01CT',
    itemName: 'CT装置 Aquilion ONE',
    manufacturer: 'キヤノンメディカルシステムズ',
    model: 'Aquilion ONE',
    aiQuantity: 1,
    rfqNo: 'RFQ-20250110-0001',
    branchNo: 1,
    unit: '台',
    listPriceUnit: 90000000,
    listPriceTotal: 90000000,
    purchasePriceUnit: 75000000,
    purchasePriceTotal: 75000000,
    remarks: '',
    allocListPriceUnit: 90000000,
    allocListPriceTotal: 90000000,
    allocPriceUnit: 75000000,
    allocDiscount: 16.7,
    allocTaxRate: 10,
    allocTaxTotal: 82500000,
    accountTitle: '医療機器',
    assetMasterId: '3',
    linkedApplicationIds: [3],
    createdAt: '2025-01-16T10:00:00.000Z',
    updatedAt: '2025-01-16T10:00:00.000Z'
  },
  {
    id: 5,
    quotationGroupId: 2,
    receivedQuotationNo: '001-2025-01-002',
    rowNo: 2,
    originalItemName: '設置工事費',
    originalQuantity: 1,
    itemType: 'E_その他役務',
    itemName: '設置工事費',
    manufacturer: '',
    model: '',
    aiQuantity: 1,
    rfqNo: 'RFQ-20250110-0001',
    unit: '式',
    listPriceUnit: 3000000,
    listPriceTotal: 3000000,
    purchasePriceUnit: 3000000,
    purchasePriceTotal: 3000000,
    remarks: '',
    allocListPriceUnit: 3000000,
    allocListPriceTotal: 3000000,
    allocPriceUnit: 3000000,
    allocDiscount: 0,
    allocTaxRate: 10,
    allocTaxTotal: 3300000,
    accountTitle: '委託費',
    linkedApplicationIds: [3],
    createdAt: '2025-01-16T10:00:00.000Z',
    updatedAt: '2025-01-16T10:00:00.000Z'
  }
];

export const useQuotationStore = create<QuotationState>((set, get) => ({
  quotationGroups: testQuotationGroups,
  quotationItems: testQuotationItems,

  // グループ操作
  addQuotationGroup: (group) => {
    const newId = get().quotationGroups.length > 0
      ? Math.max(...get().quotationGroups.map(g => g.id)) + 1
      : 1;

    const now = new Date().toISOString();
    const newGroup: ReceivedQuotationGroup = {
      ...group,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      quotationGroups: [...state.quotationGroups, newGroup],
    }));

    return newId;
  },

  updateQuotationGroup: (id, updates) => {
    set((state) => ({
      quotationGroups: state.quotationGroups.map((group) =>
        group.id === id
          ? { ...group, ...updates, updatedAt: new Date().toISOString() }
          : group
      ),
    }));
  },

  deleteQuotationGroup: (id) => {
    // グループを削除すると、紐づく明細も削除
    set((state) => ({
      quotationGroups: state.quotationGroups.filter((group) => group.id !== id),
      quotationItems: state.quotationItems.filter((item) => item.quotationGroupId !== id),
    }));
  },

  getQuotationGroupById: (id) => {
    return get().quotationGroups.find((group) => group.id === id);
  },

  getQuotationGroupsByRfqGroupId: (rfqGroupId) => {
    return get().quotationGroups.filter((group) => group.rfqGroupId === rfqGroupId);
  },

  // 明細操作
  addQuotationItem: (item) => {
    const newId = get().quotationItems.length > 0
      ? Math.max(...get().quotationItems.map(i => i.id)) + 1
      : 1;

    const now = new Date().toISOString();
    const newItem: ReceivedQuotationItem = {
      ...item,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      quotationItems: [...state.quotationItems, newItem],
    }));

    return newId;
  },

  addQuotationItems: (items) => {
    const currentMaxId = get().quotationItems.length > 0
      ? Math.max(...get().quotationItems.map(i => i.id))
      : 0;

    const now = new Date().toISOString();
    const newItems: ReceivedQuotationItem[] = items.map((item, index) => ({
      ...item,
      id: currentMaxId + index + 1,
      createdAt: now,
      updatedAt: now,
    }));

    set((state) => ({
      quotationItems: [...state.quotationItems, ...newItems],
    }));
  },

  updateQuotationItem: (id, updates) => {
    set((state) => ({
      quotationItems: state.quotationItems.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      ),
    }));
  },

  deleteQuotationItem: (id) => {
    set((state) => ({
      quotationItems: state.quotationItems.filter((item) => item.id !== id),
    }));
  },

  getQuotationItemById: (id) => {
    return get().quotationItems.find((item) => item.id === id);
  },

  getQuotationItemsByGroupId: (quotationGroupId) => {
    return get().quotationItems.filter((item) => item.quotationGroupId === quotationGroupId);
  },

  linkItemToApplication: (itemId, applicationId) => {
    const item = get().quotationItems.find((i) => i.id === itemId);
    if (!item) return;

    const currentLinkedIds = item.linkedApplicationIds || [];
    if (currentLinkedIds.includes(applicationId)) return;

    get().updateQuotationItem(itemId, {
      linkedApplicationIds: [...currentLinkedIds, applicationId],
    });
  },

  unlinkItemFromApplication: (itemId, applicationId) => {
    const item = get().quotationItems.find((i) => i.id === itemId);
    if (!item) return;

    const currentLinkedIds = item.linkedApplicationIds || [];
    get().updateQuotationItem(itemId, {
      linkedApplicationIds: currentLinkedIds.filter((id) => id !== applicationId),
    });
  },

  generateReceivedQuotationNo: (facilityNo: string = '001') => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // その日の連番を取得
    const todayPrefix = `${facilityNo}-${year}-${month}-`;
    const todayGroups = get().quotationGroups.filter(g =>
      g.receivedQuotationNo.startsWith(todayPrefix)
    );
    const sequence = String(todayGroups.length + 1).padStart(3, '0');

    return `${facilityNo}-${year}-${month}-${sequence}`;
  },
}));
