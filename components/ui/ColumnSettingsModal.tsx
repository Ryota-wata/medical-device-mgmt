'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';

interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  defaultVisible?: boolean;
  group?: string;
}

interface ColumnSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  visibleColumns: Record<string, boolean>;
  onVisibilityChange: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const COLUMN_GROUPS = [
  { id: 'basic', label: '基本情報' },
  { id: 'location', label: '設置場所' },
  { id: 'classification', label: '機器分類' },
  { id: 'specification', label: '機器仕様' },
  { id: 'size', label: 'サイズ' },
  { id: 'contract', label: '契約情報' },
  { id: 'lease', label: 'リース情報' },
  { id: 'financial', label: '財務情報' },
  { id: 'lifespan', label: '耐用年数' },
];

export function ColumnSettingsModal({
  isOpen,
  onClose,
  columns,
  visibleColumns,
  onVisibilityChange,
  onSelectAll,
  onDeselectAll,
}: ColumnSettingsModalProps) {
  // ドラッグ機能の状態管理
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // リサイズ機能の状態管理
  const [size, setSize] = useState({ width: 900, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [resizeDirection, setResizeDirection] = useState<string>('');

  // モーダルが開いたときに中央に配置
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      setPosition({
        x: (windowWidth - modalWidth) / 2,
        y: (windowHeight - modalHeight) / 2,
      });
    }
  }, [isOpen]);

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // リサイズ開始
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  // ドラッグ中
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !modalRef.current) return;

      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      // 画面外に出ないように制限
      newX = Math.max(0, Math.min(newX, windowWidth - modalWidth));
      newY = Math.max(0, Math.min(newY, windowHeight - modalHeight));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);

  // リサイズ中
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = position.x;
      let newY = position.y;

      const minWidth = 600;
      const minHeight = 400;
      const maxWidth = window.innerWidth - 100;
      const maxHeight = window.innerHeight - 100;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));
      }
      if (resizeDirection.includes('w')) {
        const proposedWidth = resizeStart.width - deltaX;
        if (proposedWidth >= minWidth && proposedWidth <= maxWidth) {
          newWidth = proposedWidth;
          newX = position.x + deltaX;
        }
      }
      if (resizeDirection.includes('n')) {
        const proposedHeight = resizeStart.height - deltaY;
        if (proposedHeight >= minHeight && proposedHeight <= maxHeight) {
          newHeight = proposedHeight;
          newY = position.y + deltaY;
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizeStart, resizeDirection, position]);

  // グループごとにカラムを分類
  const groupedColumns = useMemo(() => {
    const groups: Record<string, ColumnDef[]> = {};
    COLUMN_GROUPS.forEach(group => {
      groups[group.id] = columns.filter(col => col.group === group.id);
    });
    return groups;
  }, [columns]);

  // Hooksの後にreturn
  if (!isOpen) return null;

  // グループ全選択/全解除
  const handleGroupToggle = (groupId: string) => {
    const groupColumns = groupedColumns[groupId];
    const allSelected = groupColumns.every(col => visibleColumns[col.key]);

    groupColumns.forEach(col => {
      if (allSelected && visibleColumns[col.key]) {
        onVisibilityChange(col.key);
      } else if (!allSelected && !visibleColumns[col.key]) {
        onVisibilityChange(col.key);
      }
    });
  };

  // グループの選択状態を判定
  const getGroupStatus = (groupId: string) => {
    const groupColumns = groupedColumns[groupId];
    if (groupColumns.length === 0) return 'none';
    const selectedCount = groupColumns.filter(col => visibleColumns[col.key]).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === groupColumns.length) return 'all';
    return 'partial';
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      }}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: `${position.y}px`,
          left: `${position.x}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* モーダルヘッダー */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            background: '#9b59b6',
            color: 'white',
            padding: '20px 24px',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
        >
          <span>表示カラム設定（{columns.length}カラム）</span>
          <button
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
            }}
          >
            ×
          </button>
        </div>

        {/* モーダルボディ */}
        <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={onSelectAll}
              style={{
                padding: '8px 16px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              全て選択
            </button>
            <button
              onClick={onDeselectAll}
              style={{
                padding: '8px 16px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              全て解除
            </button>
          </div>

          {/* グループごとの表示 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {COLUMN_GROUPS.map(group => {
              const groupCols = groupedColumns[group.id];
              if (groupCols.length === 0) return null;
              const status = getGroupStatus(group.id);

              return (
                <div key={group.id} style={{ border: '1px solid #dee2e6', borderRadius: '6px', overflow: 'hidden' }}>
                  {/* グループヘッダー */}
                  <div
                    onClick={() => handleGroupToggle(group.id)}
                    style={{
                      background: status === 'all' ? '#e8f5e9' : status === 'partial' ? '#fff3e0' : '#f5f5f5',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      borderBottom: '1px solid #dee2e6',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = status === 'all' ? '#c8e6c9' : status === 'partial' ? '#ffe0b2' : '#eeeeee';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = status === 'all' ? '#e8f5e9' : status === 'partial' ? '#fff3e0' : '#f5f5f5';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={status === 'all'}
                      ref={(el) => {
                        if (el) el.indeterminate = status === 'partial';
                      }}
                      onChange={() => {}}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#2c3e50' }}>
                      {group.label} ({groupCols.filter(col => visibleColumns[col.key]).length}/{groupCols.length})
                    </span>
                  </div>

                  {/* グループ内のカラム */}
                  <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {groupCols.map((col) => (
                      <label
                        key={col.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px',
                          background: visibleColumns[col.key] ? '#e3f2fd' : 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#90caf9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.key]}
                          onChange={() => onVisibilityChange(col.key)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '13px', color: '#2c3e50' }}>{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* モーダルフッター */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            閉じる
          </button>
        </div>

        {/* リサイズハンドル */}
        {/* 上 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'n')}
          style={{
            position: 'absolute',
            top: 0,
            left: '10px',
            right: '10px',
            height: '5px',
            cursor: 'ns-resize',
          }}
        />
        {/* 下 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 's')}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '10px',
            right: '10px',
            height: '5px',
            cursor: 'ns-resize',
          }}
        />
        {/* 左 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'w')}
          style={{
            position: 'absolute',
            top: '10px',
            bottom: '10px',
            left: 0,
            width: '5px',
            cursor: 'ew-resize',
          }}
        />
        {/* 右 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'e')}
          style={{
            position: 'absolute',
            top: '10px',
            bottom: '10px',
            right: 0,
            width: '5px',
            cursor: 'ew-resize',
          }}
        />
        {/* 左上 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'nw')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '10px',
            height: '10px',
            cursor: 'nwse-resize',
          }}
        />
        {/* 右上 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'ne')}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '10px',
            height: '10px',
            cursor: 'nesw-resize',
          }}
        />
        {/* 左下 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'sw')}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '10px',
            height: '10px',
            cursor: 'nesw-resize',
          }}
        />
        {/* 右下 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'se')}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '10px',
            height: '10px',
            cursor: 'nwse-resize',
          }}
        />
      </div>
    </div>
  );
}
