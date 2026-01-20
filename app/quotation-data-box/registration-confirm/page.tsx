'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { QuotationItemType } from '@/lib/types/quotation';

// 登録区分の型
type RegistrationCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '';

// 基本情報の型（STEP1で登録した内容）
interface BasicInfo {
  // 前画面からの入力データ（固定）
  quotationPhase: string;       // 見積フェーズ
  rfqNo: string;                // 見積依頼No.
  rfqGroupName: string;         // 見積依頼G名称
  facilityName: string;         // 宛先（施設名）
  vendorName: string;           // 業者・メーカー（業者名）
  contact: string;              // 連絡先
  mail: string;                 // mail
  // OCR読み取り結果データ
  quotationDate: string;        // 見積日付
  invoiceNo: string;            // 事業者登録番号（インボイス）
  deliveryPeriod: string;       // 納期
  validityPeriod: string;       // 見積有効期限
}

// 登録明細データの型
interface RegistrationDetail {
  id: string;
  // 見積情報
  originalSeq: number;
  itemName: string;
  model: string;
  manufacturer: string;
  quantity: number | null;
  // 個体登録及び金額按分（前画面からの情報）
  category: RegistrationCategory; // 登録区分
  majorCategory: string;      // 大分類
  middleCategory: string;     // 中分類
  assetName: string;          // 個体管理品目
  assetManufacturer: string;  // メーカー（AI判定後）
  assetModel: string;         // 型式（AI判定後）
  seqId: string;              // SEQ_ID
  unit: string;               // 単位
  listUnitPrice: number | null;   // 定価単価
  allocatedUnitPrice: number | null; // 按分単価
  allocatedAmount: number | null;    // 按分金額
  parentSeqId: string;        // 親と紐付け
}

// テスト用基本情報（STEP1で登録した内容）
const testBasicInfo: BasicInfo = {
  // 前画面からの入力データ
  quotationPhase: '定価',
  rfqNo: 'RFQ-20250119-0001',
  rfqGroupName: '2025年度放射線科機器更新',
  facilityName: '医療法人○○会 ○○病院',
  vendorName: 'GEヘルスケア・ジャパン',
  contact: '03-1234-5678',
  mail: 'info@example.com',
  // OCR読み取り結果データ
  quotationDate: '2026/01/15',
  invoiceNo: 'T1234567890123',
  deliveryPeriod: '2026/03/31',
  validityPeriod: '2026/02/28',
};

