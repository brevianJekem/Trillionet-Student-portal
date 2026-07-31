import { apiFetch } from './client';

export async function updateProfile({ name, email, phone }) {
  const res = await apiFetch('/account', {
    method: 'PATCH',
    body: JSON.stringify({ name, email, phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not update your profile');
  return data.user;
}

export async function changePassword({ currentPassword, newPassword }) {
  const res = await apiFetch('/account/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not change your password');
  return true;
}
