import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { electronAPI } from '../../../lib';
import { 
  AiOutlineUser, 
  AiOutlineMail, 
  AiOutlinePlus,
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineSave,
  AiOutlineClose,
  AiOutlineCalendar,
  AiOutlineLock
} from 'react-icons/ai';
import { FaMapMarkerAlt } from 'react-icons/fa';

export default function UserManagementPage() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: theme === 'dark' ? darkStyles.text : lightStyles.text, marginBottom: '12px' }}>
            Access Denied
          </h2>
          <p style={{ color: theme === 'dark' ? darkStyles.textSecondary : lightStyles.textSecondary }}>
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const themeStyles = useMemo(() => {
    return theme === 'dark' ? darkStyles : lightStyles;
  }, [theme]);

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'clerk' as 'admin' | 'clerk',
  });

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => electronAPI.users.getAll(),
    staleTime: 5000,
    refetchInterval: 10000,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; role: 'admin' | 'clerk' }) => {
      return await electronAPI.users.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreatingUser(false);
      setUserFormData({ name: '', email: '', role: 'clerk' });
    },
    onError: (error: any) => {
      console.error('Failed to create user:', error);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; email?: string; role?: 'admin' | 'clerk' } }) => {
      return await electronAPI.users.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUserId(null);
      setUserFormData({ name: '', email: '', role: 'clerk' });
    },
    onError: (error: any) => {
      console.error('Failed to update user:', error);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await electronAPI.users.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete user:', error);
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      return;
    }
    createUserMutation.mutate({
      name: userFormData.name.trim(),
      email: userFormData.email.trim().toLowerCase(),
      role: userFormData.role,
    });
  };

  const handleUpdateUser = (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    updateUserMutation.mutate({
      id: userId,
      data: {
        name: userFormData.name.trim(),
        email: userFormData.email.trim().toLowerCase(),
        role: userFormData.role,
      },
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const startEditing = (userToEdit: any) => {
    setEditingUserId(userToEdit.id);
    setUserFormData({
      name: userToEdit.name || '',
      email: userToEdit.email || '',
      role: userToEdit.role || 'clerk',
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setUserFormData({ name: '', email: '', role: 'clerk' });
  };

  const cancelCreate = () => {
    setIsCreatingUser(false);
    setUserFormData({ name: '', email: '', role: 'clerk' });
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ 
            color: themeStyles.text, 
            fontSize: '32px', 
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            User Management
          </h1>
          <p style={{ 
            color: themeStyles.textSecondary, 
            fontSize: '14px' 
          }}>
            Manage system users and their permissions
          </p>
        </div>
        {!isCreatingUser && (
          <button
            onClick={() => setIsCreatingUser(true)}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.primaryButton,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AiOutlinePlus />
            Add New User
          </button>
        )}
      </div>

      {/* Create User Form */}
      {isCreatingUser && (
        <div style={{ 
          ...sharedStyles.card, 
          ...themeStyles.card,
          marginBottom: '24px',
          boxShadow: theme === 'dark' 
            ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
            : '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
          <h2 style={{ 
            color: themeStyles.text, 
            fontSize: '20px', 
            fontWeight: '700',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AiOutlinePlus style={{ color: themeStyles.accent }} />
            Create New User
          </h2>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
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
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  style={{
                    ...sharedStyles.input,
                    ...themeStyles.input,
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
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  style={{
                    ...sharedStyles.input,
                    ...themeStyles.input,
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
                  Role
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as 'admin' | 'clerk' })}
                  style={{
                    ...sharedStyles.input,
                    ...themeStyles.input,
                    width: '100%',
                    padding: '12px',
                  }}
                >
                  <option value="clerk">Clerk</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{ 
              padding: '12px', 
              background: `${themeStyles.accent}15`, 
              borderRadius: '6px', 
              marginBottom: '16px',
              fontSize: '13px',
              color: themeStyles.textSecondary
            }}>
              <AiOutlineLock style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Note: Password must be set separately through the registration process or password reset.
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={createUserMutation.isPending}
                style={{
                  ...sharedStyles.actionButton,
                  ...themeStyles.primaryButton,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AiOutlineSave />
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={cancelCreate}
                style={{
                  ...sharedStyles.actionButton,
                  ...themeStyles.button,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AiOutlineClose />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div style={{ 
        ...sharedStyles.card, 
        ...themeStyles.card,
        boxShadow: theme === 'dark' 
          ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
          : '0 2px 12px rgba(0, 0, 0, 0.06)'
      }}>
        <h2 style={{ 
          color: themeStyles.text, 
          fontSize: '20px', 
          fontWeight: '700',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AiOutlineUser style={{ color: themeStyles.accent }} />
          All Users ({users?.length || 0})
        </h2>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: themeStyles.textSecondary }}>
            Loading users...
          </div>
        ) : !users || users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: themeStyles.textSecondary }}>
            No users found. Create your first user above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.map((userItem: any) => (
              <div
                key={userItem.id}
                style={{
                  ...sharedStyles.card,
                  ...themeStyles.card,
                  padding: '16px',
                  border: `1px solid ${themeStyles.card.border}`,
                }}
              >
                {editingUserId === userItem.id ? (
                  <form onSubmit={(e) => handleUpdateUser(e, userItem.id)}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ 
                          color: themeStyles.text, 
                          display: 'block', 
                          marginBottom: '6px',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}>
                          Name
                        </label>
                        <input
                          type="text"
                          value={userFormData.name}
                          onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                          style={{
                            ...sharedStyles.input,
                            ...themeStyles.input,
                            width: '100%',
                            padding: '10px',
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ 
                          color: themeStyles.text, 
                          display: 'block', 
                          marginBottom: '6px',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                          style={{
                            ...sharedStyles.input,
                            ...themeStyles.input,
                            width: '100%',
                            padding: '10px',
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ 
                          color: themeStyles.text, 
                          display: 'block', 
                          marginBottom: '6px',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}>
                          Role
                        </label>
                        <select
                          value={userFormData.role}
                          onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as 'admin' | 'clerk' })}
                          style={{
                            ...sharedStyles.input,
                            ...themeStyles.input,
                            width: '100%',
                            padding: '10px',
                          }}
                        >
                          <option value="clerk">Clerk</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="submit"
                        disabled={updateUserMutation.isPending}
                        style={{
                          ...sharedStyles.actionButton,
                          ...themeStyles.primaryButton,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          padding: '8px 12px',
                        }}
                      >
                        <AiOutlineSave />
                        {updateUserMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        style={{
                          ...sharedStyles.actionButton,
                          ...themeStyles.button,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          padding: '8px 12px',
                        }}
                      >
                        <AiOutlineClose />
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ 
                          color: themeStyles.text, 
                          fontSize: '16px', 
                          fontWeight: '700',
                          margin: 0
                        }}>
                          {userItem.name || 'Unknown User'}
                        </h3>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: userItem.role === 'admin' 
                            ? `${themeStyles.accent}20` 
                            : `${themeStyles.textSecondary}20`,
                          color: userItem.role === 'admin' 
                            ? themeStyles.accent 
                            : themeStyles.textSecondary,
                        }}>
                          {userItem.role === 'admin' ? 'Admin' : 'Clerk'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: themeStyles.textSecondary, fontSize: '13px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AiOutlineMail style={{ fontSize: '12px' }} />
                          {userItem.email || 'N/A'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AiOutlineCalendar style={{ fontSize: '12px' }} />
                          Joined {formatDate(userItem.createdAt || 0)}
                        </span>
                        {userItem.location?.address && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaMapMarkerAlt style={{ fontSize: '12px' }} />
                            {userItem.location.address.length > 30 
                              ? userItem.location.address.substring(0, 30) + '...'
                              : userItem.location.address}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => startEditing(userItem)}
                        style={{
                          ...sharedStyles.actionButton,
                          ...themeStyles.button,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          padding: '8px 12px',
                        }}
                      >
                        <AiOutlineEdit />
                        Edit
                      </button>
                      {userItem.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(userItem.id)}
                          disabled={deleteUserMutation.isPending}
                          style={{
                            ...sharedStyles.actionButton,
                            ...themeStyles.dangerButton,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            padding: '8px 12px',
                          }}
                        >
                          <AiOutlineDelete />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

