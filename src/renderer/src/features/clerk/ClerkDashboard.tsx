import { useAuthStore } from '../auth/store/authStore';
import { useTheme } from '../../context/ThemeContext';
import React, { useState } from 'react';
import { electronAPI } from '../../lib';
import {
  AiOutlinePrinter,
  AiOutlineFileAdd,
  AiOutlineReload,
  AiOutlineMoon,
  AiOutlineSun,
} from 'react-icons/ai';
import { HiOutlineLogout } from 'react-icons/hi';

export default function ClerkDashboard() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'jobs' | 'print' | 'status'>('jobs');

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebar, ...themeStyles.sidebar }}>
        <div style={styles.sidebarHeader}>
          <h2
            style={{
              color: themeStyles.text,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AiOutlinePrinter /> Print Station
          </h2>
        </div>
        <nav style={styles.nav}>
          <button
            onClick={() => setActiveTab('jobs')}
            style={{
              ...styles.navItem,
              ...(activeTab === 'jobs' ? themeStyles.activeNav : {}),
              color: activeTab === 'jobs' ? '#ffffff' : themeStyles.text,
            }}
          >
            <AiOutlineFileAdd style={{ marginRight: '8px' }} />
            Print Jobs
          </button>
          <button
            onClick={() => setActiveTab('print')}
            style={{
              ...styles.navItem,
              ...(activeTab === 'print' ? themeStyles.activeNav : {}),
              color: activeTab === 'print' ? '#ffffff' : themeStyles.text,
            }}
          >
            <AiOutlineFileAdd style={{ marginRight: '8px' }} />
            Submit Print
          </button>
          <button
            onClick={() => setActiveTab('status')}
            style={{
              ...styles.navItem,
              ...(activeTab === 'status' ? themeStyles.activeNav : {}),
              color: activeTab === 'status' ? '#ffffff' : themeStyles.text,
            }}
          >
            <AiOutlinePrinter style={{ marginRight: '8px' }} />
            Printer Status
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.userInfo}>
            <button onClick={toggleTheme} style={{ ...styles.iconButton, ...themeStyles.button }}>
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
    const interval = setInterval(loadJobs, 3000);
    return () => clearInterval(interval);
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
    <div style={{ ...styles.card, ...themeStyles.card }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: themeStyles.text }}>Recent Print Jobs</h2>
        <button
          onClick={loadJobs}
          disabled={isLoading}
          style={{ ...styles.actionButton, ...themeStyles.primaryButton }}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <div style={styles.jobsList}>
        {jobs.length === 0 ? (
          <p style={{ color: themeStyles.textSecondary }}>No jobs found</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id || job._id || job.printJobId}
              style={{ ...styles.jobItem, ...themeStyles.card }}
            >
              <div>
                <p style={{ color: themeStyles.text, fontWeight: 'bold' }}>{job.fileName}</p>
                <p style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                  {job.printerName} •{' '}
                  {new Date(job.submittedAt || job.submittedAt).toLocaleString()}
                </p>
              </div>
              <span
                style={{
                  color: getStatusColor(job.status),
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '12px',
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
    <div style={{ flexDirection: 'row', display: 'flex', gap: 4 }}>
      <div style={{ ...styles.card, ...themeStyles.card }}>
        <h2 style={{ color: themeStyles.text }}>Submit New Print Job</h2>
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
              gridTemplateColumns: '1fr 1fr',
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
      <div style={{ width: '50%', backgroundColor: 'red' }}>
        <p>Hello</p>
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
      <div style={{ ...styles.card, ...themeStyles.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: themeStyles.text }}>Available Printers</h2>
          <button
            onClick={loadPrinters}
            disabled={isLoading}
            style={{ ...styles.actionButton, ...themeStyles.primaryButton }}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div style={styles.printersList}>
          {printers.length === 0 ? (
            <p style={{ color: themeStyles.textSecondary }}>No printers available</p>
          ) : (
            printers.map((p, i) => (
              <div key={i} style={{ ...styles.printerCard, ...themeStyles.card }}>
                <div>
                  <p style={{ color: themeStyles.text, fontWeight: 'bold' }}>
                    {p.displayName || p.printerName}
                  </p>
                  <p style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                    {p.location || 'No location'} • {p.status}
                  </p>
                </div>
                <span
                  style={{
                    color: getStatusColor(p.status),
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '12px',
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
  },
  sidebar: {
    width: '250px',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRight: '1px solid',
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
    padding: '12px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: '14px',
    background: 'transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'end',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid',
  },
  userInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  iconButton: {
    padding: '8px 12px',
    borderRadius: '4px',
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
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: '20px',
    overflow: 'auto',
  },
  card: {
    padding: '24px',
    borderRadius: '8px',
    width: '100%',
  },
  jobsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginTop: '20px',
  },
  jobItem: {
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  printersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginTop: '20px',
  },
  printerCard: {
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  form: {
    marginTop: '20px',
  },
  input: {
    borderRadius: '4px',
    fontSize: '14px',
  },
  fileButton: {
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  actionButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
};

const lightStyles = {
  container: { background: '#f5f7fa' },
  text: '#1a2d4f',
  textSecondary: '#4a5a7a',
  accent: '#1e4d72',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  sidebar: { background: '#ffffff', borderColor: '#cbd5e0' },
  card: { background: '#ffffff', border: '1px solid #cbd5e0' },
  button: { background: '#ffffff', color: '#1a2d4f', border: '1px solid #cbd5e0' },
  input: { background: '#ffffff', color: '#1a2d4f', border: '1px solid #cbd5e0' },
  primaryButton: { background: '#1e4d72', color: '#ffffff' },
  dangerButton: { background: '#ef4444', color: '#ffffff' },
  activeNav: { background: '#1e4d72' },
};

const darkStyles = {
  container: { background: '#1e293b' },
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  accent: '#60a5fa',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  sidebar: { background: '#0f172a', borderColor: '#334155' },
  card: { background: '#0f172a', border: '1px solid #334155' },
  button: { background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' },
  input: { background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' },
  primaryButton: { background: '#60a5fa', color: '#0f172a' },
  dangerButton: { background: '#f87171', color: '#0f172a' },
  activeNav: { background: '#60a5fa' },
};
