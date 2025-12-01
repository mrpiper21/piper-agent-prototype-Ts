import { useState, useEffect } from 'react';
import { electronAPI } from '../../../../../lib';
import { CategoryFormData, Category, CategoryType } from '../types';

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadCategories = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const data = await electronAPI.categories.getAll(userId);
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadCategories();
    }
  }, [userId]);

  return {
    categories,
    isLoading,
    loadCategories,
  };
}

export function useCategoryForm() {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    unitPrice: 0,
    description: '',
    categoryType: undefined,
    regularFormatProperties: undefined,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      unitPrice: 0,
      description: '',
      categoryType: undefined,
      regularFormatProperties: undefined,
    });
    setEditingCategory(null);
    setIsSubmitting(false);
  };

  const handleAdd = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleAddCategoryType = (type: CategoryType) => {
    resetForm();
    setFormData((prev) => ({ ...prev, categoryType: type }));
    setIsDrawerOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsSubmitting(false);
    setFormData({
      name: category.name || '',
      unitPrice: category.unitPrice || 0,
      description: category.description || '',
      categoryType: category.categoryType || undefined,
      regularFormatProperties: category.regularFormatProperties || undefined,
    });
    setIsDrawerOpen(true);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsDrawerOpen(false);
    resetForm();
  };

  return {
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
    resetForm,
  };
}

