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