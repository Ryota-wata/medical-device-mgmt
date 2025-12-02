'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts';
import { Asset } from '@/lib/types';

export default function AssetDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrCode = searchParams.get('qrCode');

  const [asset, setAsset] = useState<Asset | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  // モックデータ
  useEffect(() => {
    const mockAsset: Asset = {
      qrCode: qrCode || 'QR-2025-0001',
      no: 1,
      facility: '〇〇〇〇〇〇病院',
      building: '本館',
      floor: '2F',
      department: '手術部門',
      section: '手術',
      category: '医療機器',
      largeClass: '手術関連機器',
      mediumClass: '電気メス 双極',
      item: '手術台',
      name: '電気手術用電源装置2システム',
      maker: '医療',
      model: 'EW11 超音波吸引器',
      quantity: 1,
      width: 520,
      depth: 480,
      height: 1400,
      photos: [
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%2390caf9" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23fff" font-size="24"%3E写真1%3C/text%3E%3C/svg%3E',
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%2366bb6a" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23fff" font-size="24"%3E写真2%3C/text%3E%3C/svg%3E',
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ff7043" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23fff" font-size="24"%3E写真3%3C/text%3E%3C/svg%3E'
      ]
    };
    setAsset(mockAsset);
  }, [qrCode]);

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
          <button
            style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            onClick={() => alert('移動申請')}
          >
            移動申請
          </button>
          <button
            style={{ padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            onClick={() => alert('廃棄申請')}
          >
            廃棄申請
          </button>
          <button
            style={{ padding: '8px 16px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            onClick={() => alert('修理申請')}
          >
            修理申請
          </button>

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

          <button
            style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            onClick={() => router.back()}
          >
            戻る
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div style={{ display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow: 'auto' }}>
        {/* 左側: 写真と基本情報 */}
        <div style={{ flex: '1', minWidth: '400px' }}>
          {/* 写真表示エリア */}
          <div style={{ marginBottom: '20px', background: '#f8f9fa', borderRadius: '8px', padding: '20px' }}>
            <div style={{ position: 'relative', marginBottom: '15px' }}>
              {hasPhotos && (
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

          {/* 基本情報 */}
          <div style={{ background: 'white', border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #27ae60', paddingBottom: '8px' }}>
              基本情報
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '14px' }}>
              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>QRコードNo.:</div>
              <div style={{ color: '#2c3e50' }}>{asset.qrCode}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>施設名:</div>
              <div style={{ color: '#2c3e50' }}>{asset.facility}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>棟:</div>
              <div style={{ color: '#2c3e50' }}>{asset.building}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>階:</div>
              <div style={{ color: '#2c3e50' }}>{asset.floor}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>部門:</div>
              <div style={{ color: '#2c3e50' }}>{asset.department}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>部署:</div>
              <div style={{ color: '#2c3e50' }}>{asset.section}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>Category:</div>
              <div style={{ color: '#2c3e50' }}>{asset.category}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>大分類:</div>
              <div style={{ color: '#2c3e50' }}>{asset.largeClass}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>中分類:</div>
              <div style={{ color: '#2c3e50' }}>{asset.mediumClass}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>品目:</div>
              <div style={{ color: '#2c3e50' }}>{asset.item}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>品名:</div>
              <div style={{ color: '#2c3e50' }}>{asset.name}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>メーカー:</div>
              <div style={{ color: '#2c3e50' }}>{asset.maker}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>型式:</div>
              <div style={{ color: '#2c3e50' }}>{asset.model}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>数量:</div>
              <div style={{ color: '#2c3e50' }}>{asset.quantity}</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>幅(W):</div>
              <div style={{ color: '#2c3e50' }}>{asset.width}mm</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>奥行(D):</div>
              <div style={{ color: '#2c3e50' }}>{asset.depth}mm</div>

              <div style={{ color: '#5a6c7d', fontWeight: 'bold' }}>高さ(H):</div>
              <div style={{ color: '#2c3e50' }}>{asset.height}mm</div>
            </div>
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
    </div>
  );
}
