cd "$(dirname "$0")"

# 1. Full schema.sql — complete, correct version with all columns
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
echo "1/3 schema.sql — full file written"

# 2. Full packages.js route
cat > server/src/routes/packages.js << 'JSEOF'
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getPackagesWithEnrollmentStatus, enrollUserInPackage, dropUserFromPackage, findPackageById,
} from '../db/packages.js';

const router = Router();

function toClientShape(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    instructor: row.instructor,
    totalLessons: row.total_lessons,
    color: row.color,
    price: row.price,
    description: row.description,
    enrolled: !!row.enrolled,
    completedLessons: row.completed_lessons ?? 0,
    nextClass: row.next_class ?? null,
  };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await getPackagesWithEnrollmentStatus(req.user.sub);
    res.json({ packages: rows.map(toClientShape) });
  } catch (err) {
    console.error('List packages error:', err);
    res.status(500).json({ error: 'Could not load packages' });
  }
});

router.post('/:id/enroll', requireAuth, async (req, res) => {
  try {
    const pkg = await findPackageById(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    await enrollUserInPackage(req.user.sub, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).json({ error: 'Could not complete registration' });
  }
});

router.delete('/:id/enroll', requireAuth, async (req, res) => {
  try {
    await dropUserFromPackage(req.user.sub, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Drop error:', err);
    res.status(500).json({ error: 'Could not drop the package' });
  }
});

export default router;
JSEOF
echo "2/3 packages.js — full file written"

# 3. Full seed.js with the real catalog
cat > server/src/seed.js << 'JSEOF'
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { findUserByRegNo, createUser, updateUserPassword, revokeAllRefreshTokensForUser } from './db/queries.js';
import { pool } from './db/pool.js';

const demoUser = {
  regNo: 'TCT/2024/0142',
  email: 'faith.mwangi@trillionet.ac.ke',
  name: 'Faith Mwangi',
  role: 'student',
};

const PLAINTEXT_PASSWORD = 'Trillionet2026!';

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

async function seed() {
  await syncCatalog();
  const user = await seedDemoUser();
  await seedEnrollments(user.id);
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
JSEOF
echo "3/3 seed.js — real catalog written"

echo ""
echo "Files written. Verifying..."
grep -c "price" server/src/db/schema.sql server/src/routes/packages.js server/src/seed.js