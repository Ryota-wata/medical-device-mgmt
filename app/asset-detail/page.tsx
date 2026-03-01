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
    <div className="min-h-screen flex flex-col" style={{ background: 'white' }}>
      {/* ヘッダー */}
      <header
        className="text-white flex justify-between items-center"
        style={{
          background: '#2c3e50',
          padding: '12px 20px'
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center text-white font-bold text-sm"
              style={{
                width: '40px',
                height: '40px',
                background: '#27ae60',
                borderRadius: '8px'
              }}
            >
              SHIP
            </div>
            <div className="text-base font-bold">資産リスト</div>
          </div>
          <span className="text-sm" style={{ color: '#ecf0f1' }}>1件</span>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <>
              {!isEditMode ? (
                <button
                  style={{ padding: '8px 16px', background: '#9b59b6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                  onClick={() => setIsEditMode(true)}
                >
                  編集
                </button>
              ) : (
                <>
                  <button
                    style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => { alert('保存'); setIsEditMode(false); }}
                  >
                    保存
                  </button>
                  <button
                    style={{ padding: '8px 16px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => setIsEditMode(false)}
                  >
                    キャンセル
                  </button>
                </>
              )}
            </>
          )}

          <button
            style={{ padding: '8px 16px', background: '#34495e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            onClick={() => router.push(backConfig.href)}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2c3e50'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#34495e'; }}
          >
            {backConfig.label}
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div style={{ display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow: 'auto' }}>
        {/* 左側: 写真と基本情報 */}
        <div style={{ flex: '1', minWidth: '400px' }}>
          {/* 写真表示エリア */}
          <div style={{ marginBottom: '20px', background: '#f8f9fa', borderRadius: '8px', padding: '20px' }}>
            {isEditMode && (
              <div style={{ marginBottom: '15px' }}>
                <label
                  htmlFor="photo-upload"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: '#27ae60',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  📷 写真を追加
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </div>
            )}
            <div style={{ position: 'relative', marginBottom: '15px' }}>
              {hasPhotos ? (
                <>
                  <button
                    onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                    disabled={currentPhotoIndex === 0}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: currentPhotoIndex === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '24px',
                      zIndex: 10
                    }}
                  >
                    ‹
                  </button>
                  <img
                    src={photos[currentPhotoIndex]}
                    alt="資産写真"
                    style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  {isEditMode && (
                    <button
                      onClick={() => handlePhotoDelete(currentPhotoIndex)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        zIndex: 10,
                      }}
                    >
                      🗑️ 削除
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentPhotoIndex(Math.min(photos.length - 1, currentPhotoIndex + 1))}
                    disabled={currentPhotoIndex === photos.length - 1}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: currentPhotoIndex === photos.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '24px',
                      zIndex: 10
                    }}
                  >
                    ›
                  </button>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#e0e0e0',
                    borderRadius: '8px',
                    color: '#666',
                    fontSize: '16px',
                  }}
                >
                  写真なし
                </div>
              )}
            </div>

            {/* サムネイル */}
            {hasPhotos && (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`サムネイル${index + 1}`}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: index === currentPhotoIndex ? '3px solid #27ae60' : '1px solid #ddd'
                    }}
                    onClick={() => setCurrentPhotoIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 資産情報（8グループ構成） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* 基本情報 */}
            <DetailSection title="基本情報" color="#495057" bg="#f8f9fa">
              <DetailField label="施設名" value={asset.facility} field="facility" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* 共通マスタ */}
            <DetailSection title="共通マスタ" color="#2e7d32" bg="#e8f5e9">
              <DetailField label="部門名" value={asset.shipDivision} field="shipDivision" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="部署名" value={asset.shipDepartment} field="shipDepartment" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="諸室区分①" value={asset.roomClass1} field="roomClass1" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="諸室区分②" value={asset.roomClass2} field="roomClass2" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* 設置情報 */}
            <DetailSection title="設置情報" color="#1565c0" bg="#e3f2fd">
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
            <DetailSection title="識別情報" color="#e65100" bg="#fff3e0">
              <DetailField label="QRコード" value={asset.qrCode} field="qrCode" isEditMode={false} onChange={handleFieldChange} />
              <DetailField label="台帳番号" value={asset.assetNo} field="assetNo" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="管理部署" value={asset.managementDept} field="managementDept" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="管理機器番号" value={asset.managementNo} field="managementNo" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="備品番号" value={asset.equipmentNo} field="equipmentNo" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="シリアルNo." value={asset.serialNumber} field="serialNumber" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* 資産分類 */}
            <DetailSection title="資産分類" color="#7b1fa2" bg="#f3e5f5">
              <DetailField label="資産マスタID" value={asset.assetMasterId} field="assetMasterId" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="Category" value={asset.category} field="category" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="大分類" value={asset.largeClass} field="largeClass" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="中分類" value={asset.mediumClass} field="mediumClass" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="明細区分" value={asset.detailCategory} field="detailCategory" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="個体管理品目" value={asset.item} field="item" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* 機器仕様 */}
            <DetailSection title="機器仕様" color="#00838f" bg="#e0f7fa">
              <DetailField label="個体管理名称" value={asset.name} field="name" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="メーカー名" value={asset.maker} field="maker" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="型式" value={asset.model} field="model" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="W" value={asset.width} field="width" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="D" value={asset.depth} field="depth" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="H" value={asset.height} field="height" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* 取得情報 */}
            <DetailSection title="取得情報" color="#c62828" bg="#fce4ec">
              <DetailField label="購入年月日" value={asset.purchaseDate} field="purchaseDate" isEditMode={isEditMode} onChange={handleFieldChange} type="date" />
              <DetailField label="リース" value={asset.lease} field="lease" isEditMode={isEditMode} onChange={handleFieldChange} />
              <DetailField label="貸出品" value={asset.rental} field="rental" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

            {/* その他 */}
            <DetailSection title="その他" color="#616161" bg="#f5f5f5">
              <DetailField label="備考" value={asset.remarks} field="remarks" isEditMode={isEditMode} onChange={handleFieldChange} />
            </DetailSection>

          </div>
        </div>

        {/* 右側: ドキュメント閲覧 */}
        <div style={{ flex: '1', minWidth: '400px' }}>
          <div style={{ background: 'white', border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>登録ドキュメント</h3>
              {isEditMode && (
                <button
                  style={{ padding: '6px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                  onClick={() => alert('ドキュメント追加')}
                >
                  ➕ ドキュメント追加
                </button>
              )}
            </div>

            {/* ドキュメントリスト */}
            <div style={{ marginBottom: '20px' }}>
              {['契約書.pdf', '納品書.pdf', '検収書.pdf'].map((doc, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    marginBottom: '8px',
                    background: index === 0 ? '#e3f2fd' : '#f8f9fa',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '24px', marginRight: '12px' }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2c3e50' }}>{doc}</div>
                    <div style={{ fontSize: '12px', color: '#5a6c7d' }}>2025-01-15 登録</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ドキュメントビューアー */}
            <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px', textAlign: 'center', background: '#f8f9fa' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📄</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px' }}>契約書.pdf</div>
              <p style={{ fontSize: '13px', color: '#5a6c7d' }}>
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
function DetailSection({ title, color, bg, children }: { title: string; color: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ background: bg, padding: '8px 16px', borderBottom: '1px solid #dee2e6' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color }}>{title}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0', fontSize: '14px' }}>
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
  const inputStyle = { padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', width: '100%', boxSizing: 'border-box' as const };

  return (
    <>
      <div style={{ color: '#5a6c7d', fontWeight: 'bold', padding: '8px 12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>{label}</div>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
        {isEditMode ? (
          <input
            type={type}
            value={value ?? ''}
            onChange={(e) => {
              const val = type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value;
              onChange(field as keyof Asset, val);
            }}
            style={inputStyle}
          />
        ) : (
          <div style={{ color: '#2c3e50', fontSize: '13px' }}>{typeof displayValue === 'number' ? String(displayValue) : displayValue}</div>
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
