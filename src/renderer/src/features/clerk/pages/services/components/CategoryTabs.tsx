import React from 'react';
import { CategoryTab, CategoryType } from '../types';
import { lightStyles, darkStyles, sharedStyles } from '../../../shared/clerkStyles';

interface CategoryTabsProps {
  activeTab: CategoryTab;
  theme: 'light' | 'dark';
  onTabChange: (tab: CategoryTab) => void;
  onAddCategory: () => void;
  onAddCategoryType: (type: CategoryType) => void;
}

export default function CategoryTabs({
  activeTab,
  theme,
  onTabChange,
  onAddCategory,
  onAddCategoryType,
}: CategoryTabsProps) {
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <>
      <div style={{ ...sharedStyles.card, ...themeStyles.card, padding: '0' }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${themeStyles.card.border}` }}>
          <TabButton
            label="Regular Categories"
            tab="regular"
            activeTab={activeTab}
            themeStyles={themeStyles}
            onClick={() => onTabChange('regular')}
          />
          <TabButton
            label="Result Checker Categories"
            tab="results"
            activeTab={activeTab}
            themeStyles={themeStyles}
            onClick={() => onTabChange('results')}
          />
          <TabButton
            label="Format Categories"
            tab="formats"
            activeTab={activeTab}
            themeStyles={themeStyles}
            onClick={() => onTabChange('formats')}
          />
        </div>
      </div>

      <div style={{ ...sharedStyles.card, ...themeStyles.card }}>
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
            {getTabTitle(activeTab)}
          </h2>
          {getActionButtons(activeTab, themeStyles, onAddCategory, onAddCategoryType)}
        </div>
      </div>
    </>
  );
}

function TabButton({
  label,
  tab,
  activeTab,
  themeStyles,
  onClick,
}: {
  label: string;
  tab: CategoryTab;
  activeTab: CategoryTab;
  themeStyles: any;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 16px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: activeTab === tab ? '600' : '500',
        color: activeTab === tab ? themeStyles.accent : themeStyles.textSecondary,
        borderBottom:
          activeTab === tab ? `2px solid ${themeStyles.accent}` : '2px solid transparent',
        transition: 'all 0.2s ease',
        textAlign: 'center' as const,
      }}
    >
      {label}
    </button>
  );
}

function getTabTitle(activeTab: CategoryTab): string {
  switch (activeTab) {
    case 'regular':
      return 'Regular Categories';
    case 'results':
      return 'Result Checker Categories';
    case 'formats':
      return 'Format Categories';
    default:
      return 'Categories';
  }
}

function getActionButtons(
  activeTab: CategoryTab,
  themeStyles: any,
  onAddCategory: () => void,
  onAddCategoryType: (type: CategoryType) => void
) {
  switch (activeTab) {
    case 'regular':
      return (
        <button
          onClick={onAddCategory}
          style={{ ...sharedStyles.actionButton, ...themeStyles.primaryButton }}
        >
          Add Category
        </button>
      );
    case 'results':
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onAddCategoryType('wassce_result')}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.primaryButton,
              fontSize: '12px',
              padding: '6px 12px',
            }}
          >
            Add WASSCE
          </button>
          <button
            onClick={() => onAddCategoryType('bece_result')}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.primaryButton,
              fontSize: '12px',
              padding: '6px 12px',
            }}
          >
            Add BECE
          </button>
          <button
            onClick={() => onAddCategoryType('novdec_result')}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.primaryButton,
              fontSize: '12px',
              padding: '6px 12px',
            }}
          >
            Add Nov/Dec
          </button>
        </div>
      );
    case 'formats':
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onAddCategoryType('large_format')}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.primaryButton,
              fontSize: '12px',
              padding: '6px 12px',
            }}
          >
            Add Large Format
          </button>
          <button
            onClick={() => onAddCategoryType('regular_format')}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.primaryButton,
              fontSize: '12px',
              padding: '6px 12px',
            }}
          >
            Add Regular Format
          </button>
        </div>
      );
    default:
      return null;
  }
}

