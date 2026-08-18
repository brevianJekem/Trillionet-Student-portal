import { pool } from './pool.js';

export async function createLaptopOrder({ name, phone, email, budget, useCase, message }) {
  const { rows } = await pool.query(
    `INSERT INTO laptop_orders (name, phone, email, budget, use_case, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, phone, email || null, budget || null, useCase || null, message || null],
  );
  return rows[0];
}

export async function listLaptopOrders() {
  const { rows } = await pool.query(
    `SELECT * FROM laptop_orders ORDER BY created_at DESC`,
  );
  return rows;
}

export async function updateLaptopOrderStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE laptop_orders SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id],
  );
  return rows[0] || null;
}