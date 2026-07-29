import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, setAccessToken, refreshAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we try to restore a session
  const [error, setError] = useState(null);

  // On first load, try to silently refresh — if the httpOnly cookie is
  // still valid this logs the user back in without them re-entering anything.
  useEffect(() => {
    (async () => {
      const result = await refreshAccessToken();
      if (result) setUser(result.user);
      setLoading(false);
    })();
  }, []);

  const login = async (regNo, password) => {
    setError(null);
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ regNo, password }),
    }, false);

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Sign in failed');
      return false;
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
    return true;
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' }, false);
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
