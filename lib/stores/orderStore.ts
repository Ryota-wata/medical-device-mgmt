import { create } from 'zustand';
import { OrderGroup, OrderItem } from '@/lib/types';

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
  orderGroups: [],
  orderItems: [],

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
