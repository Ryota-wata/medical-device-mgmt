import { create } from 'zustand';
import { OrderGroup, OrderItem } from '@/lib/types';

// テストデータ: rfqGroupId=4（発注登録済）に対応
const testOrderGroups: OrderGroup[] = [
  {
    id: 1,
    orderNo: 'PO-20250130-0001',
    rfqGroupId: 4,
    rfqNo: 'RFQ-20250115-0004',
    groupName: '2025年度内視鏡センター機器',
    vendorName: 'オリンパス',
    applicant: '田中次郎',
    applicantEmail: 'tanaka@olympus.co.jp',
    orderType: '購入',
    deliveryDate: '2025-04-30',
    paymentTerms: '検収後一括',
    inspectionCertType: '本体のみ',
    storageFormat: '未指定',
    totalAmount: 12650000,
    orderDate: '2025-01-30',
    createdAt: '2025-01-30T10:00:00.000Z',
    updatedAt: '2025-01-30T10:00:00.000Z',
  },
];

const testOrderItems: OrderItem[] = [
  // 本体
  {
    id: 1,
    orderGroupId: 1,
    quotationItemId: 1,
    itemName: '内視鏡システム EVIS X1',
    manufacturer: 'オリンパス',
    model: 'CV-1500',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 8800000,
    totalPrice: 8800000,
  },
  {
    id: 2,
    orderGroupId: 1,
    quotationItemId: 2,
    itemName: '上部消化管汎用ビデオスコープ',
    manufacturer: 'オリンパス',
    model: 'GIF-1100',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 1650000,
    totalPrice: 1650000,
  },
  {
    id: 3,
    orderGroupId: 1,
    quotationItemId: 2,
    itemName: '上部消化管汎用ビデオスコープ',
    manufacturer: 'オリンパス',
    model: 'GIF-1100',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 1650000,
    totalPrice: 1650000,
  },
  {
    id: 4,
    orderGroupId: 1,
    quotationItemId: 3,
    itemName: '内視鏡洗浄消毒装置',
    manufacturer: 'オリンパス',
    model: 'OER-5',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 550000,
    totalPrice: 550000,
  },
  // 付属品
  {
    id: 5,
    orderGroupId: 1,
    quotationItemId: 1,
    itemName: '内視鏡用モニター',
    manufacturer: 'オリンパス',
    model: 'OEV-262H',
    registrationType: '付属品',
    quantity: 1,
    unitPrice: 450000,
    totalPrice: 450000,
  },
  {
    id: 6,
    orderGroupId: 1,
    quotationItemId: 1,
    itemName: '内視鏡用トロリー',
    manufacturer: 'オリンパス',
    model: 'WM-NP1',
    registrationType: '付属品',
    quantity: 1,
    unitPrice: 180000,
    totalPrice: 180000,
  },
  {
    id: 7,
    orderGroupId: 1,
    quotationItemId: 3,
    itemName: '洗浄チューブセット',
    manufacturer: 'オリンパス',
    model: 'MAJ-1888',
    registrationType: '付属品',
    quantity: 1,
    unitPrice: 35000,
    totalPrice: 35000,
  },
];

interface OrderState {
  orderGroups: OrderGroup[];
  orderItems: OrderItem[];

  addOrderGroup: (group: Omit<OrderGroup, 'id' | 'createdAt' | 'updatedAt'>) => number;
  updateOrderGroup: (id: number, updates: Partial<OrderGroup>) => void;
  getOrderGroupById: (id: number) => OrderGroup | undefined;
  getOrderGroupByRfqGroupId: (rfqGroupId: number) => OrderGroup | undefined;

  addOrderItems: (items: Omit<OrderItem, 'id'>[]) => void;
  getOrderItemsByGroupId: (orderGroupId: number) => OrderItem[];

  generateOrderNo: () => string;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orderGroups: testOrderGroups,
  orderItems: testOrderItems,

  addOrderGroup: (group) => {
    const now = new Date().toISOString();
    const newId = get().orderGroups.length > 0
      ? Math.max(...get().orderGroups.map(g => g.id)) + 1
      : 1;

    const newGroup: OrderGroup = {
      ...group,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      orderGroups: [...state.orderGroups, newGroup],
    }));

    return newId;
  },

  updateOrderGroup: (id, updates) => {
    set((state) => ({
      orderGroups: state.orderGroups.map((group) =>
        group.id === id
          ? { ...group, ...updates, updatedAt: new Date().toISOString() }
          : group
      ),
    }));
  },

  getOrderGroupById: (id) => {
    return get().orderGroups.find((group) => group.id === id);
  },

  getOrderGroupByRfqGroupId: (rfqGroupId) => {
    return get().orderGroups.find((group) => group.rfqGroupId === rfqGroupId);
  },

  addOrderItems: (items) => {
    const currentMax = get().orderItems.length > 0
      ? Math.max(...get().orderItems.map(i => i.id))
      : 0;

    const newItems: OrderItem[] = items.map((item, index) => ({
      ...item,
      id: currentMax + index + 1,
    }));

    set((state) => ({
      orderItems: [...state.orderItems, ...newItems],
    }));
  },

  getOrderItemsByGroupId: (orderGroupId) => {
    return get().orderItems.filter((item) => item.orderGroupId === orderGroupId);
  },

  generateOrderNo: () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const sequence = String(get().orderGroups.length + 1).padStart(4, '0');

    return `PO-${year}${month}${day}-${sequence}`;
  },
}));
