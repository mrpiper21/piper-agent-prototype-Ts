import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { electronAPI } from '../../../lib';
import { AccessDenied } from './user-management/components';
import { sharedStyles, lightStyles, darkStyles } from '../shared/clerkStyles';
import { CategoryForm, CategoryList, CategoryTabs } from './services/components';
import { useCategories, useCategoryForm } from './services/hooks/useCategories';
import { PaymentMethodModal } from '../../../shared/components/PaymentMethodModal';
import {
  CategoryFormData,
  CategoryType,
  RegularFormatProperties,
  CategoryTab,
  Category,
} from './services/types';

export default function ServicesPage() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<CategoryTab>('regular');

  const { categories, isLoading, loadCategories } = useCategories(user?.id);
  const {
    isDrawerOpen,
    editingCategory,
    isSubmitting,
    formData,
    setIsSubmitting,
    setFormData,
    handleAdd,
    handleAddCategoryType,
    handleEdit,
    handleClose,
  } = useCategoryForm();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const themeStyles = useMemo(() => {
    return theme === 'dark' ? darkStyles : lightStyles;
  }, [theme]);

  if (user?.role !== 'admin') {
    return <AccessDenied />;
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }
    try {
      await electronAPI.categories.delete(id);
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      alert('Category name is required');
      return;
    }

    if (formData.unitPrice <= 0 || isNaN(formData.unitPrice)) {
      alert('Unit price must be a positive number greater than 0');
      return;
    }

    if (formData.categoryType === 'regular_format' && !formData.regularFormatProperties) {
      alert('Please select a format property (Front Only or Front and Back)');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload(formData, editingCategory);

      if (editingCategory) {
        await electronAPI.categories.update(
          editingCategory.id || editingCategory._id || '',
          payload
        );
      } else {
        await electronAPI.categories.create(payload);
      }

      handleClose();
      await loadCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      
      // Check if payment method is not set
      const errorMessage = error?.message || error?.response?.data?.message || '';
      const hasPaymentError = 
        error?.hasSetPaymentMethod === false ||
        error?.response?.data?.hasSetPaymentMethod === false ||
        errorMessage.toLowerCase().includes('payment method') ||
        errorMessage.toLowerCase().includes('contact system support');
      
      if (hasPaymentError) {
        setShowPaymentModal(true);
        return;
      }
      
      alert(errorMessage || 'Failed to save category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormDataChange = (data: Partial<CategoryFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  if (isLoading && categories.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--spacing-md, 12px)',
          height: '100%',
          overflow: 'auto',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div style={{ ...sharedStyles.card, ...themeStyles.card }}>
          <p style={{ color: themeStyles.text }}>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...sharedStyles.container,
        padding: 'var(--spacing-md, 12px)',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <CategoryTabs
          activeTab={activeTab}
          theme={theme}
          onTabChange={setActiveTab}
          onAddCategory={handleAdd}
          onAddCategoryType={handleAddCategoryType}
        />

        <div style={{ ...sharedStyles.card, ...themeStyles.card }}>
          <CategoryList
            categories={categories}
            activeTab={activeTab}
            theme={theme}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <CategoryForm
          isOpen={isDrawerOpen}
          isSubmitting={isSubmitting}
          editingCategory={editingCategory}
          formData={formData}
          theme={theme}
          onClose={handleClose}
          onSubmit={handleSubmit}
          onFormDataChange={handleFormDataChange}
        />

        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      </div>
    </div>
  );
}

function buildPayload(formData: CategoryFormData, editingCategory: Category | null) {
  // Add 7% markup when creating a new category (not editing)
  const unitPrice = editingCategory ? formData.unitPrice : formData.unitPrice * 1.07;

  const payload: {
    name: string;
    unitPrice: number;
    description?: string;
    categoryType?: CategoryType;
    regularFormatProperties?: RegularFormatProperties;
  } = {
    name: formData.name.trim(),
    unitPrice: Math.round(unitPrice * 100) / 100, // Round to 2 decimal places
  };

  if (formData.description?.trim()) {
    payload.description = formData.description.trim();
  }

  if (formData.categoryType) {
    payload.categoryType = formData.categoryType;
  }

  if (formData.regularFormatProperties) {
    payload.regularFormatProperties = formData.regularFormatProperties;
  }

  return payload;
}
