import { AiOutlineSend, AiOutlinePaperClip } from 'react-icons/ai';
import { electronAPI } from '../../../../../lib';
import type { ThemeStyles } from './types';

interface MessageInputProps {
  themeStyles: ThemeStyles;
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onFileSelect?: (filePath: string) => void;
}

export function MessageInput({ themeStyles, message, onMessageChange, onSend, onFileSelect }: MessageInputProps) {
  const handleFileSelect = async () => {
    if (!onFileSelect) return;
    
    try {
      // Use Electron's IPC to open file dialog
      // Check if dialog API is available
      if (!electronAPI || !electronAPI.dialog || !electronAPI.dialog.showOpenDialog) {
        console.error('[MessageInput] File dialog not available', {
          hasElectronAPI: !!electronAPI,
          hasDialog: !!electronAPI?.dialog,
          hasShowOpenDialog: !!electronAPI?.dialog?.showOpenDialog,
          electronAPIKeys: electronAPI ? Object.keys(electronAPI) : [],
        });
        alert('File selection is not available. Please restart the application to enable file sending.');
        return;
      }

      const result = await electronAPI.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
          { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
          { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv'] },
        ],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        onFileSelect(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      alert(`Failed to select file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div
      style={{
        padding: '8px 16px',
        background: themeStyles.card.background,
        borderTop: `1px solid ${themeStyles.card.border}`,
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        flexShrink: 0,
      }}
    >
      {/* File Attachment Button */}
      {onFileSelect && (
        <button
          onClick={handleFileSelect}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: 'none',
            background: themeStyles.input.background,
            color: themeStyles.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = themeStyles.card.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = themeStyles.input.background;
          }}
          title="Attach file"
        >
          <AiOutlinePaperClip style={{ fontSize: '20px' }} />
        </button>
      )}
      
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          background: themeStyles.input.background,
          borderRadius: '21px',
          padding: '9px 12px',
          border: `1px solid ${themeStyles.card.border}`,
          minHeight: '42px',
          maxHeight: '120px',
        }}
      >
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Type a message..."
          rows={1}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: themeStyles.input.color,
            fontSize: '15px',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            overflowY: 'auto',
            maxHeight: '100px',
            lineHeight: '20px',
            padding: 0,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (message.trim()) {
                onSend();
              }
            }
          }}
        />
      </div>
      <button
        onClick={onSend}
        disabled={!message.trim()}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: 'none',
          background: message.trim() ? '#25D366' : themeStyles.card.border,
          color: '#ffffff',
          cursor: message.trim() ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <AiOutlineSend style={{ fontSize: '18px' }} />
      </button>
    </div>
  );
}

