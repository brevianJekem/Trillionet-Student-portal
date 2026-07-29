import { useState } from 'react';
import Layout from '../components/Layout';
import { student, feeHistory } from '../data/mock';

export default function Fees() {
  const [showPay, setShowPay] = useState(false);
  const totalPaid = feeHistory.reduce((s, f) => s + f.amount, 0);

  return (
    <Layout title="Fees">
      <section className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="num" style={{ color: 'var(--red)' }}>KSh {student.feeBalance.toLocaleString()}</div>
          <div className="lbl">Outstanding balance</div>
        </div>
        <div className="stat-card">
          <div className="num">KSh {totalPaid.toLocaleString()}</div>
          <div className="lbl">Total paid this year</div>
        </div>
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => setShowPay(s => !s)}>
            <i className="ti ti-device-mobile"></i>Pay with M-Pesa
          </button>
        </div>
      </section>

      {showPay && (
        <div className="panel" style={{ marginBottom: 16, maxWidth: 380 }}>
          <div className="panel-head"><h3>Pay via M-Pesa</h3></div>
          <div className="field"><label>M-Pesa phone number</label><input type="text" placeholder="07XX XXX XXX" /></div>
          <div className="field"><label>Amount (KSh)</label><input type="text" placeholder={String(student.feeBalance)} /></div>
          <button className="btn btn-primary" style={{ width: '100%' }}>Send STK push</button>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Payment history</h3>
            <p className="sub">All payments made towards your registered packages</p>
          </div>
          <button className="btn btn-secondary btn-sm"><i className="ti ti-printer"></i>Print statement</button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Reference</th><th>Description</th><th>Amount</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {feeHistory.map((f, i) => (
                <tr key={i}>
                  <td className="muted">{f.date}</td>
                  <td className="mono">{f.ref}</td>
                  <td>{f.desc}</td>
                  <td style={{ fontWeight: 500 }}>KSh {f.amount.toLocaleString()}</td>
                  <td><span className="tag green"><span className="dot"></span>Paid</span></td>
                  <td style={{ textAlign: 'right' }}><button className="btn btn-secondary btn-sm"><i className="ti ti-receipt"></i>Receipt</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
