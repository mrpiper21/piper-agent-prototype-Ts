import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../../../context/ThemeContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, isLoading } = useAuthStore();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div style={{ ...styles.container, ...themeStyles.container }}>
      <div style={{ ...styles.card, ...themeStyles.card }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
         <h1 style={{ ...styles.title, color: themeStyles.text }}>Uranius Print Agent</h1>
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
          <button type="submit" disabled={isLoading} style={{ ...styles.button, ...themeStyles.primaryButton }}>
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
    // borderRadius: '8px',
    width: '90%',
    maxWidth: '450px',
    // boxSizing: 'border-box' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  themeButton: {
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '20px',
    transition: 'all 0.2s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  input: {
    padding: '10px',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  button: {
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  error: {
    fontSize: '14px',
    textAlign: 'center' as const,
  },
};

const lightStyles = {
  container: { backgroundColor: '#f5f7fa' },
  text: '#1a2d4f',
  accent: '#1e4d72',
  card: { backgroundColor: '#ffffff', border: '1px solid #cbd5e0' },
  button: { backgroundColor: '#f5f7fa', color: '#1a2d4f', border: '1px solid #cbd5e0' },
  input: { backgroundColor: '#ffffff', color: '#1a2d4f', border: '1px solid #cbd5e0' },
  primaryButton: { backgroundColor: '#1e4d72', color: '#ffffff' },
  error: '#ef4444',
};

const darkStyles = {
  container: { backgroundColor: '#1e293b' },
  text: '#e2e8f0',
  accent: '#60a5fa',
  card: { backgroundColor: '#0f172a', border: '1px solid #334155' },
  button: { backgroundColor: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
  input: { backgroundColor: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' },
  primaryButton: { backgroundColor: '#60a5fa', color: '#0f172a' },
  error: '#f87171',
};
