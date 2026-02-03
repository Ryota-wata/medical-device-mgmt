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
  | '見積依頼'
  | '見積依頼済'
  | '見積登録済'
  | '発注登録済'
  | '検収登録済'
  | '資産仮登録済'
  | '資産登録済';
