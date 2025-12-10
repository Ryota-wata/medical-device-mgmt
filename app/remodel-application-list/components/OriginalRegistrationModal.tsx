import React, { useState, useEffect, useRef } from 'react';
import { Application, OriginalDocumentType, UploadedFile, OriginalRegistration } from '@/lib/types/application';

interface OriginalRegistrationModalProps {
  show: boolean;
  onClose: () => void;
  application: Application | null;
  onSubmit: (applicationId: number, registration: OriginalRegistration) => void;
  generateQrCodeNo: () => string;
}

// ドキュメント種別の定義
const DOCUMENT_TYPES: OriginalDocumentType[] = [
  '契約書（押印済）',
  '納品書（業者）',
  '検収書（押印分）',
  '保証書',
  '取扱説明書',
  '添付文書（JMDN発行）',
  'カタログdata',
];

// ファイルサイズフォーマット
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// UUID生成（簡易版）
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const OriginalRegistrationModal: React.FC<OriginalRegistrationModalProps> = ({
  show,
  onClose,
  application,
  onSubmit,
  generateQrCodeNo,
}) => {
  // QRコードNo.
  const [qrCodeNo, setQrCodeNo] = useState<string>('');
  // シリアルNo.
  const [serialNo, setSerialNo] = useState<string>('');
  // 写真
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  // ドキュメント
  const [documents, setDocuments] = useState<{ type: OriginalDocumentType; files: UploadedFile[] }[]>(
    DOCUMENT_TYPES.map(type => ({ type, files: [] }))
  );

  // ファイル入力ref
  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // モーダル表示時に初期化
  useEffect(() => {
    if (show && application) {
      // 既存の原本登録情報があれば読み込む
      if (application.originalRegistration) {
        setQrCodeNo(application.originalRegistration.qrCodeNo || '');
        setSerialNo(application.originalRegistration.serialNo || '');
        setPhotos(application.originalRegistration.photos || []);
        setDocuments(
          DOCUMENT_TYPES.map(type => {
            const existing = application.originalRegistration?.documents.find(d => d.type === type);
            return { type, files: existing?.files || [] };
          })
        );
      } else {
        // 新規の場合はQRコードNoを採番
        setQrCodeNo(generateQrCodeNo());
        setSerialNo('');
        setPhotos([]);
        setDocuments(DOCUMENT_TYPES.map(type => ({ type, files: [] })));
      }
    }
  }, [show, application, generateQrCodeNo]);

  // 写真アップロード処理
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: UploadedFile[] = Array.from(files).map(file => ({
      id: generateId(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // 写真削除
  const handleRemovePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  // ドキュメントアップロード処理
  const handleDocumentUpload = (docType: OriginalDocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: generateId(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    }));

    setDocuments(prev =>
      prev.map(doc =>
        doc.type === docType
          ? { ...doc, files: [...doc.files, ...newFiles] }
          : doc
      )
    );

    // 入力をリセット
    const ref = documentInputRefs.current[docType];
    if (ref) {
      ref.value = '';
    }
  };

  // ドキュメント削除
  const handleRemoveDocument = (docType: OriginalDocumentType, fileId: string) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.type === docType
          ? { ...doc, files: doc.files.filter(f => f.id !== fileId) }
          : doc
      )
    );
  };

  // 登録確定
  const handleSubmit = () => {
    if (!application) return;

    const registration: OriginalRegistration = {
      qrCodeNo,
      serialNo,
      photos,
      documents: documents.filter(doc => doc.files.length > 0),
      registeredAt: new Date().toISOString(),
      registeredBy: 'current-user', // TODO: 実際のユーザー情報
    };

    onSubmit(application.id, registration);
    onClose();
  };

  if (!show || !application) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #dee2e6',
            background: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', color: '#2c3e50' }}>
            原本登録 - {application.applicationNo}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#7f8c8d',
            }}
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div style={{ padding: '20px' }}>
          {/* 申請情報サマリー */}
          <div
            style={{
              marginBottom: '20px',
              padding: '15px',
              background: '#e8f5e9',
              borderRadius: '4px',
              border: '1px solid #a5d6a7',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#666' }}>申請種別:</span>{' '}
                <strong>{application.applicationType}</strong>
              </div>
              <div>
                <span style={{ color: '#666' }}>品目:</span>{' '}
                <strong>{application.asset.name}</strong>
              </div>
              <div>
                <span style={{ color: '#666' }}>メーカー:</span>{' '}
                <strong>{application.vendor}</strong>
              </div>
            </div>
          </div>

          {/* QRコードNo. */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
              ① QRコードNo.
            </label>
            <div
              style={{
                padding: '12px 16px',
                background: '#fff3cd',
                borderRadius: '4px',
                border: '1px solid #ffc107',
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#856404',
              }}
            >
              {qrCodeNo}
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
              ※ 自動採番されたQRコードNo.です。登録確定後に変更できません。
            </p>
          </div>

          {/* 写真アップロード */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
              ② 写真アップロード
            </label>
            <div
              style={{
                border: '2px dashed #3498db',
                borderRadius: '4px',
                padding: '20px',
                textAlign: 'center',
                background: '#f8fbff',
                cursor: 'pointer',
              }}
              onClick={() => photoInputRef.current?.click()}
            >
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
              <div style={{ fontSize: '14px', color: '#3498db' }}>
                クリックまたはドラッグ＆ドロップで写真を追加
              </div>
            </div>
            {photos.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      padding: '8px 12px',
                      background: '#e3f2fd',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: '#1565c0' }}>{photo.fileName}</span>
                    <span style={{ color: '#666' }}>({formatFileSize(photo.fileSize)})</span>
                    <button
                      onClick={() => handleRemovePhoto(photo.id)}
                      style={{
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        lineHeight: '1',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* シリアルNo. */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
              ③ シリアルNo.
            </label>
            <input
              type="text"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              placeholder="シリアルナンバーを入力"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* 各種ドキュメントアップロード */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
              ④ 各種ドキュメントアップロード
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {documents.map((doc) => (
                <div
                  key={doc.type}
                  style={{
                    padding: '12px',
                    background: '#fafafa',
                    borderRadius: '4px',
                    border: '1px solid #eee',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 500, color: '#2c3e50', fontSize: '13px' }}>
                      {doc.type}
                    </span>
                    <button
                      onClick={() => documentInputRefs.current[doc.type]?.click()}
                      style={{
                        padding: '6px 12px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ファイル追加
                    </button>
                    <input
                      ref={(el) => { documentInputRefs.current[doc.type] = el; }}
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocumentUpload(doc.type, e)}
                    />
                  </div>
                  {doc.files.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {doc.files.map((file) => (
                        <div
                          key={file.id}
                          style={{
                            padding: '6px 10px',
                            background: '#e8f5e9',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                          }}
                        >
                          <span style={{ color: '#2e7d32' }}>{file.fileName}</span>
                          <span style={{ color: '#666' }}>({formatFileSize(file.fileSize)})</span>
                          <button
                            onClick={() => handleRemoveDocument(doc.type, file.id)}
                            style={{
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              lineHeight: '1',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {doc.files.length === 0 && (
                    <span style={{ fontSize: '12px', color: '#95a5a6', fontStyle: 'italic' }}>
                      ファイルなし
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div
          style={{
            padding: '15px 20px',
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 24px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            登録確定
          </button>
        </div>
      </div>
    </div>
  );
};
