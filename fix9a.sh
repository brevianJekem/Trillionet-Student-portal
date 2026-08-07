cd "$(dirname "$0")"

cat > server/src/db/schema.sql << 'SQLEOF'
-- Run this once against your Neon database before starting the server.
-- psql "$DATABASE_URL" -f src/db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no         TEXT UNIQUE NOT NULL,
  email          TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'student',
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

CREATE TABLE IF NOT EXISTS admission_sequences (
  year         INTEGER PRIMARY KEY,
  last_number  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fee_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL,
  method       TEXT NOT NULL DEFAULT 'cash',
  note         TEXT,
  recorded_by  UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fee_payments_user_id ON fee_payments(user_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

CREATE TABLE IF NOT EXISTS packages (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL,
  instructor     TEXT NOT NULL,
  total_lessons  INTEGER NOT NULL,
  color          TEXT NOT NULL DEFAULT 'var(--blue)',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE packages ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 0;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS enrollments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id         TEXT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  completed_lessons  INTEGER NOT NULL DEFAULT 0,
  next_class         TEXT,
  enrolled_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_package_id ON enrollments(package_id);
SQLEOF
echo "1/8 schema.sql"

cat > server/src/middleware/auth.js << 'JSEOF'
import { verifyAccessToken } from '../utils/tokens.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

export function requireRole(role) {
  const allowed = Array.isArray(role) ? role : [role];
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do that' });
    }
    next();
  };
}
JSEOF
echo "2/8 middleware/auth.js"

cat > server/src/db/staff.js << 'JSEOF'
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
JSEOF
echo "3/8 db/staff.js"

cat > server/src/routes/staff.js << 'JSEOF'
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { nextAdmissionNumber, createStudent, recordFeePayment, listStudents } from '../db/staff.js';
import { enrollUserInPackage } from '../db/packages.js';

const router = Router();

router.use(requireAuth, requireRole('staff'));

function generateTempPassword() {
  return crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
}

router.get('/students', async (req, res) => {
  try {
    const students = await listStudents();
    res.json({
      students: students.map(s => ({
        id: s.id,
        regNo: s.reg_no,
        name: s.name,
        email: s.email,
        phone: s.phone || '',
        parentPhone: s.parent_phone || '',
        totalPaid: Number(s.total_paid),
        packageCount: Number(s.package_count),
        createdAt: s.created_at,
      })),
    });
  } catch (err) {
    console.error('List students error:', err);
    res.status(500).json({ error: 'Could not load students' });
  }
});

router.post('/students', async (req, res) => {
  try {
    const { name, phone, parentPhone, feesPaid, feesMethod, packageIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Student name is required' });
    }

    const regNo = await nextAdmissionNumber();
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const student = await createStudent({
      regNo, name: name.trim(), phone, parentPhone, passwordHash, createdBy: req.user.sub,
    });

    if (feesPaid && Number(feesPaid) > 0) {
      await recordFeePayment({
        userId: student.id, amount: Number(feesPaid), method: feesMethod || 'cash',
        note: 'Initial payment at registration', recordedBy: req.user.sub,
      });
    }

    if (Array.isArray(packageIds)) {
      for (const pkgId of packageIds) {
        await enrollUserInPackage(student.id, pkgId);
      }
    }

    res.status(201).json({
      student: {
        id: student.id,
        regNo: student.reg_no,
        name: student.name,
        phone: student.phone || '',
        parentPhone: student.parent_phone || '',
      },
      tempPassword,
    });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ error: 'Could not create the student account' });
  }
});

export default router;
JSEOF
echo "4/8 routes/staff.js"

cat > server/src/index.js << 'JSEOF'
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import packagesRoutes from './routes/packages.js';
import accountRoutes from './routes/account.js';
import staffRoutes from './routes/staff.js';
import { requireAuth } from './middleware/auth.js';
import { pruneExpiredRefreshTokens } from './db/queries.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/staff', staffRoutes);

app.get('/api/protected-example', requireAuth, (req, res) => {
  res.json({ message: `Hello ${req.user.name}, this route required a valid access token.` });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const isDirectRun = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Trillionet auth server running on http://localhost:${PORT}`);
  });

  setInterval(() => {
    pruneExpiredRefreshTokens().catch(err => console.error('Token cleanup failed:', err));
  }, 24 * 60 * 60 * 1000);
}

export default app;
JSEOF
echo "5/8 index.js"

cat > server/src/seed.js << 'JSEOF'
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { findUserByRegNo, findUserByEmail, createUser, updateUserPassword, revokeAllRefreshTokensForUser } from './db/queries.js';
import { pool } from './db/pool.js';

const demoUser = {
  regNo: 'TCT/2024/0142',
  email: 'faith.mwangi@trillionet.ac.ke',
  name: 'Faith Mwangi',
  role: 'student',
};

const staffUser = {
  regNo: 'STAFF-0001',
  email: 'admin@trillionet.ac.ke',
  name: 'Admin',
  role: 'staff',
};

