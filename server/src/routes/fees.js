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
