import { useAuthStore } from '../auth/store/authStore';
import { useTheme } from '../../context/ThemeContext';
import React, { useState } from 'react';
import { electronAPI } from '../../lib';
import {
  AiOutlineMoon,
  AiOutlineSun,
} from 'react-icons/ai';
import { HiOutlineLogout } from 'react-icons/hi';

export default function ClerkDashboard() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'jobs' | 'print' | 'status'>('jobs' as const);

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div style={styles.wrapper}>
      <div style={styles.main}>
        {/* Header */}
        <div style={{ ...styles.header, ...themeStyles.header }}>
          <div style={styles.userInfo}>
            <button onClick={toggleTheme} style={{ ...styles.iconButton, ...themeStyles.iconButton }}>
              {theme === 'light' ? <AiOutlineMoon /> : <AiOutlineSun />}
            </button>
            <span style={{ color: themeStyles.text }}>{user?.name || 'Clerk'}</span>
            <button
              onClick={logout}
              style={{ ...styles.logoutButton, ...themeStyles.dangerButton }}
            >
              <HiOutlineLogout style={{ marginRight: '4px' }} />
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === 'jobs' && <JobsTab themeStyles={themeStyles} />}
          {activeTab === 'print' && <SubmitTab themeStyles={themeStyles} />}
          {activeTab === 'status' && <StatusTab themeStyles={themeStyles} />}
        </div>
      </div>
    </div>
  );
}

