import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from './clerkStyles';
import { getStatusColor } from './utils';

interface JobDetailsProps {
  job: any;
}

export function JobDetails({ job }: JobDetailsProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <>
      <div style={{ 
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: `1px solid ${themeStyles.sidebar.borderColor}`
      }}>
        <h3 style={{ color: '#fbbf24', marginBottom: '16px', fontSize: '18px' }}>Job Details</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '12px',
            background: themeStyles.container.background,
            borderRadius: '8px',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ color: themeStyles.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                Status
              </p>
              <p style={{ color: themeStyles.text, fontWeight: 'bold' }}>
                {job.status?.toUpperCase()}
              </p>
            </div>
            <div style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: getStatusColor(job.status, themeStyles) === themeStyles.success ? 'rgba(34, 197, 94, 0.2)' :
                         getStatusColor(job.status, themeStyles) === themeStyles.warning ? 'rgba(251, 158, 11, 0.2)' :
                         getStatusColor(job.status, themeStyles) === themeStyles.error ? 'rgba(239, 68, 68, 0.2)' :
                         'rgba(212, 212, 212, 0.2)',
              color: getStatusColor(job.status, themeStyles),
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              {job.status}
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div>
              <p style={{ color: themeStyles.textSecondary, fontSize: '12px', marginBottom: '6px' }}>
                Copies
              </p>
              <p style={{ color: themeStyles.text, fontWeight: '600', fontSize: '16px' }}>
                {job.copies || 1}
              </p>
            </div>
            <div>
              <p style={{ color: themeStyles.textSecondary, fontSize: '12px', marginBottom: '6px' }}>
                Created
              </p>
              <p style={{ color: themeStyles.text, fontSize: '14px' }}>
                {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {job.description && (
            <div>
              <p style={{ color: themeStyles.textSecondary, fontSize: '12px', marginBottom: '6px' }}>
                Description
              </p>
              <p style={{ color: themeStyles.text, lineHeight: '1.5' }}>{job.description}</p>
            </div>
          )}
          
          <div>
            <p style={{ color: themeStyles.textSecondary, fontSize: '12px', marginBottom: '6px' }}>
              File Path
            </p>
            <div style={{
              padding: '10px',
              background: themeStyles.container.background,
              borderRadius: '6px',
              wordBreak: 'break-all',
              fontSize: '12px',
              color: themeStyles.text,
              fontFamily: 'monospace'
            }}>
              {job.filePath || 'N/A'}
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement submit to printer
            }}
            style={{ 
              ...sharedStyles.actionButton, 
              ...themeStyles.primaryButton,
              flex: 1,
              minHeight: '44px',
              fontSize: '15px'
            }}
          >
            Submit to Printer
          </button>
        </div>
      </div>
    </>
  );
}

