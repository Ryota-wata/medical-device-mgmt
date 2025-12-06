import { create } from 'zustand';
import { RfqGroup } from '@/lib/types';

interface RfqGroupState {
  rfqGroups: RfqGroup[];
  addRfqGroup: (rfqGroup: Omit<RfqGroup, 'id'>) => void;
  updateRfqGroup: (id: number, updates: Partial<RfqGroup>) => void;
  deleteRfqGroup: (id: number) => void;
  getRfqGroupById: (id: number) => RfqGroup | undefined;
  generateRfqNo: () => string;
}

// テストデータ
const testRfqGroups: RfqGroup[] = [
  {
    id: 1,
    rfqNo: 'RFQ-20250110-0001',
    groupName: '2025年度放射線科機器更新',
    createdDate: '2025-01-10',
    applicationIds: [1, 3],
    status: '見積書受領'
  },
  {
    id: 2,
    rfqNo: 'RFQ-20250111-0002',
    groupName: '2025年度循環器科新規導入',
    createdDate: '2025-01-11',
    applicationIds: [2],
    status: '送信済み'
  },
  {
    id: 3,
    rfqNo: 'RFQ-20250113-0003',
    groupName: '2025年度検査科・手術室機器更新',
    createdDate: '2025-01-13',
    applicationIds: [4, 5],
    status: '未送信'
  }
];

export const useRfqGroupStore = create<RfqGroupState>((set, get) => ({
  rfqGroups: testRfqGroups,

  addRfqGroup: (rfqGroup) => {
    const newId = get().rfqGroups.length > 0
      ? Math.max(...get().rfqGroups.map(g => g.id)) + 1
      : 1;

    const newRfqGroup: RfqGroup = {
      ...rfqGroup,
      id: newId,
    };

    set((state) => ({
      rfqGroups: [...state.rfqGroups, newRfqGroup],
    }));
  },

  updateRfqGroup: (id, updates) => {
    set((state) => ({
      rfqGroups: state.rfqGroups.map((group) =>
        group.id === id ? { ...group, ...updates } : group
      ),
    }));
  },

  deleteRfqGroup: (id) => {
    set((state) => ({
      rfqGroups: state.rfqGroups.filter((group) => group.id !== id),
    }));
  },

  getRfqGroupById: (id) => {
    return get().rfqGroups.find((group) => group.id === id);
  },

  generateRfqNo: () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const sequence = String(get().rfqGroups.length + 1).padStart(4, '0');

    return `RFQ-${year}${month}${day}-${sequence}`;
  },
}));