function JobsTab({ themeStyles }: { themeStyles: any }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  React.useEffect(() => {
    loadJobs();
    // const interval = setInterval(loadJobs, 3000);
    // return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const jobsData = await electronAPI.jobs.getAll();
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return themeStyles.success;
    if (status === 'printing' || status === 'processing') return themeStyles.warning;
    if (status === 'failed') return themeStyles.error;
    return themeStyles.textSecondary;
  };

  return (
    <div style={{ ...styles.card, ...themeStyles.card, padding: 'var(--spacing-md, 12px)', boxShadow: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md, 12px)' }}>
        <h2 style={{ color: '#fbbf24', fontWeight: '600', fontSize: 'var(--font-size-large, 16px)' }}>Recent Print Jobs</h2>
        <button
          onClick={loadJobs}
          disabled={isLoading}
          style={{ 
            padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
            borderRadius: 'var(--border-radius-sm, 4px)',
            border: themeStyles.button.border,
            background: themeStyles.button.background,
            color: themeStyles.button.color,
            fontSize: 'var(--font-size-small, 12px)',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <div style={{ ...styles.jobsList, gap: 'var(--spacing-xs, 4px)' }}>
        {jobs.length === 0 ? (
          <p style={{ color: themeStyles.textSecondary }}>No jobs found</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id || job._id || job.printJobId}
              style={{ 
                ...styles.jobItem, 
                ...themeStyles.card,
                padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
                borderRadius: 0,
                border: 'none',
                borderBottom: themeStyles.card.border,
                boxShadow: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ color: themeStyles.text, fontWeight: '500', fontSize: 'var(--font-size, 14px)', margin: 0, marginBottom: 'var(--spacing-xs, 4px)' }}>{job.fileName}</p>
                <p style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size-small, 12px)', margin: 0 }}>
                  {job.printerName} •{' '}
                  {new Date(job.submittedAt || job.submittedAt).toLocaleString()}
                </p>
              </div>
              <span
                style={{
                  color: getStatusColor(job.status),
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  fontSize: 'var(--font-size-small, 12px)',
                  padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
                  borderRadius: 'var(--border-radius-sm, 4px)',
                  background: 'rgba(148, 163, 184, 0.1)',
                }}
              >
                {job.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SubmitTab({ themeStyles }: { themeStyles: any }) {
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
    // Use Electron's file dialog
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
      // First, upload the file
      const uploadResult = await electronAPI.files.upload(selectedFile);

      // Create the print job
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

      // Submit to agent for printing
      const agents = await electronAPI.agents.getAll();
      if (agents.length > 0) {
        await electronAPI.jobs.submitToPrinter(
          createdJob.id || createdJob._id,
          agents[0].id || agents[0]._id
        );
      }

      // Reset form
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
    <div style={{ ...styles.card, ...themeStyles.card }}>
        <h2 style={{ color: '#fbbf24', marginBottom: 'var(--spacing-md, 12px)', fontWeight: '600', fontSize: 'var(--font-size-large, 16px)' }}>Submit New Print Job</h2>
        <div style={styles.form}>
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
                ...styles.fileButton,
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
                ...styles.input,
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
                ...styles.input,
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
                  ...styles.input,
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
                  ...styles.input,
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
              ...styles.actionButton,
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

function StatusTab({ themeStyles }: { themeStyles: any }) {
  const [printers, setPrinters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  React.useEffect(() => {
    loadPrinters();
    const interval = setInterval(loadPrinters, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadPrinters = async () => {
    try {
      setIsLoading(true);
      const printersData = await electronAPI.agent.getPrinters();
      setPrinters(printersData);
    } catch (error) {
      console.error('Failed to load printers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'online') return themeStyles.success;
    if (status === 'busy') return themeStyles.warning;
    return themeStyles.error;
  };

  return (
      <div>
      <div style={{ ...styles.card, ...themeStyles.card, padding: 'var(--spacing-md, 12px)', boxShadow: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md, 12px)' }}>
          <h2 style={{ color: '#fbbf24', fontWeight: '600', fontSize: 'var(--font-size-large, 16px)' }}>Available Printers</h2>
          <button
            onClick={loadPrinters}
            disabled={isLoading}
            style={{ 
              padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
              borderRadius: 'var(--border-radius-sm, 4px)',
              border: themeStyles.button.border,
              background: themeStyles.button.background,
              color: themeStyles.button.color,
              fontSize: 'var(--font-size-small, 12px)',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div style={{ ...styles.printersList, gap: 'var(--spacing-xs, 4px)' }}>
          {printers.length === 0 ? (
            <p style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size-small, 12px)' }}>No printers available</p>
          ) : (
            printers.map((p, i) => (
              <div key={i} style={{ 
                ...styles.printerCard, 
                ...themeStyles.card,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: themeStyles.text, fontWeight: '500', fontSize: 'var(--font-size, 14px)', margin: 0, marginBottom: 'var(--spacing-xs, 4px)' }}>
                    {p.displayName || p.printerName}
                  </p>
                  <p style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size-small, 12px)', margin: 0 }}>
                    {p.location || 'No location'} • {p.status}
                  </p>
                </div>
                <span
                  style={{
                    color: getStatusColor(p.status),
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    fontSize: 'var(--font-size-small, 12px)',
                    padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
                    borderRadius: 'var(--border-radius-sm, 4px)',
                    background: 'rgba(148, 163, 184, 0.1)',
                  }}
                >
                  {p.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    overflowX: 'hidden' as const,
    width: '100vw',
  },
  sidebar: {
    width: '250px',
    minWidth: '200px',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRight: '1px solid',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '10px',
    gap: '5px',
  },
  navItem: {
    padding: '12px 10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: '14px',
    background: 'transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    fontWeight: '500',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    overflowX: 'hidden' as const,
    minWidth: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'end',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid',
    borderColor: 'inherit',
  },
  userInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  iconButton: {
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '20px',
    transition: 'all 0.2s ease',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: '20px',
    overflow: 'auto',
    overflowX: 'hidden' as const,
  },
  card: {
    padding: 'var(--spacing-md, 12px)',
    borderRadius: 0,
    width: '100%',
    boxShadow: 'none',
  },
  jobsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--spacing-xs, 4px)',
    marginTop: 'var(--spacing-sm, 8px)',
  },
  jobItem: {
    padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
    borderRadius: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background 0.15s ease',
    border: 'none',
    borderBottom: '1px solid',
    boxShadow: 'none',
  },
  printersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--spacing-xs, 4px)',
    marginTop: 'var(--spacing-sm, 8px)',
  },
  printerCard: {
    padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
    borderRadius: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background 0.15s ease',
    border: 'none',
    borderBottom: '1px solid',
    boxShadow: 'none',
  },
  form: {
    marginTop: 'var(--spacing-md, 12px)',
  },
  input: {
    borderRadius: 'var(--border-radius-sm, 4px)',
    fontSize: 'var(--font-size, 14px)',
  },
  fileButton: {
    padding: 'var(--spacing-sm, 8px)',
    border: 'none',
    borderRadius: 'var(--border-radius-sm, 4px)',
    cursor: 'pointer',
    fontSize: 'var(--font-size, 14px)',
    fontWeight: '500',
  },
  actionButton: {
    padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
    border: 'none',
    borderRadius: 'var(--border-radius-sm, 4px)',
    cursor: 'pointer',
    fontSize: 'var(--font-size, 14px)',
    transition: 'all 0.2s ease',
    fontWeight: '500',
  },
};

const lightStyles = {
  container: { background: '#ffffff' },
  text: '#000000',
  textSecondary: '#4a4a4a',
  accent: '#fbbf24',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  sidebar: { background: '#f8f9fa', borderColor: '#e1e1e1' },
  card: { background: '#ffffff', border: '1px solid #e1e1e1', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' },
  button: { background: '#ffffff', color: '#000000', border: '1px solid #e1e1e1' },
  iconButton: { background: '#ffffff', color: '#000000', border: '1px solid #e1e1e1' },
  header: { background: '#ffffff', borderColor: '#e1e1e1' },
  input: { background: '#ffffff', color: '#000000', border: '1px solid #e1e1e1' },
  primaryButton: { background: '#fbbf24', color: '#000000' },
  dangerButton: { background: '#ef4444', color: '#ffffff' },
  activeNav: { background: '#fbbf24' },
};

const darkStyles = {
  container: { background: '#1a1a1a' },
  text: '#f5f5f5',
  textSecondary: '#d4d4d4',
  accent: '#fbbf24',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  sidebar: { background: '#262626', borderColor: '#404040' },
  card: { background: '#262626', border: '1px solid #404040', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' },
  button: { background: '#333333', color: '#f5f5f5', border: '1px solid #404040' },
  iconButton: { background: '#333333', color: '#f5f5f5', border: '1px solid #404040' },
  header: { background: '#1a1a1a', borderColor: '#404040' },
  input: { background: '#333333', color: '#f5f5f5', border: '1px solid #404040' },
  primaryButton: { background: '#fbbf24', color: '#000000' },
  dangerButton: { background: '#ef4444', color: '#ffffff' },
  activeNav: { background: '#fbbf24' },
};
