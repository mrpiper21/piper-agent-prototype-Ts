import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { AiOutlineMoon, AiOutlineSun } from 'react-icons/ai';
import printAgentLogo from '../../../assets/printAgentLogo.png';

// Access store without hook to avoid rules of hooks violation
const getAuthState = () => useAuthStore.getState();

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, isLoading } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
        navigate('/setup-location');
        return;
      }

      // User is fully set up (admin with location) - navigate to dashboard
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div style={{ ...styles.container, ...themeStyles.container }}>
      <div style={{ ...styles.card, ...themeStyles.card }}>
        <div style={styles.logoContainer}>
          <img src={printAgentLogo} alt="Print Agent Logo" style={styles.logo} />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h1 style={{ ...styles.title, color: themeStyles.text }}>Uranius Print Agent</h1>
          <button
            type="button"
            onClick={toggleTheme}
            style={{ ...styles.themeButton, ...themeStyles.button }}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <AiOutlineMoon /> : <AiOutlineSun />}
          </button>
        </div>
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
  card: {
    padding: '30px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '450px',
    boxSizing: 'border-box' as const,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
  },
  logo: {
    maxWidth: '200px',
    height: 'auto',
    objectFit: 'contain' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
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
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    width: '100%',
    transition: 'all 0.2s ease',
  },
  button: {
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  error: {
    fontSize: '14px',
    textAlign: 'center' as const,
    padding: '10px',
    borderRadius: '6px',
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
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
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
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
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
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
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
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
  },
  error: '#f87171',
};
