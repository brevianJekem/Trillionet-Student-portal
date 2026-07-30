import { apiFetch } from './client';

export async function fetchPackages() {
  const res = await apiFetch('/packages');
  if (!res.ok) throw new Error('Could not load packages');
  const data = await res.json();
  return data.packages;
}

export async function enrollInPackage(packageId) {
  const res = await apiFetch(`/packages/${packageId}/enroll`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Could not register for this package');
  }
  return true;
}

export async function dropPackage(packageId) {
  const res = await apiFetch(`/packages/${packageId}/enroll`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Could not drop this package');
  }
  return true;
}