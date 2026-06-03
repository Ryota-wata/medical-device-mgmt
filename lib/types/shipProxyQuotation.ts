// SHIP代理見積依頼 — 病院ユーザーが見積書PDFをアップロード→
// SHIP代理見積ユーザーがOCR〜見積DB登録までを代行 (2026-06-03 新規要求)

export type ShipProxyQuotationStatus =
  | '依頼中'       // 病院から SHIP に依頼済、SHIP 未着手
  | 'SHIP作業中'   // SHIP代理見積ユーザーが OCR/紐付け作業中
  | '完了'         // 見積DB登録済、病院の購入タスクに反映済
  | '差戻';        // SHIP から病院に差戻 (ファイル不備等)

export type QuotationPhase = '定価見積' | '概算見積' | '発注登録用見積';
export type SaveFormat = '電子取引' | 'スキャナ保存' | '未指定';

export interface ShipProxyQuotation {
  id: string;
  requestNo: string;            // SPQ-YYYYMMDD-NNNN
  requestedAt: string;
  // 病院側情報
  hospitalId: string;
  hospitalName: string;
  rfqGroupId: number;           // 関連する見積依頼グループ
  rfqGroupName: string;
  // 添付ファイル
  attachedFileName: string;
  // 入力内容
  applicantId: string;
  applicantName: string;
  quotationPhase: QuotationPhase;
  saveFormat: SaveFormat;
  vendorName?: string;
  registrationDeadline?: string;
  // ステータス
  status: ShipProxyQuotationStatus;
  // SHIP側作業情報 (完了時)
  shipUserName?: string;
  completedAt?: string;
  quotationDbId?: string;       // 登録された見積DB ID
  rejectReason?: string;        // 差戻時の理由
}
