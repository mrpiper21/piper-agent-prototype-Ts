import { WhatsAppConversationList } from '../../pages/whatsapp-jobs/components';
import type { lightStyles } from '../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface Job {
  id?: string;
  _id?: string;
  printJobId?: string;
  [key: string]: unknown;
}

interface WhatsAppSidebarProps {
  themeStyles: ThemeStyles;
  whatsappJobs: Job[];
  selectedJob: Job | null;
  onJobSelect: (job: Job) => void;
  spacing: number;
  fontSize: number;
}

export function WhatsAppSidebar({
  themeStyles,
  whatsappJobs,
  selectedJob,
  onJobSelect,
  spacing,
  fontSize,
}: WhatsAppSidebarProps) {
  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* WhatsApp Header */}
      <div
        style={{
          padding: `${12 * spacing}px ${12 * spacing}px ${8 * spacing}px`,
          borderBottom: `1px solid ${themeStyles.card.border}`,
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: '600',
            color: themeStyles.text,
            margin: '0 0 4px 0',
          }}
        >
          WhatsApp Conversations
        </h3>
        <p
          style={{
            fontSize: `${fontSize * 0.85}px`,
            color: themeStyles.textSecondary,
            margin: 0,
          }}
        >
          {whatsappJobs.length} conversation{whatsappJobs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* WhatsApp Conversations List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: `${4 * spacing}px`,
        }}
      >
        {whatsappJobs.length === 0 ? (
          <div
            style={{
              padding: `${24 * spacing}px ${12 * spacing}px`,
              textAlign: 'center',
              color: themeStyles.textSecondary,
            }}
          >
            <p style={{ fontSize: `${fontSize}px`, margin: 0 }}>No WhatsApp conversations yet</p>
            <p
              style={{
                fontSize: `${fontSize * 0.85}px`,
                margin: `${4 * spacing}px 0 0 0`,
                opacity: 0.7,
              }}
            >
              Jobs sent via WhatsApp will appear here
            </p>
          </div>
        ) : (
          <WhatsAppConversationList
            themeStyles={themeStyles}
            jobs={whatsappJobs}
            selectedJob={selectedJob}
            onJobSelect={onJobSelect}
          />
        )}
      </div>
    </div>
  );
}


