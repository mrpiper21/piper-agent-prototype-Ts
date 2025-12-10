import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles } from '../shared/clerkStyles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { electronAPI } from '../../../lib';
import { ConnectivityIssue } from '../../../shared/components/ConnectivityIssue';
import { useConnectivity } from '../../../shared/hooks';
import { useSoundNotifications } from '../../../hooks/useSoundNotifications';
import { WhatsAppConversationList, WhatsAppJobDetails } from './whatsapp-jobs/components';

interface Job {
  id?: string;
  _id?: string;
  printJobId?: string;
  [key: string]: unknown;
}

interface LocalMessage {
  contact: string;
  contactName: string;
  messageId: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  isPrintCommand: boolean;
}

export default function WhatsAppJobsPage() {
  const { theme } = useTheme();
  const themeStyles = useMemo(() => {
    return theme === 'dark' ? darkStyles : lightStyles;
  }, [theme]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [messageUpdateTrigger, setMessageUpdateTrigger] = useState(0);

  const { hasConnectivityIssue } = useConnectivity();
  const { playSound } = useSoundNotifications();

  const printSoundRef = useRef<Set<string>>(new Set());

  // Fetch WhatsApp conversations (NOT API jobs - these are separate)
  // Use local state that gets updated via IPC events for real-time updates
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  // Initial load and periodic refresh (much less frequent - only as backup)
  const { refetch: refetchMessages, error: messagesError } = useQuery<LocalMessage[]>({
    queryKey: ['whatsapp-local-messages', messageUpdateTrigger],
    queryFn: async () => {
      try {
        if (!electronAPI.whatsapp?.getLocalMessages) {
          return [];
        }
        const messages = await electronAPI.whatsapp.getLocalMessages();
        console.log('[WhatsAppJobsPage] Fetched local messages:', messages?.length || 0);
        const messagesArray = (messages || []) as LocalMessage[];
        setLocalMessages(messagesArray);
        setIsLoadingMessages(false);
        return messagesArray;
      } catch (error) {
        console.error('[WhatsAppJobsPage] Error fetching local messages:', error);
        setIsLoadingMessages(false);
        return [];
      }
    },
    staleTime: 30000, // 30 seconds - messages update via IPC events primarily
    refetchInterval: 60000, // Only refetch every 60 seconds as backup (real-time via IPC)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchIntervalInBackground: false, // Don't poll in background
  });

  const whatsappJobs = useMemo(() => {
    const messagesArray = Array.isArray(localMessages) ? localMessages : [];
    console.log(
      '[WhatsAppJobsPage] 🔄 Recalculating whatsappJobs from',
      messagesArray.length,
      'messages',
      'at',
      Date.now()
    );

    if (messagesArray.length === 0) {
      return [];
    }

    const messagesByContact = new Map<string, LocalMessage[]>();
    for (const msg of messagesArray) {
      if (!msg.contact) continue;
      if (!messagesByContact.has(msg.contact)) {
        messagesByContact.set(msg.contact, []);
      }
      messagesByContact.get(msg.contact)!.push(msg);
    }

    // Convert to conversation objects - ONLY include conversations with /print commands
    // This WhatsApp integration is specifically for print jobs, not general messaging
    const conversations: Job[] = [];
    for (const [contact, messages] of messagesByContact) {
      // Strictly check if conversation has /print command
      // Must have at least one message that is explicitly a /print command
      const hasPrintCommand = messages.some((m) => {
        const body = (m.body || '').trim();
        // Check if message is marked as print command OR starts with /print (case insensitive)
        return m.isPrintCommand === true || body.toLowerCase().startsWith('/print');
      });

      // Only include conversations with /print commands - filter out all others
      if (!hasPrintCommand) {
        console.log('[WhatsAppJobsPage] ⏭️ Skipping conversation without /print command:', {
          contact,
          messageCount: messages.length,
          sampleMessages: messages.slice(0, 3).map((m) => ({
            body: (m.body || '').substring(0, 50),
            isPrintCommand: m.isPrintCommand,
          })),
        });
        continue;
      }

      console.log('[WhatsAppJobsPage] ✅ Including conversation with /print command:', {
        contact,
        messageCount: messages.length,
        printCommandMessages: messages.filter(
          (m) =>
            m.isPrintCommand === true || (m.body || '').trim().toLowerCase().startsWith('/print')
        ).length,
      });

      // Sort messages by timestamp (ascending - oldest first)
      const sortedMessages = [...messages].sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeA - timeB;
      });

      // Get the latest message (last in sorted array)
      const latestMessage = sortedMessages[sortedMessages.length - 1];

      // Get contact name
      const contactName =
        sortedMessages
          .map((m) => m.contactName)
          .find((name) => name && name !== contact && !name.includes('@')) ||
        latestMessage.contactName ||
        contact.split('@')[0];

      // Get the latest message (could be from client or agent)
      const latestMessageBody = latestMessage.body || 'No messages';

      // Get latest message timestamp for sorting - use the most recent timestamp from all messages
      const latestTimestamp = Math.max(
        ...sortedMessages.map((m) => m.timestamp || 0),
        latestMessage.timestamp || Date.now()
      );

      conversations.push({
        _id: `conversation-${contact}`,
        printJobId: `conversation-${contact}`,
        fileName: `WhatsApp Conversation - ${contactName}`,
        description: latestMessageBody, // Show latest message in preview
        status: 'needs_quote', // All conversations need a quote
        submittedAt: new Date(latestTimestamp).toISOString(),
        createdAt: new Date(latestTimestamp).toISOString(),
        metadata: {
          whatsappContact: contact,
          contactName: contactName,
          isLocalMessage: true,
          isConversation: true, // Mark as conversation, not a job
          messages: sortedMessages, // All messages in the conversation (sorted, including agent messages)
          hasPrintCommand: hasPrintCommand,
          latestMessageTimestamp: latestTimestamp, // Store for easy sorting
        },
      });
    }

    // Sort by latest message timestamp (newest first) - WhatsApp style
    // Use the stored latestMessageTimestamp or calculate from messages array
    conversations.sort((a, b) => {
      // Try to get from metadata first (faster)
      const latestTimeA =
        (a.metadata as { latestMessageTimestamp?: number })?.latestMessageTimestamp ||
        (() => {
          const messagesA = (a.metadata as { messages?: LocalMessage[] })?.messages || [];
          return messagesA.length > 0
            ? Math.max(...messagesA.map((m) => m.timestamp || 0))
            : new Date((a.submittedAt as string) || Date.now()).getTime();
        })();

      const latestTimeB =
        (b.metadata as { latestMessageTimestamp?: number })?.latestMessageTimestamp ||
        (() => {
          const messagesB = (b.metadata as { messages?: LocalMessage[] })?.messages || [];
          return messagesB.length > 0
            ? Math.max(...messagesB.map((m) => m.timestamp || 0))
            : new Date((b.submittedAt as string) || Date.now()).getTime();
        })();

      // Sort newest first (descending order)
      const sortResult = latestTimeB - latestTimeA;

      // Log sorting for debugging
      if (Math.abs(sortResult) < 1000) {
        // Only log if timestamps are very close
        console.log('[WhatsAppJobsPage] Sorting conversations:', {
          contactA: (a.metadata as { whatsappContact?: string })?.whatsappContact,
          contactB: (b.metadata as { whatsappContact?: string })?.whatsappContact,
          timeA: latestTimeA,
          timeB: latestTimeB,
          sortResult,
        });
      }

      return sortResult;
    });

    console.log(
      '[WhatsAppJobsPage] ✅ Filtered and sorted',
      conversations.length,
      'conversations with /print commands (out of',
      messagesByContact.size,
      'total contacts). Top conversation:',
      {
        contact: (conversations[0]?.metadata as { whatsappContact?: string })?.whatsappContact,
        latestTime: (conversations[0]?.metadata as { latestMessageTimestamp?: number })
          ?.latestMessageTimestamp,
        filteredOut: messagesByContact.size - conversations.length,
      }
    );

    return conversations;
  }, [localMessages]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return whatsappJobs.find((job) => job._id === selectedJobId) || null;
  }, [whatsappJobs, selectedJobId]);

  const selectedMessages = useMemo(() => {
    if (!selectedJobId) {
      return [];
    }

    const job = whatsappJobs.find((job) => job._id === selectedJobId);
    const contact = (job?.metadata as { whatsappContact?: string })?.whatsappContact;
    if (!contact) return [];

    return localMessages
      .filter((m) => m.contact === contact)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [localMessages, selectedJobId, whatsappJobs]);

  useEffect(() => {
    console.log('[WhatsAppJobsPage] 📊 WhatsApp jobs updated:', {
      count: whatsappJobs.length,
      jobs: whatsappJobs.map((j) => {
        const messages =
          (j.metadata as { messages?: Array<{ timestamp?: number }> })?.messages || [];
        const latestTimestamp =
          (j.metadata as { latestMessageTimestamp?: number })?.latestMessageTimestamp ||
          (messages.length > 0 ? Math.max(...messages.map((m) => m.timestamp || 0)) : 0);
        return {
          _id: j._id,
          contact: (j.metadata as { whatsappContact?: string })?.whatsappContact,
          description: (j.description as string)?.substring(0, 30),
          latestTimestamp,
          messageCount: messages.length,
        };
      }),
    });
  }, [whatsappJobs]);
  const handleMessageUpdate = useCallback(async () => {
    console.log('[WhatsAppJobsPage] 🔄 handleMessageUpdate called - triggering immediate refetch');

    setMessageUpdateTrigger((prev) => {
      const newValue = prev + 1;
      console.log('[WhatsAppJobsPage] Updating trigger:', prev, '->', newValue);
      return newValue;
    });

    queryClient.invalidateQueries({
      queryKey: ['whatsapp-local-messages'],
      exact: false,
    });

    try {
      const result = await refetchMessages({ cancelRefetch: false });
      console.log(
        '[WhatsAppJobsPage] ✅ Messages refetched successfully, count:',
        result.data?.length || 0
      );

      setTimeout(async () => {
        try {
          queryClient.invalidateQueries({
            queryKey: ['whatsapp-local-messages'],
            exact: false,
          });
          await refetchMessages({ cancelRefetch: false });
          console.log('[WhatsAppJobsPage] ✅ Backup refetch completed');
        } catch (error) {
          console.error('[WhatsAppJobsPage] Error in backup refetch:', error);
        }
      }, 300);
    } catch (error) {
      console.error('[WhatsAppJobsPage] Error refetching messages:', error);
    }
  }, [queryClient, refetchMessages]);

  // Real-time message updates via IPC events
  useEffect(() => {
    if (!electronAPI.whatsapp) {
      console.warn('[WhatsAppJobsPage] electronAPI.whatsapp not available');
      return;
    }

    console.log('[WhatsAppJobsPage] Setting up IPC message listeners...');

    const unsubscribeMessage = electronAPI.whatsapp.onMessage(
      (messageData: {
        contact?: string;
        message?: { 
          messageId?: string; 
          body?: string; 
          from?: string; 
          isPrintCommand?: boolean;
          timestamp?: number;
          hasMedia?: boolean;
          media?: any;
        };
        messageId?: string;
        body?: string;
        from?: string;
        contactName?: string;
        isPrintCommand?: boolean;
        timestamp?: number;
        hasMedia?: boolean;
        media?: any;
      }) => {
        // Handle format from sendToRenderer: { contact, contactName, message: LocalMessage }
        // or direct format: { contact, messageId, body, ... }
        const message = messageData.message || messageData;
        const contact = messageData.contact || (messageData.message as any)?.contact;
        const messageId = (message as any).messageId || messageData.messageId;
        const body = (message.body || messageData.body || '').substring(0, 50);
        const from = message.from || messageData.from;
        const isPrintCommand =
          message.isPrintCommand ||
          messageData.isPrintCommand ||
          body.trim().toLowerCase().startsWith('/print');

        console.log('[WhatsAppJobsPage] ✅ IPC message event received!', {
          contact,
          messageId,
          body,
          from,
          isPrintCommand,
          timestamp: Date.now(),
        });

        // Play print command sound immediately
        const soundKey = messageId
          ? `whatsapp-print-${contact}-${messageId}`
          : `whatsapp-print-${contact}-${Date.now()}`;
        if (isPrintCommand && contact) {
          if (!printSoundRef.current.has(soundKey)) {
            printSoundRef.current.add(soundKey);
            try {
              playSound('whatsapp-job', soundKey);
            } catch (error) {
              console.error('[WhatsAppJobsPage] Error playing print command sound:', error);
            }
          }
        }

        // Immediately update local messages state for real-time UI update
        if (contact && messageId) {
          setLocalMessages((prev) => {
            // Check if message already exists (prevent duplicates)
            const exists = prev.some((msg) => msg.messageId === messageId);
            if (exists) {
              console.log('[WhatsAppJobsPage] Message already exists, skipping duplicate', messageId);
              return prev;
            }
            
            // Add new message
            const newMessage: LocalMessage = {
              contact,
              contactName: messageData.contactName || contact.split('@')[0],
              messageId,
              body: message.body || messageData.body || '',
              timestamp: message.timestamp || messageData.timestamp || Date.now(),
              hasMedia: message.hasMedia || messageData.hasMedia || false,
              isPrintCommand,
            };
            
            console.log('[WhatsAppJobsPage] Adding new message to state', newMessage.messageId);
            return [...prev, newMessage];
          });
        }

        // Only refetch for print commands (to check if job was created)
        // Regular messages are updated via IPC events, no need to refetch
        if (isPrintCommand) {
          // Refetch after a delay to ensure job is created
          setTimeout(() => {
            handleMessageUpdate();
          }, 1000);
        }
      }
    );

    const unsubscribeHistory = electronAPI.whatsapp.onHistoryLoaded((data: { count: number }) => {
      console.log('[WhatsAppJobsPage] ✅ History loaded event received!', data);
      handleMessageUpdate();
    });

    console.log('[WhatsAppJobsPage] IPC message listeners set up successfully');

    return () => {
      console.log('[WhatsAppJobsPage] Cleaning up IPC message listeners');
      unsubscribeMessage();
      unsubscribeHistory();
    };
  }, [handleMessageUpdate, playSound]);

  if (hasConnectivityIssue) {
    return <ConnectivityIssue />;
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        background: themeStyles.container.background,
      }}
    >
      <div
        style={{
          width: '320px',
          minWidth: '280px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: themeStyles.card.border,
          background: themeStyles.sidebar.background,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: themeStyles.card.border,
            background: '#25D366',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
              margin: '0 0 4px 0',
            }}
          >
            WhatsApp Conversations
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
            }}
          >
            {whatsappJobs.length} conversation{whatsappJobs.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {isLoadingMessages ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: themeStyles.textSecondary,
              }}
            >
              <p>Loading conversations...</p>
            </div>
          ) : messagesError ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: themeStyles.error || '#ef4444',
              }}
            >
              <p>
                Error loading conversations:{' '}
                {messagesError instanceof Error ? messagesError.message : 'Unknown error'}
              </p>
            </div>
          ) : (
            <WhatsAppConversationList
              key={`conversations-${messageUpdateTrigger}-${whatsappJobs.length}-${whatsappJobs[0] ? (whatsappJobs[0].metadata as { latestMessageTimestamp?: number })?.latestMessageTimestamp || 0 : 0}`}
              themeStyles={themeStyles}
              jobs={whatsappJobs}
              selectedJob={selectedJob}
              onJobSelect={(job) => setSelectedJobId(job._id || null)}
            />
          )}
        </div>
      </div>

      {selectedJob ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <WhatsAppJobDetails 
            themeStyles={themeStyles} 
            job={selectedJob} 
            messages={selectedMessages}
          />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: themeStyles.container.background,
            color: themeStyles.textSecondary,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '16px',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              Select a conversation to view job details
            </p>
            <p style={{ fontSize: '13px', opacity: 0.7 }}>
              Click on any conversation from the sidebar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
