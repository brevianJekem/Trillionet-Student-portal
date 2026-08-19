import { Router } from 'express';
import { createLaptopOrder } from '../db/orders.js';

const router = Router();

// POST /api/orders/laptops — public, anyone can submit this from the landing page
router.post('/laptops', async (req, res) => {
  try {
    const { name, phone, email, budget, useCase, message, website } = req.body;

    // Honeypot: a real visitor never fills in this hidden field, a bot often does.
    if (website) return res.status(201).json({ ok: true });

    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!phone || !phone.trim()) return res.status(400).json({ error: 'Phone number is required' });

    await createLaptopOrder({
      name: name.trim(), phone: phone.trim(), email, budget, useCase, message,
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Create laptop order error:', err);
    res.status(500).json({ error: 'Could not submit your request — please try again or call us directly.' });
  }
});

export default router;