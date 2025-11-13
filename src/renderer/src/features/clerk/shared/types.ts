// Permission enum - matches src/shared/types/auth.types.ts
export enum Permission {
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SYSTEM = 'manage_system',
  VIEW_ALL_JOBS = 'view_all_jobs',
  
  // Clerk permissions
  MANAGE_JOBS = 'manage_jobs',
  SUBMIT_PRINTS = 'submit_prints',
  VIEW_AGENTS = 'view_agents',
  VIEW_OWN_JOBS = 'view_own_jobs',
}
