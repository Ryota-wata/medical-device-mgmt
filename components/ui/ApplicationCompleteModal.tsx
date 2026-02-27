'use client';

import React from 'react';

interface ApplicationCompleteModalProps {
  isOpen: boolean;
  applicationName: string;
  applicationNo: string;
  guidanceText: string;
  returnDestination?: string;
  onGoToMain: () => void;
  onContinue: () => void;
}

export function ApplicationCompleteModal({
  isOpen,
  applicationName,
  applicationNo,
  guidanceText,
  returnDestination = 'メイン画面',
  onGoToMain,
  onContinue,
}: ApplicationCompleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '480px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          textAlign: 'center',
          padding: '40px 32px 32px',
        }}
      >
        {/* チェックマークアイコン */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#e8f5e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4a6741"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* 送信完了メッセージ */}
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#333',
            margin: '0 0 12px',
          }}
        >
          {applicationName}を送信しました
        </h2>

        {/* 申請No */}
        <p
          style={{
            fontSize: '14px',
            color: '#555',
            margin: guidanceText ? '0 0 16px' : '0 0 32px',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          申請No.: {applicationNo}
        </p>

        {/* ガイダンステキスト */}
        {guidanceText && (
          <p
            style={{
              fontSize: '13px',
              color: '#888',
              margin: '0 0 32px',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
            }}
          >
            {guidanceText}
          </p>
        )}

        {/* ボタン */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <button
            onClick={onGoToMain}
            style={{
              padding: '12px 24px',
              background: '#4a6741',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              minHeight: '44px',
            }}
          >
            {returnDestination}に戻る
          </button>
          <button
            onClick={onContinue}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#4a6741',
              border: '2px solid #4a6741',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              minHeight: '44px',
            }}
          >
            続けて申請する
          </button>
        </div>
      </div>
    </div>
  );
}
