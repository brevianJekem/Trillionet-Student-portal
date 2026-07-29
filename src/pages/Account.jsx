import { useState } from 'react';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { student } from '../data/mock';

export default function Account() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [twoFA, setTwoFA] = useState(false);
  const [notifs, setNotifs] = useState({ assignments: true, fees: true, classes: true, messages: true });

  const name = user?.name || student.name;
  const regNo = user?.regNo || student.regNo;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Layout title="Account">
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
        <div className="panel" style={{ textAlign: 'center', alignSelf: 'start' }}>
          <div className="avatar-sm" style={{ width: 68, height: 68, fontSize: 20, margin: '0 auto 12px' }}>{initials}</div>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>{name}</div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{regNo}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <div className="panel-head"><h3>Personal details</h3></div>
            <div className="field"><label>Full name</label><input type="text" defaultValue={name} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field"><label>Email</label><input type="text" defaultValue={user?.email || 'faith.mwangi@trillionet.ac.ke'} /></div>
              <div className="field"><label>Phone</label><input type="text" defaultValue="07XX XXX XXX" /></div>
            </div>
            <button className="btn btn-primary btn-sm">Save changes</button>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Security</h3></div>
            <div className="field"><label>Current password</label><input type="password" placeholder="••••••••" /></div>
            <div className="field"><label>New password</label><input type="password" placeholder="••••••••" /></div>
            <button className="btn btn-primary btn-sm" style={{ marginBottom: 4 }}>Update password</button>
            <Toggle label="Two-factor authentication" sub="Require a code at sign-in" checked={twoFA} onChange={() => setTwoFA(v => !v)} />
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Appearance</h3></div>
            <Toggle label="Dark mode" sub="Switch the whole portal to a dark theme" checked={theme === 'dark'} onChange={toggleTheme} />
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Notifications</h3></div>
            {Object.entries({ assignments: 'New assignments', fees: 'Fee reminders', classes: 'Class schedule changes', messages: 'New messages' }).map(([key, label]) => (
              <Toggle key={key} label={label} checked={notifs[key]} onChange={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Toggle({ label, sub, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderTop: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{sub}</div>}
      </div>
      <button
        onClick={onChange}
        style={{
          width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--navy)' : 'var(--border)', position: 'relative', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left .15s ease',
        }} />
      </button>
    </div>
  );
}
