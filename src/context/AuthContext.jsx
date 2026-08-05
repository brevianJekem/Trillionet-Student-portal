import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, setAccessToken, refreshAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const result = await refreshAccessToken();
      if (result) setUser(result.user);
      setLoading(false);
    })();
  }, []);

  const login = async (regNo, password, rememberMe = true) => {
    setError(null);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ regNo, password, rememberMe }),
      }, false);

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sign in failed');
        return false;
      }

      setAccessToken(data.accessToken);
      setUser(data.user);
      return true;
    } catch (err) {
      console.error('Login request failed:', err);
      setError('Could not reach the server. Check your connection and try again.');
      return false;
    }
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' }, false);
    setAccessToken(null);
    setUser(null);
  };

  const updateUser = (patch) => {
    setUser(u => (u ? { ...u, ...patch } : u));
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
