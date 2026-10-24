import { createContext } from 'react';

// Holds { user, login, logout }. Filled in by <AuthProvider>, read with useAuth().
export const AuthContext = createContext(null);
