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
  generateReceivedQuotationNo: (facilityNo: string) => string;
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
    itemType: 'C_個体管理品目',
    itemName: 'MRI装置 MAGNETOM Altea',
    manufacturer: 'シーメンスヘルスケア',
    model: 'MAGNETOM Altea 1.5T',
    quantity: 1,
    unit: '台',
    listPriceUnit: 120000000,
    listPriceTotal: 120000000,
    sellingPriceUnit: 100000000,
    sellingPriceTotal: 100000000,
    discount: 16.7,
    taxRate: 10,
    totalWithTax: 110000000,
    assetMasterId: '5', // MRI装置
    linkedApplicationIds: [1],
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z'
  },
  {
    id: 2,
    quotationGroupId: 1,
    receivedQuotationNo: '001-2025-01-001',
    itemType: 'D_付属品',
    itemName: 'MRI用頭部コイル',
    manufacturer: 'シーメンスヘルスケア',
    model: 'Head Coil 64ch',
    quantity: 2,
    unit: '個',
    listPriceUnit: 2000000,
    listPriceTotal: 4000000,
    sellingPriceUnit: 1800000,
    sellingPriceTotal: 3600000,
    discount: 10,
    taxRate: 10,
    totalWithTax: 3960000,
    linkedApplicationIds: [1],
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z'
  },
  {
    id: 3,
    quotationGroupId: 1,
    receivedQuotationNo: '001-2025-01-001',
    itemType: 'E_その他役務',
    itemName: '設置工事費',
    manufacturer: '',
    model: '',
    quantity: 1,
    unit: '式',
    listPriceUnit: 5000000,
    listPriceTotal: 5000000,
    sellingPriceUnit: 5000000,
    sellingPriceTotal: 5000000,
    discount: 0,
    taxRate: 10,
    totalWithTax: 5500000,
    linkedApplicationIds: [1],
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z'
  },
  // 見積2の明細
  {
    id: 4,
    quotationGroupId: 2,
    receivedQuotationNo: '001-2025-01-002',
    itemType: 'C_個体管理品目',
    itemName: 'CT装置 Aquilion ONE',
    manufacturer: 'キヤノンメディカルシステムズ',
    model: 'Aquilion ONE',
    quantity: 1,
    unit: '台',
    listPriceUnit: 90000000,
    listPriceTotal: 90000000,
    sellingPriceUnit: 75000000,
    sellingPriceTotal: 75000000,
    discount: 16.7,
    taxRate: 10,
    totalWithTax: 82500000,
    assetMasterId: '3', // CT装置
    linkedApplicationIds: [3],
    createdAt: '2025-01-16T10:00:00.000Z',
    updatedAt: '2025-01-16T10:00:00.000Z'
  },
  {
    id: 5,
    quotationGroupId: 2,
    receivedQuotationNo: '001-2025-01-002',
    itemType: 'E_その他役務',
    itemName: '設置工事費',
    manufacturer: '',
    model: '',
    quantity: 1,
    unit: '式',
    listPriceUnit: 3000000,
    listPriceTotal: 3000000,
    sellingPriceUnit: 3000000,
    sellingPriceTotal: 3000000,
    discount: 0,
    taxRate: 10,
    totalWithTax: 3300000,
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
