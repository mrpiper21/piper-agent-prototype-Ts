// Shared constants

export const APP_NAME = 'Electron React App';
export const APP_VERSION = '1.0.0';

export const IPC_EVENTS = {
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_REFRESH: 'auth:refresh',
  USERS_GET_ALL: 'users:getAll',
  USERS_GET_BY_ID: 'users:getById',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  FILES_SAVE: 'files:save',
  FILES_READ: 'files:read',
} as const;
