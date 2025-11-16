import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type FontSize = 'small' | 'medium' | 'large';
export type UIScale = 'compact' | 'comfortable' | 'spacious';

interface Settings {
  fontSize: FontSize;
  uiScale: UIScale;
  lineHeight: number;
}

interface SettingsContextType {
  settings: Settings;
  setFontSize: (size: FontSize) => void;
  setUIScale: (scale: UIScale) => void;
  setLineHeight: (height: number) => void;
  resetSettings: () => void;
  getFontSize: () => number;
  getSpacing: () => number;
  getIconSize: () => number;
}

const defaultSettings: Settings = {
  fontSize: 'medium',
  uiScale: 'comfortable',
  lineHeight: 1.5,
};

// Font size mappings (in pixels)
const fontSizeMap: Record<FontSize, number> = {
  small: 12,
  medium: 14,
  large: 16,
};

// UI Scale spacing multipliers
const spacingMap: Record<UIScale, number> = {
  compact: 0.75,
  comfortable: 1,
  spacious: 1.25,
};

// Icon size multipliers
const iconSizeMap: Record<UIScale, number> = {
  compact: 0.9,
  comfortable: 1,
  spacious: 1.1,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper function to apply CSS variables
function applyCSSVariables(settings: Settings) {
  if (typeof document === 'undefined') return;
  
  const fontSize = fontSizeMap[settings.fontSize];
  const spacing = spacingMap[settings.uiScale];
  const iconSize = iconSizeMap[settings.uiScale];
  
  // Set root CSS variables that all components can use
  document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
  document.documentElement.style.setProperty('--font-size-small', `${fontSize - 2}px`);
  document.documentElement.style.setProperty('--font-size-large', `${fontSize + 2}px`);
  document.documentElement.style.setProperty('--font-size-xl', `${fontSize + 4}px`);
  document.documentElement.style.setProperty('--spacing-multiplier', `${spacing}`);
  document.documentElement.style.setProperty('--icon-size-multiplier', `${iconSize}`);
  document.documentElement.style.setProperty('--line-height', `${settings.lineHeight}`);
  
  // Set spacing units for common use
  document.documentElement.style.setProperty('--spacing-xs', `${4 * spacing}px`);
  document.documentElement.style.setProperty('--spacing-sm', `${8 * spacing}px`);
  document.documentElement.style.setProperty('--spacing-md', `${12 * spacing}px`);
  document.documentElement.style.setProperty('--spacing-lg', `${16 * spacing}px`);
  document.documentElement.style.setProperty('--spacing-xl', `${24 * spacing}px`);
  document.documentElement.style.setProperty('--spacing-2xl', `${32 * spacing}px`);
  
  // Set icon sizes
  document.documentElement.style.setProperty('--icon-size', `${16 * iconSize}px`);
  document.documentElement.style.setProperty('--icon-size-sm', `${14 * iconSize}px`);
  document.documentElement.style.setProperty('--icon-size-lg', `${20 * iconSize}px`);
  document.documentElement.style.setProperty('--icon-size-xl', `${24 * iconSize}px`);
  
  // Set border radius based on scale
  document.documentElement.style.setProperty('--border-radius-sm', `${4 * spacing}px`);
  document.documentElement.style.setProperty('--border-radius-md', `${6 * spacing}px`);
  document.documentElement.style.setProperty('--border-radius-lg', `${8 * spacing}px`);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const parsed = { ...defaultSettings, ...JSON.parse(saved) };
        // Apply CSS variables immediately on initialization
        applyCSSVariables(parsed);
        return parsed;
      } catch {
        applyCSSVariables(defaultSettings);
        return defaultSettings;
      }
    }
    applyCSSVariables(defaultSettings);
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    // Apply CSS variables whenever settings change
    applyCSSVariables(settings);
  }, [settings]);

  const setFontSize = useCallback((fontSize: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize }));
  }, []);

  const setUIScale = useCallback((uiScale: UIScale) => {
    setSettings(prev => ({ ...prev, uiScale }));
  }, []);

  const setLineHeight = useCallback((lineHeight: number) => {
    setSettings(prev => ({ ...prev, lineHeight }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const getFontSize = useCallback(() => {
    return fontSizeMap[settings.fontSize];
  }, [settings.fontSize]);

  const getSpacing = useCallback(() => {
    return spacingMap[settings.uiScale];
  }, [settings.uiScale]);

  const getIconSize = useCallback(() => {
    return iconSizeMap[settings.uiScale];
  }, [settings.uiScale]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setFontSize,
        setUIScale,
        setLineHeight,
        resetSettings,
        getFontSize,
        getSpacing,
        getIconSize,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

// Helper function to get font size (for use outside of context)
function getFontSize(settings: Settings): number {
  return fontSizeMap[settings.fontSize];
}

