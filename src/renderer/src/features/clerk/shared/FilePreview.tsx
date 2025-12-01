import { useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles } from './clerkStyles';
import { getFileType } from './utils';

interface FilePreviewProps {
  fileName: string;
  fileUrl: string;
}

export function FilePreview({ fileName, fileUrl }: FilePreviewProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const fileType = getFileType(fileName);

  // Simple download handler - just opens the file URL
  const handleDownload = () => {
    if (!fileUrl) return;
    window.open(fileUrl, '_blank');
  };

  // Block print functionality
  useEffect(() => {
    const handleBeforePrint = (e: Event) => {
      e.preventDefault();
      alert('Printing is disabled');
    };

    const handlePrintShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        alert('Printing is disabled');
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('keydown', handlePrintShortcut);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('keydown', handlePrintShortcut);
    };
  }, []);

  if (fileType === 'image' && fileUrl) {
    return (
      <div
        style={{
          background: themeStyles.container.background,
          padding: '12px',
          borderRadius: '12px',
          textAlign: 'center',
          minHeight: '600px',
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <img
          src={fileUrl}
          alt={fileName}
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(100% - 60px)',
            objectFit: 'contain',
            borderRadius: '8px',
          }}
        />
        <button
          onClick={handleDownload}
          disabled={!fileUrl}
          style={{
            padding: '10px 24px',
            background: themeStyles.primaryButton.background,
            color: themeStyles.primaryButton.color,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: !fileUrl ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            transition: 'transform 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: !fileUrl ? 0.6 : 1,
          }}
          onMouseEnter={(e) => fileUrl && (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          ⬇️ Download
        </button>
      </div>
    );
  }

  if (fileType === 'pdf' && fileUrl) {
    // Use fileUrl directly in iframe - no fetching needed
    const pdfUrl = `${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`;

    return (
      <div
        style={{
          background: themeStyles.container.background,
          padding: '16px',
          borderRadius: '12px',
          height: '100%',
          minHeight: '600px',
          overflow: 'hidden',
          display: 'flex',
          position: 'relative',
          userSelect: 'none',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <iframe
          src={pdfUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '8px',
          }}
          title={fileName}
        />
      </div>
    );
  }

  if (fileType === 'document' && fileUrl) {
    // Use Microsoft Office Online Viewer for Word documents
    // This works with publicly accessible URLs
    const isDocx =
      fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc');
    const viewerUrl = isDocx
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
      : fileUrl;

    return (
      <div
        style={{
          background: themeStyles.container.background,
          padding: '16px',
          borderRadius: '12px',
          height: '100%',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleDownload}
            disabled={!fileUrl}
            style={{
              padding: '8px 16px',
              background: themeStyles.primaryButton.background,
              color: themeStyles.primaryButton.color,
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: !fileUrl ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              transition: 'transform 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: !fileUrl ? 0.6 : 1,
            }}
            onMouseEnter={(e) => fileUrl && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ⬇️ Download
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            position: 'relative',
            userSelect: 'none',
            borderRadius: '8px',
            border: themeStyles.card.border,
            minHeight: 0,
          }}
        >
          <iframe
            src={viewerUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
            }}
            title={fileName}
            allow="fullscreen"
          />
        </div>
      </div>
    );
  }

  // Default/Unknown file type
  const fileIcon = fileType === 'document' ? '📝' : '📄';
  const fileTypeLabel = getFileType(fileName) === 'document' ? 'DOCUMENT' : 'FILE';

  return (
    <div
      style={{
        padding: '60px 40px',
        textAlign: 'center',
        background: themeStyles.container.background,
        border: themeStyles.card.border,
        borderRadius: '12px',
        height: '100%',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: '72px',
          marginBottom: '16px',
          filter: 'opacity(0.6)',
        }}
      >
        {fileIcon}
      </div>
      <p
        style={{
          color: themeStyles.text,
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '8px',
        }}
      >
        {fileName}
      </p>
      <p style={{ color: themeStyles.textSecondary }}>{fileTypeLabel}</p>
      {fileUrl && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginTop: '16px',
          }}
        >
          <button
            onClick={handleDownload}
            disabled={!fileUrl}
            style={{
              padding: '10px 24px',
              background: themeStyles.primaryButton.background,
              color: themeStyles.primaryButton.color,
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: !fileUrl ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              transition: 'transform 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: !fileUrl ? 0.6 : 1,
            }}
            onMouseEnter={(e) => fileUrl && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ⬇️ Download
          </button>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              background: themeStyles.button?.background || themeStyles.card.background,
              color: themeStyles.text,
              textDecoration: 'none',
              border: themeStyles.card.border,
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🔗 Open File
          </a>
        </div>
      )}
    </div>
  );
}

