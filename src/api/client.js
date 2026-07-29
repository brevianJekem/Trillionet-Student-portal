const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Wraps fetch: always sends cookies, attaches the access token, and retries
// once after a silent refresh if the token turned out to be expired.
export async function apiFetch(path, options = {}, retry = true) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });

  if (res.status === 401 && retry && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch(path, options, false);
  }

  return res;
}

export async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return data;
  } catch {
    return false;
  }
}
