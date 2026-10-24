import { useContext } from 'react';
import { AuthContext } from './authContext';

// { user, login, logout } for the current visitor. `user` is null when logged out.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
