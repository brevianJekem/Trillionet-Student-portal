cd "$(dirname "$0")"

mkdir -p src/pages/staff

cat > src/api/staff.js << 'JSEOF'
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
JSEOF
echo "1/7 api/staff.js"

cat > src/components/ProtectedRoute.jsx << 'JSEOF'
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, staffOnly = false, neutral = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 13.5 }}>
        Loading your portal…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!neutral) {
    if (staffOnly && user.role !== 'staff') return <Navigate to="/" replace />;
    if (!staffOnly && user.role === 'staff') return <Navigate to="/staff/students" replace />;
  }

  return children;
}
JSEOF
echo "2/7 ProtectedRoute.jsx"

cat > src/components/StaffSidebar.jsx << 'JSEOF'
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/staff/students', end: true, icon: 'ti-users', label: 'Students' },
  { to: '/staff/students/new', icon: 'ti-user-plus', label: 'Register student' },
  { to: '/account', icon: 'ti-settings', label: 'Account' },
];

export default function StaffSidebar({ collapsed }) {
  return (
    <aside className={`sidebar-dark${collapsed ? ' collapsed' : ''}`}>
      <nav className="side-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 'nav-item-dark' + (isActive ? ' active' : '')}
            title={collapsed ? item.label : undefined}
          >
            <i className={`ti ${item.icon}`}></i>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot-dark">
        {!collapsed && <span>© 2026 Trillionet Computer Training Center — Staff</span>}
      </div>
    </aside>
  );
}
JSEOF
echo "3/7 StaffSidebar.jsx"

cat > src/components/StaffLayout.jsx << 'JSEOF'
import { useState } from 'react';
import StaffSidebar from './StaffSidebar';
import TopNav from './TopNav';

export default function StaffLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );

  return (
    <div className="app-root">
      <TopNav onToggleSidebar={() => setCollapsed(c => !c)} />
      <div className="app-shell">
        <StaffSidebar collapsed={collapsed} />
        {!collapsed && <div className="mobile-backdrop" onClick={() => setCollapsed(true)}></div>}
        <main className="content">
          {title && <div className="page-title-row"><h1>{title}</h1></div>}
          {children}
        </main>
      </div>
    </div>
  );
}
JSEOF
echo "4/7 StaffLayout.jsx"

cat > src/pages/staff/StaffStudents.jsx << 'JSEOF'
import { useEffect, useState } from 'react';
import StaffLayout from '../../components/StaffLayout';
import { fetchStudents } from '../../api/staff';
import { SkeletonRow } from '../../components/Skeleton';

export default function StaffStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setStudents(await fetchStudents());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? students.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.regNo.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.email.toLowerCase().includes(q)
      )
    : students;

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
                <tr><th>Admission No.</th><th>Name</th><th>Phone</th><th>Parent phone</th><th>Fees paid</th><th>Packages</th></tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td className="mono">{s.regNo}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td className="muted">{s.phone || '—'}</td>
                    <td className="muted">{s.parentPhone || '—'}</td>
                    <td>KSh {s.totalPaid.toLocaleString()}</td>
                    <td className="muted">{s.packageCount}</td>
                  </tr>
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
echo "5/7 pages/staff/StaffStudents.jsx"

cat > src/pages/staff/StaffCreateStudent.jsx << 'JSEOF'
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
JSEOF
echo "6/7 pages/staff/StaffCreateStudent.jsx"

cat > src/App.jsx << 'JSEOF'
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Schedule from './pages/Schedule';
import Assignments from './pages/Assignments';
import Messages from './pages/Messages';
import Fees from './pages/Fees';
import Account from './pages/Account';
import StaffStudents from './pages/staff/StaffStudents';
import StaffCreateStudent from './pages/staff/StaffCreateStudent';

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function StaffOnly({ children }) {
  return <ProtectedRoute staffOnly>{children}</ProtectedRoute>;
}

function Shared({ children }) {
  return <ProtectedRoute neutral>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/packages" element={<Protected><Packages /></Protected>} />
            <Route path="/schedule" element={<Protected><Schedule /></Protected>} />
            <Route path="/assignments" element={<Protected><Assignments /></Protected>} />
            <Route path="/messages" element={<Protected><Messages /></Protected>} />
            <Route path="/fees" element={<Protected><Fees /></Protected>} />

            <Route path="/staff/students" element={<StaffOnly><StaffStudents /></StaffOnly>} />
            <Route path="/staff/students/new" element={<StaffOnly><StaffCreateStudent /></StaffOnly>} />

            <Route path="/account" element={<Shared><Account /></Shared>} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
JSEOF
echo "7/7 App.jsx"

echo ""
echo "Frontend done. Verify with:"
echo "  ls src/pages/staff/"
echo "  grep -c StaffOnly src/App.jsx"