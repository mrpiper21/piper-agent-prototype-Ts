import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from './clerkStyles';
import { getStatusColor } from './utils';

interface JobListItemProps {
  job: any;
  isSelected: boolean;
  onSelect: () => void;
}

export function JobListItem({ job, isSelected, onSelect }: JobListItemProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      style={{ 
        ...sharedStyles.jobItem, 
        ...themeStyles.card,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        position: 'relative',
        transform: isSelected ? 'translateX(4px)' : 'translateX(0)',
      }}
    >
      <div>
        <p style={{ color: themeStyles.text, fontWeight: 'bold' }}>
          {job.artwork || job.fileName}
        </p>
        <p style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
          {job?.fileName} • {new Date(job?.createdAt).toLocaleString()}
        </p>
        <p style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
          {job.copies} copies
        </p>
        <p style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
          {job.description}
        </p>
      </div>
      <span
        style={{
          color: getStatusColor(job.status, themeStyles),
          fontWeight: 'bold',
          textTransform: 'uppercase',
          fontSize: '12px',
        }}
      >
        {job.status}
      </span>
    </div>
  );
}

