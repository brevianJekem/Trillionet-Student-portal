import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import packagesRoutes from './routes/packages.js';
import accountRoutes from './routes/account.js';
import staffRoutes from './routes/staff.js';
import { requireAuth } from './middleware/auth.js';
import { pruneExpiredRefreshTokens } from './db/queries.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/staff', staffRoutes);

app.get('/api/protected-example', requireAuth, (req, res) => {
  res.json({ message: `Hello ${req.user.name}, this route required a valid access token.` });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const isDirectRun = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Trillionet auth server running on http://localhost:${PORT}`);
  });

  setInterval(() => {
    pruneExpiredRefreshTokens().catch(err => console.error('Token cleanup failed:', err));
  }, 24 * 60 * 60 * 1000);
}

export default app;
