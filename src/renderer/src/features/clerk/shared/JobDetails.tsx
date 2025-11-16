import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../context/ThemeContext';
import { electronAPI } from '../../../lib';
import { lightStyles, darkStyles } from './clerkStyles';
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
          marginTop: 'var(--spacing-md, 12px)',
          paddingTop: 'var(--spacing-md, 12px)',
          borderTop: themeStyles.card.border,
        }}
      >
        <h3 style={{ color: '#fbbf24', marginBottom: 'var(--spacing-sm, 8px)', fontSize: 'var(--font-size, 14px)', fontWeight: '600' }}>Job Details</h3>
        <div style={{ display: 'grid', gap: 'var(--spacing-sm, 8px)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 'var(--spacing-sm, 8px)',
              background: themeStyles.container.background,
              borderRadius: 'var(--border-radius-sm, 4px)',
              alignItems: 'center',
            }}
          >
            <div>
              <p
                style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size-small, 12px)', marginBottom: 'var(--spacing-xs, 4px)' }}
              >
                Status
              </p>
              <p style={{ color: themeStyles.text, fontWeight: '500', fontSize: 'var(--font-size, 14px)' }}>
                {job.status?.toUpperCase() || 'UNKNOWN'}
              </p>
            </div>
            <div
              style={{
                padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
                borderRadius: 'var(--border-radius-sm, 4px)',
                background:
                  getStatusColor(job.status || '', themeStyles) === themeStyles.success
                    ? 'rgba(34, 197, 94, 0.1)'
                    : getStatusColor(job.status || '', themeStyles) === themeStyles.warning
                    ? 'rgba(251, 158, 11, 0.1)'
                    : getStatusColor(job.status || '', themeStyles) === themeStyles.error
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(212, 212, 212, 0.1)',
                color: getStatusColor(job.status || '', themeStyles),
                fontWeight: '500',
                fontSize: 'var(--font-size-small, 12px)',
              }}
            >
              {job.status || 'unknown'}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 'var(--spacing-md, 12px)',
              alignItems: 'center',
              padding: 'var(--spacing-sm, 8px)',
            }}
          >
            <div>
              <p
                style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size-small, 12px)', marginBottom: 'var(--spacing-xs, 4px)' }}
              >
                Copies
              </p>
              <p style={{ color: themeStyles.text, fontWeight: '500', fontSize: 'var(--font-size, 14px)' }}>
                {job.copies || 1}
              </p>
            </div>
            <div>
              <p
                style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size-small, 12px)', marginBottom: 'var(--spacing-xs, 4px)' }}
              >
                Created
              </p>
              <p style={{ color: themeStyles.text, fontSize: 'var(--font-size, 14px)' }}>
                {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {job.description && (
            <div>
              <p
                style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size-small, 12px)', marginBottom: 'var(--spacing-xs, 4px)' }}
              >
                Description
              </p>
              <p style={{ color: themeStyles.text, lineHeight: 'var(--line-height, 1.5)', fontSize: 'var(--font-size, 14px)' }}>{job.description}</p>
            </div>
          )}

          <div>
            <p style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size-small, 12px)', marginBottom: 'var(--spacing-xs, 4px)' }}>
              File Path
            </p>
            <div
              style={{
                padding: 'var(--spacing-sm, 8px)',
                background: themeStyles.container.background,
                borderRadius: 'var(--border-radius-sm, 4px)',
                wordBreak: 'break-all',
                fontSize: 'var(--font-size-small, 12px)',
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
            marginTop: 'var(--spacing-md, 12px)',
            display: 'flex',
            gap: 'var(--spacing-sm, 8px)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={handleMarkAsCompleted}
            disabled={isUpdating || job.status === 'completed'}
            style={{
              padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
              borderRadius: 'var(--border-radius-sm, 4px)',
              border: 'none',
              background: themeStyles.primaryButton.background,
              color: themeStyles.primaryButton.color,
              fontSize: 'var(--font-size, 14px)',
              fontWeight: '500',
              flex: 1,
              maxWidth: '500px',
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
