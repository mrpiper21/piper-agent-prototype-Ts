import type { ThemeStyles, Job } from './types';

interface JobInfoSectionProps {
  themeStyles: ThemeStyles;
  job: Job;
  phone: string;
}

export function JobInfoSection({ themeStyles, job, phone }: JobInfoSectionProps) {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        background: themeStyles.card.background,
        border: `1px solid ${themeStyles.card.border}`,
        marginBottom: '20px',
      }}
    >
      <h3
        style={{
          fontSize: '14px',
          fontWeight: '600',
          color: themeStyles.text,
          margin: '0 0 12px 0',
        }}
      >
        Job Information
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {job.printJobId && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: themeStyles.textSecondary, fontSize: '14px' }}>Job ID:</span>
            <span style={{ color: themeStyles.text, fontSize: '14px', fontWeight: '500' }}>
              {job.printJobId}
            </span>
          </div>
        )}
        {job.fileName && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: themeStyles.textSecondary, fontSize: '14px' }}>File:</span>
            <span style={{ color: themeStyles.text, fontSize: '14px', fontWeight: '500' }}>
              {job.fileName}
            </span>
          </div>
        )}
        {job.description && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: themeStyles.textSecondary, fontSize: '14px' }}>Description:</span>
            <span style={{ color: themeStyles.text, fontSize: '14px', fontWeight: '500' }}>
              {job.description}
            </span>
          </div>
        )}
        {phone && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: themeStyles.textSecondary, fontSize: '14px' }}>Contact:</span>
            <span style={{ color: themeStyles.text, fontSize: '14px', fontWeight: '500' }}>
              {phone}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

