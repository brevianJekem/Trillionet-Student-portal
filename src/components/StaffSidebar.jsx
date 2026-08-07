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
