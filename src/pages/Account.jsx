import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../api/account';

export default function Account() {
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const [twoFA, setTwoFA] = useState(false);
  const [notifs, setNotifs] = useState({ assignments: true, fees: true, classes: true, messages: true });

  const initials = (name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updated = await updateProfile({ name, email, phone });
      updateUser(updated);
      setProfileMsg({ type: 'ok', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMsg({ type: 'ok', text: 'Password changed. Signing you out for security — sign back in with your new password.' });
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <Layout title="Account">
      <div className="account-grid">
        <div className="panel" style={{ textAlign: 'center', alignSelf: 'start' }}>
          <div className="avatar-sm" style={{ width: 68, height: 68, fontSize: 20, margin: '0 auto 12px' }}>{initials}</div>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>{name}</div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.regNo}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <form className="panel" onSubmit={handleSaveProfile}>
            <div className="panel-head"><h3>Personal details</h3></div>

            {profileMsg && (
              <div style={{
                background: profileMsg.type === 'ok' ? 'var(--green-bg)' : 'var(--red-bg)',
                color: profileMsg.type === 'ok' ? 'var(--green)' : 'var(--red)',
                fontSize: 12.5, padding: '9px 13px', borderRadius: 9, marginBottom: 14,
              }}>
                {profileMsg.text}
              </div>
            )}

            <div className="field">
              <label>Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label>Phone</label>
                <input type="text" placeholder="07XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={profileSaving}>
              {profileSaving ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          <form className="panel" onSubmit={handleChangePassword}>
            <div className="panel-head"><h3>Security</h3></div>

            {passwordMsg && (
              <div style={{
                background: passwordMsg.type === 'ok' ? 'var(--green-bg)' : 'var(--red-bg)',
                color: passwordMsg.type === 'ok' ? 'var(--green)' : 'var(--red)',
                fontSize: 12.5, padding: '9px 13px', borderRadius: 9, marginBottom: 14,
              }}>
                {passwordMsg.text}
              </div>
            )}

            <div className="field">
              <label>Current password</label>
              <input type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="field">
              <label>New password</label>
              <input type="password" placeholder="At least 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={passwordSaving} style={{ marginBottom: 4 }}>
              {passwordSaving ? 'Updating…' : 'Update password'}
            </button>

            <Toggle
              label="Two-factor authentication" sub="Not available yet — coming soon"
              checked={twoFA} onChange={() => setTwoFA(v => !v)} disabled
            />
          </form>

          <div className="panel">
            <div className="panel-head"><h3>Appearance</h3></div>
            <Toggle
              label="Dark mode" sub="Switch the whole portal to a dark theme"
              checked={theme === 'dark'} onChange={toggleTheme}
            />
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Notification preferences</h3></div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '-8px 0 4px' }}>
              Not wired to real notifications yet — this is a preview of the settings UI.
            </p>
            {Object.entries({ assignments: 'New assignments', fees: 'Fee reminders', classes: 'Class schedule changes', messages: 'New messages' }).map(([key, label]) => (
              <Toggle key={key} label={label} checked={notifs[key]} onChange={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Toggle({ label, sub, checked, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderTop: '1px solid var(--border)', opacity: disabled ? 0.55 : 1 }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{sub}</div>}
      </div>
      <button
        type="button"
        onClick={disabled ? undefined : onChange}
        disabled={disabled}
        style={{
          width: 42, height: 24, borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
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