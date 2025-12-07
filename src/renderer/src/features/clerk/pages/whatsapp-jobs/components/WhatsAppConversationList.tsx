import { useTheme } from '../../../../../context/ThemeContext';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface Job {
  id?: string;
  _id?: string;
  printJobId?: string;
  fileName?: string;
  description?: string;
  status?: string;
  metadata?: {
    whatsappContact?: string;
    whatsappMessageId?: string;
    notes?: string;
    contactName?: string;
  };
  clientId?: {
    fullName?: string;
    phoneNumber?: string;
  } | string;
  createdAt?: string;
  submittedAt?: string;
  [key: string]: unknown;
}

interface WhatsAppConversationListProps {
  themeStyles: ThemeStyles;
  jobs: Job[];
  selectedJob: Job | null;
  onJobSelect: (job: Job) => void;
}

// Get initial from name
const getInitial = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

// Format phone number
const formatPhoneNumber = (phone: string): string => {
  // Remove @c.us or @g.us suffix if present
  const cleaned = phone.replace(/@.*$/, '');
  // Format as +233 XX XXX XXXX if it's a Ghana number
  if (cleaned.startsWith('233')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return cleaned;
};

// Get status tag color and text
const getStatusTag = (status: string | undefined) => {
  const statusLower = (status || '').toLowerCase();
  if (statusLower === 'completed') {
    return { text: 'Completed', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
  }
  if (statusLower === 'payment_received' || statusLower === 'processing') {
    return { text: 'Payment Received', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
  }
  if (statusLower === 'quote_sent' || statusLower === 'awaiting_payment') {
    return { text: 'Quote Sent', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
  }
  if (statusLower === 'needs_quote') {
    return { text: 'Needs Quote', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
  }
  if (statusLower === 'pending' || statusLower === 'queued') {
    return { text: 'Pending', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
  }
  if (statusLower === 'failed') {
    return { text: 'Failed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
  }
  return { text: status || 'Unknown', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
};

// Format timestamp
const formatTime = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Format as time if today, otherwise date
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export function WhatsAppConversationList({
  themeStyles,
  jobs,
  selectedJob,
  onJobSelect,
}: WhatsAppConversationListProps) {
  const { theme } = useTheme();
  const isJobSelected = (job: Job): boolean => {
    if (!selectedJob) return false;
    return (
      (selectedJob.id && selectedJob.id === job.id) ||
      (selectedJob._id && selectedJob._id === job._id) ||
      (selectedJob.printJobId && selectedJob.printJobId === job.printJobId) as boolean
    );
  };

  // Get contact info from job
  const getContactInfo = (job: Job) => {
    let name = 'Unknown Contact';
    let phone = '';

    // Try to get from metadata contactName first (for local messages)
    if (job.metadata?.contactName) {
      name = job.metadata.contactName;
    }

    // Try to get from clientId
    if (job.clientId && typeof job.clientId === 'object') {
      if (name === 'Unknown Contact') {
        name = job.clientId.fullName || name;
      }
      phone = job.clientId.phoneNumber || '';
    }

    // Try to get from metadata whatsappContact
    if (job.metadata?.whatsappContact) {
      const contact = job.metadata.whatsappContact;
      // Extract phone number from JID format (e.g., "233241234567@c.us")
      const phoneMatch = contact.match(/^(\d+)@/);
      if (phoneMatch) {
        phone = formatPhoneNumber(phoneMatch[1]);
      }
      // If no name found yet, try to extract from contact
      if (name === 'Unknown Contact') {
        name = contact.split('@')[0];
      }
    }

    return { name, phone };
  };

  // Get message preview - show latest message from conversation
  const getMessagePreview = (job: Job): string => {
    // Try to get latest message from metadata.messages array
    const messages = (job.metadata as { messages?: Array<{ body?: string; from?: string }> })?.messages || [];
    if (messages.length > 0) {
      // Get the latest message (last in array since they're sorted by timestamp)
      const latestMsg = messages[messages.length - 1];
      const preview = latestMsg.body || '';
      if (preview) {
        // Add "You: " prefix for agent messages
        const prefix = latestMsg.from === 'agent' ? 'You: ' : '';
        const fullText = prefix + preview;
        return fullText.length > 50 ? fullText.substring(0, 50) + '...' : fullText;
      }
    }
    
    // Fallback to description or notes
    if (job.metadata?.notes && typeof job.metadata.notes === 'string') {
      return job.metadata.notes.length > 50
        ? job.metadata.notes.substring(0, 50) + '...'
        : job.metadata.notes;
    }
    if (job.description && typeof job.description === 'string') {
      return job.description.length > 50 ? job.description.substring(0, 50) + '...' : job.description;
    }
    if (job.fileName) {
      return `File: ${job.fileName}`;
    }
    return 'No message';
  };

  // Filter out any conversations that don't have /print commands
  // This is a safeguard - conversations should already be filtered in WhatsAppJobsPage
  const filteredJobs = jobs.filter((job) => {
    // Check if conversation has /print command in metadata or messages
    const metadata = job.metadata as { 
      hasPrintCommand?: boolean;
      whatsappContact?: string;
      messages?: Array<{ isPrintCommand?: boolean; body?: string }> 
    } | undefined;
    
    // If metadata explicitly says it has a print command, include it
    if (metadata?.hasPrintCommand === true) {
      return true;
    }
    
    // Otherwise, check messages array for /print commands
    const messages = metadata?.messages || [];
    const hasPrintCommand = messages.some(m => {
      const body = (m.body || '').trim();
      return m.isPrintCommand === true || body.toLowerCase().startsWith('/print');
    });
    
    if (!hasPrintCommand) {
      console.warn('[WhatsAppConversationList] Filtering out conversation without /print command:', {
        contact: metadata?.whatsappContact || job._id,
        messageCount: messages.length,
      });
    }
    
    return hasPrintCommand;
  });

  if (filteredJobs.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: themeStyles.textSecondary,
        }}
      >
        <p style={{ fontSize: '14px', marginBottom: '8px' }}>No WhatsApp conversations yet</p>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>Jobs sent via WhatsApp will appear here</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {filteredJobs.map((job) => {
        const isSelected = isJobSelected(job);
        const { name } = getContactInfo(job);
        const statusTag = getStatusTag(job.status);
        const messagePreview = getMessagePreview(job);
        const time = formatTime(job.createdAt || job.submittedAt);
        const initial = getInitial(name);

        // Use a stable key that includes the contact and latest message timestamp to force re-render on new messages
        const latestTimestamp = (job.metadata as { latestMessageTimestamp?: number; messages?: Array<{ timestamp?: number }> })?.latestMessageTimestamp
          || (() => {
              const messages = (job.metadata as { messages?: Array<{ timestamp?: number }> })?.messages || [];
              return messages.length > 0 ? Math.max(...messages.map(m => m.timestamp || 0)) : 0;
            })();
        const stableKey = `${job.id || job._id || job.printJobId}-${latestTimestamp}`;

        return (
          <div
            key={stableKey}
            onClick={() => onJobSelect(job)}
            style={{
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              position: 'relative',
              borderLeft: isSelected ? `3px solid ${themeStyles.accent}` : '3px solid transparent',
              borderTop: 'none',
              borderRight: 'none',
              borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
              background: isSelected
                ? theme === 'dark'
                  ? 'rgba(251, 191, 36, 0.12)'
                  : 'rgba(251, 191, 36, 0.08)'
                : themeStyles.card.background,
              padding: '8px 6px',
              borderRadius: 0,
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background =
                  theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = themeStyles.card.background;
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
              {/* Avatar - smaller, compact */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  background: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '600',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {initial}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Name and Time Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <p
                    style={{
                      color: themeStyles.text,
                      fontWeight: isSelected ? '600' : '500',
                      fontSize: '12px',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const,
                      lineHeight: '1.4',
                      flex: 1,
                    }}
                    title={name}
                  >
                    {name}
                  </p>
                  {time && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: themeStyles.textSecondary,
                        flexShrink: 0,
                        opacity: 0.7,
                      }}
                    >
                      {time}
                    </span>
                  )}
                </div>

                {/* Message Preview and Status Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    fontSize: '10px',
                    color: themeStyles.textSecondary,
                    lineHeight: '1.3',
                  }}
                >
                  {/* Message Preview */}
                  {messagePreview && (
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                        flex: 1,
                        minWidth: 0,
                      }}
                      title={messagePreview}
                    >
                      {messagePreview}
                    </span>
                  )}

                  {/* Separator */}
                  {messagePreview && statusTag.text && <span style={{ opacity: 0.4 }}>•</span>}

                  {/* Status Badge */}
                  <span
                    style={{
                      color: statusTag.color,
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      fontSize: '9px',
                      letterSpacing: '0.3px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: statusTag.bg,
                      flexShrink: 0,
                    }}
                  >
                    {statusTag.text}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

