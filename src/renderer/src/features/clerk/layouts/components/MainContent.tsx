import { Outlet } from 'react-router-dom';
import { AiOutlineFileText, AiOutlineMessage } from 'react-icons/ai';
import { JobPreview } from '../../shared';
import { WhatsAppJobDetails } from '../../pages/whatsapp-jobs/components';
import type { lightStyles } from '../../shared/clerkStyles';
import type { TabType } from './TabSwitcher';

type ThemeStyles = typeof lightStyles;

interface Job {
  id?: string;
  _id?: string;
  printJobId?: string;
  [key: string]: unknown;
}

interface MainContentProps {
  themeStyles: ThemeStyles;
  isSettingsPage: boolean;
  activeTab: TabType;
  selectedJob: Job | null;
  selectedWhatsAppJob: Job | null;
  onCloseJob: () => void;
  onJobUpdate?: () => void;
  spacing: number;
  fontSize: number;
}

export function MainContent({
  themeStyles,
  isSettingsPage,
  activeTab,
  selectedJob,
  selectedWhatsAppJob,
  onCloseJob,
  onJobUpdate,
  spacing,
  fontSize,
}: MainContentProps) {
  if (isSettingsPage) {
    return <Outlet />;
  }

  if (activeTab === 'whatsapp' && selectedWhatsAppJob) {
    return (
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <WhatsAppJobDetails
          themeStyles={themeStyles}
          job={selectedWhatsAppJob}
          onJobUpdate={onJobUpdate}
        />
      </div>
    );
  }

  if (activeTab === 'jobs' && selectedJob) {
    return (
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <JobPreview job={selectedJob} onClose={onCloseJob} />
      </div>
    );
  }

  return (
    <div
      style={{ ...styles.content, padding: `${12 * spacing}px`, fontSize: `${fontSize}px` }}
    >
      {activeTab === 'jobs' && !selectedJob ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: themeStyles.textSecondary,
            flexDirection: 'column',
            gap: `${8 * spacing}px`,
          }}
        >
          <AiOutlineFileText style={{ fontSize: `${48 * spacing}px`, opacity: 0.3 }} />
          <p style={{ fontSize: `${fontSize + 2}px`, margin: 0, fontWeight: '500' }}>
            Select a job to view details
          </p>
          <p style={{ fontSize: `${fontSize}px`, margin: 0, opacity: 0.7 }}>
            Click on any job from the sidebar to see its preview
          </p>
        </div>
      ) : activeTab === 'whatsapp' && !selectedWhatsAppJob ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: themeStyles.textSecondary,
            flexDirection: 'column',
            gap: `${8 * spacing}px`,
          }}
        >
          <AiOutlineMessage style={{ fontSize: `${48 * spacing}px`, opacity: 0.3 }} />
          <p style={{ fontSize: `${fontSize + 2}px`, margin: 0, fontWeight: '500' }}>
            Select a conversation to view job details
          </p>
          <p style={{ fontSize: `${fontSize}px`, margin: 0, opacity: 0.7 }}>
            Click on any conversation from the sidebar
          </p>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  );
}

const styles = {
  content: {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
    overflowX: 'hidden' as const,
    minWidth: 0,
  },
};


