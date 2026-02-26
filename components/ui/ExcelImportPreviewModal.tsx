'use client';

interface ExcelImportPreviewModalProps {
  isOpen: boolean;
  importableCount: number;
  errors: string[];
  onCancel: () => void;
  onAdd: () => void;
  onReplace: () => void;
  onDownloadTemplate: () => void;
}

export function ExcelImportPreviewModal({
  isOpen,
  importableCount,
  errors,
  onCancel,
  onAdd,
  onReplace,
  onDownloadTemplate,
}: ExcelImportPreviewModalProps) {
  if (!isOpen) return null;

  const disabled = importableCount === 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* ヘッダー */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#2c3e50' }}>
            インポートプレビュー
          </h2>
          <button
            onClick={onDownloadTemplate}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: '#2980b9',
              border: '1px solid #2980b9',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            テンプレートDL
          </button>
        </div>

        {/* ボディ */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* サマリー */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '20px',
          }}>
            <div style={{
              flex: 1,
              padding: '16px',
              background: '#eaf7ee',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#27ae60', fontVariantNumeric: 'tabular-nums' }}>
                {importableCount}
              </div>
              <div style={{ fontSize: '13px', color: '#2c3e50', marginTop: '4px' }}>取込可能件数</div>
            </div>
            <div style={{
              flex: 1,
              padding: '16px',
              background: errors.length > 0 ? '#fdecea' : '#f5f5f5',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                color: errors.length > 0 ? '#e74c3c' : '#7f8c8d',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {errors.length}
              </div>
              <div style={{ fontSize: '13px', color: '#2c3e50', marginTop: '4px' }}>エラー件数</div>
            </div>
          </div>

          {/* エラー一覧 */}
          {errors.length > 0 && (
            <div style={{
              background: '#fdecea',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e74c3c', marginBottom: '8px' }}>
                エラー詳細
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#721c24' }}>
                {errors.map((err, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {importableCount === 0 && errors.length === 0 && (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px', fontSize: '14px' }}>
              取込可能なデータがありません
            </div>
          )}
        </div>

        {/* フッター */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              background: '#f5f5f5',
              color: '#2c3e50',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={onReplace}
            disabled={disabled}
            style={{
              padding: '10px 20px',
              background: disabled ? '#bdc3c7' : '#e67e22',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            置換
          </button>
          <button
            onClick={onAdd}
            disabled={disabled}
            style={{
              padding: '10px 20px',
              background: disabled ? '#bdc3c7' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
