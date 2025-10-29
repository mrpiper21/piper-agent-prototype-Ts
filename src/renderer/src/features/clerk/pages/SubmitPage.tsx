import React, { useState } from 'react';
import { electronAPI } from '../../../lib';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';

export default function SubmitPage() {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [printer, setPrinter] = useState<string>('');
  const [printers, setPrinters] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copies, setCopies] = useState<number>(1);
  const [colorMode, setColorMode] = useState<'color' | 'grayscale' | 'black-white'>('color');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  React.useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      const printersData = await electronAPI.agent.getPrinters();
      setPrinters(printersData);
      if (printersData.length > 0 && !printer) {
        setPrinter(printersData[0].printerName);
      }
    } catch (error) {
      console.error('Failed to load printers:', error);
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedFile(file.path || file.name);
      }
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!selectedFile || !printer) {
      alert('Please select a file and printer');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadResult = await electronAPI.files.upload(selectedFile);

      const jobData = {
        printJobId: `job-${Date.now()}`,
        fileName: uploadResult.fileName,
        filePath: selectedFile,
        fileType: selectedFile.split('.').pop() || 'pdf',
        printerName: printer,
        status: 'pending',
        submittedAt: new Date().toISOString(),
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

      setSelectedFile('');
      setCopies(1);
      setColorMode('color');
      setOrientation('portrait');

      alert('Print job submitted successfully!');
    } catch (error) {
      console.error('Failed to submit print job:', error);
      alert('Failed to submit print job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ ...sharedStyles.card, ...themeStyles.card }}>
      <h2 style={{ color: '#fbbf24', marginBottom: '24px', fontWeight: '700' }}>Submit New Print Job</h2>
      <div style={sharedStyles.form}>
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              color: themeStyles.text,
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
            }}
          >
            Select File
          </label>
          <button
            onClick={handleFileSelect}
            style={{
              ...sharedStyles.fileButton,
              ...themeStyles.primaryButton,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            📄 {selectedFile ? selectedFile.split('/').pop() : 'Choose File'}
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              color: themeStyles.text,
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
            }}
          >
            Select Printer
          </label>
          <select
            value={printer}
            onChange={(e) => setPrinter(e.target.value)}
            style={{
              ...sharedStyles.input,
              ...themeStyles.input,
              width: '100%',
              padding: '10px',
            }}
          >
            <option value="">Select a printer</option>
            {printers.map((p, i) => (
              <option key={i} value={p.printerName}>
                {p.displayName || p.printerName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              color: themeStyles.text,
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
            }}
          >
            Copies
          </label>
          <input
            type="number"
            value={copies}
            onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
            min={1}
            max={100}
            style={{
              ...sharedStyles.input,
              ...themeStyles.input,
              width: '100%',
              padding: '10px',
            }}
          />
        </div>

        <div
          style={{
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
          }}
        >
          <div>
            <label
              style={{
                color: themeStyles.text,
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
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
                padding: '10px',
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
                marginBottom: '8px',
                fontWeight: 'bold',
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
                padding: '10px',
              }}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedFile || !printer || isSubmitting}
          style={{
            ...sharedStyles.actionButton,
            ...themeStyles.primaryButton,
            width: '100%',
            padding: '12px',
            opacity: !selectedFile || !printer || isSubmitting ? 0.5 : 1,
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Print Job'}
        </button>
      </div>
    </div>
  );
}