// テスト用登録明細データ
const testRegistrationDetails: RegistrationDetail[] = [
  // B: 明細代表
  { id: '1', originalSeq: 1, itemName: '具象眼科用ユニット', model: 'さららEFUS01', manufacturer: '第一医科', quantity: 4, category: 'B', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: '具象眼科用ユニット', assetManufacturer: '第一医科', assetModel: 'さららEFUS01', seqId: '', unit: '台', listUnitPrice: 3300000, allocatedUnitPrice: 1650000, allocatedAmount: 6600000, parentSeqId: '' },
  // E: その他役務
  { id: '2', originalSeq: 2, itemName: '仕様', model: '', manufacturer: '第一医科', quantity: null, category: 'E', majorCategory: '', middleCategory: '', assetName: '仕様', assetManufacturer: '第一医科', assetModel: '', seqId: '', unit: '台', listUnitPrice: null, allocatedUnitPrice: null, allocatedAmount: null, parentSeqId: '' },
  // C: 個体管理品目（4台）
  { id: '3-1', originalSeq: 3, itemName: '具象眼科用ユニット', model: 'さらら', manufacturer: '第一医科', quantity: 4, category: 'C', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: '眼科用ユニット EFUS01', assetManufacturer: '第一医科', assetModel: 'EFUS01', seqId: '1', unit: '台', listUnitPrice: 3300000, allocatedUnitPrice: 1650000, allocatedAmount: 1650000, parentSeqId: '本体' },
  { id: '3-2', originalSeq: 3, itemName: '具象眼科用ユニット', model: 'さらら', manufacturer: '第一医科', quantity: 4, category: 'C', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: '眼科用ユニット EFUS01', assetManufacturer: '第一医科', assetModel: 'EFUS01', seqId: '2', unit: '台', listUnitPrice: 3300000, allocatedUnitPrice: 1650000, allocatedAmount: 1650000, parentSeqId: '本体' },
  { id: '3-3', originalSeq: 3, itemName: '具象眼科用ユニット', model: 'さらら', manufacturer: '第一医科', quantity: 4, category: 'C', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: '眼科用ユニット EFUS01', assetManufacturer: '第一医科', assetModel: 'EFUS01', seqId: '3', unit: '台', listUnitPrice: 3300000, allocatedUnitPrice: 1650000, allocatedAmount: 1650000, parentSeqId: '本体' },
  { id: '3-4', originalSeq: 3, itemName: '具象眼科用ユニット', model: 'さらら', manufacturer: '第一医科', quantity: 4, category: 'C', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: '眼科用ユニット EFUS01', assetManufacturer: '第一医科', assetModel: 'EFUS01', seqId: '4', unit: '台', listUnitPrice: 3300000, allocatedUnitPrice: 1650000, allocatedAmount: 1650000, parentSeqId: '本体' },
  // D: 付属品
  { id: '4', originalSeq: 4, itemName: 'ホース付きスプレー2本', model: '', manufacturer: '第一', quantity: null, category: 'D', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: 'ホース付きスプレー2本', assetManufacturer: '第一', assetModel: '', seqId: '', unit: '台', listUnitPrice: null, allocatedUnitPrice: null, allocatedAmount: null, parentSeqId: '' },
  { id: '5', originalSeq: 5, itemName: '吸引清掃式　ロック枠掛付', model: '', manufacturer: '第一医科', quantity: null, category: 'D', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: '吸引清掃式　ロック枠掛付', assetManufacturer: '第一医科', assetModel: '', seqId: '', unit: '台', listUnitPrice: null, allocatedUnitPrice: null, allocatedAmount: null, parentSeqId: '' },
  { id: '6', originalSeq: 6, itemName: '通気清掃式　ロック枠掛付', model: '', manufacturer: '第一医科', quantity: null, category: 'D', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: '通気清掃式　ロック枠掛付', assetManufacturer: '第一医科', assetModel: '', seqId: '', unit: '台', listUnitPrice: null, allocatedUnitPrice: null, allocatedAmount: null, parentSeqId: '' },
  // C: ツインボール
  { id: '7', originalSeq: 7, itemName: 'ツインボール', model: '', manufacturer: '第一医科', quantity: null, category: 'C', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: 'ツインボール（眼科用）', assetManufacturer: '第一医科', assetModel: '', seqId: '5', unit: '台', listUnitPrice: null, allocatedUnitPrice: null, allocatedAmount: null, parentSeqId: '本体' },
  // D: 付属品
  { id: '8', originalSeq: 8, itemName: '照明灯あり', model: '', manufacturer: '第一医科', quantity: null, category: 'D', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: '照明灯あり', assetManufacturer: '第一医科', assetModel: '', seqId: '', unit: '台', listUnitPrice: null, allocatedUnitPrice: null, allocatedAmount: null, parentSeqId: '' },
  { id: '9', originalSeq: 9, itemName: '吸引便ディスポ', model: '', manufacturer: '第一医科', quantity: null, category: 'D', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: '吸引便ディスポ', assetManufacturer: '第一医科', assetModel: '', seqId: '', unit: '台', listUnitPrice: null, allocatedUnitPrice: null, allocatedAmount: null, parentSeqId: '' },
  { id: '10', originalSeq: 10, itemName: 'キャスターあり', model: '', manufacturer: '第一医科', quantity: null, category: 'D', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: 'キャスターあり', assetManufacturer: '第一医科', assetModel: '', seqId: '', unit: '台', listUnitPrice: null, allocatedUnitPrice: null, allocatedAmount: null, parentSeqId: '' },
  { id: '11', originalSeq: 11, itemName: '天板フラット', model: '', manufacturer: '第一医科', quantity: null, category: 'D', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: '天板フラット', assetManufacturer: '第一医科', assetModel: '', seqId: '', unit: '台', listUnitPrice: null, allocatedUnitPrice: null, allocatedAmount: null, parentSeqId: '' },
  // C: 棚（4台）
  { id: '12-1', originalSeq: 12, itemName: 'さらら用ツインボール用棚　壁付タイプ', model: '', manufacturer: '第一医科', quantity: 4, category: 'C', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: 'ツインボール用棚 壁付', assetManufacturer: '第一医科', assetModel: '壁付タイプ', seqId: '6', unit: '台', listUnitPrice: 162000, allocatedUnitPrice: 162000, allocatedAmount: 162000, parentSeqId: '本体' },
  { id: '12-2', originalSeq: 12, itemName: 'さらら用ツインボール用棚　壁付タイプ', model: '', manufacturer: '第一医科', quantity: 4, category: 'C', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: 'ツインボール用棚 壁付', assetManufacturer: '第一医科', assetModel: '壁付タイプ', seqId: '7', unit: '台', listUnitPrice: 162000, allocatedUnitPrice: 162000, allocatedAmount: 162000, parentSeqId: '本体' },
  { id: '12-3', originalSeq: 12, itemName: 'さらら用ツインボール用棚　壁付タイプ', model: '', manufacturer: '第一医科', quantity: 4, category: 'C', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: 'ツインボール用棚 壁付', assetManufacturer: '第一医科', assetModel: '壁付タイプ', seqId: '8', unit: '台', listUnitPrice: 162000, allocatedUnitPrice: 162000, allocatedAmount: 162000, parentSeqId: '本体' },
  { id: '12-4', originalSeq: 12, itemName: 'さらら用ツインボール用棚　壁付タイプ', model: '', manufacturer: '第一医科', quantity: 4, category: 'C', majorCategory: '01医療機器', middleCategory: '眼科用機器', assetName: 'ツインボール用棚 壁付', assetManufacturer: '第一医科', assetModel: '壁付タイプ', seqId: '9', unit: '台', listUnitPrice: 162000, allocatedUnitPrice: 162000, allocatedAmount: 162000, parentSeqId: '本体' },
];

