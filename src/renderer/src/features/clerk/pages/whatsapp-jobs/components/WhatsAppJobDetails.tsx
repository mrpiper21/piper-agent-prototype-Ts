import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { electronAPI } from '../../../../../lib';
import { QuoteForm, type QuoteData } from './QuoteForm';
import { StatusBanner } from './StatusBanner';
import { ActionButtons } from './ActionButtons';
import { ConversationMessages } from './ConversationMessages';
import { AttachedFiles } from './AttachedFiles';
import { TextSection } from './TextSection';
import { PriceDisplay } from './PriceDisplay';
import { JobInfoSection } from './JobInfoSection';
import { MessageInput } from './MessageInput';
import { FloatingActionButton } from './FloatingActionButton';
import { getStatusInfo, getContactInfo } from './utils';
import type { ThemeStyles, Job } from './types';

interface WhatsAppJobDetailsProps {
  themeStyles: ThemeStyles;
  job: Job;
  onJobUpdate?: () => void;
}

export function WhatsAppJobDetails({ themeStyles, job, onJobUpdate }: WhatsAppJobDetailsProps) {
  const [message, setMessage] = useState('');
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const statusInfo = getStatusInfo(job.status);
  const { phone, email } = getContactInfo(job);

  const isConversation = job.metadata?.isConversation === true;
  const isNeedsQuote = job.status?.toLowerCase() === 'needs_quote' || isConversation;
  const isQuoteSent = job.status?.toLowerCase() === 'quote_sent' || job.status?.toLowerCase() === 'awaiting_payment';
  const isPaymentReceived = job.status?.toLowerCase() === 'payment_received' || job.status?.toLowerCase() === 'processing';

  const { data: latestMessages = [] } = useQuery({
    queryKey: ['whatsapp-local-messages'],
    queryFn: async () => {
      if (!electronAPI.whatsapp?.getLocalMessages) return [];
      const messages = await electronAPI.whatsapp.getLocalMessages();
      return (messages || []) as Array<{
        contact: string;
        contactName: string;
        messageId: string;
        body: string;
        timestamp: number;
        hasMedia: boolean;
        isPrintCommand: boolean;
        from?: 'client' | 'agent';
        media?: { mimetype: string; filename: string; filePath?: string; };
      }>;
    },
    staleTime: 0,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Get messages for this specific contact
  const contactMessages = latestMessages.filter(
    (msg) => msg.contact === job.metadata?.whatsappContact
  );

  const allConversationMessages = useMemo(() => {
    const jobMessages = job.metadata?.messages || [];
    const messageMap = new Map();
    
    // Add job messages first
    jobMessages.forEach((msg: any) => {
      messageMap.set(msg.messageId, msg);
    });
    
    // Override/add latest messages
    contactMessages.forEach((msg) => {
      messageMap.set(msg.messageId, msg);
    });
    
    // Convert to array and sort by timestamp
    return Array.from(messageMap.values()).sort((a: any, b: any) => 
      (a.timestamp || 0) - (b.timestamp || 0)
    );
  }, [job.metadata?.messages, contactMessages]);

  // Listen for real-time message updates (both client and agent messages)
  useEffect(() => {
    if (!electronAPI.whatsapp) return;

    const unsubscribe = electronAPI.whatsapp.onMessage((messageData: any) => {
      // Check if this message is for the current conversation
      const messageContact = messageData.contact || messageData.message?.contact;
      const currentContact = job.metadata?.whatsappContact;
      
      if (messageContact === currentContact) {
        console.log('[WhatsAppJobDetails] Message received for current conversation', {
          contact: messageContact,
          messageId: messageData.message?.messageId || messageData.messageId,
          from: messageData.message?.from || messageData.from,
        });
        
        // Invalidate and refetch messages for this conversation
        queryClient.invalidateQueries({ queryKey: ['whatsapp-local-messages'] });
        queryClient.refetchQueries({ queryKey: ['whatsapp-local-messages'] });
        
        // Also trigger parent update to refresh conversation list and re-sort
        if (onJobUpdate) {
          onJobUpdate();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [job.metadata?.whatsappContact, queryClient, onJobUpdate]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allConversationMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !electronAPI.whatsapp) return;

    try {
      const contact = job.metadata?.whatsappContact || phone;
      if (contact) {
        await electronAPI.whatsapp.sendMessage(contact, message);
        setMessage('');
        
        // Immediately refetch messages to show the sent message
        queryClient.invalidateQueries({ queryKey: ['whatsapp-local-messages'] });
        queryClient.refetchQueries({ queryKey: ['whatsapp-local-messages'] });
        
        // Trigger parent update to refresh conversation list
        if (onJobUpdate) {
          onJobUpdate();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    if (!electronAPI.whatsapp) return;

    try {
      const contact = job.metadata?.whatsappContact || phone;
      if (contact) {
        // Send file with optional caption (current message text)
        await electronAPI.whatsapp.sendFile(contact, filePath, message.trim() || undefined);
        setMessage('');
        
        // Immediately refetch messages to show the sent file
        queryClient.invalidateQueries({ queryKey: ['whatsapp-local-messages'] });
        queryClient.refetchQueries({ queryKey: ['whatsapp-local-messages'] });
        
        // Trigger parent update to refresh conversation list
        if (onJobUpdate) {
          onJobUpdate();
        }
      }
    } catch (error) {
      console.error('Error sending file:', error);
      alert(`Failed to send file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateQuote = async (quoteData: QuoteData) => {
    setIsProcessing(true);
    console.log('quoteData', quoteData);
    try {
      const jobId = job.id || job._id || job.printJobId;
      if (!jobId) throw new Error('Job ID not found');

      await electronAPI.whatsapp.createQuote(jobId, {
        ...quoteData,
        contact: job.metadata?.whatsappContact || phone,
        email,
      });

      if (onJobUpdate) {
        onJobUpdate();
      }
      setShowQuoteForm(false);
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!confirm('Mark this job as completed? This will notify the client.')) return;

    setIsProcessing(true);
    try {
      const jobId = job.id || job._id || job.printJobId;
      if (!jobId) throw new Error('Job ID not found');

      const customMessage = prompt('Add a custom completion message (optional):') || undefined;

      await electronAPI.whatsapp.markJobCompleted(jobId, {
        contact: job.metadata?.whatsappContact || phone,
        customMessage,
      });

      if (onJobUpdate) {
        onJobUpdate();
      }
    } catch (error) {
      console.error('Error marking job as completed:', error);
      alert('Failed to mark job as completed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show WhatsApp-style conversation view if there are any messages
  const hasMessages = allConversationMessages.length > 0;
  const showWhatsAppView = hasMessages;

  return (
    <>
      {showQuoteForm && (
        <QuoteForm
          themeStyles={themeStyles}
          job={job}
          onClose={() => setShowQuoteForm(false)}
          onSubmit={handleCreateQuote}
        />
      )}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: showWhatsAppView ? '#e5ddd5' : themeStyles.container.background,
          position: 'relative',
        }}
      >
        {/* Header */}
            <div
              style={{
                padding: '10px 16px',
                borderBottom: `1px solid ${themeStyles.card.border}`,
                background: themeStyles.header?.background || themeStyles.card.background,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: themeStyles.text,
                margin: 0,
              }}
            >
              {job.metadata?.contactName || 'Client'}
            </h2>
            {phone && (
              <p
                style={{
                  fontSize: '13px',
                  color: themeStyles.textSecondary,
                  margin: '2px 0 0 0',
                }}
              >
                {phone}
              </p>
            )}
          </div>
          <div
            style={{
              padding: '4px 8px',
              borderRadius: '12px',
              background: statusInfo.bg,
              border: `1px solid ${statusInfo.color}40`,
              fontSize: '12px',
              fontWeight: '500',
              color: statusInfo.color,
            }}
          >
            {statusInfo.text}
          </div>
        </div>

        {showWhatsAppView ? (
          <>
            {/* WhatsApp Conversation View */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                background: themeStyles.container.background,
                // Subtle pattern overlay that adapts to theme
                backgroundImage: (themeStyles.container.background === '#1a1a1a' || themeStyles.container.background === '#262626')
                  ? 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'grid\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 100 0 L 0 0 0 100\' fill=\'none\' stroke=\'%23404040\' stroke-width=\'0.5\' opacity=\'0.2\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23grid)\'/%3E%3C/svg%3E")'
                  : 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'grid\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 100 0 L 0 0 0 100\' fill=\'none\' stroke=\'%23d4d4d4\' stroke-width=\'0.5\' opacity=\'0.3\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23grid)\'/%3E%3C/svg%3E")',
              }}
            >
              {allConversationMessages.length > 0 ? (
                <>
                  <ConversationMessages
                    themeStyles={themeStyles}
                    messages={allConversationMessages}
                  />
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: themeStyles.textSecondary,
                    fontSize: '14px',
                  }}
                >
                  No messages yet. Start the conversation!
                </div>
              )}
            </div>

            {/* Fixed Message Input */}
            <MessageInput
              themeStyles={themeStyles}
              message={message}
              onMessageChange={setMessage}
              onSend={handleSendMessage}
              onFileSelect={handleFileSelect}
            />

            {/* Floating Create Quote Button */}
            {isNeedsQuote && (
              <FloatingActionButton
                themeStyles={themeStyles}
                onClick={() => setShowQuoteForm(true)}
                disabled={isProcessing}
              />
            )}
          </>
        ) : (
          /* Traditional Job Details View (when no messages) */
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
            }}
          >
            <StatusBanner themeStyles={themeStyles} statusInfo={statusInfo} />

            <ActionButtons
              themeStyles={themeStyles}
              job={job}
              isNeedsQuote={isNeedsQuote}
              isQuoteSent={isQuoteSent}
              isPaymentReceived={isPaymentReceived}
              isProcessing={isProcessing}
              onCreateQuote={() => setShowQuoteForm(true)}
              onMarkCompleted={handleMarkCompleted}
            />

            {job.metadata?.attachedFiles && job.metadata.attachedFiles.length > 0 && (
              <AttachedFiles
                themeStyles={themeStyles}
                files={job.metadata.attachedFiles}
              />
            )}

            {job.metadata?.orderDescription && (
              <TextSection
                themeStyles={themeStyles}
                title="Order Description"
                content={job.metadata.orderDescription}
              />
            )}

            {job.metadata?.specifications && (
              <TextSection
                themeStyles={themeStyles}
                title="Specifications"
                content={job.metadata.specifications}
              />
            )}

            {job.metadata?.total && (
              <PriceDisplay total={job.metadata.total} />
            )}

            {job.metadata?.internalNotes && (
              <TextSection
                themeStyles={themeStyles}
                title="Internal Notes"
                content={job.metadata.internalNotes}
                isItalic
                background={themeStyles.input.background}
                titleColor={themeStyles.textSecondary}
              />
            )}

            <JobInfoSection themeStyles={themeStyles} job={job} phone={phone} />

            <MessageInput
              themeStyles={themeStyles}
              message={message}
              onMessageChange={setMessage}
              onSend={handleSendMessage}
              onFileSelect={handleFileSelect}
            />
          </div>
        )}
      </div>
    </>
  );
}
