cd "$(dirname "$0")"

# 1. Notification bell — now actually clickable, honest content instead of a fake "3" badge
cat > src/components/TopNav.jsx << 'JSXEOF'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function TopNav({ onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const displayName = user?.name || 'Student';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="topnav">
      <div className="topnav-left">
        <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <i className="ti ti-menu-2"></i>
        </button>
        <div className="topnav-brand">
          <div className="brand-mark">T</div>
          <span>Trillionet Computer Training Center</span>
        </div>
      </div>

      <div className="topnav-right">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          <i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon'}`}></i>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn notif-btn"
            aria-label="Notifications"
            onClick={() => { setNotifOpen(o => !o); setMenuOpen(false); }}
          >
            <i className="ti ti-bell"></i>
          </button>
          {notifOpen && (
            <div className="user-dropdown" style={{ width: 260, padding: 4 }}>
              <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                <i className="ti ti-bell-off" style={{ fontSize: 22, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}></i>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>You're all caught up</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>No new notifications right now.</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button className="user-menu" onClick={() => { setMenuOpen(o => !o); setNotifOpen(false); }}>
            <div className="avatar-sm">{initials}</div>
            <span>Hi, {displayName.split(' ')[0]}</span>
            <i className="ti ti-chevron-down" style={{ fontSize: 14, color: 'var(--text-muted)' }}></i>
          </button>
          {menuOpen && (
            <div className="user-dropdown">
              <a href="#/account" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                <i className="ti ti-user"></i>Account
              </a>
              <div className="user-dropdown-divider"></div>
              <button className="user-dropdown-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }} onClick={handleSignOut}>
                <i className="ti ti-logout"></i>Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
JSXEOF
echo "1/4 TopNav.jsx — notifications fixed"

# 2. Account page mobile layout — swap fragile inline style for a real class
python3 -c "
path = 'src/pages/Account.jsx'
with open(path) as f:
    content = f.read()
content = content.replace(
    \"      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>\",
    '      <div className=\"account-grid\">'
)
with open(path, 'w') as f:
    f.write(content)
print('2/4 Account.jsx — mobile class swap done')
"

# 3. app.css — add account-grid base style, fix mobile rule to use the class
python3 -c "
path = 'src/styles/app.css'
with open(path) as f:
    content = f.read()

content = content.replace(
    '.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }',
    '.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }\n.account-grid { display: grid; grid-template-columns: 240px 1fr; gap: 16px; }'
)

content = content.replace(
    'div[style*=\"grid-template-columns: 240px 1fr\"] { grid-template-columns: 1fr !important; }',
    '.account-grid { grid-template-columns: 1fr !important; }'
)

with open(path, 'w') as f:
    f.write(content)
print('3/4 app.css — account-grid rules added')
"

# 4. Login page — fix icon/placeholder overlap with proper autocomplete attributes + spacing
python3 -c "
path = 'src/pages/Login.jsx'
with open(path) as f:
    content = f.read()

content = content.replace(
    '''                type=\"text\" placeholder=\"TCT/2024/0142\"''',
    '''                type=\"text\" name=\"username\" autoComplete=\"username\" placeholder=\"TCT/2024/0142\"'''
)
content = content.replace(
    '''                type={showPassword ? 'text' : 'password'} placeholder=\"••••••••\"''',
    '''                type={showPassword ? 'text' : 'password'} name=\"password\" autoComplete=\"current-password\" placeholder=\"••••••••\"'''
)

with open(path, 'w') as f:
    f.write(content)
print('4/4 Login.jsx — autocomplete attributes added')
"

python3 -c "
path = 'src/styles/login.css'
with open(path) as f:
    content = f.read()
content = content.replace(
    '.input-wrap input { width: 100%; padding: 11px 14px 11px 38px;',
    '.input-wrap input { width: 100%; padding: 11px 14px 11px 42px;'
)
with open(path, 'w') as f:
    f.write(content)
print('   login.css — extra icon clearance added')
"

echo ""
echo "All done. Verify with: grep account-grid src/styles/app.css"