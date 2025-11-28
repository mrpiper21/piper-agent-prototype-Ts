import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import React, { useState } from 'react';
import { electronAPI } from '../../../lib';
import { AiOutlineClose } from 'react-icons/ai';
import { AccessDenied } from './user-management/components';

export default function ServicesPage() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [formData, setFormData] = useState<{ name: string; unitPrice: number; description: string }>({
    name: '',
    unitPrice: 0,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  // Check if user is admin
  if (user?.role !== 'admin') {
    return <AccessDenied />;
  }

  React.useEffect(() => {
    if (user?.id) {
      loadCategories();
    }
  }, [user?.id]);

  const loadCategories = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const data = await electronAPI.categories.getAll(user.id);
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', unitPrice: 0, description: '' });
    setIsDrawerOpen(true);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      unitPrice: category.unitPrice || 0,
      description: category.description || '',
    });
    setIsDrawerOpen(true);
  };

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
    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }
    if (formData.unitPrice < 0) {
      alert('Unit price must be a positive number');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await electronAPI.categories.update(editingCategory.id || editingCategory._id, formData);
      } else {
        await electronAPI.categories.create(formData);
      }
      setIsDrawerOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', unitPrice: 0, description: '' });
      await loadCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      alert(error.message || 'Failed to save category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsDrawerOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', unitPrice: 0, description: '' });
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
        <div style={{ ...styles.card, ...themeStyles.card }}>
          <p style={{ color: themeStyles.text }}>Loading categories...</p>
        </div>
      </div>
    );
  }

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ ...styles.card, ...themeStyles.card }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
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
              Categories
            </h2>
            <button
              onClick={handleAdd}
              style={{ ...styles.actionButton, ...themeStyles.primaryButton }}
            >
              Add Category
            </button>
          </div>

          {categories.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: themeStyles.textSecondary,
              }}
            >
              <p style={{ fontSize: '14px', margin: 0 }}>No categories found</p>
              <p style={{ fontSize: '12px', margin: '8px 0 0 0', opacity: 0.7 }}>
                Click "Add Category" to create your first category
              </p>
            </div>
          ) : (
            <div style={styles.categoriesList}>
              {categories.map((category) => (
                <div
                  key={category.id || category._id}
                  style={{ ...styles.categoryCard, ...themeStyles.card }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        color: themeStyles.text,
                        margin: 0,
                        marginBottom: '4px',
                        fontSize: '16px',
                        fontWeight: '600',
                      }}
                    >
                      {category.name}
                    </h3>
                    <p
                      style={{
                        color: themeStyles.textSecondary,
                        margin: 0,
                        marginBottom: category.description ? '4px' : 0,
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      Unit Price: ${category.unitPrice?.toFixed(2) || '0.00'}
                    </p>
                    {category.description && (
                      <p
                        style={{
                          color: themeStyles.textSecondary,
                          margin: 0,
                          fontSize: '13px',
                        }}
                      >
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(category)}
                      style={{
                        ...styles.iconButton,
                        ...themeStyles.button,
                        padding: '6px 12px',
                        fontSize: '13px',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id || category._id)}
                      style={{
                        ...styles.iconButton,
                        ...themeStyles.dangerButton,
                        padding: '6px 12px',
                        fontSize: '13px',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer for Add/Edit */}
        {isDrawerOpen && (
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
            onClick={handleClose}
          >
            <div
              style={{
                ...styles.card,
                ...themeStyles.card,
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
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
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h2>
                <button
                  onClick={handleClose}
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

              <form onSubmit={handleSubmit}>
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
                    Name <span style={{ color: themeStyles.error }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${themeStyles.card.border}`,
                      background:
                        (themeStyles as any).input?.background || themeStyles.card.background,
                      color: (themeStyles as any).input?.color || themeStyles.text,
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box' as const,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = themeStyles.accent;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = themeStyles.card.border;
                    }}
                  />
                </div>

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
                    Unit Price <span style={{ color: themeStyles.error }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${themeStyles.card.border}`,
                      background:
                        (themeStyles as any).input?.background || themeStyles.card.background,
                      color: (themeStyles as any).input?.color || themeStyles.text,
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box' as const,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = themeStyles.accent;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = themeStyles.card.border;
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      color: themeStyles.text,
                      marginBottom: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${themeStyles.card.border}`,
                      background:
                        (themeStyles as any).input?.background || themeStyles.card.background,
                      color: (themeStyles as any).input?.color || themeStyles.text,
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical' as const,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box' as const,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = themeStyles.accent;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = themeStyles.card.border;
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      ...styles.actionButton,
                      ...themeStyles.button,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      ...styles.actionButton,
                      ...themeStyles.primaryButton,
                      opacity: isSubmitting ? 0.6 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    padding: '16px',
    borderRadius: '8px',
  },
  actionButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  iconButton: {
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.2s ease',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  categoryCard: {
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid',
  },
};

const lightStyles = {
  text: '#1a2d4f',
  textSecondary: '#4a5a7a',
  accent: '#1e4d72',
  success: '#10b981',
  error: '#ef4444',
  card: { background: '#ffffff', border: '1px solid #cbd5e0' },
  button: { background: '#ffffff', color: '#1a2d4f', border: '1px solid #cbd5e0' },
  primaryButton: { background: '#1e4d72', color: '#ffffff' },
  dangerButton: { background: '#ef4444', color: '#ffffff' },
};

const darkStyles = {
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  accent: '#60a5fa',
  success: '#34d399',
  error: '#f87171',
  card: { background: '#0f172a', border: '1px solid #334155' },
  button: { background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' },
  primaryButton: { background: '#60a5fa', color: '#0f172a' },
  dangerButton: { background: '#f87171', color: '#0f172a' },
};

