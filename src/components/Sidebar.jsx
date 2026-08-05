import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const navGroups = [
  { type: 'link', to: '/', end: true, icon: 'ti-layout-dashboard', label: 'Dashboard' },
  {
    type: 'group', icon: 'ti-school', label: 'Academic',
    items: [
      { to: '/packages', icon: 'ti-apps', label: 'My packages' },
      { to: '/schedule', icon: 'ti-calendar', label: 'Schedule' },
      { to: '/assignments', icon: 'ti-file-text', label: 'Assignments' },
    ],
  },
  { type: 'link', to: '/messages', icon: 'ti-message-circle', label: 'Messages & complaints' },
  { type: 'link', to: '/fees', icon: 'ti-receipt', label: 'Fees' },
  { type: 'link', to: '/account', icon: 'ti-settings', label: 'Account' },
];

export default function Sidebar({ collapsed }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(navGroups.filter(g => g.type === 'group').map(g => [g.label, true]))
  );

  useEffect(() => {
    navGroups.forEach(g => {
      if (g.type === 'group' && g.items.some(i => i.to === location.pathname)) {
        setOpenGroups(o => ({ ...o, [g.label]: true }));
      }
    });
  }, [location.pathname]);

  return (
    <aside className={`sidebar-dark${collapsed ? ' collapsed' : ''}`}>
      <nav className="side-nav">
        {navGroups.map((g) => {
          if (g.type === 'link') {
            return (
              <NavLink
                key={g.to}
                to={g.to}
                end={g.end}
                className={({ isActive }) => 'nav-item-dark' + (isActive ? ' active' : '')}
                title={collapsed ? g.label : undefined}
              >
                <i className={`ti ${g.icon}`}></i>
                {!collapsed && <span>{g.label}</span>}
              </NavLink>
            );
          }
          const isOpen = openGroups[g.label];
          const groupActive = g.items.some(item => item.to === location.pathname);
          return (
            <div key={g.label}>
              <button
                className={'nav-item-dark nav-group-toggle' + (groupActive && collapsed ? ' active' : '')}
                onClick={() => setOpenGroups(o => ({ ...o, [g.label]: !o[g.label] }))}
                title={collapsed ? g.label : undefined}
              >
                <i className={`ti ${g.icon}`}></i>
                {!collapsed && <span>{g.label}</span>}
                {!collapsed && <i className={`ti ti-chevron-right nav-chevron${isOpen ? ' open' : ''}`}></i>}
              </button>
              {!collapsed && isOpen && (
                <div className="nav-subgroup">
                  {g.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => 'nav-item-dark nav-sub-item' + (isActive ? ' active' : '')}
                    >
                      <i className={`ti ${item.icon}`}></i>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot-dark">
        {!collapsed && <span>© 2026 Trillionet Computer Training Center</span>}
      </div>
    </aside>
  );
}
