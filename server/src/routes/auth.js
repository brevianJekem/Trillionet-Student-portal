import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  findUserByRegNo, findUserByEmail, findUserById,
  storeRefreshToken, isRefreshTokenValid, revokeRefreshToken,
} from '../db/queries.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const REFRESH_COOKIE_NAME = 'trillionet_refresh';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — keep in sync with REFRESH_TOKEN_TTL in .env

function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // Frontend and backend live on different Render subdomains in production,
    // which makes this a cross-site cookie — SameSite=None + Secure is required
    // for the browser to send it at all. Locally (same-site) 'lax' is enough.
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/api/auth',
    maxAge: REFRESH_TTL_MS,
  };
}

function publicUser(user) {
  return { id: user.id, regNo: user.reg_no, email: user.email, name: user.name, role: user.role };
}

// POST /api/auth/login  { regNo, password }
router.post('/login', async (req, res) => {
  try {
    const { regNo, password } = req.body;
    if (!regNo || !password) {
      return res.status(400).json({ error: 'Registration number and password are required' });
    }

    const found = regNo.includes('@') ? await findUserByEmail(regNo) : await findUserByRegNo(regNo);
    if (!found) {
      return res.status(401).json({ error: 'Invalid registration number or password' });
    }

    const valid = await bcrypt.compare(password, found.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid registration number or password' });
    }

    const accessToken = signAccessToken(found);
    const refreshToken = signRefreshToken(found);
    await storeRefreshToken(found.id, refreshToken, new Date(Date.now() + REFRESH_TTL_MS));

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    res.json({ accessToken, user: publicUser(found) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong signing you in' });
  }
});

// POST /api/auth/refresh — reads the httpOnly cookie, issues a new access token
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const valid = await isRefreshTokenValid(payload.sub, token);
    if (!valid) {
      return res.status(401).json({ error: 'Refresh token has been revoked' });
    }

    const user = await findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User no longer exists' });

    // rotate: invalidate the old refresh token, issue a new one
    await revokeRefreshToken(token);
    const newRefreshToken = signRefreshToken(user);
    await storeRefreshToken(user.id, newRefreshToken, new Date(Date.now() + REFRESH_TTL_MS));
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions());

    const accessToken = signAccessToken(user);
    res.json({ accessToken, user: publicUser(user) });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Something went wrong refreshing your session' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (token) await revokeRefreshToken(token);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Something went wrong signing you out' });
  }
});

// GET /api/auth/me — protected, proves the access token works
router.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

export default router;
