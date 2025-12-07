import { AiOutlineCalendar, AiOutlineDownload } from 'react-icons/ai';
import { sharedStyles } from '../../../shared/clerkStyles';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface RecentJobsProps {
  themeStyles: ThemeStyles;
  selectedDate: string;
  jobsByDate: any[] | undefined;
  isLoading: boolean;
  onDateClear: () => void;
  onDownloadReport: () => Promise<void>;
}

export function RecentJobs({
  themeStyles,
  selectedDate,
  jobsByDate,
  isLoading,
  onDateClear,
  onDownloadReport,
}: RecentJobsProps) {
  if (!selectedDate) {
    return null;
  }

  return (
    <div
      style={{
        ...sharedStyles.card,
        ...themeStyles.card,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h3
            style={{
              color: themeStyles.text,
              margin: 0,
              marginBottom: '4px',
              fontWeight: '700',
              fontSize: '18px',
            }}
          >
            Jobs for{' '}
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          <p
            style={{
              color: themeStyles.textSecondary,
              margin: 0,
              fontSize: '13px',
            }}
          >
            {jobsByDate?.length || 0} jobs found
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onDateClear}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${themeStyles.card.border}`,
              background: themeStyles.input.background,
              color: themeStyles.text,
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AiOutlineCalendar />
            Clear Filter
          </button>
          <button
            onClick={onDownloadReport}
            disabled={!selectedDate || !jobsByDate || jobsByDate.length === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${themeStyles.card.border}`,
              background: themeStyles.input.background,
              color: themeStyles.text,
              cursor: !jobsByDate || jobsByDate.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: !jobsByDate || jobsByDate.length === 0 ? 0.6 : 1,
            }}
          >
            <AiOutlineDownload />
            Download Report
          </button>
        </div>
      </div>
      <div style={sharedStyles.jobsList}>
        {isLoading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: themeStyles.textSecondary,
            }}
          >
            <p style={{ fontSize: '16px' }}>Loading jobs...</p>
          </div>
        ) : jobsByDate && jobsByDate.length > 0 ? (
          jobsByDate.map((job: any, index: number) => (
            <div
              key={job.id || job._id || job.printJobId || `job-${index}`}
              style={{
                ...sharedStyles.jobItem,
                ...themeStyles.card,
                padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
                marginBottom: 'var(--spacing-xs, 4px)',
                borderRadius: 0,
                border: 'none',
                borderBottom: themeStyles.card.border,
                boxShadow: 'none',
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: themeStyles.text,
                    fontWeight: '600',
                    marginBottom: '6px',
                    fontSize: '15px',
                  }}
                >
                  {job.fileName || job.name || 'Unnamed Job'}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      color: themeStyles.textSecondary,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🖨️ {job.printerName || job.printer || 'N/A'}
                  </span>
                  <span style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                    🕒 {job.createdAt ? new Date(job.createdAt).toLocaleTimeString() : 'N/A'}
                  </span>
                  <span style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                    📍 {job.location || 'N/A'}
                  </span>
                </div>
              </div>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  background:
                    job.status === 'completed'
                      ? themeStyles.success
                      : job.status === 'failed'
                        ? themeStyles.error
                        : themeStyles.warning,
                  color: '#ffffff',
                  letterSpacing: '0.5px',
                }}
              >
                {job.status || 'pending'}
              </span>
            </div>
          ))
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: themeStyles.textSecondary,
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
              No jobs on this date
            </p>
            <p style={{ fontSize: '13px' }}>Try selecting a different date</p>
          </div>
        )}
      </div>
    </div>
  );
}