const PLAINTEXT_PASSWORD = 'Trillionet2026!';
const STAFF_PASSWORD = 'TrillionetStaff2026!';

const catalog = [
  {
    id: 'computer-packages', name: 'Computer Packages', category: 'Foundations', instructor: 'Ms. Wanjiru',
    total_lessons: 20, color: 'var(--navy)', price: 3500,
    description: 'MS Word, MS Excel, MS PowerPoint, MS Publisher, Internet, Cyber Security, Introduction to Programming',
  },
  { id: 'photoshop',  name: 'Adobe Photoshop',    category: 'Graphic Design', instructor: 'Mr. Otieno',  total_lessons: 24, color: 'var(--blue)',       price: 7000,  description: null },
  { id: 'coreldraw',  name: 'CorelDraw',           category: 'Graphic Design', instructor: 'Ms. Chebet',  total_lessons: 20, color: 'var(--ice)',        price: 5000,  description: null },
  { id: 'sage',       name: 'Sage',                category: 'Accounting',     instructor: 'Mr. Kiplagat',total_lessons: 18, color: 'var(--amber)',      price: 5000,  description: null },
  { id: 'quickbooks', name: 'QuickBooks',          category: 'Accounting',     instructor: 'Mr. Kiplagat',total_lessons: 18, color: 'var(--green)',      price: 5000,  description: null },
  { id: 'webdev',     name: 'Website Development', category: 'Programming',    instructor: 'Dr. Barasa',  total_lessons: 30, color: 'var(--red)',        price: 10000, description: null },
];

const catalogIds = catalog.map(p => p.id);

const demoEnrollments = [
  { packageId: 'coreldraw', completedLessons: 14, nextClass: 'Wed · 10:00' },
  { packageId: 'photoshop', completedLessons: 9,  nextClass: 'Mon · 08:00' },
  { packageId: 'webdev',    completedLessons: 22, nextClass: 'Thu · 14:00' },
];

async function syncCatalog() {
  const { rows: removed } = await pool.query(
    `DELETE FROM packages WHERE id != ALL($1::text[]) RETURNING id, name`,
    [catalogIds],
  );
  if (removed.length) {
    console.log(`Removed ${removed.length} discontinued package(s): ${removed.map(r => r.name).join(', ')}`);
  }

  for (const pkg of catalog) {
    await pool.query(
      `INSERT INTO packages (id, name, category, instructor, total_lessons, color, price, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, category = EXCLUDED.category, instructor = EXCLUDED.instructor,
         total_lessons = EXCLUDED.total_lessons, color = EXCLUDED.color,
         price = EXCLUDED.price, description = EXCLUDED.description`,
      [pkg.id, pkg.name, pkg.category, pkg.instructor, pkg.total_lessons, pkg.color, pkg.price, pkg.description],
    );
  }
  console.log(`Catalog: ${catalog.length} packages ensured (prices and descriptions kept in sync).`);
}

async function seedDemoUser() {
  let user = await findUserByRegNo(demoUser.regNo);
  const passwordHash = await bcrypt.hash(PLAINTEXT_PASSWORD, 10);

  if (!user) {
    user = await createUser({ ...demoUser, passwordHash });
    console.log('Seeded demo user:');
  } else {
    await updateUserPassword(user.id, passwordHash);
    await revokeAllRefreshTokensForUser(user.id);
    console.log('Demo user already existed — password rotated:');
  }
  console.log(`  Reg no / email : ${demoUser.regNo} / ${demoUser.email}`);
  console.log(`  Password       : ${PLAINTEXT_PASSWORD}`);
  return user;
}

async function seedEnrollments(userId) {
  for (const e of demoEnrollments) {
    await pool.query(
      `INSERT INTO enrollments (user_id, package_id, completed_lessons, next_class)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, package_id) DO NOTHING`,
      [userId, e.packageId, e.completedLessons, e.nextClass],
    );
  }
  console.log(`Enrollments: ${demoEnrollments.length} ensured for demo user.`);
}

async function seedStaffUser() {
  let user = await findUserByEmail(staffUser.email);
  const passwordHash = await bcrypt.hash(STAFF_PASSWORD, 10);

  if (!user) {
    user = await createUser({ ...staffUser, passwordHash });
    console.log('Seeded staff user:');
  } else {
    await updateUserPassword(user.id, passwordHash);
    await revokeAllRefreshTokensForUser(user.id);
    console.log('Staff user already existed — password rotated:');
  }
  console.log(`  Email    : ${staffUser.email}`);
  console.log(`  Password : ${STAFF_PASSWORD}`);
  return user;
}

async function seed() {
  await syncCatalog();
  const user = await seedDemoUser();
  await seedEnrollments(user.id);
  await seedStaffUser();
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
JSEOF
echo "6/8 seed.js"

echo ""
echo "Backend done. Verify with:"
echo "  grep -c requireRole server/src/middleware/auth.js"
echo "  grep -c staffRoutes server/src/index.js"