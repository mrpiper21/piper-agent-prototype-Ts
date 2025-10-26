import { Link } from 'react-router-dom';
import { useUsers, useDeleteUser } from '../api/usersApi';
import { useCreateUser } from '../api/usersApi';
import { useState } from 'react';
import type { CreateUserData } from '@shared/types/ipc.types';

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser.mutateAsync({ name: formData.name, email: formData.email } as CreateUserData);
      setFormData({ name: '', email: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create user', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUser.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div style={styles.loading}>Loading users...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/" style={styles.backButton}>← Back to Dashboard</Link>
        <h1>Manage Users</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
          Add User
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <form onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
              required
            />
            <div style={styles.formActions}>
              <button type="submit" style={styles.saveButton}>Save</button>
              <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.userList}>
        {users.map((user) => (
          <div key={user.id} style={styles.userCard}>
            <div>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <small style={styles.date}>
                Created: {new Date(user.createdAt).toLocaleDateString()}
              </small>
            </div>
            <button
              onClick={() => handleDelete(user.id)}
              style={styles.deleteButton}
            >
              Delete
            </button>
          </div>
        ))}
        {users.length === 0 && (
          <div style={styles.emptyState}>No users found</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  backButton: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '14px',
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  formCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  formActions: {
    display: 'flex',
    gap: '10px',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  userCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: '#666',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
};
