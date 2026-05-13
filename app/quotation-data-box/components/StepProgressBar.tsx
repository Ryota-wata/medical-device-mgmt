'use client';

import React from 'react';

interface StepProgressBarProps {
  currentStep: number;
  steps?: { step: number; label: string }[];
  /** @deprecated Figma パレット統一に伴い無視。後方互換のため残存 (orphan `page 2.tsx` 用) */
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

export const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep, steps }) => {
  const displaySteps = steps || DEFAULT_STEPS;

  return (
    <div className="flex items-start justify-between px-8 py-3 bg-surface-screen">
      {displaySteps.map((item, index) => {
        const isCompleted = item.step < currentStep;
        const isCurrent = item.step === currentStep;
        const circleBg = isCompleted
          ? 'bg-step-completed'
          : isCurrent
            ? 'bg-cta-primary-dark'
            : 'bg-stroke-input';
        const labelColor = isCompleted
          ? 'text-step-completed'
          : isCurrent
            ? 'text-cta-primary-dark font-bold'
            : 'text-content-sub';
        const connectorBg = isCompleted ? 'bg-step-completed' : 'bg-stroke-input';

        return (
          <React.Fragment key={item.step}>
            <div className="flex flex-col items-center gap-2 shrink-0 w-10">
              <div
                className={`flex items-center justify-center size-10 rounded-full text-white text-sm ${circleBg}`}
              >
                {isCompleted ? '✓' : item.step}
              </div>
              <span className={`text-xs text-center whitespace-nowrap ${labelColor}`}>{item.label}</span>
            </div>
            {index < displaySteps.length - 1 && (
              <div className={`flex-1 h-0.5 mt-5 mx-2 ${connectorBg}`} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
