cd "$(dirname "$0")"

# 1. Fix the broken icon CDN
sed -i.bak 's|<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/2.47.0/iconfont/tabler-icons.min.css">|<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.44.0/dist/tabler-icons.min.css">|' index.html
rm -f index.html.bak
echo "1/7 icon CDN fixed"

# 2. Add phone column to schema
cat >> server/src/db/schema.sql << 'SQLEOF'

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
SQLEOF
echo "2/7 schema updated"

# 3. Account routes (profile update + password change)
cat > server/src/routes/account.js << 'JSEOF'
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth.js';
import { findUserById, updateUserPassword, revokeAllRefreshTokensForUser } from '../db/queries.js';
import { pool } from '../db/pool.js';

const router = Router();

function publicUser(user) {
  return {
    id: user.id,
    regNo: user.reg_no,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone || '',
  };
}

router.patch('/', requireAuth, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'A valid email is required' });

    const { rows } = await pool.query(
      'UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
      [name.trim(), email.trim(), phone?.trim() || null, req.user.sub],
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'That email is already in use by another account' });
    }
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Could not update your profile' });
  }
});

router.post('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are both required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await findUserById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(user.id, passwordHash);
    await revokeAllRefreshTokensForUser(user.id);

    res.json({ ok: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Could not change your password' });
  }
});

export default router;
JSEOF
echo "3/7 account.js routes written"

# 4. Wire account routes into the server
python3 -c "
import re
path = 'server/src/index.js'
with open(path) as f:
    content = f.read()
content = content.replace(
    \"import packagesRoutes from './routes/packages.js';\",
    \"import packagesRoutes from './routes/packages.js';\nimport accountRoutes from './routes/account.js';\"
)
content = content.replace(
    \"app.use('/api/packages', packagesRoutes);\",
    \"app.use('/api/packages', packagesRoutes);\napp.use('/api/account', accountRoutes);\"
)
with open(path, 'w') as f:
    f.write(content)
print('4/7 index.js wired')
"

# 5. Include phone in auth's publicUser shape
python3 -c "
path = 'server/src/routes/auth.js'
with open(path) as f:
    content = f.read()
old = \"function publicUser(user) {\n  return { id: user.id, regNo: user.reg_no, email: user.email, name: user.name, role: user.role };\n}\"
new = \"function publicUser(user) {\n  return { id: user.id, regNo: user.reg_no, email: user.email, name: user.name, role: user.role, phone: user.phone || '' };\n}\"
content = content.replace(old, new)
with open(path, 'w') as f:
    f.write(content)
print('5/7 auth.js publicUser updated')
"

# 6. Frontend API wrapper for account endpoints
cat > src/api/account.js << 'JSEOF'
import { apiFetch } from './client';

export async function updateProfile({ name, email, phone }) {
  const res = await apiFetch('/account', {
    method: 'PATCH',
    body: JSON.stringify({ name, email, phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not update your profile');
  return data.user;
}

export async function changePassword({ currentPassword, newPassword }) {
  const res = await apiFetch('/account/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not change your password');
  return true;
}
JSEOF
echo "6/7 frontend api/account.js written"

# 7. AuthContext — add updateUser setter
cat > src/context/AuthContext.jsx << 'JSXEOF'
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

  const login = async (regNo, password) => {
    setError(null);
    try {
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
JSXEOF
echo "7/7 AuthContext.jsx updated"

echo ""
echo "Files done. Now writing Account.jsx (too long to safely inline in this script)..."