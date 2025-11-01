import { useEffect, useState } from 'react';
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
  const [isDownloading, setIsDownloading] = useState(false);

  // Download handler that works with cross-origin URLs
  const handleDownload = async () => {
    if (!fileUrl || isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Fetch the file as a blob
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        setIsDownloading(false);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsDownloading(false);
    }
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
      <div style={{
        background: themeStyles.container.background,
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '10px',
        textAlign: 'center',
        minHeight: '800px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
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
          disabled={!fileUrl || isDownloading}
          style={{
            padding: '10px 24px',
            background: themeStyles.primaryButton.background,
            color: themeStyles.primaryButton.color,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: isDownloading || !fileUrl ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            transition: 'transform 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isDownloading || !fileUrl ? 0.6 : 1,
          }}
          onMouseEnter={(e) => !isDownloading && fileUrl && (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isDownloading ? '⏳ Downloading...' : '⬇️ Download'}
        </button>
      </div>
    );
  }
  
  if (fileType === 'pdf' && fileUrl) {
    // Append URL parameters to the PDF to reduce controls but keep download
    // Note: Different browsers handle PDF viewer controls differently
    const pdfUrl = `${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`;
    
    return (
      <div 
        style={{
          background: themeStyles.container.background,
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          height: '800px',
          overflow: 'hidden',
          display: 'flex',
          position: 'relative',
          userSelect: 'none'
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
    const isDocx = fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc');
    const viewerUrl = isDocx 
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
      : fileUrl;
    
    return (
      <div 
        style={{
          background: themeStyles.container.background,
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}>
          <button
            onClick={handleDownload}
            disabled={!fileUrl || isDownloading}
            style={{
              padding: '8px 16px',
              background: themeStyles.primaryButton.background,
              color: themeStyles.primaryButton.color,
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: isDownloading || !fileUrl ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              transition: 'transform 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isDownloading || !fileUrl ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !isDownloading && fileUrl && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isDownloading ? '⏳ Downloading...' : '⬇️ Download'}
          </button>
        </div>
        <div style={{
          height: '750px',
          overflow: 'hidden',
          display: 'flex',
          position: 'relative',
          userSelect: 'none',
          borderRadius: '8px',
          border: themeStyles.card.border,
        }}>
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
    <div style={{ 
      padding: '60px 40px',
      textAlign: 'center',
      background: themeStyles.container.background,
      border: themeStyles.card.border,
      borderRadius: '12px',
      marginBottom: '24px'
    }}>
      <div style={{ 
        fontSize: '72px', 
        marginBottom: '16px',
        filter: 'opacity(0.6)'
      }}>
        {fileIcon}
      </div>
      <p style={{ color: themeStyles.text, fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
        {fileName}
      </p>
      <p style={{ color: themeStyles.textSecondary }}>
        {fileTypeLabel}
      </p>
      {fileUrl && (
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginTop: '16px',
        }}>
          <button
            onClick={handleDownload}
            disabled={!fileUrl || isDownloading}
            style={{
              padding: '10px 24px',
              background: themeStyles.primaryButton.background,
              color: themeStyles.primaryButton.color,
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: isDownloading || !fileUrl ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              transition: 'transform 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isDownloading || !fileUrl ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !isDownloading && fileUrl && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isDownloading ? '⏳ Downloading...' : '⬇️ Download'}
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
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🔗 Open File
          </a>
        </div>
      )}
    </div>
  );
}

