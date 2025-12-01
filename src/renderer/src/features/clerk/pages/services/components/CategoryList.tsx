import React from 'react';
import { Category, CategoryTab } from '../types';
import { lightStyles, darkStyles, sharedStyles } from '../../../shared/clerkStyles';

interface CategoryListProps {
  categories: Category[];
  activeTab: CategoryTab;
  theme: 'light' | 'dark';
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export default function CategoryList({
  categories,
  activeTab,
  theme,
  onEdit,
  onDelete,
}: CategoryListProps) {
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const filteredCategories = getFilteredCategories(categories, activeTab);

  if (filteredCategories.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: themeStyles.textSecondary,
        }}
      >
        <p style={{ fontSize: '14px', margin: 0 }}>
          {getEmptyMessage(activeTab)}
        </p>
        <p style={{ fontSize: '12px', margin: '8px 0 0 0', opacity: 0.7 }}>
          {getEmptySubMessage(activeTab)}
        </p>
      </div>
    );
  }

  return (
    <div style={{ ...sharedStyles.jobsList, gap: '12px' }}>
      {filteredCategories.map((category) => (
        <CategoryCard
          key={category.id || category._id}
          category={category}
          themeStyles={themeStyles}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function CategoryCard({
  category,
  themeStyles,
  onEdit,
  onDelete,
}: {
  category: Category;
  themeStyles: any;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      style={{
        ...sharedStyles.card,
        ...themeStyles.card,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--spacing-md, 12px)',
      }}
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
          Unit Price: GHS{category.unitPrice?.toFixed(2) || '0.00'}
        </p>
        {category.categoryType && (
          <p
            style={{
              color: themeStyles.accent,
              margin: 0,
              marginBottom: category.description ? '4px' : 0,
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
            }}
          >
            Type:{' '}
            {category.categoryType
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </p>
        )}
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
          onClick={() => onEdit(category)}
          style={{
            ...sharedStyles.actionButton,
            ...themeStyles.button,
            padding: '6px 12px',
            fontSize: '13px',
          }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(category.id || category._id || '')}
          style={{
            ...sharedStyles.actionButton,
            ...themeStyles.dangerButton,
            padding: '6px 12px',
            fontSize: '13px',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function getFilteredCategories(categories: Category[], activeTab: CategoryTab): Category[] {
  switch (activeTab) {
    case 'regular':
      return categories.filter((cat) => !cat.categoryType);
    case 'results':
      return categories.filter(
        (cat) =>
          cat.categoryType === 'wassce_result' ||
          cat.categoryType === 'bece_result' ||
          cat.categoryType === 'novdec_result'
      );
    case 'formats':
      return categories.filter(
        (cat) => cat.categoryType === 'large_format' || cat.categoryType === 'regular_format'
      );
    default:
      return [];
  }
}

function getEmptyMessage(activeTab: CategoryTab): string {
  switch (activeTab) {
    case 'regular':
      return 'No regular categories found';
    case 'results':
      return 'No result checker categories found';
    case 'formats':
      return 'No format categories found';
    default:
      return 'No categories found';
  }
}

function getEmptySubMessage(activeTab: CategoryTab): string {
  switch (activeTab) {
    case 'regular':
      return 'Click "Add Category" to create your first regular category';
    case 'results':
      return 'Click one of the buttons above to create a result checker category';
    case 'formats':
      return 'Click one of the buttons above to create a format category';
    default:
      return '';
  }
}

