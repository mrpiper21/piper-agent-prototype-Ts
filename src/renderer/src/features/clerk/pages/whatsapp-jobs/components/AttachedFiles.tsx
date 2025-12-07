import { AiOutlineFile, AiOutlinePicture, AiOutlineDownload } from 'react-icons/ai';
import { electronAPI } from '../../../../../lib';
import type { ThemeStyles } from './types';

interface AttachedFile {
  filePath: string;
  fileName: string;
  fileType: string;
  messageId?: string;
}

interface AttachedFilesProps {
  themeStyles: ThemeStyles;
  files: AttachedFile[];
}

export function AttachedFiles({ themeStyles, files }: AttachedFilesProps) {
  if (!files || files.length === 0) return null;

  const handleOpenFile = async (filePath: string) => {
    try {
      await electronAPI.shell.openPath(filePath);
    } catch (err) {
      console.error('Error opening file:', err);
      alert(`Could not open file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        background: themeStyles.card.background,
        border: `1px solid ${themeStyles.card.border}`,
        marginBottom: '20px',
      }}
    >
      <h3
        style={{
          fontSize: '14px',
          fontWeight: '600',
          color: themeStyles.text,
          margin: '0 0 12px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <AiOutlineFile style={{ fontSize: '16px' }} />
        Attached Files ({files.length})
      </h3>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {files.map((file, index) => {
          const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.fileName);
          const fileExtension = file.fileName.split('.').pop()?.toUpperCase() || 'FILE';

          return (
            <div
              key={index}
              style={{
                padding: '12px',
                borderRadius: '6px',
                background: themeStyles.input.background,
                border: `1px solid ${themeStyles.card.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {isImage ? (
                <AiOutlinePicture
                  style={{
                    fontSize: '24px',
                    color: themeStyles.accent,
                    flexShrink: 0,
                  }}
                />
              ) : (
                <AiOutlineFile
                  style={{
                    fontSize: '24px',
                    color: themeStyles.textSecondary,
                    flexShrink: 0,
                  }}
                />
              )}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: themeStyles.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.fileName}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: themeStyles.textSecondary,
                  }}
                >
                  {fileExtension} • {file.fileType || 'Unknown type'}
                </span>
              </div>
              <button
                onClick={() => file.filePath && handleOpenFile(file.filePath)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: themeStyles.primaryButton.background,
                  color: themeStyles.primaryButton.color,
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                }}
              >
                <AiOutlineDownload style={{ fontSize: '14px' }} />
                Open
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

