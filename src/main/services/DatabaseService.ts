import type { User, CreateUserData, UpdateUserData } from '../../shared/types/ipc.types';
import { logger } from '../utils/logger';

class DatabaseService {
  private data: {
    users: User[];
    sessions: Map<string, { userId: string; expiresAt: number }>;
  } = {
    users: [],
    sessions: new Map(),
  };

  init() {
    try {
      // Using in-memory storage for now
      logger.info('Database initialized (in-memory)');
    } catch (error) {
      logger.error('Database initialization error', error);
      throw error;
    }
  }

  private createTables() {
    // No-op for in-memory storage
  }

  // Users
  getAllUsers(): User[] {
    return this.data.users.sort((a, b) => b.createdAt - a.createdAt);
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(data: CreateUserData): User {
    const user: User = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.data.users.push(user);
    logger.info('User created', { id: user.id, email: user.email });
    return user;
  }

  updateUser(id: string, data: UpdateUserData): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    
    if (data.name !== undefined) {
      user.name = data.name;
    }
    if (data.email !== undefined) {
      user.email = data.email;
    }
    
    user.updatedAt = Date.now();
    return user;
  }

  deleteUser(id: string): void {
    this.data.users = this.data.users.filter(u => u.id !== id);
    logger.info('User deleted', { id });
  }

  // Auth
  createAuthSession(token: string, userId: string): void {
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    this.data.sessions.set(token, { userId, expiresAt });
  }

  validateToken(token: string): string | null {
    const session = this.data.sessions.get(token);
    if (!session) return null;
    
    if (session.expiresAt < Date.now()) {
      this.data.sessions.delete(token);
      return null;
    }
    
    return session.userId;
  }

  deleteSession(token: string): void {
    this.data.sessions.delete(token);
  }

  close() {
    logger.info('Database closed');
  }
}

export const dbService = new DatabaseService();
