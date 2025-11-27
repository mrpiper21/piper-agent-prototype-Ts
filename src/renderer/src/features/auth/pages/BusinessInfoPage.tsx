import { useState, useRef, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles } from '../../clerk/shared/clerkStyles';
import { businessInfoCache } from '../../../shared/utils/businessInfoCache';
import { FaCamera } from 'react-icons/fa';

export default function BusinessInfoPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [businessPhone, setBusinessPhone] = useState(user?.businessPhone || '');
  const [websiteUrl, setWebsiteUrl] = useState(user?.websiteUrl || '');
  const [businessImage, setBusinessImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.businessCoverImage || null);
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
      // Note: We can't restore the File object, but that's okay
      // The user can re-select the image if needed
    }
  }, []);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      setBusinessImage(file);
      setError(null);

      // Create preview
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

    // Validate required fields
    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }

    if (!businessPhone.trim()) {
      setError('Business phone is required');
      return;
    }

    // Get file path from File object (for caching)
    let filePath: string | null = null;
    if (businessImage instanceof File) {
      // In Electron, File objects have a path property
      // @ts-ignore - path property exists in Electron File objects
      filePath = (businessImage as any).path || null;
      if (!filePath) {
        console.warn('File object does not have path property');
      }
    }

    // Cache business info before navigating
    businessInfoCache.save({
      businessName: businessName.trim(),
      businessPhone: businessPhone.trim(),
      businessCoverImagePath: filePath,
      websiteUrl: websiteUrl.trim() || undefined,
    });

    // Navigate to location setup
    navigate('/setup-location');
  };

  return (
    <div style={{ ...styles.container, ...themeStyles.container }}>
      <div style={styles.contentWrapper}>
        <div style={{ ...styles.card, ...themeStyles.card }}>
          <h1 style={{ ...styles.title, color: themeStyles.text }}>
            Business Information
          </h1>
          <p style={{ ...styles.subtitle, color: themeStyles.textSecondary }}>
            Please provide your business details to continue
          </p>

          <form onSubmit={handleNext} style={styles.form}>
            {/* Business Image Upload */}
            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, color: themeStyles.text }}>
                Business Cover Image (Optional)
              </label>
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
                  >
                    <FaCamera />
                    <p style={{ color: themeStyles.textSecondary }}>
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
            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, color: themeStyles.text }}>
                Business Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
                required
                style={{ ...styles.input, ...themeStyles.input }}
              />
            </div>

            {/* Business Phone */}
            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, color: themeStyles.text }}>
                Business Phone *
              </label>
              <input
                type="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="Enter your business phone number"
                required
                style={{ ...styles.input, ...themeStyles.input }}
              />
            </div>

            {/* Website URL (Optional) */}
            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, color: themeStyles.text }}>
                Website URL (Optional)
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                style={{ ...styles.input, ...themeStyles.input }}
              />
            </div>

            {error && (
              <div style={{ ...styles.error, color: themeStyles.error }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{ ...styles.button, ...themeStyles.primaryButton }}
            >
              {isLoading ? 'Loading...' : 'Next'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: '600px',
  },
  card: {
    padding: 'var(--spacing-xl, 24px)',
    borderRadius: 'var(--border-radius-lg, 8px)',
    width: '100%',
  },
  title: {
    fontSize: 'var(--font-size-2xl, 24px)',
    fontWeight: '700',
    marginBottom: '8px',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 'var(--font-size, 14px)',
    marginBottom: '24px',
    textAlign: 'center' as const,
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
  label: {
    fontSize: 'var(--font-size, 14px)',
    fontWeight: '600',
  },
  input: {
    padding: 'var(--spacing-md, 12px)',
    borderRadius: 'var(--border-radius-md, 6px)',
    fontSize: 'var(--font-size, 14px)',
    boxSizing: 'border-box' as const,
    width: '100%',
    transition: 'all 0.2s ease',
  },
  imageUploadContainer: {
    width: '100%',
  },
  imageUploadArea: {
    border: '2px dashed',
    borderRadius: 'var(--border-radius-md, 6px)',
    padding: '20px 20px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  uploadHint: {
    fontSize: 'var(--font-size-sm, 12px)',
    marginTop: '8px',
  },
  imagePreviewContainer: {
    position: 'relative' as const,
    width: '100%',
    borderRadius: 'var(--border-radius-md, 6px)',
    overflow: 'hidden' as const,
  },
  imagePreview: {
    width: '50%',
    height: '100px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    padding: '8px 12px',
    borderRadius: 'var(--border-radius-md, 6px)',
    fontSize: 'var(--font-size-sm, 12px)',
    cursor: 'pointer',
    border: 'none',
  },
  hiddenInput: {
    display: 'none',
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
    marginTop: '8px',
  },
  error: {
    fontSize: 'var(--font-size, 14px)',
    textAlign: 'center' as const,
    padding: 'var(--spacing-sm, 8px)',
    borderRadius: 'var(--border-radius-md, 6px)',
  },
};

