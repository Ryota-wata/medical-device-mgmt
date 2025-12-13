import React, { useState, useRef, useEffect, useCallback } from 'react';

interface EditableCellProps {
  value: string;
  fieldKey: string;
  applicationId: number;
  isSelected: boolean;
  selectedCount: number;
  onSave: (id: number, fieldKey: string, value: string) => void;
  onBulkEdit: (fieldKey: string, currentValue: string) => void;
  style?: React.CSSProperties;
  type?: 'text' | 'select';
  options?: string[];
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  fieldKey,
  applicationId,
  isSelected,
  selectedCount,
  onSave,
  onBulkEdit,
  style = {},
  type = 'text',
  options = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const cellRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // セル外クリックで編集終了
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (cellRef.current && !cellRef.current.contains(e.target as Node)) {
      if (editValue !== value) {
        onSave(applicationId, fieldKey, editValue);
      }
      setIsEditing(false);
      setIsHovered(false);
    }
  }, [editValue, value, applicationId, fieldKey, onSave]);

  useEffect(() => {
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEditing, handleClickOutside]);

  // ダブルクリックで編集モードに入る
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 複数選択されている場合は一括編集モーダルを開く
    if (selectedCount > 1 && isSelected) {
      onBulkEdit(fieldKey, value);
      return;
    }

    // 単一編集モードに入る
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue !== value) {
      onSave(applicationId, fieldKey, editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const cellStyle: React.CSSProperties = {
    padding: '12px 8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    backgroundColor: isEditing
      ? '#fff3cd'
      : isHovered
        ? '#e8f4fd'
        : 'transparent',
    position: 'relative',
    ...style,
  };

  if (isEditing) {
    return (
      <td ref={cellRef} style={cellStyle}>
        {type === 'select' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '4px 8px',
              border: '2px solid #3498db',
              borderRadius: '4px',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">-</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '4px 8px',
              border: '2px solid #3498db',
              borderRadius: '4px',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        )}
      </td>
    );
  }

  return (
    <td
      ref={cellRef}
      style={cellStyle}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={selectedCount > 1 && isSelected ? 'ダブルクリックで一括編集' : 'ダブルクリックで編集'}
    >
      {value || '-'}
      {isHovered && (
        <span style={{
          position: 'absolute',
          right: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '10px',
          color: '#3498db',
          pointerEvents: 'none',
        }}>
          ✏️
        </span>
      )}
    </td>
  );
};
