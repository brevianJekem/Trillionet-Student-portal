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
