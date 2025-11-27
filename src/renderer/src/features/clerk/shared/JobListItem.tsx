import React, { useMemo } from 'react';
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
  compact?: boolean; // For sidebar use
}

function JobListItemComponent({ job, isSelected, onSelect, compact = false }: JobListItemProps) {
  const { theme } = useTheme();
  const themeStyles = useMemo(() => (theme === 'dark' ? darkStyles : lightStyles), [theme]);

  // Memoize status icon
  const statusIcon = useMemo(() => {
    const status = job.status?.toLowerCase();
    const iconSize = compact ? '12px' : 'var(--icon-size-sm, 14px)';
    if (status === 'completed') {
      return <AiOutlineCheckCircle style={{ fontSize: iconSize }} />;
    }
    if (status === 'pending' || status === 'queued') {
      return <AiOutlineClockCircle style={{ fontSize: iconSize }} />;
    }
    if (status === 'processing' || status === 'printing') {
      return <AiOutlinePrinter style={{ fontSize: iconSize }} />;
    }
    if (status === 'failed') {
      return <AiOutlineCloseCircle style={{ fontSize: iconSize }} />;
    }
    return <AiOutlineFile style={{ fontSize: iconSize }} />;
  }, [job.status, compact]);

  // Memoize formatted date
  const formattedDate = useMemo(() => {
    const dateString = job.createdAt || job.submittedAt;
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [job.createdAt, job.submittedAt]);

  const statusColor = useMemo(
    () => getStatusColor(job.status, themeStyles),
    [job.status, themeStyles]
  );
  const status = useMemo(() => job.status?.toLowerCase() || 'unknown', [job.status]);

  // Compact sidebar version
  if (compact) {
    return (
      <div
        onClick={onSelect}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background =
              theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = themeStyles.card.background;
          }
        }}
        style={{
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
          borderLeft: isSelected ? `3px solid ${themeStyles.accent}` : '3px solid transparent',
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          background: isSelected
            ? theme === 'dark'
              ? 'rgba(251, 191, 36, 0.12)'
              : 'rgba(251, 191, 36, 0.08)'
            : themeStyles.card.background,
          padding: '8px 6px',
          borderRadius: 0,
          boxShadow: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
          {/* Status Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              background:
                status === 'completed'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : status === 'failed'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : status === 'processing' || status === 'printing'
                      ? 'rgba(251, 158, 11, 0.15)'
                      : 'rgba(148, 163, 184, 0.15)',
              color: statusColor,
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            {statusIcon}
          </div>

          {/* Content */}
          <div
            style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            {/* File Name */}
            <p
              style={{
                color: themeStyles.text,
                fontWeight: isSelected ? '600' : '500',
                fontSize: '12px',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: '1.4',
              }}
              title={job.artwork || job.fileName}
            >
              {job.artwork || job.fileName || 'Untitled Job'}
            </p>

            {/* Metadata Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
                fontSize: '10px',
                color: themeStyles.textSecondary,
                lineHeight: '1.3',
              }}
            >
              {/* Status Badge */}
              <span
                style={{
                  color: statusColor,
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  fontSize: '9px',
                  letterSpacing: '0.3px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background:
                    status === 'completed'
                      ? 'rgba(34, 197, 94, 0.15)'
                      : status === 'failed'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : status === 'processing' || status === 'printing'
                          ? 'rgba(251, 158, 11, 0.15)'
                          : 'rgba(148, 163, 184, 0.15)',
                  flexShrink: 0,
                }}
              >
                {status}
              </span>

              {/* Separator */}
              {(job.printerName || job.copies || job.createdAt) && (
                <span style={{ opacity: 0.4 }}>•</span>
              )}

              {/* Printer Name (truncated) */}
              {job.printerName && (
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '80px',
                  }}
                  title={job.printerName}
                >
                  {job.printerName}
                </span>
              )}

              {/* Copies */}
              {job.copies && (
                <>
                  {job.printerName && <span style={{ opacity: 0.4 }}>•</span>}
                  <span>{job.copies}x</span>
                </>
              )}

              {/* Date */}
              {job.createdAt && (
                <>
                  {(job.printerName || job.copies) && <span style={{ opacity: 0.4 }}>•</span>}
                  <span>{formattedDate}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full version for main content area
  return (
    <div
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background =
            theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = themeStyles.card.background;
        }
      }}
      style={{
        ...sharedStyles.jobItem,
        ...themeStyles.card,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        position: 'relative',
        borderLeft: isSelected ? `3px solid ${themeStyles.accent}` : '3px solid transparent',
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: themeStyles.card.border,
        background: isSelected
          ? theme === 'dark'
            ? 'rgba(251, 191, 36, 0.08)'
            : 'rgba(251, 191, 36, 0.04)'
          : themeStyles.card.background,
        padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
        borderRadius: 0,
        boxShadow: 'none',
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm, 8px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--border-radius-sm, 4px)',
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
          {statusIcon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              color: themeStyles.text,
              fontWeight: '500',
              fontSize: 'var(--font-size, 14px)',
              margin: 0,
              marginBottom: 'var(--spacing-xs, 4px)',
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
              fontSize: 'var(--font-size-small, 12px)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs, 4px)',
              flexWrap: 'wrap',
            }}
          >
            {job.printerName && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <AiOutlinePrinter style={{ fontSize: 'var(--icon-size-sm, 14px)' }} />
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
            {job.createdAt && <span>{formattedDate}</span>}
          </p>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm, 8px)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: statusColor,
            fontWeight: '500',
            textTransform: 'uppercase',
            fontSize: 'var(--font-size-small, 12px)',
            letterSpacing: '0.3px',
            padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
            borderRadius: 'var(--border-radius-sm, 4px)',
            background:
              status === 'completed'
                ? 'rgba(34, 197, 94, 0.1)'
                : status === 'failed'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : status === 'processing' || status === 'printing'
                    ? 'rgba(251, 158, 11, 0.1)'
                    : 'rgba(148, 163, 184, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs, 4px)',
          }}
        >
          {statusIcon}
          {job.status || 'unknown'}
        </span>
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const JobListItem = React.memo(JobListItemComponent, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.job?.id === nextProps.job?.id &&
    prevProps.job?._id === nextProps.job?._id &&
    prevProps.job?.printJobId === nextProps.job?.printJobId &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.compact === nextProps.compact &&
    prevProps.job?.status === nextProps.job?.status &&
    prevProps.job?.fileName === nextProps.job?.fileName
  );
});
