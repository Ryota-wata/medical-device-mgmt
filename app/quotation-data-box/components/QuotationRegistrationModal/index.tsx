import React, { useState, useCallback } from 'react';
import { RfqGroup, AssetMaster, Application } from '@/lib/types';
import { OCRResult, QuotationFormData, OCRResultItem, ConfirmedStateMap } from '@/lib/types/quotation';
import { Step1RfqGroupSelection } from './Step1RfqGroupSelection';
import { Step2OcrResultDisplay } from './Step2OcrResultDisplay';
import { Step3AssetMasterLinking } from './Step3AssetMasterLinking';
import { ApplicationFormData } from './ApplicationCreationModal';

interface QuotationRegistrationModalProps {
  show: boolean;
  step: 1 | 2 | 3;
  rfqGroups: RfqGroup[];
  assetMasterData: AssetMaster[];
  applications: Application[];
  formData: QuotationFormData;
  ocrProcessing: boolean;
  ocrResult: OCRResult | null;
  onFormDataChange: (formData: QuotationFormData) => void;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateTestOCR: () => void;
  onStepChange: (step: 1 | 2 | 3) => void;
  onCreateApplication: (formData: ApplicationFormData, ocrItem: OCRResultItem) => void;
  onSubmit: (confirmedState: ConfirmedStateMap, ocrResult: OCRResult) => void;
  onClose: () => void;
}

export const QuotationRegistrationModal: React.FC<QuotationRegistrationModalProps> = ({
  show,
  step,
  rfqGroups,
  assetMasterData,
  applications,
  formData,
  ocrProcessing,
  ocrResult,
  onFormDataChange,
  onPdfUpload,
  onGenerateTestOCR,
  onStepChange,
  onCreateApplication,
  onSubmit,
  onClose,
}) => {
  // Step2で確定された内容を管理
  const [confirmedState, setConfirmedState] = useState<ConfirmedStateMap>({});

  // Step2からの確定状態変更を受け取るコールバック
  const handleConfirmedStateChange = useCallback((newState: ConfirmedStateMap) => {
    setConfirmedState(newState);
  }, []);

  if (!show) return null;

  // 選択された見積依頼グループを取得
  const selectedRfqGroup = formData.rfqGroupId
    ? rfqGroups.find(g => g.id.toString() === formData.rfqGroupId)
    : undefined;

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
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '30px',
          minWidth: '600px',
          maxWidth: '95%',
          width: step === 2 ? '1400px' : step === 3 ? '1400px' : undefined,
          maxHeight: '92vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
          見積書登録 - Step {step}/3
        </h2>

        {step === 1 && (
          <Step1RfqGroupSelection
            rfqGroups={rfqGroups}
            formData={formData}
            ocrProcessing={ocrProcessing}
            onFormDataChange={onFormDataChange}
            onPdfUpload={onPdfUpload}
            onGenerateTestOCR={onGenerateTestOCR}
            onCancel={onClose}
          />
        )}

        {step === 2 && ocrResult && (
          <Step2OcrResultDisplay
            ocrResult={ocrResult}
            pdfFile={formData.pdfFile}
            confirmedState={confirmedState}
            onConfirmedStateChange={handleConfirmedStateChange}
            onBack={() => onStepChange(1)}
            onNext={() => onStepChange(3)}
          />
        )}

        {step === 3 && ocrResult && (
          <Step3AssetMasterLinking
            ocrResult={ocrResult}
            rfqGroup={selectedRfqGroup}
            applications={applications}
            confirmedState={confirmedState}
            onCreateApplication={onCreateApplication}
            onBack={() => onStepChange(2)}
            onSubmit={() => onSubmit(confirmedState, ocrResult)}
          />
        )}
      </div>
    </div>
  );
};
