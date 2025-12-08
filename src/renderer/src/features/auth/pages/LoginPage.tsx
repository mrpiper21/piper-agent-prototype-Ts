import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { WhatsAppConnectionModal } from '../../../shared/components/WhatsAppConnectionModal';
import { electronAPI } from '../../../lib';
// import { AiOutlineMoon, AiOutlineSun } from 'react-icons/ai';
import printAgentLogo from '../../../assets/printAgentLogo.png';

// Access store without hook to avoid rules of hooks violation
const getAuthState = () => useAuthStore.getState();

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, isLoading } = useAuthStore();
  const { theme,/* toggleTheme */} = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [shouldShowWhatsAppPrompt, setShouldShowWhatsAppPrompt] = useState(false);

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });

      const { isAuthenticated, user } = getAuthState();

      console.log('Login result:', {
        isAuthenticated,
        hasLocation: !!user?.location,
        isTemporaryPassword: user?.isTemporaryPassword,
        user: user?.id,
      });

      // Priority 1: If isTemporaryPassword is true, user is a clerk - must change password
      if (user?.isTemporaryPassword === true) {
        navigate('/setup-password');
        return;
      }

      // Priority 2: If isTemporaryPassword is not present, user is an admin
      // Check if admin has location set
      if (!user?.location) {
        // Check if business info is already set
        if (user?.businessName && user?.businessPhone) {
          // Business info exists, go directly to location setup
          navigate('/setup-location');
        } else {
          // Business info missing, start with business info page
          navigate('/setup-business');
        }
        return;
      }

      // User is fully set up (admin with location) - check WhatsApp connection
      const whatsappStatus = await electronAPI.whatsapp.getStatus();
      if (!whatsappStatus.isAuthenticated) {
        // Show WhatsApp connection prompt
        setShouldShowWhatsAppPrompt(true);
        setShowWhatsAppModal(true);
      } else {
        // Already connected, navigate to dashboard
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleWhatsAppConnect = () => {
    setShowWhatsAppModal(false);
    setShouldShowWhatsAppPrompt(false);
    navigate('/');
  };

  const handleWhatsAppSkip = () => {
    setShowWhatsAppModal(false);
    setShouldShowWhatsAppPrompt(false);
    navigate('/');
  };

  return (
    <div style={{ ...styles.container, ...themeStyles.container }}>
      <div style={styles.contentWrapper}>
        {/* Logo Section - Separated and Prominent */}
        <div style={styles.logoContainer}>
            <img src={printAgentLogo} alt="Print Agent Logo" style={styles.logo} />
          </div>

        {/* Form Section - Separate Card */}
        <div style={{ ...styles.card, ...themeStyles.card }}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={{ color: themeStyles.text }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{ ...styles.input, ...themeStyles.input }}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={{ color: themeStyles.text }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ ...styles.input, ...themeStyles.input }}
              />
            </div>
            {error && <div style={{ ...styles.error, color: themeStyles.error }}>{error}</div>}
            <button
              type="submit"
              disabled={isLoading}
              style={{ ...styles.button, ...themeStyles.primaryButton }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>

      {/* WhatsApp Connection Modal */}
      {shouldShowWhatsAppPrompt && (
        <WhatsAppConnectionModal
          isOpen={showWhatsAppModal}
          onClose={handleWhatsAppSkip}
          onConnect={handleWhatsAppConnect}
          onSkip={handleWhatsAppSkip}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: '20px',
    overflow: 'hidden',
    boxSizing: 'border-box' as const,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 'var(--spacing-2xl, 32px)',
    width: '100%',
    maxWidth: '500px',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    // gap: 'var(--spacing-lg, 16px)',
    width: '100%',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // padding: 'var(--spacing-md, 12px)',
  },
  logo: {
    maxWidth: '280px',
    width: '100%',
    height: 'auto',
    objectFit: 'contain' as const,
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
  },
  title: {
    fontSize: 'var(--font-size-xl, 20px)',
    fontWeight: '700',
    textAlign: 'center' as const,
    letterSpacing: '0.5px',
  },
  card: {
    padding: 'var(--spacing-xl, 24px)',
    borderRadius: 'var(--border-radius-lg, 8px)',
    width: '100%',
    maxWidth: '450px',
  },
  themeButton: {
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '20px',
    transition: 'all 0.2s ease',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  input: {
    padding: 'var(--spacing-md, 12px)',
    borderRadius: 'var(--border-radius-md, 6px)',
    fontSize: 'var(--font-size, 14px)',
    boxSizing: 'border-box' as const,
    width: '100%',
    transition: 'all 0.2s ease',
  },
  button: {
    padding: 'var(--spacing-md, 12px)',
    border: 'none',
    borderRadius: 'var(--border-radius-md, 6px)',
    fontSize: 'var(--font-size, 14px)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  error: {
    fontSize: 'var(--font-size, 14px)',
    textAlign: 'center' as const,
    padding: 'var(--spacing-sm, 8px)',
    borderRadius: 'var(--border-radius-md, 6px)',
  },
};

const lightStyles = {
  container: {
    backgroundColor: '#ffffff',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  },
  text: '#000000',
  accent: '#fbbf24',
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e1e1e1',
  },
  button: {
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '1px solid #e1e1e1',
  },
  input: {
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '1px solid #e1e1e1',
  },
  primaryButton: {
    backgroundColor: '#fbbf24',
    color: '#000000',
  },
  error: '#ef4444',
};

const darkStyles = {
  container: { 
    backgroundColor: '#1a1a1a',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #262626 100%)',
  },
  text: '#f5f5f5',
  accent: '#fbbf24',
  card: { 
    backgroundColor: '#262626', 
    border: '1px solid #404040',
  },
  button: { 
    backgroundColor: '#333333', 
    color: '#f5f5f5', 
    border: '1px solid #404040',
  },
  input: { 
    backgroundColor: '#1a1a1a', 
    color: '#f5f5f5', 
    border: '1px solid #404040',
  },
  primaryButton: { 
    backgroundColor: '#fbbf24', 
    color: '#000000',
  },
  error: '#f87171',
};
