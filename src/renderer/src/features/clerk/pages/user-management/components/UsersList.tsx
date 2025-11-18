import React from 'react';
import { useTheme } from '../../../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../../../shared/clerkStyles';
import { AiOutlineUser } from 'react-icons/ai';
import UserCard from './UserCard';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'clerk';
  permissions?: string[];
  location?: {
    address: string;
  };
  createdAt?: number;
}

interface UserFormData {
  name: string;
  email: string;
  role: 'admin' | 'clerk';
}

interface UsersListProps {
  users: User[] | undefined;
  isLoading: boolean;
  currentUserId?: string;
  editingUserId: string | null;
  formData: UserFormData;
  onFormDataChange: (data: Partial<UserFormData>) => void;
  onStartEdit: (user: User) => void;
  onCancelEdit: () => void;
  onSave: (e: React.FormEvent, userId: string) => void;
  onDelete: (userId: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
  formatDate: (timestamp: number) => string;
}

export default function UsersList({
  users,
  isLoading,
  currentUserId,
  editingUserId,
  formData,
  onFormDataChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  formatDate,
}: UsersListProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  if (isLoading) {
    return (
      <div
        style={{
          ...sharedStyles.card,
          ...themeStyles.card,
        }}
      >
        <div
          style={{
            padding: '60px 40px',
            textAlign: 'center',
            color: themeStyles.textSecondary,
          }}
        >
          Loading users...
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div
        style={{
          ...sharedStyles.card,
          ...themeStyles.card,
          minWidth: '350px',
        }}
      >
        <div
          style={{
            padding: '60px 40px',
            textAlign: 'center',
            color: themeStyles.textSecondary,
          }}
        >
          <AiOutlineUser
            style={{
              fontSize: '48px',
              marginBottom: '16px',
              opacity: 0.5,
              display: 'block',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ margin: 0, fontSize: '16px' }}>No clerks found.</p>
          <p style={{ margin: '8px 0 0', fontSize: '14px' }}>Create your first clerk above.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...sharedStyles.card,
        ...themeStyles.card,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-md, 12px)',
          flexWrap: 'wrap',
          gap: 'var(--spacing-sm, 8px)',
        }}
      >
        <h2
          style={{
            color: themeStyles.text,
            fontSize: 'var(--font-size-large, 16px)',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm, 8px)',
            margin: 0,
          }}
        >
          <AiOutlineUser style={{ color: themeStyles.accent, fontSize: 'var(--icon-size, 16px)' }} />
          My Clerks ({users.length})
        </h2>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 'var(--spacing-sm, 8px)',
        }}
      >
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            currentUserId={currentUserId}
            isEditing={editingUserId === user.id}
            formData={formData}
            onFormDataChange={onFormDataChange}
            onStartEdit={() => onStartEdit(user)}
            onCancelEdit={onCancelEdit}
            onSave={(e) => onSave(e, user.id)}
            onDelete={() => onDelete(user.id)}
            isSaving={isSaving}
            isDeleting={isDeleting}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  );
}

