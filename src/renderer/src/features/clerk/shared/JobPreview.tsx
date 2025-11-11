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
        background: themeStyles.card.background,
        border: themeStyles.card.border,
        padding: '16px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        // overflow: 'hidden',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexShrink: 0,
        }}
      >
        <h2 style={{ color: '#fbbf24', fontWeight: '700', fontSize: '22px' }}>Preview</h2>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            background: themeStyles.error,
            color: '#ffffff',
            fontWeight: '600',
            transition: 'transform 0.2s ease',
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: '30px' }}>
        <FilePreview fileName={job.fileName} fileUrl={job?.cloudinaryUrl} />
        <JobDetails job={job} />
      </div>
    </div>
  );
}

