import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { electronAPI } from '../../../lib';
import { AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

export default function SetupPasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  // Redirect if user doesn't exist or doesn't need password setup
  // If isTemporaryPassword is true, user is a clerk and must change password
  if (!user || user.isTemporaryPassword !== true) {
    navigate('/login');
    return null;
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Call the API to change the clerk's password
      const updatedUser = await electronAPI.adminManagement.changeClerkPassword(
        user.id,
        newPassword
      );

      // Update the user in the auth store
      useAuthStore.setState({
        user: {
          ...updatedUser,
          isTemporaryPassword: false,
        },
        isAuthenticated: true, // Now authenticate the user
      });

      // Navigate based on whether user has location
      if (updatedUser.location) {
        navigate('/');
      } else {
        navigate('/setup-location');
      }
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setError(err?.message || 'Failed to change password. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ ...styles.container, ...themeStyles.container }}>
      <div style={{ ...styles.card, ...themeStyles.card }}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <AiOutlineLock size={32} style={{ color: themeStyles.accent }} />
          </div>
          <h1 style={{ ...styles.title, color: themeStyles.text }}>
            Set Your Password
          </h1>
          <p style={{ ...styles.subtitle, color: themeStyles.textSecondary }}>
            Please create a new password to secure your account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={{ color: themeStyles.text }}>New Password</label>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                style={{ ...styles.input, ...styles.passwordInput, ...themeStyles.input }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible size={20} style={{ color: themeStyles.textSecondary }} />
                ) : (
                  <AiOutlineEye size={20} style={{ color: themeStyles.textSecondary }} />
                )}
              </button>
            </div>
            <div style={styles.passwordHint}>
              <p style={{ color: themeStyles.textSecondary, fontSize: '12px', margin: 0 }}>
                Password must be at least 8 characters and include uppercase, lowercase, and numbers
              </p>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={{ color: themeStyles.text }}>Confirm Password</label>
            <div style={styles.passwordInputContainer}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                style={{ ...styles.input, ...styles.passwordInput, ...themeStyles.input }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <AiOutlineEyeInvisible size={20} style={{ color: themeStyles.textSecondary }} />
                ) : (
                  <AiOutlineEye size={20} style={{ color: themeStyles.textSecondary }} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ ...styles.error, color: themeStyles.error }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !newPassword || !confirmPassword}
            style={{
              ...styles.button,
              ...themeStyles.primaryButton,
              opacity: isLoading || !newPassword || !confirmPassword ? 0.6 : 1,
              cursor: isLoading || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Updating Password...' : 'Set Password'}
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
    padding: '40px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    boxSizing: 'border-box' as const,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '14px',
    margin: 0,
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
  passwordInput: {
    paddingRight: '45px',
  },
  passwordInputContainer: {
    position: 'relative' as const,
    width: '100%',
  },
  eyeButton: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordHint: {
    marginTop: '4px',
  },
  button: {
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  error: {
    fontSize: '14px',
    textAlign: 'center' as const,
    padding: '10px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
};

const lightStyles = {
  container: {
    backgroundColor: '#ffffff',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  },
  text: '#000000',
  textSecondary: '#6b7280',
  accent: '#fbbf24',
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e1e1e1',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
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
  textSecondary: '#9ca3af',
  accent: '#fbbf24',
  card: {
    backgroundColor: '#262626',
    border: '1px solid #404040',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
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

