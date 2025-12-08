import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface LegendItemProps {
  color: string;
  label: string;
  themeStyles: ThemeStyles;
}

export function LegendItem({ color, label, themeStyles }: LegendItemProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: '12px', height: '12px', background: color, borderRadius: '3px' }} />
      <span style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>{label}</span>
    </div>
  );
}