// 登録区分からQuotationItemTypeへの変換
const categoryToItemType = (category: RegistrationCategory): QuotationItemType => {
  const mapping: Record<string, QuotationItemType> = {
    'A': 'A_表紙明細',
    'B': 'B_明細代表',
    'C': 'C_個体管理品目',
    'D': 'D_付属品',
    'E': 'E_その他役務',
    'F': 'F_値引き',
  };
  return mapping[category] || 'C_個体管理品目';
};

export default function RegistrationConfirmPage() {
  const router = useRouter();
  const { addQuotationGroup, addQuotationItems, generateReceivedQuotationNo } = useQuotationStore();

  // 基本情報
  const [basicInfo] = useState<BasicInfo>(testBasicInfo);

  // 登録明細データ
  const [details] = useState<RegistrationDetail[]>(testRegistrationDetails);

  // 合計金額（税抜）
  const totalAmount = useMemo(() => {
    return details.reduce((sum, detail) => sum + (detail.allocatedAmount || 0), 0);
  }, [details]);

  // 戻るボタン（原本へ/登録情報修正）
  const handleBack = () => {
    router.push('/quotation-data-box/price-allocation');
  };

  // 登録ボタン
  const handleRegister = () => {
    if (confirm('見積情報をDatabaseに登録します。よろしいですか？')) {
      // 見積番号を生成
      const quotationNo = generateReceivedQuotationNo();

      // 見積グループ（ヘッダー情報）を登録
      const groupId = addQuotationGroup({
        receivedQuotationNo: quotationNo,
        rfqNo: basicInfo.rfqNo,
        vendorName: basicInfo.vendorName,
        vendorContact: basicInfo.contact,
        vendorEmail: basicInfo.mail,
        quotationDate: basicInfo.quotationDate,
        validityPeriod: 1,
        deliveryPeriod: 3,
        phase: basicInfo.quotationPhase === '定価' ? '定価見積' : '確定見積',
        totalAmount: totalAmount,
      });

      // 見積明細を登録
      const itemsToAdd = details.map((detail) => ({
        quotationGroupId: groupId,
        receivedQuotationNo: quotationNo,
        rowNo: detail.originalSeq,
        originalItemName: detail.itemName,
        originalManufacturer: detail.manufacturer,
        originalModel: detail.model,
        originalQuantity: detail.quantity || 1,
        itemType: categoryToItemType(detail.category),
        category: detail.majorCategory,
        largeClass: detail.majorCategory,
        middleClass: detail.middleCategory,
        itemName: detail.assetName,
        manufacturer: detail.assetManufacturer,
        model: detail.assetModel,
        aiQuantity: 1,
        rfqNo: basicInfo.rfqNo,
        unit: detail.unit,
        listPriceUnit: detail.listUnitPrice || undefined,
        allocListPriceUnit: detail.listUnitPrice || undefined,
        allocPriceUnit: detail.allocatedUnitPrice || undefined,
        allocListPriceTotal: detail.allocatedAmount || undefined,
        seqId: detail.seqId || undefined,
        parentSeqId: detail.parentSeqId || undefined,
        linkedApplicationIds: [],
      }));

      addQuotationItems(itemsToAdd);

      alert(`登録が完了しました（見積番号: ${quotationNo}）`);
      // 見積明細タブを表示するためにクエリパラメータを追加
      router.push('/quotation-data-box?tab=quotations');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f5' }}>
      <Header
        title="見積登録（購入）登録確認へ"
        stepBadge="STEP 6"
        hideMenu={true}
        showBackButton={false}
      />
      <StepProgressBar currentStep={6} />

      {/* ページ全体スクロール */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* 確認メッセージ */}
        <div style={{
          padding: '12px 16px',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#856404',
          fontWeight: 'bold'
        }}>
          下記の内容で見積Databaseへ登録を実施します。
        </div>

        {/* 基本情報セクション（STEP1で登録した内容） */}
        <div style={{
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginBottom: '16px',
        }}>
          <div style={{
            padding: '8px 16px',
            background: '#6c757d',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
          }}>
            基本情報
          </div>
          <div style={{ padding: '12px 16px' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', width: '100px', border: '1px solid #dee2e6' }}>見積日付</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6', width: '120px' }}>{basicInfo.quotationDate}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', width: '100px', border: '1px solid #dee2e6' }}>見積フェーズ</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6', width: '80px' }}>{basicInfo.quotationPhase}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', width: '120px', border: '1px solid #dee2e6' }}>見積依頼G名称</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }} colSpan={3}>{basicInfo.rfqGroupName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>見積依頼No.</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}>{basicInfo.rfqNo}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>宛先（施設名）</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }} colSpan={5}>{basicInfo.facilityName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>業者・メーカー</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}>{basicInfo.vendorName}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>連絡先</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}>{basicInfo.contact}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>mail</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }} colSpan={3}>{basicInfo.mail}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>納期</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}>{basicInfo.deliveryPeriod}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>見積有効期限</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}>{basicInfo.validityPeriod}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>インボイス</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }} colSpan={3}>{basicInfo.invoiceNo}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 登録明細確認セクション */}
        <div style={{
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginBottom: '16px',
        }}>
          {/* セクションヘッダー */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: '#4a6fa5',
            color: 'white',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>登録明細確認</span>
            <span style={{ fontSize: '12px' }}>
              合計金額（税抜）:
              <span style={{ fontWeight: 'bold', fontSize: '16px', marginLeft: '8px' }}>
                ¥{totalAmount.toLocaleString()}
              </span>
            </span>
          </div>

          {/* 明細テーブル */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr style={{ background: '#4a6fa5', color: 'white' }}>
                  <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #3d5a80', width: '60px', fontSize: '11px', fontWeight: 'bold' }}>登録区分</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #3d5a80', width: '100px', fontSize: '11px', fontWeight: 'bold' }}>大分類</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #3d5a80', width: '100px', fontSize: '11px', fontWeight: 'bold' }}>中分類</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #3d5a80', fontSize: '11px', fontWeight: 'bold' }}>個体管理品目</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #3d5a80', width: '100px', fontSize: '11px', fontWeight: 'bold' }}>メーカー</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #3d5a80', width: '120px', fontSize: '11px', fontWeight: 'bold' }}>型式</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #3d5a80', width: '50px', fontSize: '11px', fontWeight: 'bold' }}>単位</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', borderBottom: '1px solid #3d5a80', width: '90px', fontSize: '11px', fontWeight: 'bold' }}>定価単価</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', borderBottom: '1px solid #3d5a80', width: '90px', fontSize: '11px', fontWeight: 'bold' }}>按分単価</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', borderBottom: '1px solid #3d5a80', width: '90px', fontSize: '11px', fontWeight: 'bold' }}>按分金額</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #3d5a80', width: '60px', fontSize: '11px', fontWeight: 'bold' }}>SEQ_ID</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #3d5a80', width: '80px', fontSize: '11px', fontWeight: 'bold' }}>親と紐付け</th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail) => {
                  const rowBg = detail.category === 'C' ? '#e8f5e9' : detail.category === 'D' ? '#fffde7' : detail.category === 'B' ? '#e3f2fd' : 'white';

                  return (
                    <tr key={detail.id} style={{ borderBottom: '1px solid #ddd', background: rowBg }}>
                      <td style={{
                        padding: '8px 6px',
                        textAlign: 'center',
                        background: detail.category === 'C' ? '#4caf50' : detail.category === 'D' ? '#ffc107' : detail.category === 'B' ? '#2196f3' : '#9e9e9e',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}>
                        {detail.category || '-'}
                      </td>
                      <td style={{ padding: '8px 6px', fontSize: '11px' }}>
                        {detail.majorCategory || '-'}
                      </td>
                      <td style={{ padding: '8px 6px', fontSize: '11px' }}>
                        {detail.middleCategory || '-'}
                      </td>
                      <td style={{ padding: '8px 6px', fontWeight: detail.category === 'C' ? 'bold' : 'normal', fontSize: '12px' }}>
                        {detail.assetName}
                      </td>
                      <td style={{ padding: '8px 6px', fontSize: '11px' }}>
                        {detail.assetManufacturer || '-'}
                      </td>
                      <td style={{ padding: '8px 6px', fontSize: '11px' }}>
                        {detail.assetModel || '-'}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center', fontSize: '11px' }}>
                        {detail.unit}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '11px' }}>
                        {detail.listUnitPrice?.toLocaleString() || '-'}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '11px' }}>
                        {detail.allocatedUnitPrice?.toLocaleString() || '-'}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px', color: '#c62828' }}>
                        {detail.allocatedAmount?.toLocaleString() || '-'}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center', fontSize: '11px', fontWeight: detail.category === 'C' ? 'bold' : 'normal' }}>
                        {detail.seqId || '-'}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center', fontSize: '11px' }}>
                        {detail.parentSeqId || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* フッターボタン */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '16px' }}>
          <button
            onClick={handleBack}
            style={{
              padding: '12px 28px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            一つ前のSTEPに戻る
          </button>
          <button
            onClick={handleRegister}
            style={{
              padding: '12px 28px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            見積情報Databaseに登録
          </button>
        </div>
      </div>
    </div>
  );
}
