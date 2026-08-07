import { useEffect, useState } from 'react';
import StaffLayout from '../../components/StaffLayout';
import { createStudentAccount } from '../../api/staff';
import { fetchPackages } from '../../api/packages';

export default function StaffCreateStudent() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [feesPaid, setFeesPaid] = useState('');
  const [feesMethod, setFeesMethod] = useState('cash');
  const [selectedPackages, setSelectedPackages] = useState([]);

  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setPackages(await fetchPackages());
      } catch {
        // optional at registration — ignore failure here
      } finally {
        setPackagesLoading(false);
      }
    })();
  }, []);

  const togglePackage = (id) => {
    setSelectedPackages(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };

  const resetForm = () => {
    setName(''); setPhone(''); setParentPhone(''); setFeesPaid(''); setFeesMethod('cash');
    setSelectedPackages([]); setCreated(null); setCopied(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await createStudentAccount({
        name, phone, parentPhone,
        feesPaid: feesPaid ? Number(feesPaid) : 0,
        feesMethod,
        packageIds: selectedPackages,
      });
      setCreated(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    const text = `Trillionet Computer Training Center\nAdmission No: ${created.student.regNo}\nTemporary password: ${created.tempPassword}\nLogin at: ${window.location.origin}/#/login`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (created) {
    return (
      <StaffLayout title="Register student">
        <div className="panel" style={{ maxWidth: 480 }}>
          <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24,
            }}>
              <i className="ti ti-check"></i>
            </div>
            <h3 style={{ margin: '0 0 4px' }}>{created.student.name} is registered</h3>
            <p className="sub">Save these credentials now — the password won't be shown again.</p>
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 3 }}>Admission number</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{created.student.regNo}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 3 }}>Temporary password</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{created.tempPassword}</div>
            </div>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 10, justifyContent: 'center' }} onClick={copyCredentials}>
            <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`}></i>{copied ? 'Copied' : 'Copy credentials'}
          </button>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={resetForm}>
            <i className="ti ti-user-plus"></i>Register another student
          </button>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout title="Register student">
      <form className="panel" style={{ maxWidth: 560 }} onSubmit={handleSubmit}>
        <div className="panel-head"><h3>Student details</h3></div>

        {error && (
          <div style={{ background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="field">
          <label>Full name</label>
          <input type="text" placeholder="e.g. Brian Otieno" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field">
            <label>Student phone</label>
            <input type="tel" placeholder="07XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label>Parent / guardian phone</label>
            <input type="tel" placeholder="07XX XXX XXX" value={parentPhone} onChange={e => setParentPhone(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field">
            <label>Fees paid now (KSh)</label>
            <input type="number" min="0" placeholder="0" value={feesPaid} onChange={e => setFeesPaid(e.target.value)} />
          </div>
          <div className="field">
            <label>Payment method</label>
            <select value={feesMethod} onChange={e => setFeesMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank">Bank</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Packages (optional — can be added later)</label>
          {packagesLoading ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Loading packages…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {packages.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedPackages.includes(p.id)} onChange={() => togglePackage(p.id)} />
                  {p.name} <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>KSh {p.price.toLocaleString()}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
          {submitting ? 'Registering…' : 'Register student'}
        </button>
      </form>
    </StaffLayout>
  );
}
