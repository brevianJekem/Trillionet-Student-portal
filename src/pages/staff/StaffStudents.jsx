import { useEffect, useState, Fragment } from 'react';
import StaffLayout from '../../components/StaffLayout';
import { fetchStudents, recordPaymentForStudent } from '../../api/staff';
import { openReceipt } from '../../utils/receipt';
import { SkeletonRow } from '../../components/Skeleton';

export default function StaffStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const [payingFor, setPayingFor] = useState(null); // student id currently showing the payment form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payCode, setPayCode] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setStudents(await fetchStudents());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? students.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.regNo.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.email.toLowerCase().includes(q)
      )
    : students;

  const openPayForm = (studentId) => {
    setPayingFor(studentId);
    setPayAmount(''); setPayMethod('cash'); setPayCode(''); setPayError(null);
  };

  const handleRecordPayment = async (e, student) => {
    e.preventDefault();
    setPayError(null);
    setPaySubmitting(true);
    try {
      await recordPaymentForStudent(student.id, {
        amount: Number(payAmount), method: payMethod, transactionCode: payCode || undefined,
      });
      const amountPaid = Number(payAmount);
      setPayingFor(null);
      await load();
      // Offer a receipt immediately, same as the student would get.
      openReceipt({
        studentName: student.name, regNo: student.regNo,
        payment: { id: crypto.randomUUID(), amount: amountPaid, method: payMethod, transactionCode: payCode || null, date: new Date().toISOString() },
      });
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaySubmitting(false);
    }
  };

  return (
    <StaffLayout title="Students">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>All students</h3>
            <p className="sub">{students.length} registered</p>
          </div>
          <a href="#/staff/students/new" className="btn btn-primary btn-sm">
            <i className="ti ti-user-plus"></i>Register student
          </a>
        </div>

        <div className="field" style={{ marginBottom: 18 }}>
          <div className="input-wrap">
            <i className="ti ti-search"></i>
            <input
              type="text"
              placeholder="Search by name, admission number, phone, or email…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div><SkeletonRow withBar={false} /><SkeletonRow withBar={false} /><SkeletonRow withBar={false} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-users"></i>
            <div className="t">{q ? 'No matches' : 'No students yet'}</div>
            <div className="m">{q ? 'Try a different search term.' : 'Register your first student to get started.'}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Admission No.</th><th>Name</th><th>Phone</th><th>Total fee</th><th>Paid</th><th>Balance</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <Fragment key={s.id}>
                    <tr>
                      <td className="mono">{s.regNo}</td>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      <td className="muted">{s.phone || '—'}</td>
                      <td className="muted">KSh {s.totalFee.toLocaleString()}</td>
                      <td className="muted">KSh {s.totalPaid.toLocaleString()}</td>
                      <td style={{ fontWeight: 500, color: s.balance > 0 ? 'var(--red)' : 'var(--green)' }}>
                        KSh {s.balance.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openPayForm(s.id)}>
                          <i className="ti ti-plus"></i>Payment
                        </button>
                      </td>
                    </tr>
                    {payingFor === s.id && (
                      <tr>
                        <td colSpan={7} style={{ background: 'var(--bg)' }}>
                          <form onSubmit={(e) => handleRecordPayment(e, s)} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', padding: '12px 4px', flexWrap: 'wrap' }}>
                            {payError && <div style={{ width: '100%', color: 'var(--red)', fontSize: 12 }}>{payError}</div>}
                            <div style={{ flex: '0 0 110px' }}>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Amount (KSh)</label>
                              <input type="number" min="1" required value={payAmount} onChange={e => setPayAmount(e.target.value)}
                                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13 }} />
                            </div>
                            <div style={{ flex: '0 0 130px' }}>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Method</label>
                              <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13 }}>
                                <option value="cash">Cash</option>
                                <option value="mpesa">M-Pesa</option>
                                <option value="bank">Bank</option>
                              </select>
                            </div>
                            <div style={{ flex: '1 1 160px' }}>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Transaction code (optional)</label>
                              <input type="text" value={payCode} onChange={e => setPayCode(e.target.value.toUpperCase())}
                                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13 }} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm" disabled={paySubmitting}>
                              {paySubmitting ? 'Saving…' : 'Save & print receipt'}
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPayingFor(null)}>Cancel</button>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}