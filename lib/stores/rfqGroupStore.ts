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

// テストデータ（全7ステータスパターン + 資産仮登録用）
const testRfqGroups: RfqGroup[] = [
  {
    id: 1,
    rfqNo: 'RFQ-20250110-0001',
    groupName: '2025年度放射線科機器更新',
    createdDate: '2025-01-10',
    applicationIds: [1],
    status: '見積依頼',
    vendorName: 'シーメンス・ジャパン',
    personInCharge: '山田太郎',
    email: 'yamada@siemens.co.jp',
    tel: '03-1234-5678',
  },
  {
    id: 2,
    rfqNo: 'RFQ-20250111-0002',
    groupName: '2025年度循環器科新規導入',
    createdDate: '2025-01-11',
    applicationIds: [2],
    status: '見積依頼済',
    vendorName: 'GEヘルスケア',
    personInCharge: '鈴木一郎',
    email: 'suzuki@gehealthcare.co.jp',
    tel: '03-2345-6789',
    deadline: '2025-02-15',
  },
  {
    id: 3,
    rfqNo: 'RFQ-20250113-0003',
    groupName: '2025年度検査科・手術室機器更新',
    createdDate: '2025-01-13',
    applicationIds: [3],
    status: '見積登録済',
    vendorName: 'フィリップス・ジャパン',
    personInCharge: '佐藤花子',
    email: 'sato@philips.co.jp',
    tel: '03-3456-7890',
    deadline: '2025-03-31',
  },
  {
    id: 4,
    rfqNo: 'RFQ-20250115-0004',
    groupName: '2025年度内視鏡センター機器',
    createdDate: '2025-01-15',
    applicationIds: [4],
    status: '発注登録済',
    vendorName: 'オリンパス',
    personInCharge: '田中次郎',
    email: 'tanaka@olympus.co.jp',
    tel: '03-4567-8901',
    deadline: '2025-04-30',
  },
  {
    id: 5,
    rfqNo: 'RFQ-20250120-0005',
    groupName: '2025年度リハビリ科機器導入',
    createdDate: '2025-01-20',
    applicationIds: [5],
    status: '検収登録済',
    vendorName: 'キヤノンメディカル',
    personInCharge: '高橋美咲',
    email: 'takahashi@canon-med.co.jp',
    tel: '03-5678-9012',
  },
  {
    id: 6,
    rfqNo: 'RFQ-20250122-0006',
    groupName: '2025年度眼科機器更新',
    createdDate: '2025-01-22',
    applicationIds: [6],
    status: '資産仮登録済',
    vendorName: 'トプコン',
    personInCharge: '中村健一',
    email: 'nakamura@topcon.co.jp',
    tel: '03-6789-0123',
    deadline: '2025-06-30',
  },
  {
    id: 7,
    rfqNo: 'RFQ-20250125-0007',
    groupName: '2024年度病理科機器更新',
    createdDate: '2025-01-25',
    applicationIds: [7],
    status: '資産登録済',
    vendorName: '島津製作所',
    personInCharge: '伊藤裕子',
    email: 'ito@shimadzu.co.jp',
    tel: '03-7890-1234',
  },
  // 資産仮登録テスト用（発注データと紐付き）
  {
    id: 8,
    rfqNo: 'RFQ-20250128-0008',
    groupName: '2025年度内視鏡センター機器（検収済）',
    createdDate: '2025-01-28',
    applicationIds: [4],
    status: '検収登録済',
    vendorName: 'オリンパス',
    personInCharge: '田中次郎',
    email: 'tanaka@olympus.co.jp',
    tel: '03-4567-8901',
    deadline: '2025-05-31',
  },
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
