'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts';
import { Asset } from '@/lib/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAssetStore } from '@/lib/stores';

function AssetDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrCode = searchParams.get('qrCode');
  const assetNo = searchParams.get('no');
  const isReadOnly = searchParams.get('readonly') === 'true';
  const from = searchParams.get('from');

  // 戻り先マッピング
  const backConfig = (() => {
    switch (from) {
      case 'inventory':
        return { href: '/inventory', label: '棚卸一覧に戻る' };
      case 'remodel':
        return { href: '/remodel-application', label: '編集リストに戻る' };
      case 'asset-search':
      default:
        return { href: '/asset-search-result', label: '資産一覧に戻る' };
    }
  })();

  const { assets: storeAssets } = useAssetStore();

  // ストアから該当資産を検索
  const foundAsset = storeAssets.find(a => {
    if (qrCode && a.qrCode === qrCode) return true;
    if (assetNo && a.no === parseInt(assetNo)) return true;
    return false;
  });

  const [asset, setAsset] = useState<Asset | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  // ストアデータをローカルステートにセット
  useEffect(() => {
    if (foundAsset) {
      setAsset({ ...foundAsset });
    }
  }, [foundAsset?.no]);

  const handleHomeClick = () => {
    if (isEditMode) {
      setShowHomeConfirm(true);
    } else {
      router.push('/main');
    }
  };

  // 写真アップロードハンドラー
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !asset) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAsset((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              photos: [...(prev.photos || []), event.target?.result as string],
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // 写真削除ハンドラー
  const handlePhotoDelete = (index: number) => {
    if (!asset) return;
    setAsset((prev) => {
      if (!prev) return prev;
      const newPhotos = [...(prev.photos || [])];
      newPhotos.splice(index, 1);
      if (currentPhotoIndex >= newPhotos.length && newPhotos.length > 0) {
        setCurrentPhotoIndex(newPhotos.length - 1);
      }
      return { ...prev, photos: newPhotos };
    });
  };

  // フィールド変更ハンドラー
  const handleFieldChange = (field: keyof Asset, value: any) => {
    if (!asset) return;
    setAsset((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  if (!asset) {
    return <div>読み込み中...</div>;
  }

  const photos = asset.photos || [];
  const hasPhotos = photos.length > 0;

  return (
    <div className="min-h-dvh flex flex-col bg-[#f9fafb]">
      {/* ヘッダー */}
      <header className="bg-white border-b border-[#e5e7eb] flex justify-between items-center px-5 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center text-white font-bold text-sm w-10 h-10 bg-[#27ae60] rounded-lg">
              SHIP
            </div>
            <div className="text-base font-bold text-[#1f2937]">資産リスト</div>
          </div>
          <span className="text-sm text-[#4b5563]">1件</span>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <>
              {!isEditMode ? (
                <button
                  className="px-4 py-2 bg-[#9b59b6] text-white border-none rounded-md cursor-pointer text-sm hover:bg-[#8e44ad]"
                  onClick={() => setIsEditMode(true)}
                >
                  編集
                </button>
              ) : (
                <>
                  <button
                    className="px-4 py-2 bg-[#27ae60] text-white border-none rounded-md cursor-pointer text-sm hover:bg-[#219a52]"
                    onClick={() => { alert('保存'); setIsEditMode(false); }}
                  >
                    保存
                  </button>
                  <button
                    className="px-4 py-2 bg-[#95a5a6] text-white border-none rounded-md cursor-pointer text-sm hover:bg-[#7f8c8d]"
                    onClick={() => setIsEditMode(false)}
                  >
                    キャンセル
                  </button>
                </>
              )}
            </>
          )}

          <button
            className="px-4 py-2 bg-[#374151] text-white border-none rounded-md cursor-pointer text-sm hover:bg-[#1f2937]"
            onClick={() => router.push(backConfig.href)}
          >
            {backConfig.label}
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex flex-1 gap-5 p-5 overflow-auto">
        {/* 左側: 写真と基本情報 */}
        <div className="flex-1 min-w-[400px]">
          {/* 写真表示エリア */}
          <div className="mb-5 bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-5">
            {isEditMode && (
              <div className="mb-4">
                <label
                  htmlFor="photo-upload"
                  className="inline-block px-4 py-2 bg-[#27ae60] text-white rounded-md cursor-pointer text-sm hover:bg-[#219a52]"
                >
                  📷 写真を追加
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            )}
            <div className="relative mb-4">
              {hasPhotos ? (
                <>
                  <button
                    onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                    disabled={currentPhotoIndex === 0}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/50 text-white border-none rounded-full w-10 h-10 text-2xl z-10 disabled:cursor-not-allowed cursor-pointer"
                  >
                    ‹
                  </button>
                  <img
                    src={photos[currentPhotoIndex]}
                    alt="資産写真"
                    className="w-full h-[300px] object-cover rounded-lg"
                  />
                  {isEditMode && (
                    <button
                      onClick={() => handlePhotoDelete(currentPhotoIndex)}
                      className="absolute top-2.5 right-2.5 bg-[#e74c3c] text-white border-none rounded-md px-3 py-2 cursor-pointer text-sm z-10 hover:bg-[#c0392b]"
                    >
                      🗑️ 削除
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentPhotoIndex(Math.min(photos.length - 1, currentPhotoIndex + 1))}
                    disabled={currentPhotoIndex === photos.length - 1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/50 text-white border-none rounded-full w-10 h-10 text-2xl z-10 disabled:cursor-not-allowed cursor-pointer"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white px-2.5 py-1 rounded text-xs">
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                </>
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center bg-[#e0e0e0] rounded-lg text-[#666] text-base">
                  写真なし
                </div>
              )}
            </div>

            {/* サムネイル */}
            {hasPhotos && (
              <div className="flex gap-2.5 justify-center flex-wrap">
                {photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`サムネイル${index + 1}`}
                    className={`w-[60px] h-[60px] object-cover rounded cursor-pointer ${
                      index === currentPhotoIndex
                        ? 'border-[3px] border-[#27ae60]'
                        : 'border border-[#ddd]'
                    }`}
                    onClick={() => setCurrentPhotoIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 資産情報（8グループ構成） */}
          <div className="flex flex-col gap-4">

            {/* 基本情報 */}
            <DetailSection title="基本情報">
              <DetailField label="施設名" value={asset.facility} field="facility" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* 共通マスタ */}
            <DetailSection title="共通マスタ">
              <DetailField label="部門名" value={asset.shipDivision} field="shipDivision" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="部署名" value={asset.shipDepartment} field="shipDepartment" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="諸室区分①" value={asset.roomClass1} field="roomClass1" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="諸室区分②" value={asset.roomClass2} field="roomClass2" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* 設置情報 */}
            <DetailSection title="設置情報">
              <DetailField label="部門ID" value={asset.divisionId} field="divisionId" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="部署ID" value={asset.departmentId} field="departmentId" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="諸室ID" value={asset.roomId} field="roomId" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="棟" value={asset.building} field="building" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="階" value={asset.floor} field="floor" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="部門" value={asset.department} field="department" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="部署" value={asset.section} field="section" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="室名" value={asset.roomName} field="roomName" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="設置場所" value={asset.installationLocation} field="installationLocation" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* 識別情報 */}
            <DetailSection title="識別情報">
              <DetailField label="QRコード" value={asset.qrCode} field="qrCode" isEditMode={false} onChange={handleFieldChange} />
              <DetailField label="台帳番号" value={asset.assetNo} field="assetNo" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="管理部署" value={asset.managementDept} field="managementDept" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="管理機器番号" value={asset.managementNo} field="managementNo" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="備品番号" value={asset.equipmentNo} field="equipmentNo" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="シリアルNo." value={asset.serialNumber} field="serialNumber" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* 資産分類 */}
            <DetailSection title="資産分類">
              <DetailField label="資産マスタID" value={asset.assetMasterId} field="assetMasterId" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="Category" value={asset.category} field="category" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="大分類" value={asset.largeClass} field="largeClass" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="中分類" value={asset.mediumClass} field="mediumClass" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="明細区分" value={asset.detailCategory} field="detailCategory" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="個体管理品目" value={asset.item} field="item" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* 機器仕様 */}
            <DetailSection title="機器仕様">
              <DetailField label="個体管理名称" value={asset.name} field="name" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="メーカー名" value={asset.maker} field="maker" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="型式" value={asset.model} field="model" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="W" value={asset.width} field="width" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="D" value={asset.depth} field="depth" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="H" value={asset.height} field="height" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* 取得情報 */}
            <DetailSection title="取得情報">
              <DetailField label="購入年月日" value={asset.purchaseDate} field="purchaseDate" isEditMode={isEditMode} onChange={handleFieldChange} type="date" />
              <DetailField label="リース" value={asset.lease} field="lease" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="貸出品" value={asset.rental} field="rental" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* その他 */}
            <DetailSection title="その他">
              <DetailField label="備考" value={asset.remarks} field="remarks" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

          </div>
        </div>

        {/* 右側: ドキュメント閲覧 */}
        <div className="flex-1 min-w-[400px]">
          <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-5 h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[#1f2937]">登録ドキュメント</h3>
              {isEditMode && (
                <button
                  className="px-3 py-1.5 bg-[#27ae60] text-white border-none rounded-md cursor-pointer text-[13px] hover:bg-[#219a52]"
                  onClick={() => alert('ドキュメント追加')}
                >
                  ➕ ドキュメント追加
                </button>
              )}
            </div>

            {/* ドキュメントリスト */}
            <div className="mb-5">
              {['契約書.pdf', '納品書.pdf', '検収書.pdf'].map((doc, index) => (
                <div
                  key={index}
                  className={`flex items-center p-3 mb-2 rounded cursor-pointer ${
                    index === 0 ? 'bg-[#e3f2fd]' : 'bg-[#f8f9fa]'
                  }`}
                >
                  <span className="text-2xl mr-3">📄</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#1f2937]">{doc}</div>
                    <div className="text-xs text-[#4b5563]">2025-01-15 登録</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ドキュメントビューアー */}
            <div className="border border-[#e5e7eb] rounded-lg p-5 text-center bg-[#f8f9fa]">
              <div className="text-5xl mb-4">📄</div>
              <div className="text-base font-bold text-[#1f2937] mb-2.5">契約書.pdf</div>
              <p className="text-[13px] text-[#4b5563]">
                ※ 実際のシステムでは、選択したドキュメントがここに表示されます
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showHomeConfirm}
        onClose={() => setShowHomeConfirm(false)}
        onConfirm={() => router.push('/main')}
        title="メイン画面に戻る"
        message="編集中の内容が破棄されます。メイン画面に戻りますか？"
        confirmLabel="メイン画面に戻る"
        cancelLabel="編集を続ける"
        variant="warning"
      />
    </div>
  );
}


// セクションヘッダー付きグループ
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] overflow-hidden">
      <div className="bg-[#f9fafb] px-4 py-2 border-b border-[#e0e0e0]">
        <span className="text-sm font-bold text-[#2c3e50]">{title}</span>
      </div>
      <div className="grid grid-cols-[140px_1fr] text-sm">
        {children}
      </div>
    </div>
  );
}

// 1フィールド行（ラベル + 値/入力）
function DetailField({ label, value, field, isEditMode, onChange, type = 'text' }: {
  label: string;
  value: any;
  field: string;
  isEditMode: boolean;
  onChange: (field: keyof Asset, value: any) => void;
  type?: 'text' | 'number' | 'date';
}) {
  const displayValue = value ?? '-';

  return (
    <>
      <div className="text-sm font-semibold text-[#2c3e50] px-3 py-2 border-b border-[#f0f0f0]">{label}</div>
      <div className="px-3 py-2 border-b border-[#f0f0f0]">
        {isEditMode ? (
          <input
            type={type}
            value={value ?? ''}
            onChange={(e) => {
              const val = type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value;
              onChange(field as keyof Asset, val);
            }}
            className="w-full px-3 py-2.5 border border-[#ddd] rounded text-sm box-border"
          />
        ) : (
          <div className="text-sm text-[#4b5563]">{typeof displayValue === 'number' ? String(displayValue) : displayValue}</div>
        )}
      </div>
    </>
  );
}

export default function AssetDetailPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <AssetDetailContent />
    </Suspense>
  );
}
