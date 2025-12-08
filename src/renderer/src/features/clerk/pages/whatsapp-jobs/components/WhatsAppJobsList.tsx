import { JobListItem } from '../../../shared';
import { sharedStyles } from '../../../shared/clerkStyles';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface Job {
  id?: string;
  _id?: string;
  printJobId?: string;
  [key: string]: unknown;
}

interface WhatsAppJobsListProps {
  themeStyles: ThemeStyles;
  jobs: Job[];
  filteredAndSortedJobs: Job[];
  isLoading: boolean;
  error: Error | null;
  selectedJob: Job | null;
  onJobSelect: (job: Job | null) => void;
}

export function WhatsAppJobsList({
  themeStyles,
  jobs,
  filteredAndSortedJobs,
  isLoading,
  error,
  selectedJob,
  onJobSelect,
}: WhatsAppJobsListProps) {
  const isJobSelected = (job: Job): boolean => {
    if (!selectedJob) return false;
    return (
      (selectedJob.id && selectedJob.id === job.id) ||
      (selectedJob._id && selectedJob._id === job._id) ||
      (selectedJob.printJobId && selectedJob.printJobId === job.printJobId)
    );
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl, 24px)',
          textAlign: 'center',
          color: themeStyles.textSecondary,
        }}
      >
        <p>Loading WhatsApp jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl, 24px)',
          textAlign: 'center',
          color: themeStyles.error || '#ef4444',
        }}
      >
        <p>Error loading jobs: {error.message || 'Unknown error'}</p>
      </div>
    );
  }

  if (filteredAndSortedJobs.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl, 24px)',
          textAlign: 'center',
          color: themeStyles.textSecondary,
        }}
      >
        <p style={{ fontSize: 'var(--font-size, 14px)', marginBottom: 'var(--spacing-sm, 8px)' }}>
          {jobs.length === 0 ? 'No WhatsApp jobs yet' : 'No jobs match your filters'}
        </p>
        <p style={{ fontSize: 'var(--font-size-small, 12px)', opacity: 0.7 }}>
          {jobs.length === 0
            ? 'Jobs sent via WhatsApp will appear here'
            : 'Try adjusting your search or filters'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ ...sharedStyles.jobsList, gap: 'var(--spacing-xs, 4px)' }}>
      {filteredAndSortedJobs.map((job) => {
        const isSelected = isJobSelected(job);
        return (
          <JobListItem
            key={job.id || job._id || job.printJobId}
            job={job}
            isSelected={isSelected}
            onSelect={() => onJobSelect(isSelected ? null : job)}
          />
        );
      })}
    </div>
  );
}

