import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../context/ThemeContext';
import { electronAPI } from '../../../lib';
import { lightStyles, darkStyles, sharedStyles } from './clerkStyles';
import { getStatusColor } from './utils';

interface Job {
  id?: string;
  _id?: string;
  printJobId?: string;
  status?: string;
  copies?: number;
  createdAt?: string;
  description?: string;
  filePath?: string;
  [key: string]: unknown;
}

interface JobDetailsProps {
  job: Job;
}

export function JobDetails({ job }: JobDetailsProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Get job ID (could be id, _id, or printJobId)
  const jobId = job.id || job._id || job.printJobId || '';

  // Mutation to update job status
  const updateJobMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!jobId) {
        throw new Error('Job ID not found');
      }
      const jobsAPI = (
        electronAPI as {
          jobs?: { update: (id: string, updates: { status: string }) => Promise<Job> };
        }
      ).jobs;
      if (!jobsAPI) {
        throw new Error('Jobs API not available');
      }
      return await jobsAPI.update(jobId, { status });
    },
    onSuccess: () => {
      // Invalidate and refetch jobs query to update the UI
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      // Also invalidate dashboard queries if they exist
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Failed to update job status:', error);
      alert(
        `Failed to update job status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    },
  });

  const handleMarkAsCompleted = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!jobId) {
      alert('Job ID not found');
      return;
    }

    if (job.status === 'completed') {
      alert('Job is already completed');
      return;
    }

    setIsUpdating(true);
    try {
      await updateJobMutation.mutateAsync('completed');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div
        style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: `1px solid ${themeStyles.sidebar.borderColor}`,
        }}
      >
        <h3 style={{ color: '#fbbf24', marginBottom: '16px', fontSize: '18px' }}>Job Details</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px',
              background: themeStyles.container.background,
              borderRadius: '8px',
              alignItems: 'center',
            }}
          >
            <div>
              <p
                style={{ color: themeStyles.textSecondary, fontSize: '12px', marginBottom: '4px' }}
              >
                Status
              </p>
              <p style={{ color: themeStyles.text, fontWeight: 'bold' }}>
                {job.status?.toUpperCase() || 'UNKNOWN'}
              </p>
            </div>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                background:
                  getStatusColor(job.status || '', themeStyles) === themeStyles.success
                    ? 'rgba(34, 197, 94, 0.2)'
                    : getStatusColor(job.status || '', themeStyles) === themeStyles.warning
                    ? 'rgba(251, 158, 11, 0.2)'
                    : getStatusColor(job.status || '', themeStyles) === themeStyles.error
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(212, 212, 212, 0.2)',
                color: getStatusColor(job.status || '', themeStyles),
                fontWeight: 'bold',
                fontSize: '12px',
              }}
            >
              {job.status || 'unknown'}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px',
              alignItems: 'center',
              paddingRight: '16px',
              paddingLeft: '16px',
            }}
          >
            <div>
              <p
                style={{ color: themeStyles.textSecondary, fontSize: '12px', marginBottom: '6px' }}
              >
                Copies
              </p>
              <p style={{ color: themeStyles.text, fontWeight: '600', fontSize: '16px' }}>
                {job.copies || 1}
              </p>
            </div>
            <div>
              <p
                style={{ color: themeStyles.textSecondary, fontSize: '12px', marginBottom: '6px' }}
              >
                Created
              </p>
              <p style={{ color: themeStyles.text, fontSize: '14px' }}>
                {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p
                style={{ color: themeStyles.textSecondary, fontSize: '12px', marginBottom: '6px' }}
              >
                Size
              </p>
              <p style={{ color: themeStyles.text, fontSize: '16px' }}>
                height: {job.height as number}
              </p>
              <p style={{ color: themeStyles.text, fontSize: '16px' }}>
                width: {job.width as number}
              </p>
            </div>
          </div>

          {job.description && (
            <div>
              <p
                style={{ color: themeStyles.textSecondary, fontSize: '12px', marginBottom: '6px' }}
              >
                Description
              </p>
              <p style={{ color: themeStyles.text, lineHeight: '1.5' }}>{job.description}</p>
            </div>
          )}

          <div>
            <p style={{ color: themeStyles.textSecondary, fontSize: '12px', marginBottom: '6px' }}>
              File Path
            </p>
            <div
              style={{
                padding: '10px',
                background: themeStyles.container.background,
                borderRadius: '6px',
                wordBreak: 'break-all',
                fontSize: '12px',
                color: themeStyles.text,
                fontFamily: 'monospace',
              }}
            >
              {job.filePath || 'N/A'}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={handleMarkAsCompleted}
            disabled={isUpdating || job.status === 'completed'}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.primaryButton,
              flex: 1,
              maxWidth: '500px',
              minHeight: '44px',
              fontSize: '15px',
              opacity: isUpdating || job.status === 'completed' ? 0.6 : 1,
              cursor: isUpdating || job.status === 'completed' ? 'not-allowed' : 'pointer',
            }}
          >
            {isUpdating
              ? 'Updating...'
              : job.status === 'completed'
              ? 'Already Completed'
              : 'Mark as Completed'}
          </button>
        </div>
      </div>
    </>
  );
}
