import { pool } from './pool.js';

export async function findUserByRegNo(regNo) {
  const { rows } = await pool.query('SELECT * FROM users WHERE lower(reg_no) = lower($1)', [regNo]);
  return rows[0] || null;
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function createUser({ regNo, email, name, role = 'student', passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO users (reg_no, email, name, role, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [regNo, email, name, role, passwordHash],
  );
  return rows[0];
}

export async function storeRefreshToken(userId, token, expiresAt) {
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt],
  );
}

export async function isRefreshTokenValid(userId, token) {
  const { rows } = await pool.query(
    'SELECT 1 FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND expires_at > now()',
    [userId, token],
  );
  return rows.length > 0;
}

export async function revokeRefreshToken(token) {
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}

export async function revokeAllRefreshTokensForUser(userId) {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

// Housekeeping — call periodically (or on server start) to keep the table small.
export async function pruneExpiredRefreshTokens() {
  await pool.query('DELETE FROM refresh_tokens WHERE expires_at <= now()');
}
export async function updateUserPassword(userId, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
}
