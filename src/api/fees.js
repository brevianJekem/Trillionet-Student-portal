import { apiFetch } from './client';

export async function fetchFeesSummary() {
  const res = await apiFetch('/fees');
  if (!res.ok) throw new Error('Could not load your fee statement');
  return res.json();
}

export async function submitPayment({ amount, method, transactionCode }) {
  const res = await apiFetch('/fees/pay', {
    method: 'POST',
    body: JSON.stringify({ amount, method, transactionCode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not record your payment');
  return data;
}