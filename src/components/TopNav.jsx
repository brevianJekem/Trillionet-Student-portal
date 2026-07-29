import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { student as mockStudent } from '../data/mock';

export default function TopNav({ onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.name || mockStudent.name;
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

        <button className="icon-btn notif-btn" aria-label="Notifications">
          <i className="ti ti-bell"></i>
          {mockStudent.notificationsCount > 0 && <span className="notif-badge">{mockStudent.notificationsCount}</span>}
        </button>

        <div style={{ position: 'relative' }}>
          <button className="user-menu" onClick={() => setMenuOpen(o => !o)}>
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
