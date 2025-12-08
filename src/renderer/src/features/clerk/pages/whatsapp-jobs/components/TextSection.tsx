import type { ThemeStyles } from './types';

interface TextSectionProps {
  themeStyles: ThemeStyles;
  title: string;
  content: string;
  isItalic?: boolean;
  background?: string;
  borderColor?: string;
  titleColor?: string;
}

export function TextSection({
  themeStyles,
  title,
  content,
  isItalic = false,
  background,
  borderColor,
  titleColor,
}: TextSectionProps) {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        background: background || themeStyles.card.background,
        border: `1px solid ${borderColor || themeStyles.card.border}`,
        marginBottom: '20px',
      }}
    >
      <h3
        style={{
          fontSize: '14px',
          fontWeight: '600',
          color: titleColor || themeStyles.text,
          margin: '0 0 12px 0',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: themeStyles.textSecondary,
          margin: 0,
          whiteSpace: 'pre-wrap',
          fontStyle: isItalic ? 'italic' : 'normal',
        }}
      >
        {content}
      </p>
    </div>
  );
}

