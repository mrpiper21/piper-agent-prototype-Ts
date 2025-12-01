import { useState, useRef, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { businessInfoCache } from '../../../shared/utils/businessInfoCache';
import { FaCamera, FaBuilding, FaPhone, FaGlobe, FaClock } from 'react-icons/fa';
import WorkingHoursSelector, { WorkingHour } from '../components/WorkingHoursSelector';

export default function BusinessInfoPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? premiumDarkStyles : premiumLightStyles;

  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [businessPhone, setBusinessPhone] = useState(user?.businessPhone || '');
  const [websiteUrl, setWebsiteUrl] = useState(user?.websiteUrl || '');
  const [businessImage, setBusinessImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.businessCoverImage || null);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(() => {
    if (user?.workingHours && Array.isArray(user.workingHours)) {
      return user.workingHours as WorkingHour[];
    }
    return [];
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load cached business info if available (in case user navigates back)
  useEffect(() => {
    const cached = businessInfoCache.get();
    if (cached) {
      setBusinessName(cached.businessName || '');
      setBusinessPhone(cached.businessPhone || '');
      setWebsiteUrl(cached.websiteUrl || '');
      if (cached.workingHours) {
        setWorkingHours(cached.workingHours);
      }
    }
  }, []);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      setBusinessImage(file);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setBusinessImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNext = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!businessName.trim()) {
      setError('Business name is required');
      setIsLoading(false);
      return;
    }

    if (!businessPhone.trim()) {
      setError('Business phone is required');
      setIsLoading(false);
      return;
    }

    try {
      let filePath: string | null = null;
      let uploadedImageUrl: string | null = null;

      if (businessImage instanceof File) {
        filePath = (businessImage as File & { path?: string }).path || null;
        
        if (filePath && user?.id) {
          try {
            console.log('Uploading business cover image...');
            const updatedUser = await window.electron.users.update(user.id, {
              businessCoverImage: filePath,
            });
            
            uploadedImageUrl = updatedUser.businessCoverImage || null;
            console.log('Business cover image uploaded successfully:', uploadedImageUrl);
          } catch (uploadError: unknown) {
            const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
            console.error('Failed to upload business cover image:', uploadError);
            setError(`Failed to upload image: ${errorMessage}. You can continue without it or try again.`);
            setIsLoading(false);
            return;
          }
        }
      }

      businessInfoCache.save({
        businessName: businessName.trim(),
        businessPhone: businessPhone.trim(),
        businessCoverImagePath: filePath,
        businessCoverImageUrl: uploadedImageUrl,
        websiteUrl: websiteUrl.trim() || undefined,
        workingHours: workingHours.length > 0 ? workingHours : undefined,
      });

      navigate('/setup-location');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      console.error('Error in handleNext:', err);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ ...styles.container, ...themeStyles.container }}>
      <div style={styles.scrollableContent}>
        <div style={{ ...styles.card, ...themeStyles.card }}>
          {/* Header Section */}
          <div style={styles.header}>
            <div style={styles.iconContainer}>
              <FaBuilding size={40} style={{ color: themeStyles.accent }} />
            </div>
            <h1 style={{ ...styles.title, color: themeStyles.text }}>
              Business Information
            </h1>
            <p style={{ ...styles.subtitle, color: themeStyles.textSecondary }}>
              Tell us about your business to get started
            </p>
          </div>

          {/* Scrollable Form */}
          <div style={styles.formContainer}>
            <form onSubmit={handleNext} style={styles.form}>
              {/* Business Image Upload */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaCamera size={18} style={{ color: themeStyles.accent, marginRight: '8px' }} />
                  <label style={{ ...styles.sectionLabel, color: themeStyles.text }}>
                    Business Cover Image
                    <span style={{ ...styles.optional, color: themeStyles.textSecondary }}> (Optional)</span>
                  </label>
                </div>
                <div style={styles.imageUploadContainer}>
                  {imagePreview ? (
                    <div style={styles.imagePreviewContainer}>
                      <img
                        src={imagePreview}
                        alt="Business preview"
                        style={styles.imagePreview}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        style={{ ...styles.removeImageButton, ...themeStyles.dangerButton }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{ ...styles.imageUploadArea, ...themeStyles.input }}
                      onClick={() => fileInputRef.current?.click()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = themeStyles.accent;
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2a2a2a' : '#fafafa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = themeStyles.input.border;
                        e.currentTarget.style.backgroundColor = themeStyles.input.background;
                      }}
                    >
                      <FaCamera size={32} style={{ color: themeStyles.accent, marginBottom: '12px' }} />
                      <p style={{ color: themeStyles.text, fontWeight: '500', margin: '0 0 4px 0' }}>
                        Click to upload or drag and drop
                      </p>
                      <p style={{ ...styles.uploadHint, color: themeStyles.textSecondary }}>
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={styles.hiddenInput}
                  />
                </div>
              </div>

              {/* Business Name */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaBuilding size={18} style={{ color: themeStyles.accent, marginRight: '8px' }} />
                  <label style={{ ...styles.sectionLabel, color: themeStyles.text }}>
                    Business Name <span style={{ color: themeStyles.error }}>*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your business name"
                  required
                  style={{
                    ...styles.input,
                    ...themeStyles.input,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = themeStyles.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${themeStyles.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeStyles.input.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Business Phone */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaPhone size={18} style={{ color: themeStyles.accent, marginRight: '8px' }} />
                  <label style={{ ...styles.sectionLabel, color: themeStyles.text }}>
                    Business Phone <span style={{ color: themeStyles.error }}>*</span>
                  </label>
                </div>
                <input
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="Enter your business phone number"
                  required
                  style={{
                    ...styles.input,
                    ...themeStyles.input,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = themeStyles.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${themeStyles.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeStyles.input.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Website URL */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaGlobe size={18} style={{ color: themeStyles.accent, marginRight: '8px' }} />
                  <label style={{ ...styles.sectionLabel, color: themeStyles.text }}>
                    Website URL
                    <span style={{ ...styles.optional, color: themeStyles.textSecondary }}> (Optional)</span>
                  </label>
                </div>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  style={{
                    ...styles.input,
                    ...themeStyles.input,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = themeStyles.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${themeStyles.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeStyles.input.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Working Hours */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaClock size={18} style={{ color: themeStyles.accent, marginRight: '8px' }} />
                  <label style={{ ...styles.sectionLabel, color: themeStyles.text }}>
                    Working Hours
                    <span style={{ ...styles.optional, color: themeStyles.textSecondary }}> (Optional)</span>
                  </label>
                </div>
                <p style={{ ...styles.hint, color: themeStyles.textSecondary }}>
                  Set your business operating hours for each day of the week
                </p>
                <WorkingHoursSelector
                  value={workingHours}
                  onChange={setWorkingHours}
                  themeStyles={themeStyles}
                />
              </div>

              {error && (
                <div style={{ ...styles.error, backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }}>
                  <span style={{ color: themeStyles.error }}>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  ...styles.button,
                  ...themeStyles.primaryButton,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${themeStyles.accent}40`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = themeStyles.primaryButton.boxShadow || '0 2px 8px rgba(251, 191, 36, 0.3)';
                  }
                }}
              >
                {isLoading ? 'Processing...' : 'Continue to Location Setup'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100vw',
    minHeight: '100vh',
    padding: '20px',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollableContent: {
    width: '100%',
    maxWidth: '700px',
    maxHeight: '100vh',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    padding: '20px 0',
    boxSizing: 'border-box' as const,
    scrollBehavior: 'smooth' as const,
    scrollbarWidth: 'thin' as const,
    // Webkit scrollbar styling
    WebkitOverflowScrolling: 'touch' as const,
  },
  card: {
    padding: '40px',
    borderRadius: '16px',
    width: '100%',
    boxSizing: 'border-box' as const,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 10px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '15px',
    margin: 0,
    lineHeight: '1.5',
  },
  formContainer: {
    width: '100%',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '4px',
  },
  sectionLabel: {
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
  },
  optional: {
    fontWeight: '400',
    fontSize: '14px',
  },
  input: {
    padding: '14px 16px',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box' as const,
    width: '100%',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  imageUploadContainer: {
    width: '100%',
  },
  imageUploadArea: {
    border: '2px dashed',
    borderRadius: '12px',
    padding: '32px 20px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadHint: {
    fontSize: '13px',
    margin: 0,
  },
  imagePreviewContainer: {
    position: 'relative' as const,
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden' as const,
    border: '1px solid',
  },
  imagePreview: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: '12px',
    right: '12px',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    border: 'none',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
  hiddenInput: {
    display: 'none',
  },
  hint: {
    fontSize: '13px',
    margin: '0 0 8px 0',
    lineHeight: '1.4',
  },
  button: {
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    marginTop: '8px',
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
  },
  error: {
    fontSize: '14px',
    textAlign: 'center' as const,
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid',
  },
};

// Enhanced theme styles with premium look
const premiumLightStyles = {
  container: {
    backgroundColor: '#ffffff',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%)',
  },
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  accent: '#fbbf24',
  error: '#ef4444',
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
  input: {
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    border: '2px solid #e5e7eb',
  },
  primaryButton: {
    backgroundColor: '#fbbf24',
    color: '#000000',
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
  },
};

const premiumDarkStyles = {
  container: {
    backgroundColor: '#0f0f0f',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 50%, #1a1a1a 100%)',
  },
  text: '#f5f5f5',
  textSecondary: '#9ca3af',
  accent: '#fbbf24',
  error: '#f87171',
  card: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  input: {
    backgroundColor: '#1f1f1f',
    color: '#f5f5f5',
    border: '2px solid #2a2a2a',
  },
  primaryButton: {
    backgroundColor: '#fbbf24',
    color: '#000000',
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
  },
};
