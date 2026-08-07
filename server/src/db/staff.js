import { pool } from './pool.js';

export async function nextAdmissionNumber(year = new Date().getFullYear()) {
  const { rows } = await pool.query(
    `INSERT INTO admission_sequences (year, last_number)
     VALUES ($1, 1)
     ON CONFLICT (year) DO UPDATE SET last_number = admission_sequences.last_number + 1
     RETURNING last_number`,
    [year],
  );
  const number = String(rows[0].last_number).padStart(4, '0');
  return `TCT/${year}/${number}`;
}

export async function createStudent({ regNo, name, phone, parentPhone, passwordHash, createdBy }) {
  const syntheticEmail = `${regNo.replace(/\//g, '.').toLowerCase()}@trillionet.ac.ke`;

  const { rows } = await pool.query(
    `INSERT INTO users (reg_no, email, name, role, password_hash, phone, parent_phone, created_by)
     VALUES ($1, $2, $3, 'student', $4, $5, $6, $7)
     RETURNING *`,
    [regNo, syntheticEmail, name, passwordHash, phone || null, parentPhone || null, createdBy],
  );
  return rows[0];
}

export async function recordFeePayment({ userId, amount, method, note, recordedBy }) {
  const { rows } = await pool.query(
    `INSERT INTO fee_payments (user_id, amount, method, note, recorded_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, amount, method || 'cash', note || null, recordedBy],
  );
  return rows[0];
}

export async function getTotalPaidForUser(userId) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM fee_payments WHERE user_id = $1`,
    [userId],
  );
  return Number(rows[0].total);
}

export async function listStudents() {
  const { rows } = await pool.query(
    `SELECT
       u.id, u.reg_no, u.name, u.email, u.phone, u.parent_phone, u.created_at,
       COALESCE(fp.total_paid, 0) AS total_paid,
       COALESCE(en.package_count, 0) AS package_count
     FROM users u
     LEFT JOIN (
       SELECT user_id, SUM(amount) AS total_paid FROM fee_payments GROUP BY user_id
     ) fp ON fp.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS package_count FROM enrollments GROUP BY user_id
     ) en ON en.user_id = u.id
     WHERE u.role = 'student'
     ORDER BY u.created_at DESC`,
  );
  return rows;
}
