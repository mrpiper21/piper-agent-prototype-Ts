import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from './clerkStyles';
import { getStatusColor } from './utils';
import {
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineCloseCircle,
  AiOutlinePrinter,
  AiOutlineFile,
} from 'react-icons/ai';

interface JobListItemProps {
  job: any;
  isSelected: boolean;
  onSelect: () => void;
}

export function JobListItem({ job, isSelected, onSelect }: JobListItemProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const getStatusIcon = () => {
    const status = job.status?.toLowerCase();
    if (status === 'completed') {
      return <AiOutlineCheckCircle style={{ fontSize: '16px' }} />;
    }
    if (status === 'pending' || status === 'queued') {
      return <AiOutlineClockCircle style={{ fontSize: '16px' }} />;
    }
    if (status === 'processing' || status === 'printing') {
      return <AiOutlinePrinter style={{ fontSize: '16px' }} />;
    }
    if (status === 'failed') {
      return <AiOutlineCloseCircle style={{ fontSize: '16px' }} />;
    }
    return <AiOutlineFile style={{ fontSize: '16px' }} />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const statusColor = getStatusColor(job.status, themeStyles);
  const status = job.status?.toLowerCase() || 'unknown';

  return (
    <div
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      style={{
        ...sharedStyles.jobItem,
        ...themeStyles.card,
        cursor: 'pointer',
        // Only transition transform/box-shadow for hover, not theme colors
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        position: 'relative',
        transform: isSelected ? 'translateX(4px)' : 'translateX(0)',
        borderLeft: isSelected ? `4px solid ${themeStyles.accent}` : '4px solid transparent',
        background: isSelected
          ? theme === 'dark'
            ? 'rgba(251, 191, 36, 0.1)'
            : 'rgba(251, 191, 36, 0.05)'
          : themeStyles.card.background,
        padding: '18px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background:
                status === 'completed'
                  ? 'rgba(34, 197, 94, 0.1)'
                  : status === 'failed'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : status === 'processing' || status === 'printing'
                  ? 'rgba(251, 158, 11, 0.1)'
                  : 'rgba(148, 163, 184, 0.1)',
              color: statusColor,
              flexShrink: 0,
            }}
          >
            {getStatusIcon()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                color: themeStyles.text,
                fontWeight: 'bold',
                fontSize: '15px',
                margin: 0,
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={job.artwork || job.fileName}
            >
              {job.artwork || job.fileName || 'Untitled Job'}
            </p>
            <p
              style={{
                color: themeStyles.textSecondary,
                fontSize: '12px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              {job.printerName && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AiOutlinePrinter style={{ fontSize: '12px' }} />
                  {job.printerName}
                </span>
              )}
              {job.printerName && (job.copies || job.createdAt) && <span>•</span>}
              {job.copies && (
                <span>
                  {job.copies} {job.copies === 1 ? 'copy' : 'copies'}
                </span>
              )}
              {(job.copies || job.printerName) && job.createdAt && <span>•</span>}
              {job.createdAt && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {formatDate(job.createdAt || job.submittedAt)}
                </span>
              )}
            </p>
            {job.description && (
              <p
                style={{
                  color: themeStyles.textSecondary,
                  fontSize: '12px',
                  margin: '6px 0 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={job.description}
              >
                {job.description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
          flexShrink: 0,
          marginLeft: '12px',
        }}
      >
        <span
          style={{
            color: statusColor,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '11px',
            letterSpacing: '0.5px',
            padding: '4px 10px',
            borderRadius: '12px',
            background:
              status === 'completed'
                ? 'rgba(34, 197, 94, 0.15)'
                : status === 'failed'
                ? 'rgba(239, 68, 68, 0.15)'
                : status === 'processing' || status === 'printing'
                ? 'rgba(251, 158, 11, 0.15)'
                : 'rgba(148, 163, 184, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {getStatusIcon()}
          {job.status || 'unknown'}
        </span>
      </div>
    </div>
  );
}
