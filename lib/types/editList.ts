/**
 * 編集リストの型定義
 */

/**
 * 編集リスト
 */
export interface EditList {
  id: string;
  name: string;
  facilities: string[];  // 関連する施設名の配列
  createdAt: string;
  updatedAt: string;
}

/**
 * 編集リスト作成用データ
 */
export interface CreateEditListInput {
  name: string;
  facilities: string[];
}
