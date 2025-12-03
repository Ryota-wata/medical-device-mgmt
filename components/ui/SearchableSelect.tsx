'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  isMobile?: boolean;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = '選択または入力してください',
  label,
  isMobile = false,
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchQuery, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionClick = (option: string) => {
    setSearchQuery(option);
    onChange(option);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  return (
    <div style={{ width: '100%', position: 'relative' }} ref={containerRef}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: isMobile ? '13px' : '14px',
          fontWeight: 600,
          color: '#2c3e50',
          marginBottom: isMobile ? '6px' : '8px'
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: isMobile ? '10px' : '10px 12px',
            paddingRight: '36px',
            border: '1px solid #d0d0d0',
            borderRadius: '6px',
            fontSize: isMobile ? '14px' : '14px',
            background: disabled ? '#f8f9fa' : 'white',
            cursor: disabled ? 'not-allowed' : 'text',
            boxSizing: 'border-box'
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#7f8c8d',
            fontSize: '12px'
          }}
        >
          ▼
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'white',
          border: '1px solid #d0d0d0',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxHeight: isMobile ? '200px' : '300px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handleOptionClick(option)}
              style={{
                padding: isMobile ? '10px 12px' : '12px 14px',
                cursor: 'pointer',
                fontSize: isMobile ? '13px' : '14px',
                color: '#2c3e50',
                background: option === value ? '#e8f4f8' : 'white',
                borderBottom: index < filteredOptions.length - 1 ? '1px solid #f0f0f0' : 'none',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => {
                if (option !== value) {
                  e.currentTarget.style.background = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (option !== value) {
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && searchQuery && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'white',
          border: '1px solid #d0d0d0',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: isMobile ? '12px' : '16px',
          textAlign: 'center',
          color: '#7f8c8d',
          fontSize: isMobile ? '13px' : '14px',
          zIndex: 1000
        }}>
          検索結果がありません
        </div>
      )}

      {!disabled && (
        <span style={{
          display: 'block',
          fontSize: isMobile ? '10px' : '11px',
          color: '#7f8c8d',
          marginTop: '4px'
        }}>
          フリー入力・一覧選択・あいまい検索可
        </span>
      )}
    </div>
  );
}
