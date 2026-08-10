cd "$(dirname "$0")"

# 1. api/fees.js — new file
cat > src/api/fees.js << 'JSEOF'
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
JSEOF
echo "1/6 api/fees.js"

# 2. api/staff.js — add recordPaymentForStudent
python3 -c "
path = 'src/api/staff.js'
with open(path) as f:
    content = f.read()
content = content.rstrip() + '''

export async function recordPaymentForStudent(studentId, payload) {
  const res = await apiFetch(\`/staff/students/\${studentId}/payments\`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not record the payment');
  return data;
}
'''
with open(path, 'w') as f:
    f.write(content)
print('2/6 api/staff.js — recordPaymentForStudent added')
"

# 3. utils/receipt.js — new file
mkdir -p src/utils
cat > src/utils/receipt.js << 'JSEOF'
export function openReceipt({ studentName, regNo, payment }) {
  const date = new Date(payment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Receipt — ${regNo}</title>
<style>
  body { font-family: -apple-system, Inter, sans-serif; max-width: 480px; margin: 40px auto; color: #1D1D1F; }
  .header { text-align: center; margin-bottom: 32px; }
  .header h1 { font-size: 18px; margin: 0 0 4px; }
  .header p { font-size: 12px; color: #6E6E73; margin: 0; }
  .receipt-title { text-align: center; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #052659; margin-bottom: 24px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 13px; }
  .row .label { color: #6E6E73; }
  .row .value { font-weight: 500; }
  .amount { text-align: center; margin: 28px 0; }
  .amount .num { font-size: 32px; font-weight: 700; color: #052659; }
  .amount .lbl { font-size: 11px; color: #6E6E73; text-transform: uppercase; letter-spacing: 0.04em; }
  .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #A1A1A6; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <div class="header">
    <h1>Trillionet Computer Training Center</h1>
    <p>Official Payment Receipt</p>
  </div>
  <div class="receipt-title">Payment Confirmation</div>
  <div class="amount">
    <div class="num">KSh ${payment.amount.toLocaleString()}</div>
    <div class="lbl">Amount Paid</div>
  </div>
  <div class="row"><span class="label">Student</span><span class="value">${studentName}</span></div>
  <div class="row"><span class="label">Admission No.</span><span class="value">${regNo}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
  <div class="row"><span class="label">Method</span><span class="value">${payment.method.toUpperCase()}</span></div>
  ${payment.transactionCode ? `<div class="row"><span class="label">Transaction code</span><span class="value">${payment.transactionCode}</span></div>` : ''}
  <div class="row"><span class="label">Receipt ID</span><span class="value">${payment.id.slice(0, 8).toUpperCase()}</span></div>
  <div class="footer">This is a system-generated receipt. Keep it for your records.</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
JSEOF
echo "3/6 utils/receipt.js"

# 4. pages/Fees.jsx — full replacement
cat > src/pages/Fees.jsx << 'JSEOF'
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { fetchFeesSummary, submitPayment } from '../api/fees';
import { openReceipt } from '../utils/receipt';
import { SkeletonLine, SkeletonRow } from '../components/Skeleton';

export default function Fees() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showPay, setShowPay] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('mpesa');
  const [transactionCode, setTransactionCode] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [paySuccess, setPaySuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setSummary(await fetchFeesSummary());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    setPayError(null);
    setPaying(true);
    try {
      const updated = await submitPayment({ amount: Number(amount), method, transactionCode });
      setSummary(updated);
      setPaySuccess(true);
      setAmount(''); setTransactionCode('');
      setTimeout(() => { setPaySuccess(false); setShowPay(false); }, 1800);
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleReceipt = (payment) => {
    const ok = openReceipt({ studentName: user?.name || 'Student', regNo: user?.regNo || '', payment });
    if (!ok) alert('Please allow pop-ups to download your receipt.');
  };

  return (
    <Layout title="Fees">
      {error && (
        <div style={{ background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <section className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          {loading ? <SkeletonLine width={90} height={22} /> : <div className="num">KSh {summary.totalFee.toLocaleString()}</div>}
          <div className="lbl">Total program fee</div>
        </div>
        <div className="stat-card">
          {loading ? <SkeletonLine width={90} height={22} /> : <div className="num" style={{ color: 'var(--green)' }}>KSh {summary.totalPaid.toLocaleString()}</div>}
          <div className="lbl">Total paid</div>
        </div>
        <div className="stat-card">
          {loading ? <SkeletonLine width={90} height={22} /> : (
            <div className="num" style={{ color: summary.balance > 0 ? 'var(--red)' : 'var(--green)' }}>KSh {summary.balance.toLocaleString()}</div>
          )}
          <div className="lbl">Balance</div>
        </div>
      </section>

      <div className="panel" style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowPay(s => !s)}>
          <i className="ti ti-device-mobile"></i>{showPay ? 'Cancel' : 'Make a payment'}
        </button>

        {showPay && (
          <form onSubmit={handlePay} style={{ marginTop: 18, maxWidth: 380 }}>
            {payError && (
              <div style={{ background: 'var(--red-bg)', color: 'var(--red)', fontSize: 12.5, padding: '9px 13px', borderRadius: 9, marginBottom: 14 }}>
                {payError}
              </div>
            )}
            {paySuccess && (
              <div style={{ background: 'var(--green-bg)', color: 'var(--green)', fontSize: 12.5, padding: '9px 13px', borderRadius: 9, marginBottom: 14 }}>
                Payment recorded — thank you!
              </div>
            )}

            <div className="field">
              <label>Payment method</label>
              <select value={method} onChange={e => setMethod(e.target.value)}>
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank transfer</option>
                <option value="cash">Cash (paid at front office)</option>
              </select>
            </div>

            <div className="field">
              <label>Amount (KSh)</label>
              <input type="number" min="1" placeholder="e.g. 2000" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>

            {method === 'mpesa' && (
              <div className="field">
                <label>M-Pesa transaction code</label>
                <input
                  type="text" placeholder="e.g. QRT8HDSIU9"
                  value={transactionCode} onChange={e => setTransactionCode(e.target.value.toUpperCase())}
                  required
                />
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5 }}>
                  Found in the M-Pesa confirmation SMS you received after paying.
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={paying} style={{ width: '100%' }}>
              {paying ? 'Recording…' : 'Submit payment'}
            </button>
          </form>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Payment history</h3>
            <p className="sub">All payments recorded on your account</p>
          </div>
        </div>

        {loading ? (
          <div><SkeletonRow withBar={false} /><SkeletonRow withBar={false} /></div>
        ) : summary.payments.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-receipt-off"></i>
            <div className="t">No payments yet</div>
            <div className="m">Payments you make will show up here.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Method</th><th>Transaction code</th><th>Amount</th><th></th></tr>
              </thead>
              <tbody>
                {summary.payments.map(p => (
                  <tr key={p.id}>
                    <td className="muted">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="muted" style={{ textTransform: 'uppercase' }}>{p.method}</td>
                    <td className="mono">{p.transactionCode || '—'}</td>
                    <td style={{ fontWeight: 500 }}>KSh {p.amount.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleReceipt(p)}>
                        <i className="ti ti-receipt"></i>Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
JSEOF
echo "4/6 pages/Fees.jsx"

# 5. pages/Dashboard.jsx — full replacement, fee card now real
cat > src/pages/Dashboard.jsx << 'JSEOF'
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Rings from '../components/Rings';
import { useAuth } from '../context/AuthContext';
import { fetchPackages } from '../api/packages';
import { fetchFeesSummary } from '../api/fees';
import { SkeletonLine, SkeletonPackageCard, SkeletonRow } from '../components/Skeleton';
import { student, announcements } from '../data/mock';

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = (user?.name || student.name).split(' ')[0];

  const [packages, setPackages] = useState([]);
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [pkgs, feesSummary] = await Promise.all([fetchPackages(), fetchFeesSummary()]);
        setPackages(pkgs);
        setFees(feesSummary);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const enrolled = packages.filter(p => p.enrolled);
  const overallProgress = enrolled.length
    ? Math.round(enrolled.reduce((s, p) => s + p.completedLessons / p.totalLessons, 0) / enrolled.length * 100)
    : 0;
  const upcoming = enrolled.filter(p => p.nextClass).sort((a, b) => a.nextClass.localeCompare(b.nextClass));
  const balance = fees?.balance ?? 0;

  const primaryAction = enrolled.length === 0
    ? { href: '#/packages', icon: 'ti-apps', label: 'Register a package' }
    : balance > 0
      ? { href: '#/fees', icon: 'ti-credit-card', label: 'Pay fees' }
      : { href: '#/assignments', icon: 'ti-file-upload', label: 'Submit assignment' };

  const secondaryActions = [
    { href: '#/packages', icon: 'ti-apps', label: 'Register a package' },
    { href: '#/fees', icon: 'ti-credit-card', label: 'Pay fees' },
    { href: '#/assignments', icon: 'ti-file-upload', label: 'Submit assignment' },
    { href: '#/messages', icon: 'ti-flag', label: 'File a complaint' },
  ].filter(a => a.label !== primaryAction.label);

  return (
    <Layout title="Dashboard">
      {error && (
        <div style={{ background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!loading && (
        balance > 0 ? (
          <div className="status-banner status-banner-alert">
            <div>
              <div className="status-banner-label">Outstanding balance</div>
              <div className="status-banner-title">KSh {balance.toLocaleString()} due</div>
            </div>
            <a href="#/fees" className="btn-status-cta">Pay now <i className="ti ti-arrow-right"></i></a>
          </div>
        ) : (
          <div className="status-banner status-banner-ok">
            <div>
              <div className="status-banner-label">Account status</div>
              <div className="status-banner-title">You're all paid up</div>
            </div>
          </div>
        )
      )}

      <div className="hero-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <section className="hero-panel">
            <div>
              <h2 className="heading">Welcome back, {firstName}</h2>
              <p>
                {loading ? <SkeletonLine width={220} height={13} /> : (
                  <>You're enrolled in {enrolled.length} package{enrolled.length !== 1 ? 's' : ''} and have
                  {' '}{upcoming.length} class{upcoming.length !== 1 ? 'es' : ''} coming up.</>
                )}
              </p>
            </div>
            <Rings
              outer={overallProgress}
              inner={student.attendance}
              centerValue={`${overallProgress}%`}
              centerLabel="progress"
            />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>My packages</h3>
              <a href="#/packages" className="link-action">View all</a>
            </div>

            {loading ? (
              <div>
                <SkeletonPackageCard />
                <SkeletonPackageCard />
                <SkeletonPackageCard />
              </div>
            ) : enrolled.length === 0 ? (
              <div className="empty-state">
                <i className="ti ti-apps-off"></i>
                <div className="t">No packages registered</div>
                <div className="m">Browse available packages to get started.</div>
              </div>
            ) : (
              enrolled.map((p, i) => {
                const pct = Math.round((p.completedLessons / p.totalLessons) * 100);
                return (
                  <div key={p.id} style={{ padding: '13px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 1 }}>{p.instructor}</div>
                      </div>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pct}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>

        <div className="side-cards">
          <div className="info-card tone-blue">
            <div className="ic-icon"><i className="ti ti-coin"></i></div>
            <div className="ic-label">Fee balance</div>
            <div className="ic-value">{loading ? '…' : `KSh ${balance.toLocaleString()}`}</div>
            <a href="#/fees" className="btn-ghost-light" style={{ textDecoration: 'none', display: 'inline-block' }}>Pay now</a>
          </div>

          <div className="info-card tone-navy">
            <div className="ic-icon"><i className="ti ti-calendar-check"></i></div>
            <div className="ic-label">Attendance</div>
            <div className="ic-value" style={{ fontSize: 13, marginBottom: 10 }}>Across all enrolled packages</div>
            <div className="progress-track-light">
              <div className="progress-fill-light" style={{ width: `${student.attendance}%` }}></div>
            </div>
            <div className="ic-meta" style={{ marginTop: 8, marginBottom: 0 }}>{student.attendance}% attendance</div>
          </div>

          <div className="panel support-card">
            <div className="panel-head" style={{ marginBottom: 8 }}><h3>Support</h3></div>
            <a href="#/messages" className="support-link"><i className="ti ti-message-circle"></i>Message an instructor</a>
            <a href="#/messages" className="support-link"><i className="ti ti-flag"></i>File a complaint</a>
            <a href="#" className="support-link"><i className="ti ti-mail"></i>Contact administration</a>
          </div>
        </div>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 16 }}>
        <div className="panel">
          <div className="panel-head">
            <h3>Upcoming classes</h3>
            <a href="#/schedule" className="link-action">Full schedule</a>
          </div>
          {loading ? (
            <div>
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="m">No upcoming classes scheduled.</div>
            </div>
          ) : upcoming.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <div style={{ width: 3, height: 32, borderRadius: 2, flexShrink: 0, background: p.color }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 1 }}>{p.instructor}</div>
              </div>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{p.nextClass}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Announcements</h3>
            <a href="#" className="link-action">View all</a>
          </div>
          {announcements.map((a, i) => (
            <div key={i} style={{ padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.body}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>{a.date}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="quick">
        <a href={primaryAction.href} className="quick-btn quick-btn-primary">
          <i className={`ti ${primaryAction.icon}`}></i>{primaryAction.label}
        </a>
        {secondaryActions.map(a => (
          <a key={a.label} href={a.href} className="quick-btn">
            <i className={`ti ${a.icon}`}></i>{a.label}
          </a>
        ))}
      </div>
    </Layout>
  );
}
JSEOF
echo "5/6 pages/Dashboard.jsx"

# 6. pages/staff/StaffStudents.jsx — full replacement, real balance + inline payment recording
cat > src/pages/staff/StaffStudents.jsx << 'JSEOF'
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

  const [payingFor, setPayingFor] = useState(null);
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
JSEOF
echo "6/6 pages/staff/StaffStudents.jsx"

echo ""
echo "Frontend done. Verify: grep -c transactionCode src/pages/Fees.jsx src/pages/staff/StaffStudents.jsx"