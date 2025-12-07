import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface BarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  themeStyles: ThemeStyles;
}

export function Bar({ label, value, max, color, themeStyles }: BarProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span
          style={{
            color: themeStyles.text,
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              background: color,
            }}
          />
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              color: themeStyles.textSecondary,
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            {value} jobs
          </span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '10px',
              background: `${color}20`,
              color: color,
              fontSize: '11px',
              fontWeight: '700',
            }}
          >
            {Math.round((value / max) * 100)}%
          </span>
        </div>
      </div>
      <div
        style={{
          width: '100%',
          height: '24px',
          background: themeStyles.input.background,
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${Math.min((value / max) * 100, 100)}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}, ${color})`,
            borderRadius: '12px',
            transition: 'width 0.3s ease',
            boxShadow: `0 2px 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

