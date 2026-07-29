import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { user, loading, login, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(regNo, password);
    setSubmitting(false);
    if (ok) navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div className="login-card">
        <div className="brand-panel">
          <div className="bp-mid">
            <span className="bp-eyebrow">Student Portal</span>
            <h2 className="heading">
              Everything about your <span className="bp-accent">training</span>, in one place
            </h2>
            <p>Packages, class schedules, assignments, fees, and messages with your instructors — all in one portal.</p>
          </div>

          <div className="bp-bottom">
            <div className="bp-stat"><i className="ti ti-shield-check"></i>Secure, role-based access</div>
            <div className="bp-stat"><i className="ti ti-device-mobile"></i>Works on any device</div>
            <div className="bp-foot">© 2026 Trillionet Computer Training Center</div>
          </div>
        </div>

        <form className="form-panel" onSubmit={handleSignIn}>
          <div style={{ height: 76, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="/logo.png"
              alt="Trillionet Computer Training Center"
              style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <div className="institution"><i className="ti ti-building"></i>Trillionet Computer Training Center</div>

          <div className="form-head">
            <h1 className="heading">Sign in to your portal</h1>
            <p>Enter your student credentials to continue</p>
          </div>

          {error && (
            <div style={{
              background: 'var(--red-bg)', color: 'var(--red)', fontSize: 12.5,
              padding: '10px 14px', borderRadius: 10, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="ti ti-alert-circle"></i>{error}
            </div>
          )}

          <div className="field">
            <label>Registration number or email</label>
            <div className="input-wrap">
              <i className="ti ti-user"></i>
              <input
                type="text" placeholder="TCT/2024/0142"
                value={regNo} onChange={e => setRegNo(e.target.value)} required
              />
            </div>
          </div>

          <div className="field">
            <label>Password</label>
            <div className="input-wrap">
              <i className="ti ti-lock"></i>
              <input
                type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required
              />
              <i
                className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'} toggle-eye`}
                onClick={() => setShowPassword(s => !s)}
              ></i>
            </div>
          </div>

          <div className="field-row">
            <label className="remember"><input type="checkbox" />Remember me</label>
            <a href="#" className="forgot">Forgot password?</a>
          </div>

          <button type="submit" className="btn-signin" disabled={submitting}>
            {submitting ? 'Signing in…' : (
              <>Sign in <i className="ti ti-arrow-right"></i></>
            )}
          </button>

          <div className="divider"><span>New here?</span></div>

          <div className="signup-box">
            <div className="step"><span className="num">1</span><span>Ask the <b>admissions office</b> to create your account.</span></div>
            <div className="step"><span className="num">2</span><span>Check your email for a <b>set password</b> link (spam folder too).</span></div>
            <div className="step"><span className="num">3</span><span>Set your password, then sign in above.</span></div>
          </div>

          <div className="form-foot">
            Trouble signing in? <a href="mailto:admissions@trillionet.ac.ke">Contact the front office</a>
          </div>
        </form>
      </div>
    </div>
  );
}