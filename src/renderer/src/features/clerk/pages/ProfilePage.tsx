import React, { useState } from 'react';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';
import { 
  FaKey,
  FaUserTie
} from 'react-icons/fa';
import { 
  AiOutlineUser, 
  AiOutlineMail, 
  AiOutlineLock, 
  AiOutlineEdit,
  AiOutlineSave,
  AiOutlineClose,
  AiOutlineCalendar
} from 'react-icons/ai';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { electronAPI } from '../../../lib';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string }) => {
      if (!user?.id) throw new Error('User not found');
      return await electronAPI.users.update(user.id, data);
    },
    onSuccess: (updatedUser) => {
      // Update the auth store with new user data
      useAuthStore.setState({ user: updatedUser });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error: any) => {
      setProfileError(error?.message || 'Failed to update profile');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    
    if (!profileData.name.trim()) {
      setProfileError('Name is required');
      return;
    }
    
    if (!profileData.email.trim()) {
      setProfileError('Email is required');
      return;
    }
    
    updateProfileMutation.mutate({
      name: profileData.name.trim(),
      email: profileData.email.trim().toLowerCase(),
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!passwordData.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    // Note: Password change would typically use auth API endpoint
    // For now, we'll show a message that this feature needs backend support
    setPasswordError('Password change feature requires backend API support');
  };

  const cancelProfileEdit = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditingProfile(false);
    setProfileError(null);
  };

  const cancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsChangingPassword(false);
    setPasswordError(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          color: themeStyles.text, 
          fontSize: '32px', 
          fontWeight: '700',
          marginBottom: '8px'
        }}>
          My Profile
        </h1>
        <p style={{ 
          color: themeStyles.textSecondary, 
          fontSize: '14px' 
        }}>
          Manage your account information and preferences
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div style={{
          ...sharedStyles.card,
          ...themeStyles.card,
          background: themeStyles.success,
          color: '#ffffff',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AiOutlineSave />
          <span>{successMessage}</span>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
        gap: '24px' 
      }}>
        {/* Profile Card */}
        <div style={{ 
          ...sharedStyles.card, 
          ...themeStyles.card,
          boxShadow: theme === 'dark' 
            ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
            : '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              color: themeStyles.text, 
              fontSize: '20px', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AiOutlineUser style={{ color: themeStyles.accent, fontSize: '24px' }} />
              Personal Information
            </h2>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                style={{
                  ...sharedStyles.actionButton,
                  ...themeStyles.primaryButton,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                    <AiOutlineEdit />
                    Edit
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ 
                    color: themeStyles.text, 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    style={{
                      ...sharedStyles.input,
                      ...themeStyles.input,
                      width: '100%',
                      padding: '12px',
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    color: themeStyles.text, 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    style={{
                      ...sharedStyles.input,
                      ...themeStyles.input,
                      width: '100%',
                      padding: '12px',
                    }}
                    required
                  />
                </div>

                {profileError && (
                  <div style={{ 
                    color: themeStyles.error, 
                    fontSize: '13px',
                    padding: '10px',
                    background: `${themeStyles.error}15`,
                    borderRadius: '6px'
                  }}>
                    {profileError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    style={{
                      ...sharedStyles.actionButton,
                      ...themeStyles.primaryButton,
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <AiOutlineSave />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelProfileEdit}
                    style={{
                      ...sharedStyles.actionButton,
                      ...themeStyles.button,
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <AiOutlineClose />
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Avatar */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px',
                paddingBottom: '24px',
                borderBottom: `1px solid ${themeStyles.card.border}`
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: themeStyles.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#000000',
                  flexShrink: 0,
                }}>
                  {getInitials(user?.name || 'U')}
                </div>
                <div>
                  <h3 style={{ 
                    color: themeStyles.text, 
                    fontSize: '24px', 
                    fontWeight: '700',
                    marginBottom: '4px'
                  }}>
                    {user?.name || 'User'}
                  </h3>
                  <p style={{ 
                    color: themeStyles.textSecondary, 
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AiOutlineMail style={{ fontSize: '12px' }} />
                    {user?.email || 'No email'}
                  </p>
                </div>
              </div>

              {/* Account Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <InfoRow 
                  label="Email" 
                  value={user?.email || 'N/A'} 
                  icon={<AiOutlineMail />}
                  themeStyles={themeStyles}
                />
                <InfoRow 
                  label="Role" 
                  value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'} 
                  icon={<FaUserTie />}
                  themeStyles={themeStyles}
                />
                <InfoRow 
                  label="Member Since" 
                  value={formatDate(user?.createdAt || 0)} 
                  icon={<AiOutlineCalendar />}
                  themeStyles={themeStyles}
                />
              </div>
            </div>
          )}
        </div>

        {/* Security Card */}
        <div style={{ 
          ...sharedStyles.card, 
          ...themeStyles.card,
          boxShadow: theme === 'dark' 
            ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
            : '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              color: themeStyles.text, 
              fontSize: '20px', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AiOutlineLock style={{ color: themeStyles.accent, fontSize: '24px' }} />
              Security
            </h2>
          </div>

          {isChangingPassword ? (
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ 
                    color: themeStyles.text, 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    style={{
                      ...sharedStyles.input,
                      ...themeStyles.input,
                      width: '100%',
                      padding: '12px',
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    color: themeStyles.text, 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    style={{
                      ...sharedStyles.input,
                      ...themeStyles.input,
                      width: '100%',
                      padding: '12px',
                    }}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label style={{ 
                    color: themeStyles.text, 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    style={{
                      ...sharedStyles.input,
                      ...themeStyles.input,
                      width: '100%',
                      padding: '12px',
                    }}
                    required
                    minLength={6}
                  />
                </div>

                {passwordError && (
                  <div style={{ 
                    color: themeStyles.error, 
                    fontSize: '13px',
                    padding: '10px',
                    background: `${themeStyles.error}15`,
                    borderRadius: '6px'
                  }}>
                    {passwordError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      ...sharedStyles.actionButton,
                      ...themeStyles.primaryButton,
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <FaKey />
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={cancelPasswordChange}
                    style={{
                      ...sharedStyles.actionButton,
                      ...themeStyles.button,
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <AiOutlineClose />
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ 
                padding: '16px',
                background: themeStyles.input.background,
                borderRadius: '8px',
                border: `1px solid ${themeStyles.card.border}`
              }}>
                <p style={{ 
                  color: themeStyles.textSecondary, 
                  fontSize: '14px',
                  marginBottom: '12px'
                }}>
                  Change your password to keep your account secure
                </p>
                <button
                  onClick={() => setIsChangingPassword(true)}
                  style={{
                    ...sharedStyles.actionButton,
                    ...themeStyles.primaryButton,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FaKey />
                  Change Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  themeStyles: any;
}

function InfoRow({ label, value, icon, themeStyles }: InfoRowProps) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: `1px solid ${themeStyles.card.border}`
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        color: themeStyles.textSecondary,
        fontSize: '14px'
      }}>
        {icon}
        <span>{label}</span>
      </div>
      <span style={{ 
        color: themeStyles.text, 
        fontSize: '14px',
        fontWeight: '600'
      }}>
        {value}
      </span>
    </div>
  );
}
