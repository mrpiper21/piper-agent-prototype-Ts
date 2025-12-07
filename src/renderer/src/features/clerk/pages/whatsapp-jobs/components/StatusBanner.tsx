import { AiOutlineCheckCircle } from 'react-icons/ai';
import type { StatusInfo, ThemeStyles } from './types';

interface StatusBannerProps {
  themeStyles: ThemeStyles;
  statusInfo: StatusInfo;
}

export function StatusBanner({ themeStyles, statusInfo }: StatusBannerProps) {
  const StatusIcon = statusInfo.icon;

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        background: statusInfo.bg,
        border: `1px solid ${statusInfo.color}40`,
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {StatusIcon && <StatusIcon style={{ color: statusInfo.color, fontSize: '18px' }} />}
      <span
        style={{
          fontSize: '14px',
          fontWeight: '500',
          color: statusInfo.color,
        }}
      >
        {statusInfo.text}
      </span>
    </div>
  );
}

