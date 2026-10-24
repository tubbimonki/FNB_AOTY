import { useContext } from 'react';
import { AuthContext } from './authContext';

// { user, status, login, register, logout } for the current visitor.
// `user` is null when logged out, else { id, name, email }.
// `status` is 'loading' until the first session check finishes, then 'ready'.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
