import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles } from './clerkStyles';
import { FilePreview } from './FilePreview';
import { JobDetails } from './JobDetails';

interface JobPreviewProps {
  job: any;
  onClose: () => void;
}

export function JobPreview({ job, onClose }: JobPreviewProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div
      style={{
        flex: '1',
        background: themeStyles.container.background,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--spacing-md, 12px)',
          borderBottom: themeStyles.card.border,
          flexShrink: 0,
          background: themeStyles.card.background,
        }}
      >
        <h2
          style={{
            color: '#fbbf24',
            fontWeight: '600',
            fontSize: 'var(--font-size-large, 16px)',
            margin: 0,
          }}
        >
          Job Preview
        </h2>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
            border: 'none',
            borderRadius: 'var(--border-radius-sm, 4px)',
            cursor: 'pointer',
            background: 'transparent',
            color: themeStyles.textSecondary,
            fontWeight: '500',
            fontSize: 'var(--font-size-small, 12px)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs, 4px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = themeStyles.button.background;
            e.currentTarget.style.color = themeStyles.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = themeStyles.textSecondary;
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--spacing-md, 12px)' }}>
        <FilePreview fileName={job.fileName} fileUrl={job?.cloudinaryUrl} />
        {/* Print Dimensions - Show prominently right after preview */}
        {job.height && job.width && (
          <div
            style={{
              marginTop: 'var(--spacing-md, 12px)',
              padding: 'var(--spacing-md, 12px)',
              background:
                theme === 'dark' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.12)',
              border: `2px solid ${themeStyles.accent}`,
              borderRadius: 'var(--border-radius-md, 6px)',
              borderLeft: `4px solid ${themeStyles.accent}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm, 8px)',
                marginBottom: 'var(--spacing-sm, 8px)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--icon-size-lg, 20px)',
                  color: themeStyles.accent,
                  flexShrink: 0,
                }}
              >
                📐
              </span>
              <h3
                style={{
                  color: themeStyles.accent,
                  fontSize: 'var(--font-size, 14px)',
                  fontWeight: '600',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Print Dimensions
              </h3>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--spacing-md, 12px)',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-xs, 4px)' }}
              >
                <span
                  style={{
                    color: themeStyles.textSecondary,
                    fontSize: 'var(--font-size-small, 12px)',
                    fontWeight: '500',
                  }}
                >
                  Width:
                </span>
                <span
                  style={{
                    color: themeStyles.text,
                    fontSize: 'var(--font-size-xl, 18px)',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                  }}
                >
                  {job.width}
                </span>
                <span
                  style={{
                    color: themeStyles.textSecondary,
                    fontSize: 'var(--font-size-small, 12px)',
                    marginLeft: '2px',
                  }}
                >
                  px
                </span>
              </div>
              <span
                style={{
                  color: themeStyles.textSecondary,
                  fontSize: 'var(--font-size-large, 16px)',
                  fontWeight: '300',
                }}
              >
                ×
              </span>
              <div
                style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-xs, 4px)' }}
              >
                <span
                  style={{
                    color: themeStyles.textSecondary,
                    fontSize: 'var(--font-size-small, 12px)',
                    fontWeight: '500',
                  }}
                >
                  Height:
                </span>
                <span
                  style={{
                    color: themeStyles.text,
                    fontSize: 'var(--font-size-xl, 18px)',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                  }}
                >
                  {job.height}
                </span>
                <span
                  style={{
                    color: themeStyles.textSecondary,
                    fontSize: 'var(--font-size-small, 12px)',
                    marginLeft: '2px',
                  }}
                >
                  px
                </span>
              </div>
            </div>
            <p
              style={{
                color: themeStyles.textSecondary,
                fontSize: 'var(--font-size-small, 12px)',
                marginTop: 'var(--spacing-sm, 8px)',
                marginBottom: 0,
                fontStyle: 'italic',
              }}
            >
              These dimensions determine how the item will be printed
            </p>
          </div>
        )}
        {/* Number of Copies - Show prominently */}
        {job.copies !== undefined && (
          <div
            style={{
              marginTop: 'var(--spacing-md, 12px)',
              padding: 'var(--spacing-md, 12px)',
              background:
                theme === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.12)',
              border: '2px solid #3b82f6',
              borderRadius: 'var(--border-radius-md, 6px)',
              borderLeft: '4px solid #3b82f6',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm, 8px)',
                marginBottom: 'var(--spacing-sm, 8px)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--icon-size-lg, 20px)',
                  color: '#3b82f6',
                  flexShrink: 0,
                }}
              >
                📄
              </span>
              <h3
                style={{
                  color: '#3b82f6',
                  fontSize: 'var(--font-size, 14px)',
                  fontWeight: '600',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Number of Copies
              </h3>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--spacing-sm, 8px)',
              }}
            >
              <span
                style={{
                  color: themeStyles.text,
                  fontSize: 'var(--font-size-2xl, 24px)',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  lineHeight: '1',
                }}
              >
                {job.copies || 1}
              </span>
              <span
                style={{
                  color: themeStyles.textSecondary,
                  fontSize: 'var(--font-size, 14px)',
                  marginLeft: 'var(--spacing-xs, 4px)',
                }}
              >
                {job.copies === 1 ? 'copy' : 'copies'}
              </span>
            </div>
            <p
              style={{
                color: themeStyles.textSecondary,
                fontSize: 'var(--font-size-small, 12px)',
                marginTop: 'var(--spacing-sm, 8px)',
                marginBottom: 0,
                fontStyle: 'italic',
              }}
            >
              This is how many times the item will be printed
            </p>
          </div>
        )}
        <JobDetails job={job} />
      </div>
    </div>
  );
}

