-- Run this once against your Neon database before starting the server.
-- psql "$DATABASE_URL" -f src/db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no         TEXT UNIQUE NOT NULL,
  email          TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'student',
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

CREATE TABLE IF NOT EXISTS admission_sequences (
  year         INTEGER PRIMARY KEY,
  last_number  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fee_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL,
  method       TEXT NOT NULL DEFAULT 'cash',
  note         TEXT,
  recorded_by  UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS transaction_code TEXT;

CREATE INDEX IF NOT EXISTS idx_fee_payments_user_id ON fee_payments(user_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

CREATE TABLE IF NOT EXISTS packages (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL,
  instructor     TEXT NOT NULL,
  total_lessons  INTEGER NOT NULL,
  color          TEXT NOT NULL DEFAULT 'var(--blue)',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE packages ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 0;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS enrollments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id         TEXT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  completed_lessons  INTEGER NOT NULL DEFAULT 0,
  next_class         TEXT,
  enrolled_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_package_id ON enrollments(package_id);
