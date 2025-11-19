import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { electronAPI } from '../../../../../lib';
// import { useUsersStore } from '@/renderer/src/features/users';
import { useAuthStore } from '../../../../auth';

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'clerk';
  permissions: string[];
}

export interface EditUserFormData {
  name: string;
  email: string;
  role: 'admin' | 'clerk';
}

export function useUserManagement() {
  const queryClient = useQueryClient();
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdUserData, setCreatedUserData] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'clerk',
    permissions: [],
  });
  const [editFormData, setEditFormData] = useState<EditUserFormData>({
    name: '',
    email: '',
    role: 'clerk',
  });
  const { user } = useAuthStore();
  // Fetch admin's clerks - same pattern as jobs.getAll()
  const { data: users, isLoading } = useQuery({
    queryKey: ['myClerks', user?.id],
    queryFn: async () => {
      // Get fresh user from store to avoid closure issues
      const currentUser = useAuthStore.getState().user;
      const adminId = currentUser?.id;
      
      
      const result = await electronAPI.adminManagement.getMyClerks(adminId as string);
      return result;
    },
    enabled: !!user?.id,
    staleTime: 5000,
    refetchInterval: 10000,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      permissions: string[];
    }) => {
      return await electronAPI.adminManagement.createClerk(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['myClerks'] });
      setIsCreatingUser(false);
      // Store user data and password for success modal
      setCreatedUserData({
        name: variables.name,
        email: variables.email,
        password: variables.password,
      });
      setShowSuccessModal(true);
      setUserFormData({ name: '', email: '', password: '', role: 'clerk', permissions: [] });
    },
    onError: (error: unknown) => {
      console.error('Failed to create user:', error);
      // Extract error message
      let errorMsg = 'Failed to create user. Please try again.';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as { message?: string; response?: { data?: { message?: string } } };
        errorMsg = errorObj.message || 
                   errorObj.response?.data?.message || 
                   errorMsg;
      }
      setErrorMessage(errorMsg);
      setShowErrorToast(true);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; email?: string; role?: 'admin' | 'clerk' };
    }) => {
      return await electronAPI.users.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myClerks'] });
      setEditingUserId(null);
      setEditFormData({ name: '', email: '', role: 'clerk' });
    },
    onError: (error: unknown) => {
      console.error('Failed to update user:', error);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await electronAPI.users.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myClerks'] });
    },
    onError: (error: unknown) => {
      console.error('Failed to delete user:', error);
    },
  });

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserFormData({ ...userFormData, password });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim() || !userFormData.password.trim()) {
      return;
    }
    createUserMutation.mutate({
      name: userFormData.name.trim(),
      email: userFormData.email.trim().toLowerCase(),
      password: userFormData.password,
      permissions: userFormData.permissions,
    });
  };

  const handleUpdateUser = (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    updateUserMutation.mutate({
      id: userId,
      data: {
        name: editFormData.name.trim(),
        email: editFormData.email.trim().toLowerCase(),
        role: editFormData.role,
      },
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const startEditing = (user: { id: string; name?: string; email?: string; role?: 'admin' | 'clerk' }) => {
    setEditingUserId(user.id);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'clerk',
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({ name: '', email: '', role: 'clerk' });
  };

  const cancelCreate = () => {
    setIsCreatingUser(false);
    setUserFormData({ name: '', email: '', password: '', role: 'clerk', permissions: [] });
  };

  return {
    // State
    isCreatingUser,
    setIsCreatingUser,
    editingUserId,
    userFormData,
    editFormData,
    setUserFormData,
    setEditFormData,
    users,
    isLoading,
    showSuccessModal,
    setShowSuccessModal,
    showErrorToast,
    setShowErrorToast,
    errorMessage,
    createdUserData,
    // Mutations
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    // Handlers
    generateTemporaryPassword,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    startEditing,
    cancelEdit,
    cancelCreate,
  };
}

