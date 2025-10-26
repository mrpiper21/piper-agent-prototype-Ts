import { create } from 'zustand';
import type { User } from '@shared/types/ipc.types';

interface UsersState {
  users: User[];
  selectedUser: User | null;
  filters: {
    search?: string;
  };
}

interface UsersActions {
  setUsers: (users: User[]) => void;
  selectUser: (user: User | null) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  setFilter: (filters: Partial<UsersState['filters']>) => void;
}

export const useUsersStore = create<UsersState & UsersActions>((set) => ({
  // State
  users: [],
  selectedUser: null,
  filters: {},

  // Actions
  setUsers: (users) => set({ users }),
  
  selectUser: (user) => set({ selectedUser: user }),
  
  updateUser: (id, updates) => set((state) => ({
    users: state.users.map((user) =>
      user.id === id ? { ...user, ...updates } : user
    ),
  })),
  
  setFilter: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
}));
