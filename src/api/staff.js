import { apiFetch } from './client';

export async function fetchStudents() {
  const res = await apiFetch('/staff/students');
  if (!res.ok) throw new Error('Could not load students');
  const data = await res.json();
  return data.students;
}

export async function createStudentAccount(payload) {
  const res = await apiFetch('/staff/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not create the student account');
  return data;
}

export async function recordPaymentForStudent(studentId, payload) {
  const res = await apiFetch(`/staff/students/${studentId}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not record the payment');
  return data;
}
