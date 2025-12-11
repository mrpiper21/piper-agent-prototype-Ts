import type { ThemeStyles } from './types';
import { electronAPI } from '../../../../../lib';

interface ConversationMessagesProps {
  themeStyles: ThemeStyles;
  messages: Array<{
    contact: string;
    contactName: string;
    messageId: string;
    body: string;
    timestamp: number;
    hasMedia: boolean;
    isPrintCommand: boolean;
    from?: 'client' | 'agent'; // Add this to identify sender
    media?: {
      mimetype: string;
      filename: string;
      filePath?: string;
    };
  }>;
}

export function ConversationMessages({ themeStyles, messages }: ConversationMessagesProps) {
  if (!messages || messages.length === 0) {
    return (
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
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 16px',
        gap: '4px',
        overflowY: 'auto',
        background: themeStyles.container.background,
      }}
    >
      {messages.map((msg, index) => {
        const messageDate = new Date(msg.timestamp || Date.now());
        const isFromAgent = msg.from === 'agent'; // Check if message is from agent
        const isFromClient = !isFromAgent; // Default to client if not specified
        const isPrintCommand = msg.isPrintCommand || (msg.body || '').trim().toLowerCase().startsWith('/print');

        // Determine if dark theme by checking container background
        const isDarkTheme = themeStyles.container.background === '#1a1a1a' || 
                           themeStyles.container.background === '#262626';
        
        // WhatsApp-style bubble colors using theme
        // Client bubbles: light green for /print, white/card background for regular messages
        const clientBubbleBg = isPrintCommand 
          ? (isDarkTheme ? 'rgba(34, 197, 94, 0.2)' : '#dcf8c6')
          : themeStyles.card.background;
        // Agent bubbles: light green
        const agentBubbleBg = isDarkTheme 
          ? 'rgba(34, 197, 94, 0.3)' 
          : '#d9fdd3';
        const bubbleBg = isFromClient ? clientBubbleBg : agentBubbleBg;
        const bubbleColor = themeStyles.text;
        const bubbleShadow = isDarkTheme 
          ? '0 1px 0.5px rgba(0, 0, 0, 0.5)' 
          : '0 1px 0.5px rgba(0, 0, 0, 0.13)';

        return (
          <div
            key={msg.messageId || index}
            style={{
              display: 'flex',
              justifyContent: isFromClient ? 'flex-start' : 'flex-end',
              marginBottom: '2px',
            }}
          >
            <div
              onClick={async () => {
                // If message has media, handle download/open on click
                if (msg.hasMedia && msg.media) {
                  try {
                    if (msg.media.filePath) {
                      // File already downloaded - open it
                      if (electronAPI.shell?.openPath) {
                        await electronAPI.shell.openPath(msg.media.filePath);
                      } else {
                        alert('File path not available');
                      }
                    } else {
                      // File not downloaded yet - show message
                      alert('File is being downloaded. Please wait a moment and try again.');
                    }
                  } catch (error) {
                    console.error('Error opening file:', error);
                    alert(`Could not open file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }
              }}
              style={{
                maxWidth: '65%',
                padding: '6px 7px 8px 9px',
                borderRadius: isFromClient ? '0 7.5px 7.5px 7.5px' : '7.5px 0 7.5px 7.5px',
                background: bubbleBg,
                color: bubbleColor,
                boxShadow: bubbleShadow,
                position: 'relative',
                cursor: msg.hasMedia && msg.media ? 'pointer' : 'default',
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (msg.hasMedia && msg.media) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = isDarkTheme 
                    ? '0 2px 8px rgba(0, 0, 0, 0.6)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (msg.hasMedia && msg.media) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = bubbleShadow;
                }
              }}
            >
              {isPrintCommand && (
                <div
                  style={{
                    marginBottom: '4px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#25D366',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '600',
                    display: 'inline-block',
                  }}
                >
                  /print
                </div>
              )}
              <p
                style={{
                  fontSize: '14.2px',
                  lineHeight: '19px',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: bubbleColor,
                }}
              >
                {msg.body || 'No message content'}
              </p>
              {msg.hasMedia && msg.media && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    borderRadius: '4px',
                    background: (themeStyles.container.background === '#1a1a1a' || themeStyles.container.background === '#262626')
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <p style={{ fontSize: '12px', color: bubbleColor, margin: 0, opacity: 0.8, flex: 1 }}>
                      {msg.media.mimetype?.startsWith('image/') ? '🖼️' : '📎'} {msg.media.filename || 'Media file'}
                      {msg.media.mimetype && (
                        <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                          ({msg.media.mimetype})
                        </span>
                      )}
                    </p>
                    {msg.media.filePath ? (
                      <span
                        style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          background: themeStyles.success,
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: '500',
                          flexShrink: 0,
                        }}
                      >
                        ✓ Downloaded
                      </span>
                    ) : (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await electronAPI.whatsapp.downloadMedia(msg.contact, msg.messageId);
                            // The UI will update via the IPC message event
                          } catch (error) {
                            console.error('Error downloading file:', error);
                            alert(`Could not download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                          }
                        }}
                        style={{
                          padding: '2px 8px',
                          fontSize: '10px',
                          background: themeStyles.accent,
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: '500',
                          flexShrink: 0,
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = themeStyles.primaryButton?.background || themeStyles.accent;
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = themeStyles.accent;
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        ⬇️ Download
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginTop: '2px',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: themeStyles.textSecondary,
                    opacity: 0.7,
                    lineHeight: '15px',
                  }}
                >
                  {formatTime(messageDate.getTime())}
                </span>
                {/* Message acknowledgment status for agent messages */}
                {isFromAgent && (msg as any).ack !== undefined && (
                  <span
                    style={{
                      fontSize: '12px',
                      color:
                        (msg as any).ack === 3
                          ? '#34B7F1' // Read - blue
                          : (msg as any).ack === 2
                          ? '#34B7F1' // Delivered - blue
                          : (msg as any).ack === 1
                          ? themeStyles.textSecondary // Sent - gray
                          : themeStyles.textSecondary, // Pending - gray
                      opacity: (msg as any).ack === 0 ? 0.5 : 1,
                    }}
                  >
                    {(msg as any).ack === 0 && '🕐'}
                    {(msg as any).ack === 1 && '✓'}
                    {(msg as any).ack === 2 && '✓✓'}
                    {(msg as any).ack === 3 && '✓✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

