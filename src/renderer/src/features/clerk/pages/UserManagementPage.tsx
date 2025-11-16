import { useAuthStore } from '../../auth/store/authStore';
import {
  AccessDenied,
  UsersList,
  UserManagementHeader,
  UserDrawer,
} from './user-management/components';
import { useUserManagement } from './user-management/hooks/useUserManagement';
import { formatDate } from './user-management/utils';

export default function UserManagementPage() {
  const { user } = useAuthStore();

  // Check if user is admin
  if (user?.role !== 'admin') {
    return <AccessDenied />;
  }

  const {
    isCreatingUser,
    setIsCreatingUser,
    editingUserId,
    userFormData,
    editFormData,
    setUserFormData,
    setEditFormData,
    users,
    isLoading,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    generateTemporaryPassword,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    startEditing,
    cancelEdit,
    cancelCreate,
  } = useUserManagement();

  return (
    <>
      <div
        style={{
          padding: 'var(--spacing-md, 12px)',
          height: '100%',
          overflow: 'auto',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <UserManagementHeader
          onCreateClick={() => setIsCreatingUser(true)}
          isCreating={isCreatingUser}
        />

        <UsersList
          users={users}
          isLoading={isLoading}
          currentUserId={user?.id}
          editingUserId={editingUserId}
          formData={editFormData}
          onFormDataChange={(data) => setEditFormData({ ...editFormData, ...data })}
          onStartEdit={startEditing}
          onCancelEdit={cancelEdit}
          onSave={handleUpdateUser}
          onDelete={handleDeleteUser}
          isSaving={updateUserMutation.isPending}
          isDeleting={deleteUserMutation.isPending}
          formatDate={formatDate}
        />
      </div>

      <UserDrawer
        isOpen={isCreatingUser}
        onClose={cancelCreate}
        formData={userFormData}
        onFormDataChange={(data) => setUserFormData({ ...userFormData, ...data })}
        onGeneratePassword={generateTemporaryPassword}
        onSubmit={handleCreateUser}
        isSubmitting={createUserMutation.isPending}
      />
    </>
  );
}
