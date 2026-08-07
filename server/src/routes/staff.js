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
