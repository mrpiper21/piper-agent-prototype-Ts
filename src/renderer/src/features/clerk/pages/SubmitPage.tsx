import React, { useState, useMemo, useCallback, useRef } from 'react';
import { electronAPI } from '../../../lib';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';
import {
  AiOutlineFileAdd,
  AiOutlinePrinter,
  AiOutlineClose,
  AiOutlineCheckCircle,
  AiOutlineUpload,
  AiOutlineReload,
} from 'react-icons/ai';
import { useQueryClient } from '@tanstack/react-query';

interface FileInfo {
  name: string;
  path: string;
  size?: number;
  type?: string;
}

export default function SubmitPage() {
  const { theme } = useTheme();
  const themeStyles = useMemo(() => {
    return theme === 'dark' ? darkStyles : lightStyles;
  }, [theme]);
  const queryClient = useQueryClient();
  
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [printer, setPrinter] = useState<string>('');
  const [printers, setPrinters] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState<boolean>(false);
  const [copies, setCopies] = useState<number>(1);
  const [colorMode, setColorMode] = useState<'color' | 'grayscale' | 'black-white'>('color');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [description, setDescription] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    setIsLoadingPrinters(true);
    try {
      const printersData = await electronAPI.agent.getPrinters();
      setPrinters(printersData);
      if (printersData.length > 0 && !printer) {
        setPrinter(printersData[0].printerName);
      }
    } catch (error) {
      console.error('Failed to load printers:', error);
      setSubmitError('Failed to load printers. Please try again.');
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const typeMap: { [key: string]: string } = {
      pdf: 'PDF Document',
      doc: 'Word Document',
      docx: 'Word Document',
      txt: 'Text File',
      jpg: 'Image',
      jpeg: 'Image',
      png: 'Image',
      gif: 'Image',
      bmp: 'Image',
    };
    return typeMap[ext || ''] || 'File';
  };

  const validateFile = (filePath: string): { valid: boolean; error?: string } => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'txt', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'rtf', 'html'];
    
    if (!ext || !allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File type .${ext} is not supported. Allowed: ${allowedExtensions.join(', ')}`,
      };
    }
    
    return { valid: true };
  };

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.rtf,.html';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const filePath = file.path || file.name;
        const validation = validateFile(filePath);
        
        if (!validation.valid) {
          setSubmitError(validation.error || 'Invalid file');
          return;
        }
        
        setSelectedFile({
          name: file.name,
          path: filePath,
          size: file.size,
          type: getFileType(file.name),
        });
        setSubmitError(null);
      }
    };
    input.click();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const filePath = file.path || file.name;
      const validation = validateFile(filePath);
      
      if (!validation.valid) {
        setSubmitError(validation.error || 'Invalid file');
        return;
      }
      
      setSelectedFile({
        name: file.name,
        path: filePath,
        size: file.size,
        type: getFileType(file.name),
      });
      setSubmitError(null);
    }
  }, []);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setSubmitError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !printer) {
      setSubmitError(!selectedFile ? 'Please select a file' : 'Please select a printer');
      return;
    }

    if (copies < 1 || copies > 100) {
      setSubmitError('Copies must be between 1 and 100');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const uploadResult = await electronAPI.files.upload(selectedFile.path);

      const jobData = {
        printJobId: `job-${Date.now()}`,
        fileName: uploadResult.fileName || selectedFile.name,
        filePath: selectedFile.path,
        fileType: selectedFile.path.split('.').pop() || 'pdf',
        printerName: printer,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        description: description.trim() || undefined,
        metadata: {
          copies,
          colorMode,
          orientation,
        },
      };

      const createdJob = await electronAPI.jobs.create(jobData);

      const agents = await electronAPI.agents.getAll();
      if (agents.length > 0) {
        await electronAPI.jobs.submitToPrinter(
          createdJob.id || createdJob._id,
          agents[0].id || agents[0]._id
        );
      }

      // Reset form
      setSelectedFile(null);
      setCopies(1);
      setColorMode('color');
      setOrientation('portrait');
      setDescription('');
      setSubmitSuccess(true);
      setSubmitError(null);

      // Refresh jobs list
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to submit print job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSubmitError(`Failed to submit print job: ${errorMessage}`);
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPrinter = printers.find(p => p.printerName === printer);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100%',
        padding: '20px',
      }}
    >
      <div
        style={{
          ...sharedStyles.card,
          ...themeStyles.card,
          maxWidth: '700px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              color: '#fbbf24',
              margin: 0,
              fontWeight: '700',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AiOutlineFileAdd style={{ fontSize: '28px' }} />
            Submit New Print Job
          </h2>
          <button
            onClick={loadPrinters}
            disabled={isLoadingPrinters}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.button,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              opacity: isLoadingPrinters ? 0.6 : 1,
            }}
            title="Refresh printer list"
          >
            <AiOutlineReload
              style={{
                fontSize: '16px',
                animation: isLoadingPrinters ? 'spin 1s linear infinite' : 'none',
              }}
            />
            Refresh
          </button>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: `1px solid ${themeStyles.success}`,
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: themeStyles.success,
            }}
          >
            <AiOutlineCheckCircle style={{ fontSize: '20px', flexShrink: 0 }} />
            <span style={{ fontWeight: '600' }}>Print job submitted successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${themeStyles.error}`,
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: themeStyles.error,
            }}
          >
            <AiOutlineClose style={{ fontSize: '20px', flexShrink: 0 }} />
            <span style={{ fontWeight: '600', flex: 1 }}>{submitError}</span>
            <button
              onClick={() => setSubmitError(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: themeStyles.error,
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <AiOutlineClose style={{ fontSize: '16px' }} />
            </button>
          </div>
        )}

        <div style={sharedStyles.form}>
          {/* File Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                color: themeStyles.text,
                display: 'block',
                marginBottom: '12px',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Select File <span style={{ color: themeStyles.error }}>*</span>
            </label>
            
            {selectedFile ? (
              <div
                style={{
                  ...themeStyles.card,
                  padding: '16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: `2px solid ${themeStyles.accent}`,
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: themeStyles.accent,
                    flexShrink: 0,
                    fontSize: '24px',
                  }}
                >
                  📄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: themeStyles.text,
                      fontWeight: '600',
                      margin: 0,
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '12px',
                      color: themeStyles.textSecondary,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{selectedFile.type}</span>
                    {selectedFile.size && <span>• {formatFileSize(selectedFile.size)}</span>}
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: themeStyles.textSecondary,
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = themeStyles.error;
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = themeStyles.textSecondary;
                  }}
                  title="Remove file"
                >
                  <AiOutlineClose style={{ fontSize: '18px' }} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileSelect}
                style={{
                  border: `2px dashed ${isDragging ? themeStyles.accent : themeStyles.sidebar.borderColor}`,
                  borderRadius: '12px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragging
                    ? theme === 'dark'
                      ? 'rgba(251, 191, 36, 0.1)'
                      : 'rgba(251, 191, 36, 0.05)'
                    : themeStyles.card.background,
                  transition: 'all 0.2s ease',
                }}
              >
                <AiOutlineUpload
                  style={{
                    fontSize: '48px',
                    color: themeStyles.accent,
                    marginBottom: '12px',
                  }}
                />
                <p style={{ color: themeStyles.text, fontWeight: '600', marginBottom: '8px' }}>
                  {isDragging ? 'Drop file here' : 'Click to select or drag and drop'}
                </p>
                <p style={{ color: themeStyles.textSecondary, fontSize: '12px', margin: 0 }}>
                  PDF, DOC, DOCX, TXT, JPG, PNG, GIF, BMP, RTF, HTML
                </p>
              </div>
            )}
          </div>

          {/* Printer Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                color: themeStyles.text,
                display: 'block',
                marginBottom: '12px',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Select Printer <span style={{ color: themeStyles.error }}>*</span>
            </label>
            {isLoadingPrinters ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: themeStyles.textSecondary,
                }}
              >
                Loading printers...
              </div>
            ) : printers.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: themeStyles.textSecondary,
                  border: themeStyles.card.border,
                  borderRadius: '8px',
                  background: themeStyles.card.background,
                }}
              >
                <p style={{ margin: 0, marginBottom: '8px' }}>No printers available</p>
                <button
                  onClick={loadPrinters}
                  style={{
                    ...sharedStyles.actionButton,
                    ...themeStyles.primaryButton,
                    fontSize: '12px',
                    padding: '6px 12px',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <select
                value={printer}
                onChange={(e) => setPrinter(e.target.value)}
                style={{
                  ...sharedStyles.input,
                  ...themeStyles.input,
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select a printer</option>
                {printers.map((p, i) => (
                  <option key={i} value={p.printerName}>
                    {p.displayName || p.printerName}
                    {p.status ? ` (${p.status})` : ''}
                  </option>
                ))}
              </select>
            )}
            {selectedPrinter && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: themeStyles.card.background,
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: themeStyles.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AiOutlinePrinter style={{ fontSize: '14px' }} />
                <span>
                  Status: <strong>{selectedPrinter.status || 'Unknown'}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Copies */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                color: themeStyles.text,
                display: 'block',
                marginBottom: '12px',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Number of Copies
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setCopies(Math.max(1, copies - 1))}
                disabled={copies <= 1}
                style={{
                  ...sharedStyles.actionButton,
                  ...themeStyles.button,
                  padding: '10px 16px',
                  minWidth: '44px',
                  opacity: copies <= 1 ? 0.5 : 1,
                  cursor: copies <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                −
              </button>
              <input
                type="number"
                value={copies}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setCopies(Math.max(1, Math.min(100, value)));
                }}
                min={1}
                max={100}
                style={{
                  ...sharedStyles.input,
                  ...themeStyles.input,
                  flex: 1,
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              />
              <button
                onClick={() => setCopies(Math.min(100, copies + 1))}
                disabled={copies >= 100}
                style={{
                  ...sharedStyles.actionButton,
                  ...themeStyles.button,
                  padding: '10px 16px',
                  minWidth: '44px',
                  opacity: copies >= 100 ? 0.5 : 1,
                  cursor: copies >= 100 ? 'not-allowed' : 'pointer',
                }}
              >
                +
              </button>
            </div>
            <p
              style={{
                color: themeStyles.textSecondary,
                fontSize: '12px',
                margin: '8px 0 0 0',
              }}
            >
              Between 1 and 100 copies
            </p>
          </div>

          {/* Print Options Grid */}
          <div
            style={{
              marginBottom: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <label
                style={{
                  color: themeStyles.text,
                  display: 'block',
                  marginBottom: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                Color Mode
              </label>
              <select
                value={colorMode}
                onChange={(e) => setColorMode(e.target.value as any)}
                style={{
                  ...sharedStyles.input,
                  ...themeStyles.input,
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="color">Color</option>
                <option value="grayscale">Grayscale</option>
                <option value="black-white">Black & White</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  color: themeStyles.text,
                  display: 'block',
                  marginBottom: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                Orientation
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                style={{
                  ...sharedStyles.input,
                  ...themeStyles.input,
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          {/* Description/Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                color: themeStyles.text,
                display: 'block',
                marginBottom: '12px',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Description / Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any notes or description for this print job..."
              rows={3}
              maxLength={500}
              style={{
                ...sharedStyles.input,
                ...themeStyles.input,
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit',
                minHeight: '80px',
              }}
            />
            <p
              style={{
                color: themeStyles.textSecondary,
                fontSize: '12px',
                margin: '8px 0 0 0',
                textAlign: 'right',
              }}
            >
              {description.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || !printer || isSubmitting || isLoadingPrinters}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.primaryButton,
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: !selectedFile || !printer || isSubmitting || isLoadingPrinters ? 0.6 : 1,
              cursor: !selectedFile || !printer || isSubmitting || isLoadingPrinters ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: `2px solid ${theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}`,
                    borderTop: `2px solid ${themeStyles.primaryButton.color}`,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Submitting...
              </>
            ) : (
              <>
                <AiOutlineFileAdd style={{ fontSize: '18px' }} />
                Submit Print Job
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
