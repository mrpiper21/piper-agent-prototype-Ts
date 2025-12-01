import React from 'react';
import { CategoryFormData, RegularFormatProperties } from '../types';
import { sharedStyles } from '../../../shared/clerkStyles';

interface CategoryFormFieldsProps {
  formData: CategoryFormData;
  isSubmitting: boolean;
  themeStyles: any;
  onFormDataChange: (data: Partial<CategoryFormData>) => void;
  isEditing?: boolean;
}

export default function CategoryFormFields({
  formData,
  isSubmitting,
  themeStyles,
  onFormDataChange,
  isEditing = false,
}: CategoryFormFieldsProps) {
  const handleInputChange = (field: keyof CategoryFormData, value: any) => {
    onFormDataChange({ [field]: value });
  };

  return (
    <>
      <FormField label="Name" required themeStyles={themeStyles} isSubmitting={isSubmitting}>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          required
          disabled={isSubmitting}
          autoComplete="off"
          style={getInputStyles(themeStyles, isSubmitting)}
          onFocus={(e) => handleFocus(e, themeStyles, isSubmitting)}
          onBlur={(e) => handleBlur(e, themeStyles)}
        />
      </FormField>

      <FormField label="Unit Price" required themeStyles={themeStyles} isSubmitting={isSubmitting}>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.unitPrice || ''}
          onChange={(e) => {
            const value = e.target.value;
            handleInputChange('unitPrice', value === '' ? 0 : parseFloat(value) || 0);
          }}
          required
          disabled={isSubmitting}
          autoComplete="off"
          style={getInputStyles(themeStyles, isSubmitting)}
          onFocus={(e) => handleFocus(e, themeStyles, isSubmitting)}
          onBlur={(e) => handleBlur(e, themeStyles)}
        />
        {!isEditing && formData.unitPrice > 0 && (
          <div
            style={{
              marginTop: '6px',
              fontSize: '12px',
              color: themeStyles.textSecondary,
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Price with 7% markup:</span>
            <span
              style={{
                fontWeight: '500',
                color: themeStyles.accent,
              }}
            >
              {(formData.unitPrice * 1.07).toFixed(2)}
            </span>
          </div>
        )}
      </FormField>

      {formData.categoryType && (
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              color: themeStyles.text,
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Category Type
          </label>
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${themeStyles.card.border}`,
              background: themeStyles.card.background,
              color: themeStyles.accent,
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'uppercase',
            }}
          >
            {formData.categoryType
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </div>
        </div>
      )}

      {formData.categoryType === 'regular_format' && (
        <RegularFormatPropertiesField
          value={formData.regularFormatProperties}
          isSubmitting={isSubmitting}
          themeStyles={themeStyles}
          onChange={(value) => handleInputChange('regularFormatProperties', value)}
        />
      )}

      <FormField label="Description" themeStyles={themeStyles} isSubmitting={isSubmitting}>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          disabled={isSubmitting}
          autoComplete="off"
          style={{
            ...getInputStyles(themeStyles, isSubmitting),
            resize: 'vertical' as const,
            fontFamily: 'inherit',
          }}
          onFocus={(e) => handleFocus(e, themeStyles, isSubmitting)}
          onBlur={(e) => handleBlur(e, themeStyles)}
        />
      </FormField>
    </>
  );
}

function FormField({
  label,
  required,
  children,
  themeStyles,
  isSubmitting,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  themeStyles: any;
  isSubmitting: boolean;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          color: themeStyles.text,
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500',
          pointerEvents: 'auto',
        }}
      >
        {label} {required && <span style={{ color: themeStyles.error }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function RegularFormatPropertiesField({
  value,
  isSubmitting,
  themeStyles,
  onChange,
}: {
  value?: RegularFormatProperties;
  isSubmitting: boolean;
  themeStyles: any;
  onChange: (value: RegularFormatProperties) => void;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          color: themeStyles.text,
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        Format Property <span style={{ color: themeStyles.error }}>*</span>
      </label>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'auto',
        }}
      >
        <RadioOption
          label="Front Only"
          value="front_only"
          checked={value === 'front_only'}
          isSubmitting={isSubmitting}
          themeStyles={themeStyles}
          onChange={onChange}
        />
        <RadioOption
          label="Front and Back"
          value="front_and_back"
          checked={value === 'front_and_back'}
          isSubmitting={isSubmitting}
          themeStyles={themeStyles}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

function RadioOption({
  label,
  value,
  checked,
  isSubmitting,
  themeStyles,
  onChange,
}: {
  label: string;
  value: RegularFormatProperties;
  checked: boolean;
  isSubmitting: boolean;
  themeStyles: any;
  onChange: (value: RegularFormatProperties) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: isSubmitting ? 'not-allowed' : 'pointer',
        padding: '10px 12px',
        borderRadius: '6px',
        border: `1px solid ${themeStyles.card.border}`,
        background: themeStyles.card.background,
        transition: 'all 0.2s ease',
        opacity: isSubmitting ? 0.6 : 1,
        pointerEvents: isSubmitting ? 'none' : 'auto',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSubmitting) {
          e.currentTarget.style.borderColor = themeStyles.accent;
          e.currentTarget.style.borderWidth = '2px';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSubmitting) {
          e.currentTarget.style.borderColor = themeStyles.card.border;
          e.currentTarget.style.borderWidth = '1px';
        }
      }}
      onClick={() => {
        if (!isSubmitting && !checked) {
          onChange(value);
        }
      }}
    >
      <input
        type="radio"
        name="regularFormatProperties"
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value as RegularFormatProperties)}
        disabled={isSubmitting}
        style={{
          marginRight: '10px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          width: '18px',
          height: '18px',
          accentColor: themeStyles.accent,
        }}
      />
      <span style={{ color: themeStyles.text, fontSize: '14px' }}>{label}</span>
    </label>
  );
}

function getInputStyles(themeStyles: any, isSubmitting: boolean) {
  return {
    ...sharedStyles.input,
    ...themeStyles.input,
    width: '100%',
    padding: '8px 12px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    cursor: isSubmitting ? 'not-allowed' : 'text',
    pointerEvents: isSubmitting ? 'none' : 'auto',
    opacity: isSubmitting ? 0.6 : 1,
  };
}

function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, themeStyles: any, isSubmitting: boolean) {
  if (!isSubmitting) {
    e.currentTarget.style.borderColor = themeStyles.accent;
    e.currentTarget.style.borderWidth = '2px';
  }
}

function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, themeStyles: any) {
  e.currentTarget.style.border = themeStyles.input.border;
  e.currentTarget.style.borderWidth = '1px';
}

