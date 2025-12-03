'use client';

/**
 * 共通フォームフィールドコンポーネント
 * Phase 1-2で作成したスタイル定数とフックを活用
 */

import React from 'react';
import { inputStyle, selectStyle, labelStyle } from '@/lib/styles/helpers';
import { colors, spacing, fontSize } from '@/lib/styles/constants';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

/**
 * フォームフィールドラッパー
 *
 * 使用例:
 * ```tsx
 * <FormField label="施設名" required error={errors.name}>
 *   <Input value={name} onChange={setName} />
 * </FormField>
 * ```
 */
export const FormField: React.FC<FormFieldProps> = ({ label, required, error, helperText, children }) => {
  return (
    <div style={{ marginBottom: spacing.lg }}>
      <label style={labelStyle({ required })}>
        {label}
        {required && <span style={{ color: colors.status.error, marginLeft: spacing.xs }}>*</span>}
      </label>
      {children}
      {error && (
        <div style={{ marginTop: spacing.xs, fontSize: fontSize.sm, color: colors.status.error }}>
          {error}
        </div>
      )}
      {helperText && !error && (
        <div style={{ marginTop: spacing.xs, fontSize: fontSize.sm, color: colors.text.secondary }}>
          {helperText}
        </div>
      )}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  fullWidth?: boolean;
}

/**
 * テキスト入力コンポーネント
 *
 * 使用例:
 * ```tsx
 * <Input
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   placeholder="入力してください"
 *   hasError={!!error}
 * />
 * ```
 */
export const Input: React.FC<InputProps> = ({
  hasError = false,
  fullWidth = true,
  disabled = false,
  style: customStyle,
  ...props
}) => {
  const baseStyle = inputStyle({ hasError, disabled, fullWidth });

  return <input {...props} disabled={disabled} style={{ ...baseStyle, ...customStyle }} />;
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
  fullWidth?: boolean;
  rows?: number;
}

/**
 * テキストエリアコンポーネント
 *
 * 使用例:
 * ```tsx
 * <Textarea
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   rows={5}
 *   placeholder="詳細を入力"
 * />
 * ```
 */
export const Textarea: React.FC<TextareaProps> = ({
  hasError = false,
  fullWidth = true,
  disabled = false,
  rows = 3,
  style: customStyle,
  ...props
}) => {
  const baseStyle = inputStyle({ hasError, disabled, fullWidth });

  return (
    <textarea
      {...props}
      disabled={disabled}
      rows={rows}
      style={{
        ...baseStyle,
        ...customStyle,
        minHeight: '80px',
        resize: 'vertical',
        fontFamily: 'inherit',
      }}
    />
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  fullWidth?: boolean;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

/**
 * セレクトボックスコンポーネント
 *
 * 使用例:
 * ```tsx
 * <Select
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   options={[
 *     { value: '1', label: '選択肢1' },
 *     { value: '2', label: '選択肢2' }
 *   ]}
 *   placeholder="選択してください"
 * />
 * ```
 */
export const Select: React.FC<SelectProps> = ({
  hasError = false,
  fullWidth = true,
  disabled = false,
  options,
  placeholder,
  style: customStyle,
  ...props
}) => {
  const baseStyle = selectStyle({ hasError, disabled, fullWidth });

  return (
    <select {...props} disabled={disabled} style={{ ...baseStyle, ...customStyle }}>
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/**
 * チェックボックスコンポーネント
 *
 * 使用例:
 * ```tsx
 * <Checkbox
 *   label="同意する"
 *   checked={agreed}
 *   onChange={(e) => setAgreed(e.target.checked)}
 * />
 * ```
 */
export const Checkbox: React.FC<CheckboxProps> = ({ label, style: customStyle, ...props }) => {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        color: props.disabled ? colors.text.muted : colors.text.primary,
        ...customStyle,
      }}
    >
      <input
        {...props}
        type="checkbox"
        style={{
          width: '16px',
          height: '16px',
          cursor: props.disabled ? 'not-allowed' : 'pointer',
        }}
      />
      <span style={{ fontSize: fontSize.md }}>{label}</span>
    </label>
  );
};

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/**
 * ラジオボタンコンポーネント
 *
 * 使用例:
 * ```tsx
 * <Radio
 *   name="option"
 *   value="1"
 *   label="選択肢1"
 *   checked={selected === '1'}
 *   onChange={(e) => setSelected(e.target.value)}
 * />
 * ```
 */
export const Radio: React.FC<RadioProps> = ({ label, style: customStyle, ...props }) => {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        color: props.disabled ? colors.text.muted : colors.text.primary,
        ...customStyle,
      }}
    >
      <input
        {...props}
        type="radio"
        style={{
          width: '16px',
          height: '16px',
          cursor: props.disabled ? 'not-allowed' : 'pointer',
        }}
      />
      <span style={{ fontSize: fontSize.md }}>{label}</span>
    </label>
  );
};

interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  direction?: 'horizontal' | 'vertical';
}

/**
 * ラジオボタングループコンポーネント
 *
 * 使用例:
 * ```tsx
 * <RadioGroup
 *   name="choice"
 *   value={selected}
 *   onChange={setSelected}
 *   options={[
 *     { value: '1', label: '選択肢1' },
 *     { value: '2', label: '選択肢2' }
 *   ]}
 *   direction="horizontal"
 * />
 * ```
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  disabled = false,
  direction = 'vertical',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        gap: spacing.md,
      }}
    >
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          label={option.label}
          checked={value === option.value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};
