import { useState, useMemo } from 'react';
import { queryClient } from '../../../lib';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';
import { useQuery } from '@tanstack/react-query';
import { electronAPI } from '../../../lib';
import { JobListItem, JobPreview } from '../shared';
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
  const { data: jobs, isLoading, error, isRefetching } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => electronAPI.jobs.getAll(),
    staleTime: 5000,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    if (!jobs) return [];

    let filtered = [...jobs];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job: any) =>
          job.fileName?.toLowerCase().includes(query) ||
          job.artwork?.toLowerCase().includes(query) ||
          job.printerName?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query)
      );
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
        case 'filename':
          return (a.fileName || '').localeCompare(b.fileName || '');
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
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: themeStyles.textSecondary,
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: `4px solid ${themeStyles.sidebar.borderColor}`,
            borderTop: `4px solid ${themeStyles.accent}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
          }}
        />
        <p style={{ fontSize: '16px' }}>Loading jobs...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: themeStyles.error,
        }}
      >
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>⚠️</p>
        <p style={{ fontSize: '16px', marginBottom: '12px' }}>
          Error loading jobs: {(error as Error).message}
        </p>
        <button
          onClick={handleRefresh}
          style={{
            ...sharedStyles.actionButton,
            ...themeStyles.primaryButton,
            marginTop: '12px',
          }}
        >
          <AiOutlineReload style={{ marginRight: '8px', display: 'inline' }} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      {!selectedJob && (
        <div style={{ flexShrink: 0, marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                color: '#fbbf24',
                fontWeight: '700',
                fontSize: '24px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              Recent Print Jobs
              {jobs && jobs.length > 0 && (
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: themeStyles.textSecondary,
                    background: themeStyles.card.background,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    border: themeStyles.card.border,
                  }}
                >
                  {filteredAndSortedJobs.length} {filteredAndSortedJobs.length === 1 ? 'job' : 'jobs'}
                </span>
              )}
            </h2>
            <button
              onClick={handleRefresh}
              disabled={isRefetching || isLoading}
              style={{
                ...sharedStyles.actionButton,
                ...themeStyles.primaryButton,
                minWidth: '120px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isRefetching || isLoading ? 0.6 : 1,
              }}
            >
              <AiOutlineReload
                style={{
                  display: 'inline',
                  animation: isRefetching ? 'spin 1s linear infinite' : 'none',
                }}
              />
              {isRefetching || isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '16px',
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
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: themeStyles.textSecondary,
                  fontSize: '18px',
                }}
              />
              <input
                type="text"
                placeholder="Search jobs by filename, printer, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  borderRadius: '8px',
                  border: themeStyles.card.border,
                  background: themeStyles.input.background,
                  color: themeStyles.input.color,
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
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
                ...sharedStyles.actionButton,
                ...themeStyles.button,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
              }}
            >
              <AiOutlineFilter />
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
                padding: '10px 12px',
                borderRadius: '8px',
                border: themeStyles.card.border,
                background: themeStyles.input.background,
                color: themeStyles.input.color,
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
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
                  ...sharedStyles.actionButton,
                  ...themeStyles.button,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AiOutlineClose />
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
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span style={{ color: themeStyles.textSecondary, fontSize: '14px', fontWeight: '600' }}>
                Status:
              </span>
              {(['all', 'pending', 'processing', 'completed', 'failed'] as StatusFilter[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease',
                      ...(statusFilter === status
                        ? {
                            background: themeStyles.accent,
                            color: '#000000',
                          }
                        : {
                            background: themeStyles.button.background,
                            color: themeStyles.button.color,
                            border: themeStyles.button.border,
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
      )}

      {/* Main Content */}
      <div
        style={{
          display: 'flex',
          gap: selectedJob ? '24px' : '0',
          flex: 1,
          overflow: 'hidden',
          transition: 'gap 0.3s ease',
        }}
      >
        {/* Job List */}
        {!selectedJob ? (
          <div
            style={{
              flex: selectedJob ? '0 0 380px' : '1',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: selectedJob ? '8px' : '0',
            }}
          >
            <div style={sharedStyles.jobsList}>
              {!jobs || jobs.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: themeStyles.textSecondary,
                  }}
                >
                  <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
                  <p style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>
                    No jobs found
                  </p>
                  <p style={{ fontSize: '14px' }}>
                    Submit a print job to get started
                  </p>
                </div>
              ) : filteredAndSortedJobs.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: themeStyles.textSecondary,
                  }}
                >
                  <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</p>
                  <p style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>
                    No jobs match your filters
                  </p>
                  <p style={{ fontSize: '14px', marginBottom: '16px' }}>
                    Try adjusting your search or filter criteria
                  </p>
                  <button
                    onClick={clearFilters}
                    style={{
                      ...sharedStyles.actionButton,
                      ...themeStyles.primaryButton,
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
        ) : (
          <JobPreview job={selectedJob} onClose={() => setSelectedJob(null)} />
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
