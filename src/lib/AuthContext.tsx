import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to load user from local storage
    const storedUser = localStorage.getItem('spendsense_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  const authAction = async (action: 'login' | 'register', username: string, password?: string) => {
    setLoading(true);
    setError(null);
    try {
      // If no password provided (for MVP testing), just use a default one
      const pwd = password || 'default_mvp_password';
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, username, password: pwd })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      setUser(data.user);
      localStorage.setItem('spendsense_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      // Removed fallback for MVP: true client-side authentication is now required
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password?: string) => {
    return authAction('login', username, password);
  };

  const register = async (username: string, password?: string) => {
    return authAction('register', username, password);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('spendsense_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
