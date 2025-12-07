import { AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { JobListItem } from '../../shared';
import { sharedStyles } from '../../shared/clerkStyles';
import type { lightStyles } from '../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface Job {
  id?: string;
  _id?: string;
  printJobId?: string;
  [key: string]: unknown;
}

interface JobsSidebarProps {
  themeStyles: ThemeStyles;
  theme: 'light' | 'dark';
  jobs: Job[] | undefined;
  filteredJobs: Job[];
  selectedJob: Job | null;
  jobSearchQuery: string;
  jobStatusFilter: 'all' | 'pending' | 'processing' | 'completed' | 'failed';
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (filter: 'all' | 'pending' | 'processing' | 'completed' | 'failed') => void;
  onJobSelect: (job: Job | null) => void;
  isJobSelected: (job: Job) => boolean;
  spacing: number;
  fontSize: number;
  iconSize: number;
}

export function JobsSidebar({
  themeStyles,
  theme,
  jobs,
  filteredJobs,
  selectedJob,
  jobSearchQuery,
  jobStatusFilter,
  onSearchChange,
  onStatusFilterChange,
  onJobSelect,
  isJobSelected,
  spacing,
  fontSize,
  iconSize,
}: JobsSidebarProps) {
  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Search Bar and Status Filter */}
      <div
        style={{
          padding: `${8 * spacing}px ${8 * spacing}px ${6 * spacing}px`,
          borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: `${6 * spacing}px`,
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <AiOutlineSearch
            style={{
              position: 'absolute',
              left: `${8 * spacing}px`,
              color: themeStyles.textSecondary,
              fontSize: `${iconSize * 0.75}px`,
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search jobs..."
            value={jobSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: `${6 * spacing}px ${8 * spacing}px ${6 * spacing}px ${28 * spacing}px`,
              borderRadius: '4px',
              border: `1px solid ${themeStyles.card.border}`,
              background: themeStyles.input.background,
              color: themeStyles.input.color,
              fontSize: `${fontSize * 0.9}px`,
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
          {jobSearchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: `${6 * spacing}px`,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: themeStyles.textSecondary,
                padding: `${2 * spacing}px`,
                display: 'flex',
                alignItems: 'center',
                borderRadius: '3px',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = themeStyles.card.background;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <AiOutlineClose style={{ fontSize: `${iconSize * 0.75}px` }} />
            </button>
          )}
        </div>
        {/* Status Filter Dropdown */}
        <select
          value={jobStatusFilter}
          onChange={(e) =>
            onStatusFilterChange(e.target.value as 'all' | 'pending' | 'processing' | 'completed' | 'failed')
          }
          style={{
            width: '100%',
            padding: `${6 * spacing}px ${8 * spacing}px`,
            borderRadius: '4px',
            border: `1px solid ${themeStyles.card.border}`,
            background: themeStyles.input.background,
            color: themeStyles.input.color,
            fontSize: `${fontSize * 0.9}px`,
            cursor: 'pointer',
            outline: 'none',
            fontWeight: jobStatusFilter !== 'all' ? '500' : '400',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = themeStyles.accent;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = themeStyles.card.border;
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Jobs List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: `${4 * spacing}px 0`,
        }}
      >
        {!jobs || jobs.length === 0 ? (
          <div
            style={{
              padding: `${24 * spacing}px ${12 * spacing}px`,
              textAlign: 'center',
              color: themeStyles.textSecondary,
            }}
          >
            <p style={{ fontSize: `${fontSize}px`, margin: 0 }}>No jobs found</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div
            style={{
              padding: `${24 * spacing}px ${12 * spacing}px`,
              textAlign: 'center',
              color: themeStyles.textSecondary,
            }}
          >
            <p
              style={{
                fontSize: `${fontSize}px`,
                margin: 0,
                marginBottom: `${4 * spacing}px`,
              }}
            >
              No jobs match your search
            </p>
            <p style={{ fontSize: `${fontSize * 0.85}px`, margin: 0, opacity: 0.7 }}>
              Try a different search term
            </p>
          </div>
        ) : (
          <div
            style={{
              ...sharedStyles.jobsList,
              gap: `${2 * spacing}px`,
              padding: `0 ${4 * spacing}px`,
            }}
          >
            {filteredJobs.map((job: Job) => (
              <JobListItem
                key={job.id || job._id || job.printJobId}
                job={job}
                isSelected={isJobSelected(job)}
                onSelect={() => onJobSelect(isJobSelected(job) ? null : job)}
                compact={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


