'use client';

import React from 'react';

interface StepProgressBarProps {
  currentStep: number;
  steps?: { step: number; label: string }[];
  activeColor?: string;
}

const DEFAULT_STEPS = [
  { step: 1, label: '見積情報入力' },
  { step: 2, label: 'OCR明細確認' },
  { step: 3, label: '登録区分登録' },
  { step: 4, label: '個体品目AI判定' },
  { step: 5, label: '個体登録/金額按分' },
  { step: 6, label: '登録確認' },
];

export const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep, steps, activeColor }) => {
  const displaySteps = steps || DEFAULT_STEPS;
  const currentColor = activeColor || '#0092E6';
  const currentBorderColor = activeColor || '#0073B8';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 16px',
      background: '#FAFAFA',
      borderBottom: '1px solid #E1E1E1',
    }}>
      {displaySteps.map((item, index) => (
        <React.Fragment key={item.step}>
          {/* ステップ */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '100px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              background: item.step < currentStep ? '#008C1D' : item.step === currentStep ? currentColor : '#E1E1E1',
              color: item.step <= currentStep ? 'white' : '#8A8A8A',
              border: item.step === currentStep ? `2px solid ${currentBorderColor}` : 'none',
            }}>
              {item.step < currentStep ? '✓' : item.step}
            </div>
            <span style={{
              fontSize: '10px',
              marginTop: '4px',
              color: item.step === currentStep ? currentColor : item.step < currentStep ? '#008C1D' : '#8A8A8A',
              fontWeight: item.step === currentStep ? 'bold' : 'normal',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}>
              {item.label}
            </span>
          </div>
          {/* コネクター */}
          {index < displaySteps.length - 1 && (
            <div style={{
              flex: 1,
              height: '3px',
              background: item.step < currentStep ? '#008C1D' : '#E1E1E1',
              margin: '0 8px',
              marginBottom: '18px',
              minWidth: '30px',
              maxWidth: '60px',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
