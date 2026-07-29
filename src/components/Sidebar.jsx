import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', end: true, icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { to: '/packages', icon: 'ti-apps', label: 'My packages' },
  { to: '/schedule', icon: 'ti-calendar', label: 'Schedule' },
  { to: '/assignments', icon: 'ti-file-text', label: 'Assignments' },
  { to: '/messages', icon: 'ti-message-circle', label: 'Messages & complaints' },
  { to: '/fees', icon: 'ti-receipt', label: 'Fees' },
  { to: '/account', icon: 'ti-settings', label: 'Account' },
];

export default function Sidebar({ collapsed }) {
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
        {!collapsed && <span>© 2026 Trillionet Computer Training Center</span>}
      </div>
    </aside>
  );
}
