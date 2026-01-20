/**
 * 見積依頼グループの型定義
 */

export interface RfqGroup {
  id: number;
  rfqNo: string;
  groupName: string;
  createdDate: string;
  applicationIds: number[];
  status: RfqGroupStatus;
  vendorName?: string;
  personInCharge?: string;
  email?: string;
  tel?: string;
  deadline?: string;
}

export type RfqGroupStatus =
  | '下書き'
  | '未送信'
  | '見積依頼'
  | '見積依頼済'
  | '回答受領'
  | '登録依頼'
  | '見積登録済'
  | '原本登録用最終見積登録';
