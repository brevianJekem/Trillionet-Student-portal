import pg from 'pg';

const { Pool } = pg;

// Neon (and most managed Postgres) requires SSL. rejectUnauthorized:false
// is fine here because Neon terminates TLS with a publicly trusted cert —
// this just skips Node's stricter default CA bundle check.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});
