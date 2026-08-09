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