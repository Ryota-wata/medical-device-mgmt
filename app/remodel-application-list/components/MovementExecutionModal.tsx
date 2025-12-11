import React, { useState, useEffect, useRef } from 'react';
import { Application, UploadedFile } from '@/lib/types/application';

interface MovementExecutionModalProps {
  show: boolean;
  onClose: () => void;
  application: Application | null;
  onSubmit: (applicationId: number) => void;
}

// ドキュメント種別
const MOVEMENT_DOCUMENT_TYPES = ['移動申請書', '移動確認書', '写真（移動前）', '写真（移動後）'];

// UUID生成
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const MovementExecutionModal: React.FC<MovementExecutionModalProps> = ({
  show,
  onClose,
  application,
  onSubmit,
}) => {
  const [movementDate, setMovementDate] = useState('');
  const [movementNote, setMovementNote] = useState('');
  const [documents, setDocuments] = useState<{ type: string; files: UploadedFile[] }[]>(
    MOVEMENT_DOCUMENT_TYPES.map(type => ({ type, files: [] }))
  );
  const [confirmChecked, setConfirmChecked] = useState(false);

  const documentInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (show) {
      setMovementDate(new Date().toISOString().split('T')[0]);
      setMovementNote('');
      setDocuments(MOVEMENT_DOCUMENT_TYPES.map(type => ({ type, files: [] })));
      setConfirmChecked(false);
    }
  }, [show]);

  const handleDocumentUpload = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
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
        doc.type === docType ? { ...doc, files: [...doc.files, ...newFiles] } : doc
      )
    );

    const ref = documentInputRefs.current[docType];
    if (ref) ref.value = '';
  };

  const handleRemoveDocument = (docType: string, fileId: string) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.type === docType ? { ...doc, files: doc.files.filter(f => f.id !== fileId) } : doc
      )
    );
  };

  const handleSubmit = () => {
    if (!application || !confirmChecked) return;
    onSubmit(application.id);
    onClose();
  };

  if (!show || !application) return null;

  // 移動先の情報を取得（applicationReasonに移動先が記載されている想定）
  // 実際の移動先データがある場合はそれを使用
  const destinationInfo = application.applicationReason || '移動先は申請内容を参照してください';

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
          maxWidth: '700px',
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
            background: '#9b59b6',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            移動執行 - {application.applicationNo}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div style={{ padding: '20px' }}>
          {/* 申請情報 */}
          <div
            style={{
              marginBottom: '20px',
              padding: '15px',
              background: '#f3e5f5',
              borderRadius: '4px',
              border: '1px solid #ce93d8',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#666' }}>品目:</span>{' '}
                <strong>{application.asset.name}</strong>
              </div>
              <div>
                <span style={{ color: '#666' }}>型式:</span>{' '}
                <strong>{application.asset.model}</strong>
              </div>
              <div>
                <span style={{ color: '#666' }}>メーカー:</span>{' '}
                <strong>{application.vendor}</strong>
              </div>
              <div>
                <span style={{ color: '#666' }}>現在の設置場所:</span>{' '}
                <strong>{application.facility.building} {application.facility.floor} {application.facility.department}</strong>
              </div>
            </div>
          </div>

          {/* 移動先情報 */}
          <div
            style={{
              marginBottom: '20px',
              padding: '15px',
              background: '#e8f5e9',
              borderRadius: '4px',
              border: '1px solid #a5d6a7',
            }}
          >
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2e7d32' }}>
              移動先・申請理由
            </label>
            <div style={{ fontSize: '14px' }}>
              <strong>{destinationInfo}</strong>
            </div>
          </div>

          {/* 移動日 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
              移動日
            </label>
            <input
              type="date"
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* 備考 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
              備考
            </label>
            <textarea
              value={movementNote}
              onChange={(e) => setMovementNote(e.target.value)}
              placeholder="備考があれば入力してください"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* ドキュメント */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
              関連ドキュメント
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {documents.map((doc) => (
                <div
                  key={doc.type}
                  style={{
                    padding: '10px',
                    background: '#fafafa',
                    borderRadius: '4px',
                    border: '1px solid #eee',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 500, fontSize: '13px' }}>{doc.type}</span>
                    <button
                      onClick={() => documentInputRefs.current[doc.type]?.click()}
                      style={{
                        padding: '4px 10px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      追加
                    </button>
                    <input
                      ref={(el) => { documentInputRefs.current[doc.type] = el; }}
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocumentUpload(doc.type, e)}
                    />
                  </div>
                  {doc.files.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {doc.files.map((file) => (
                        <div
                          key={file.id}
                          style={{
                            padding: '4px 8px',
                            background: '#e3f2fd',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                          }}
                        >
                          <span>{file.fileName}</span>
                          <button
                            onClick={() => handleRemoveDocument(doc.type, file.id)}
                            style={{
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                              fontSize: '10px',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#95a5a6' }}>ファイルなし</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 確認チェック */}
          <div
            style={{
              padding: '15px',
              background: '#fff3cd',
              borderRadius: '4px',
              border: '1px solid #ffc107',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                style={{ marginTop: '3px' }}
              />
              <span style={{ fontSize: '13px', color: '#856404' }}>
                この操作により、対象資産の設置場所が更新され、申請は完了（クローズ）となります。
              </span>
            </label>
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
            disabled={!confirmChecked}
            style={{
              padding: '10px 24px',
              background: confirmChecked ? '#9b59b6' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: confirmChecked ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            移動執行
          </button>
        </div>
      </div>
    </div>
  );
};
