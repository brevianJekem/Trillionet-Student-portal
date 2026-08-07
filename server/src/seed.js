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
