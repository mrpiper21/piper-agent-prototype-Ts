import { useState } from 'react';
import { queryClient } from '../../../lib';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';
import { useQuery } from '@tanstack/react-query';
import { electronAPI } from '../../../lib';
import { JobListItem, JobPreview } from '../shared';

export default function JobsPage() {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Use the same query key as the layout - shares cache
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => electronAPI.jobs.getAll(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  const isJobSelected = (job: any) => {
    if (!selectedJob) return false;
    return (selectedJob.id && selectedJob.id === job.id) ||
           (selectedJob._id && selectedJob._id === job._id) ||
           (selectedJob.printJobId && selectedJob.printJobId === job.printJobId);
  };

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px', 
        flexShrink: 0 
      }}>
        <h2 style={{ color: '#fbbf24', fontWeight: '700', fontSize: '24px' }}>Recent Print Jobs</h2>
        <button
          onClick={() => queryClient.refetchQueries({ queryKey: ['jobs'] })}
          disabled={isLoading}
          style={{ 
            ...sharedStyles.actionButton, 
            ...themeStyles.primaryButton,
            minWidth: '120px'
          }}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        gap: selectedJob ? '24px' : '0', 
        flex: 1,
        overflow: 'hidden',
        transition: 'gap 0.3s ease'
      }}>
        {/* Job List */}
        {!selectedJob ? <div style={{ 
          flex: selectedJob ? '0 0 380px' : '1',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: selectedJob ? '8px' : '0'
        }}>
          <div style={sharedStyles.jobsList}>
            {!jobs || jobs.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: themeStyles.textSecondary 
              }}>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>📋</p>
                <p>No jobs found</p>
              </div>
            ) : (
              jobs.map((job: any) => (
                <JobListItem
                  key={job.id || job._id || job.printJobId}
                  job={job}
                  isSelected={isJobSelected(job)}
                  onSelect={() => setSelectedJob(isJobSelected(job) ? null : job)}
                />
              ))
            )}
          </div>
        </div>: <JobPreview 
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
          />}
      </div>
    </div>
  );
}
