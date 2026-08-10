cd "$(dirname "$0")"

# 1. Schema — add transaction_code column
python3 -c "
path = 'server/src/db/schema.sql'
with open(path) as f:
    content = f.read()
old = '''CREATE TABLE IF NOT EXISTS fee_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL,
  method       TEXT NOT NULL DEFAULT \'cash\',
  note         TEXT,
  recorded_by  UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);'''
new = old + '''

ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS transaction_code TEXT;'''
content = content.replace(old, new)
with open(path, 'w') as f:
    f.write(content)
print('1/5 schema.sql')
"

# 2. db/staff.js — full replacement with real balance calculation
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

export async function recordFeePayment({ userId, amount, method, note, transactionCode, recordedBy }) {
  const { rows } = await pool.query(
    `INSERT INTO fee_payments (user_id, amount, method, note, transaction_code, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, amount, method || 'cash', note || null, transactionCode || null, recordedBy],
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

export async function getFeesSummaryForUser(userId) {
  const { rows: feeRows } = await pool.query(
    `SELECT COALESCE(SUM(p.price), 0) AS total_fee
     FROM enrollments e JOIN packages p ON p.id = e.package_id
     WHERE e.user_id = $1`,
    [userId],
  );
  const totalFee = Number(feeRows[0].total_fee);

  const { rows: paidRows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_paid FROM fee_payments WHERE user_id = $1`,
    [userId],
  );
  const totalPaid = Number(paidRows[0].total_paid);

  const { rows: payments } = await pool.query(
    `SELECT id, amount, method, transaction_code, note, created_at
     FROM fee_payments WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );

  return { totalFee, totalPaid, balance: totalFee - totalPaid, payments };
}

export async function listStudents() {
  const { rows } = await pool.query(
    `SELECT
       u.id, u.reg_no, u.name, u.email, u.phone, u.parent_phone, u.created_at,
       COALESCE(fp.total_paid, 0) AS total_paid,
       COALESCE(en.package_count, 0) AS package_count,
       COALESCE(en.total_fee, 0) AS total_fee
     FROM users u
     LEFT JOIN (
       SELECT user_id, SUM(amount) AS total_paid FROM fee_payments GROUP BY user_id
     ) fp ON fp.user_id = u.id
     LEFT JOIN (
       SELECT e.user_id, COUNT(*) AS package_count, SUM(p.price) AS total_fee
       FROM enrollments e JOIN packages p ON p.id = e.package_id
       GROUP BY e.user_id
     ) en ON en.user_id = u.id
     WHERE u.role = 'student'
     ORDER BY u.created_at DESC`,
  );
  return rows;
}
JSEOF
echo "2/5 db/staff.js"

# 3. routes/staff.js — full replacement, adding payment endpoints
cat > server/src/routes/staff.js << 'JSEOF'
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { nextAdmissionNumber, createStudent, recordFeePayment, listStudents, getFeesSummaryForUser } from '../db/staff.js';
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
        id: s.id, regNo: s.reg_no, name: s.name, email: s.email,
        phone: s.phone || '', parentPhone: s.parent_phone || '',
        totalPaid: Number(s.total_paid), totalFee: Number(s.total_fee),
        balance: Number(s.total_fee) - Number(s.total_paid),
        packageCount: Number(s.package_count), createdAt: s.created_at,
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
    if (!name || !name.trim()) return res.status(400).json({ error: 'Student name is required' });

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
      for (const pkgId of packageIds) await enrollUserInPackage(student.id, pkgId);
    }

    res.status(201).json({
      student: {
        id: student.id, regNo: student.reg_no, name: student.name,
        phone: student.phone || '', parentPhone: student.parent_phone || '',
      },
      tempPassword,
    });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ error: 'Could not create the student account' });
  }
});

router.post('/students/:id/payments', async (req, res) => {
  try {
    const { amount, method, transactionCode, note } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return res.status(400).json({ error: 'Enter a valid payment amount' });

    await recordFeePayment({
      userId: req.params.id, amount: numAmount, method: method || 'cash',
      transactionCode: transactionCode?.trim() || null, note: note || null, recordedBy: req.user.sub,
    });

    const summary = await getFeesSummaryForUser(req.params.id);
    res.status(201).json({ totalFee: summary.totalFee, totalPaid: summary.totalPaid, balance: summary.balance });
  } catch (err) {
    console.error('Staff record payment error:', err);
    res.status(500).json({ error: 'Could not record the payment' });
  }
});

router.get('/students/:id/fees', async (req, res) => {
  try {
    const summary = await getFeesSummaryForUser(req.params.id);
    res.json({
      totalFee: summary.totalFee, totalPaid: summary.totalPaid, balance: summary.balance,
      payments: summary.payments.map(p => ({
        id: p.id, amount: p.amount, method: p.method,
        transactionCode: p.transaction_code, note: p.note, date: p.created_at,
      })),
    });
  } catch (err) {
    console.error('Staff fees detail error:', err);
    res.status(500).json({ error: 'Could not load fee details' });
  }
});

export default router;
JSEOF
echo "3/5 routes/staff.js"

# 4. routes/fees.js — new file
cat > server/src/routes/fees.js << 'JSEOF'
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getFeesSummaryForUser, recordFeePayment } from '../db/staff.js';

const router = Router();

function toClientShape(summary) {
  return {
    totalFee: summary.totalFee, totalPaid: summary.totalPaid, balance: summary.balance,
    payments: summary.payments.map(p => ({
      id: p.id, amount: p.amount, method: p.method,
      transactionCode: p.transaction_code, note: p.note, date: p.created_at,
    })),
  };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const summary = await getFeesSummaryForUser(req.user.sub);
    res.json(toClientShape(summary));
  } catch (err) {
    console.error('Fees summary error:', err);
    res.status(500).json({ error: 'Could not load your fee statement' });
  }
});

router.post('/pay', requireAuth, async (req, res) => {
  try {
    const { amount, method, transactionCode } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return res.status(400).json({ error: 'Enter a valid payment amount' });
    if (method === 'mpesa' && (!transactionCode || !transactionCode.trim())) {
      return res.status(400).json({ error: 'Enter the M-Pesa transaction code from your confirmation SMS' });
    }

    await recordFeePayment({
      userId: req.user.sub, amount: numAmount, method: method || 'mpesa',
      transactionCode: transactionCode?.trim() || null, recordedBy: req.user.sub,
    });

    const summary = await getFeesSummaryForUser(req.user.sub);
    res.status(201).json(toClientShape(summary));
  } catch (err) {
    console.error('Record payment error:', err);
    res.status(500).json({ error: 'Could not record your payment' });
  }
});

export default router;
JSEOF
echo "4/5 routes/fees.js"

# 5. index.js — mount fees route
python3 -c "
path = 'server/src/index.js'
with open(path) as f:
    content = f.read()
content = content.replace(
    \"import staffRoutes from './routes/staff.js';\",
    \"import staffRoutes from './routes/staff.js';\nimport feesRoutes from './routes/fees.js';\"
)
content = content.replace(
    \"app.use('/api/staff', staffRoutes);\",
    \"app.use('/api/staff', staffRoutes);\napp.use('/api/fees', feesRoutes);\"
)
with open(path, 'w') as f:
    f.write(content)
print('5/5 index.js')
"

echo ""
echo "Backend done. Verify: grep -c transaction_code server/src/db/schema.sql server/src/db/staff.js"