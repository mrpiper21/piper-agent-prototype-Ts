import { useState, useMemo } from 'react';
import { queryClient } from '../../../lib';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';
import { useQuery } from '@tanstack/react-query';
import { electronAPI } from '../../../lib';
import { JobListItem, JobPreview } from '../shared';
import { ConnectivityIssue } from '../../../shared/components/ConnectivityIssue';
import { useConnectivity } from '../../../shared/hooks';
import {
  AiOutlineReload,
  AiOutlineSearch,
  AiOutlineFilter,
  AiOutlineClose,
} from 'react-icons/ai';

type SortOption = 'newest' | 'oldest' | 'status' | 'filename';
type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

export default function JobsPage() {
  const { theme } = useTheme();
  // Memoize themeStyles to ensure synchronous updates with layout
  const themeStyles = useMemo(() => {
    return theme === 'dark' ? darkStyles : lightStyles;
  }, [theme]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Use the same query key as the layout - shares cache
  const { data: jobs, isLoading, error, isRefetching, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => electronAPI.jobs.getAll(),
    staleTime: 5000,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  const { hasConnectivityIssue } = useConnectivity();

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    if (!jobs) return [];

    let filtered = [...jobs];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((job: any) => {
        // Get client fullName from populated clientId
        const clientName = job.clientId && typeof job.clientId === 'object' 
          ? job.clientId.fullName?.toLowerCase() 
          : '';
        
        return (
          clientName?.includes(query) ||
          job.fileName?.toLowerCase().includes(query) ||
          job.artwork?.toLowerCase().includes(query) ||
          job.printerName?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((job: any) => {
        const status = job.status?.toLowerCase();
        if (statusFilter === 'pending') {
          return status === 'pending' || status === 'queued';
        }
        return status === statusFilter;
      });
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'newest': {
          const dateA = new Date(a.createdAt || a.submittedAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.submittedAt || 0).getTime();
          return dateB - dateA;
        }
        case 'oldest': {
          const dateAOld = new Date(a.createdAt || a.submittedAt || 0).getTime();
          const dateBOld = new Date(b.createdAt || b.submittedAt || 0).getTime();
          return dateAOld - dateBOld;
        }
        case 'status': {
          const statusOrder = [
            'pending',
            'queued',
            'processing',
            'printing',
            'completed',
            'failed',
          ];
          const aIndex = statusOrder.indexOf(a.status?.toLowerCase() || '');
          const bIndex = statusOrder.indexOf(b.status?.toLowerCase() || '');
          return aIndex - bIndex;
        }
        case 'filename': {
          // Sort by client fullName, fallback to fileName
          const aName = (a.clientId && typeof a.clientId === 'object' ? a.clientId.fullName : null) || a.fileName || '';
          const bName = (b.clientId && typeof b.clientId === 'object' ? b.clientId.fullName : null) || b.fileName || '';
          return aName.localeCompare(bName);
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [jobs, searchQuery, statusFilter, sortBy]);

  const isJobSelected = (job: any) => {
    if (!selectedJob) return false;
    return (
      (selectedJob.id && selectedJob.id === job.id) ||
      (selectedJob._id && selectedJob._id === job._id) ||
      (selectedJob.printJobId && selectedJob.printJobId === job.printJobId)
    );
  };

  const handleRefresh = () => {
    queryClient.refetchQueries({ queryKey: ['jobs'] });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || sortBy !== 'newest';

  if (isLoading && !jobs) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl, 24px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          color: themeStyles.textSecondary,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: `3px solid ${themeStyles.sidebar.borderColor}`,
            borderTop: `3px solid ${themeStyles.accent}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: 'var(--spacing-sm, 8px)',
          }}
        />
        <p style={{ fontSize: 'var(--font-size, 14px)' }}>Loading jobs...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show connectivity issue if offline or network error
  if (hasConnectivityIssue || (error && !jobs)) {
    return (
      <ConnectivityIssue
        message={
          error
            ? `Unable to load jobs: ${(error as Error).message}`
            : undefined
        }
        onRetry={() => {
          handleRefresh();
          refetch();
        }}
      />
    );
  }

  return (
    <div
      style={{
        padding: 'var(--spacing-md, 12px)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header - Always visible */}
      <div style={{ flexShrink: 0, marginBottom: 'var(--spacing-md, 12px)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-sm, 8px)',
          }}
        >
          <h2
            style={{
              color: '#fbbf24',
              fontWeight: '600',
              fontSize: 'var(--font-size-large, 16px)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm, 8px)',
            }}
          >
            Print Jobs
            {jobs && jobs.length > 0 && (
              <span
                style={{
                  fontSize: 'var(--font-size-small, 12px)',
                  fontWeight: '500',
                  color: themeStyles.textSecondary,
                  background: 'transparent',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                ({filteredAndSortedJobs.length})
              </span>
            )}
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isRefetching || isLoading}
            style={{
              padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
              borderRadius: 'var(--border-radius-sm, 4px)',
              border: themeStyles.button.border,
              background: themeStyles.button.background,
              color: themeStyles.button.color,
              fontSize: 'var(--font-size-small, 12px)',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs, 4px)',
              opacity: isRefetching || isLoading ? 0.6 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <AiOutlineReload
              style={{
                fontSize: 'var(--icon-size-sm, 14px)',
                animation: isRefetching ? 'spin 1s linear infinite' : 'none',
              }}
            />
            {isRefetching || isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Connectivity Indicator - Show when offline but have cached data */}
        {hasConnectivityIssue && jobs && jobs.length > 0 && (
          <ConnectivityIssue
            compact
            message="You're viewing cached data. Some information may be outdated."
            showRetry={false}
            style={{ marginBottom: 'var(--spacing-sm, 8px)' }}
          />
        )}

        {/* Search and Filters Bar */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-sm, 8px)',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--spacing-sm, 8px)',
          }}
        >
          {/* Search Input */}
          <div
            style={{
              position: 'relative',
              flex: '1',
              minWidth: '200px',
            }}
          >
            <AiOutlineSearch
              style={{
                position: 'absolute',
                left: 'var(--spacing-sm, 8px)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: themeStyles.textSecondary,
                fontSize: 'var(--icon-size-sm, 14px)',
              }}
            />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding:
                  'var(--spacing-xs, 4px) var(--spacing-sm, 8px) var(--spacing-xs, 4px) 32px',
                borderRadius: 'var(--border-radius-sm, 4px)',
                border: themeStyles.card.border,
                background: themeStyles.input.background,
                color: themeStyles.input.color,
                fontSize: 'var(--font-size, 14px)',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                height: '32px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = themeStyles.accent;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = themeStyles.card.border;
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: themeStyles.textSecondary,
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeStyles.card.background;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <AiOutlineClose />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
              borderRadius: 'var(--border-radius-sm, 4px)',
              border: themeStyles.button.border,
              background: themeStyles.button.background,
              color: themeStyles.button.color,
              fontSize: 'var(--font-size-small, 12px)',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs, 4px)',
              position: 'relative',
              height: '32px',
            }}
          >
            <AiOutlineFilter style={{ fontSize: 'var(--icon-size-sm, 14px)' }} />
            Filters
            {hasActiveFilters && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '8px',
                  height: '8px',
                  background: themeStyles.error,
                  borderRadius: '50%',
                }}
              />
            )}
          </button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{
              padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
              borderRadius: 'var(--border-radius-sm, 4px)',
              border: themeStyles.card.border,
              background: themeStyles.input.background,
              color: themeStyles.input.color,
              fontSize: 'var(--font-size-small, 12px)',
              cursor: 'pointer',
              outline: 'none',
              height: '32px',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="status">Sort by Status</option>
            <option value="filename">Sort by Filename</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
                borderRadius: 'var(--border-radius-sm, 4px)',
                border: themeStyles.button.border,
                background: themeStyles.button.background,
                color: themeStyles.button.color,
                fontSize: 'var(--font-size-small, 12px)',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs, 4px)',
                height: '32px',
              }}
            >
              <AiOutlineClose style={{ fontSize: 'var(--icon-size-sm, 14px)' }} />
              Clear
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div
            style={{
              background: themeStyles.card.background,
              border: themeStyles.card.border,
              borderRadius: 'var(--border-radius-sm, 4px)',
              padding: 'var(--spacing-sm, 8px)',
              marginBottom: 'var(--spacing-sm, 8px)',
              display: 'flex',
              gap: 'var(--spacing-sm, 8px)',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color: themeStyles.textSecondary,
                fontSize: 'var(--font-size-small, 12px)',
                fontWeight: '500',
              }}
            >
              Status:
            </span>
            {(['all', 'pending', 'processing', 'completed', 'failed'] as StatusFilter[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
                    borderRadius: 'var(--border-radius-sm, 4px)',
                    border: statusFilter === status ? 'none' : themeStyles.button.border,
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-small, 12px)',
                    fontWeight: '500',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease',
                    height: '28px',
                    ...(statusFilter === status
                      ? {
                          background: themeStyles.accent,
                          color: '#000000',
                        }
                      : {
                          background: themeStyles.button.background,
                          color: themeStyles.button.color,
                        }),
                  }}
                >
                  {status === 'all' ? 'All Statuses' : status}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Main Content - Split View */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          gap: 0,
          minHeight: 0,
        }}
      >
        {/* Job List - Always visible, constrained width */}
        <div
          style={{
            width: selectedJob ? '420px' : '100%',
            maxWidth: selectedJob ? '420px' : '600px',
            minWidth: selectedJob ? '420px' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRight: selectedJob ? themeStyles.card.border : 'none',
            background: themeStyles.container.background,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: 'var(--spacing-xs, 4px)',
            }}
          >
            <div style={{ ...sharedStyles.jobsList, gap: 'var(--spacing-xs, 4px)' }}>
              {!jobs || jobs.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-xl, 24px) var(--spacing-md, 12px)',
                    color: themeStyles.textSecondary,
                  }}
                >
                  <p
                    style={{
                      fontSize: 'var(--font-size-xl, 18px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                      fontWeight: '500',
                    }}
                  >
                    No jobs found
                  </p>
                  <p style={{ fontSize: 'var(--font-size-small, 12px)' }}>
                    Submit a print job to get started
                  </p>
                </div>
              ) : filteredAndSortedJobs.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-xl, 24px) var(--spacing-md, 12px)',
                    color: themeStyles.textSecondary,
                  }}
                >
                  <p
                    style={{
                      fontSize: 'var(--font-size-xl, 18px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                      fontWeight: '500',
                    }}
                  >
                    No jobs match your filters
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--font-size-small, 12px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    Try adjusting your search or filter criteria
                  </p>
                  <button
                    onClick={clearFilters}
                    style={{
                      padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
                      borderRadius: 'var(--border-radius-sm, 4px)',
                      border: 'none',
                      background: themeStyles.primaryButton.background,
                      color: themeStyles.primaryButton.color,
                      fontSize: 'var(--font-size-small, 12px)',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredAndSortedJobs.map((job: any) => (
                  <JobListItem
                    key={job.id || job._id || job.printJobId}
                    job={job}
                    isSelected={isJobSelected(job)}
                    onSelect={() => setSelectedJob(isJobSelected(job) ? null : job)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel - Shows when job is selected */}
        {selectedJob && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minWidth: 0,
              animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <JobPreview job={selectedJob} onClose={() => setSelectedJob(null)} />
          </div>
        )}

        {/* Empty State when no job selected but list is constrained */}
        {!selectedJob && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: themeStyles.container.background,
              color: themeStyles.textSecondary,
              padding: 'var(--spacing-xl, 24px)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontSize: 'var(--font-size-large, 16px)',
                  marginBottom: 'var(--spacing-sm, 8px)',
                  fontWeight: '500',
                }}
              >
                Select a job to view details
              </p>
              <p style={{ fontSize: 'var(--font-size-small, 12px)' }}>
                Click on any job from the list to see its preview and details
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
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
    </div>
  );
}
