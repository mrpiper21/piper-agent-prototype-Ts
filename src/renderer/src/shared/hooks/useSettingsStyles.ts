import { useSettings } from '../../context/SettingsContext';
import { useMemo } from 'react';

/**
 * Hook that returns style objects with settings applied
 * Use this in components to ensure they respect user settings
 */
export function useSettingsStyles() {
  const { getFontSize, getSpacing, getIconSize, settings } = useSettings();

  return useMemo(() => {
    const fontSize = getFontSize();
    const spacing = getSpacing();
    const iconSize = 16 * getIconSize();

    return {
      // Font sizes
      fontSize: `${fontSize}px`,
      fontSizeSmall: `${fontSize - 2}px`,
      fontSizeLarge: `${fontSize + 2}px`,
      fontSizeXL: `${fontSize + 4}px`,
      
      // Spacing
      spacing: (multiplier: number) => `${multiplier * spacing}px`,
      spacingXS: `${4 * spacing}px`,
      spacingSM: `${8 * spacing}px`,
      spacingMD: `${12 * spacing}px`,
      spacingLG: `${16 * spacing}px`,
      spacingXL: `${24 * spacing}px`,
      spacing2XL: `${32 * spacing}px`,
      
      // Icon sizes
      iconSize: `${iconSize}px`,
      iconSizeSM: `${14 * getIconSize()}px`,
      iconSizeLG: `${20 * getIconSize()}px`,
      iconSizeXL: `${24 * getIconSize()}px`,
      
      // Line height
      lineHeight: settings.lineHeight,
      
      // Border radius
      borderRadiusSM: `${4 * spacing}px`,
      borderRadiusMD: `${6 * spacing}px`,
      borderRadiusLG: `${8 * spacing}px`,
      
      // Common style objects
      text: {
        fontSize: `${fontSize}px`,
        lineHeight: settings.lineHeight,
      },
      textSmall: {
        fontSize: `${fontSize - 2}px`,
        lineHeight: settings.lineHeight,
      },
      textLarge: {
        fontSize: `${fontSize + 2}px`,
        lineHeight: settings.lineHeight,
      },
      heading: {
        fontSize: `${fontSize + 4}px`,
        lineHeight: settings.lineHeight * 1.2,
        fontWeight: '600',
      },
      button: {
        fontSize: `${fontSize}px`,
        padding: `${6 * spacing}px ${12 * spacing}px`,
        borderRadius: `${6 * spacing}px`,
      },
      input: {
        fontSize: `${fontSize}px`,
        padding: `${8 * spacing}px ${12 * spacing}px`,
        borderRadius: `${6 * spacing}px`,
      },
      card: {
        padding: `${16 * spacing}px`,
        borderRadius: `${8 * spacing}px`,
      },
    };
  }, [getFontSize, getSpacing, getIconSize, settings.lineHeight]);
}

