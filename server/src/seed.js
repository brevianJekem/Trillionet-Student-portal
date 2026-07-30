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
  { id: 'coreldraw',   name: 'CorelDraw Essentials', category: 'Graphic Design', instructor: 'Ms. Wanjiru', total_lessons: 20, color: 'var(--navy)' },
  { id: 'photoshop',   name: 'Adobe Photoshop',       category: 'Graphic Design', instructor: 'Mr. Otieno',  total_lessons: 24, color: 'var(--blue)' },
  { id: 'illustrator', name: 'Adobe Illustrator',      category: 'Graphic Design', instructor: 'Ms. Chebet',  total_lessons: 18, color: 'var(--ice)' },
  { id: 'indesign',    name: 'Adobe InDesign',         category: 'Publishing',     instructor: 'Mr. Kiplagat',total_lessons: 16, color: 'var(--amber)' },
  { id: 'webdev',      name: 'Website Development',    category: 'Programming',    instructor: 'Dr. Barasa',  total_lessons: 30, color: 'var(--green)' },
  { id: 'appdev',      name: 'App Development',        category: 'Programming',    instructor: 'Mr. Simiyu',  total_lessons: 28, color: 'var(--red)' },
  { id: 'database',    name: 'Database Management',    category: 'Programming',    instructor: 'Ms. Wanjiru', total_lessons: 20, color: 'var(--blue-light)' },
];

const demoEnrollments = [
  { packageId: 'coreldraw', completedLessons: 14, nextClass: 'Wed · 10:00' },
  { packageId: 'photoshop', completedLessons: 9,  nextClass: 'Mon · 08:00' },
  { packageId: 'webdev',    completedLessons: 22, nextClass: 'Thu · 14:00' },
  { packageId: 'database',  completedLessons: 5,  nextClass: 'Fri · 11:00' },
];

async function seedCatalog() {
  for (const pkg of catalog) {
    await pool.query(
      `INSERT INTO packages (id, name, category, instructor, total_lessons, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [pkg.id, pkg.name, pkg.category, pkg.instructor, pkg.total_lessons, pkg.color],
    );
  }
  console.log(`Catalog: ${catalog.length} packages ensured.`);
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
  await seedCatalog();
  const user = await seedDemoUser();
  await seedEnrollments(user.id);
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});