import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { findUserByRegNo, createUser } from './db/queries.js';
import { pool } from './db/pool.js';

const demoUser = {
  regNo: 'TCT/2024/0142',
  email: 'faith.mwangi@trillionet.ac.ke',
  name: 'Faith Mwangi',
  role: 'student',
};

const PLAINTEXT_PASSWORD = 'password123';

async function seed() {
  const existing = await findUserByRegNo(demoUser.regNo);
  if (existing) {
    console.log('Demo user already exists — skipping seed.');
    await pool.end();
    return;
  }
  const passwordHash = await bcrypt.hash(PLAINTEXT_PASSWORD, 10);
  await createUser({ ...demoUser, passwordHash });
  console.log('Seeded demo user:');
  console.log(`  Reg no / email : ${demoUser.regNo} / ${demoUser.email}`);
  console.log(`  Password       : ${PLAINTEXT_PASSWORD}`);
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
