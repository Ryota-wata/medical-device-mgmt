import React from 'react';
import { RfqGroup, AssetMaster } from '@/lib/types';
import { OCRResult, QuotationFormData } from '@/lib/types/quotation';
import { Step1RfqGroupSelection } from './Step1RfqGroupSelection';
import { Step2OcrResultDisplay } from './Step2OcrResultDisplay';
import { Step3AssetMasterLinking } from './Step3AssetMasterLinking';

interface QuotationRegistrationModalProps {
  show: boolean;
  step: 1 | 2 | 3;
  rfqGroups: RfqGroup[];
  assetMasterData: AssetMaster[];
  formData: QuotationFormData;
  ocrProcessing: boolean;
  ocrResult: OCRResult | null;
  itemAssetLinks: Record<number, string>;
  onFormDataChange: (formData: QuotationFormData) => void;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateTestOCR: () => void;
  onStepChange: (step: 1 | 2 | 3) => void;
  onOpenAssetMasterWindow: (itemId: number) => void;
  onAdoptRecommendation: (itemIndex: number, assetId: string) => void;
  onRemoveLink: (itemIndex: number) => void;
  getAIRecommendation: (item: { itemName: string; manufacturer?: string; model?: string }) => AssetMaster | undefined;
  onSubmit: () => void;
  onClose: () => void;
}

export const QuotationRegistrationModal: React.FC<QuotationRegistrationModalProps> = ({
  show,
  step,
  rfqGroups,
  assetMasterData,
  formData,
  ocrProcessing,
  ocrResult,
  itemAssetLinks,
  onFormDataChange,
  onPdfUpload,
  onGenerateTestOCR,
  onStepChange,
  onOpenAssetMasterWindow,
  onAdoptRecommendation,
  onRemoveLink,
  getAIRecommendation,
  onSubmit,
  onClose,
}) => {
  if (!show) return null;

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
          width: step === 2 ? '1400px' : undefined,
          maxHeight: '90vh',
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
            onBack={() => onStepChange(1)}
            onNext={() => onStepChange(3)}
          />
        )}

        {step === 3 && ocrResult && (
          <Step3AssetMasterLinking
            ocrResult={ocrResult}
            assetMasterData={assetMasterData}
            itemAssetLinks={itemAssetLinks}
            onOpenAssetMasterWindow={onOpenAssetMasterWindow}
            onAdoptRecommendation={onAdoptRecommendation}
            onRemoveLink={onRemoveLink}
            getAIRecommendation={getAIRecommendation}
            onBack={() => onStepChange(2)}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </div>
  );
};
