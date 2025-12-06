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
}

export type RfqGroupStatus =
  | '未送信'
  | '送信済み'
  | '回答待ち'
  | '回答受領'
  | '完了';
