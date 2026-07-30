import { pool } from './pool.js';

export async function getAllPackages() {
  const { rows } = await pool.query('SELECT * FROM packages ORDER BY name');
  return rows;
}

export async function getEnrollmentsForUser(userId) {
  const { rows } = await pool.query(
    `SELECT p.*, e.completed_lessons, e.next_class, e.enrolled_at
     FROM enrollments e
     JOIN packages p ON p.id = e.package_id
     WHERE e.user_id = $1
     ORDER BY p.name`,
    [userId],
  );
  return rows;
}

export async function getPackagesWithEnrollmentStatus(userId) {
  const { rows } = await pool.query(
    `SELECT
       p.*,
       e.id IS NOT NULL AS enrolled,
       e.completed_lessons,
       e.next_class
     FROM packages p
     LEFT JOIN enrollments e ON e.package_id = p.id AND e.user_id = $1
     ORDER BY p.name`,
    [userId],
  );
  return rows;
}

export async function enrollUserInPackage(userId, packageId) {
  const { rows } = await pool.query(
    `INSERT INTO enrollments (user_id, package_id, completed_lessons)
     VALUES ($1, $2, 0)
     ON CONFLICT (user_id, package_id) DO NOTHING
     RETURNING *`,
    [userId, packageId],
  );
  return rows[0] || null;
}

export async function dropUserFromPackage(userId, packageId) {
  await pool.query(
    'DELETE FROM enrollments WHERE user_id = $1 AND package_id = $2',
    [userId, packageId],
  );
}

export async function findPackageById(packageId) {
  const { rows } = await pool.query('SELECT * FROM packages WHERE id = $1', [packageId]);
  return rows[0] || null;
}