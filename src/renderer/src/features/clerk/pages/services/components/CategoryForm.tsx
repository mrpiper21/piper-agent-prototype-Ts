import React from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { CategoryFormData } from '../types';
import { lightStyles, darkStyles, sharedStyles } from '../../../shared/clerkStyles';
import CategoryFormFields from './CategoryFormFields';

interface CategoryFormProps {
  isOpen: boolean;
  isSubmitting: boolean;
  editingCategory: any | null;
  formData: CategoryFormData;
  theme: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: Partial<CategoryFormData>) => void;
}

export default function CategoryForm({
  isOpen,
  isSubmitting,
  editingCategory,
  formData,
  theme,
  onClose,
  onSubmit,
  onFormDataChange,
}: CategoryFormProps) {
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

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
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...sharedStyles.card,
          ...themeStyles.card,
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          zIndex: 1001,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              color: themeStyles.text,
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            {editingCategory
              ? 'Edit Category'
              : formData.categoryType
                ? `Add ${formData.categoryType.replace('_', ' ').toUpperCase()} Category`
                : 'Add Category'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: themeStyles.textSecondary,
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px',
            }}
          >
            <AiOutlineClose />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ pointerEvents: 'auto', width: '100%' }}>
          <CategoryFormFields
            formData={formData}
            isSubmitting={isSubmitting}
            themeStyles={themeStyles}
            onFormDataChange={onFormDataChange}
            isEditing={!!editingCategory}
          />

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              pointerEvents: 'auto',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={getButtonStyles(themeStyles.button, isSubmitting)}
              onMouseEnter={(e) => handleButtonHover(e, isSubmitting, false)}
              onMouseLeave={(e) => handleButtonLeave(e, isSubmitting, false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={getButtonStyles(themeStyles.primaryButton, isSubmitting)}
              onMouseEnter={(e) => handleButtonHover(e, isSubmitting, true)}
              onMouseLeave={(e) => handleButtonLeave(e, isSubmitting, true)}
            >
              {isSubmitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getButtonStyles(baseStyle: any, isSubmitting: boolean) {
  return {
    ...sharedStyles.actionButton,
    ...baseStyle,
    opacity: isSubmitting ? 0.6 : 1,
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    pointerEvents: isSubmitting ? 'none' : 'auto',
    transition: 'all 0.2s ease',
  };
}

function handleButtonHover(e: React.MouseEvent<HTMLButtonElement>, isSubmitting: boolean, isPrimary: boolean) {
  if (!isSubmitting) {
    e.currentTarget.style.opacity = '0.9';
    if (isPrimary) {
      e.currentTarget.style.transform = 'scale(1.02)';
    }
  }
}

function handleButtonLeave(e: React.MouseEvent<HTMLButtonElement>, isSubmitting: boolean, isPrimary: boolean) {
  if (!isSubmitting) {
    e.currentTarget.style.opacity = '1';
    if (isPrimary) {
      e.currentTarget.style.transform = 'scale(1)';
    }
  }
}
