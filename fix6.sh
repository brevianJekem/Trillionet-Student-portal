cd "$(dirname "$0")"

# 1. Grouped sidebar — Academic collects packages/schedule/assignments
cat > src/components/Sidebar.jsx << 'JSXEOF'
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
JSXEOF
echo "1/4 Sidebar.jsx — grouped nav"

# 2. Group nav CSS
python3 -c "
path = 'src/styles/app.css'
with open(path) as f:
    content = f.read()

content = content.replace(
    '''.nav-item-dark.active { background: var(--blue); color: #fff; }

.sidebar-foot-dark''',
    '''.nav-item-dark.active { background: var(--blue); color: #fff; }

.nav-group-toggle { justify-content: flex-start; }
.nav-chevron { font-size: 13px !important; width: auto !important; transition: transform .15s ease; opacity: .6; margin-left: auto; }
.nav-chevron.open { transform: rotate(90deg); }

.nav-subgroup { display: flex; flex-direction: column; gap: 1px; padding: 2px 0 4px 14px; }
.nav-sub-item { padding: 8px 12px; font-size: 13px; }
.nav-sub-item i { font-size: 15px !important; }
.nav-sub-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
.nav-sub-item.active { background: rgba(255,255,255,0.08); color: var(--ice); font-weight: 500; }

.sidebar-foot-dark'''
)

content = content.replace(
    '''.empty-state { text-align: center; padding: 40px 20px; color: var(--text-secondary); }''',
    '''/* ---------- Skeleton loading ---------- */
@keyframes skeleton-shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
.skeleton-line, .skeleton-circle {
  background: linear-gradient(90deg, var(--border) 25%, rgba(0,0,0,0.06) 37%, var(--border) 63%);
  background-size: 400px 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
  border-radius: 6px;
}
[data-theme=\"dark\"] .skeleton-line, [data-theme=\"dark\"] .skeleton-circle {
  background: linear-gradient(90deg, var(--border) 25%, rgba(255,255,255,0.08) 37%, var(--border) 63%);
  background-size: 400px 100%;
}
.skeleton-circle { border-radius: 50%; }

.empty-state { text-align: center; padding: 40px 20px; color: var(--text-secondary); }'''
)

with open(path, 'w') as f:
    f.write(content)
print('2/4 app.css — group nav + skeleton CSS added')
"

# 3. Skeleton component
cat > src/components/Skeleton.jsx << 'JSXEOF'
export function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  return <div className="skeleton-line" style={{ width, height, ...style }} />;
}

export function SkeletonCircle({ size = 40 }) {
  return <div className="skeleton-circle" style={{ width: size, height: size }} />;
}

export function SkeletonRow({ withBar = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0' }}>
      {withBar && <div className="skeleton-line" style={{ width: 3, height: 32, borderRadius: 2, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <SkeletonLine width="55%" height={13} style={{ marginBottom: 8 }} />
        <SkeletonLine width="35%" height={11} />
      </div>
    </div>
  );
}

export function SkeletonPackageCard() {
  return (
    <div style={{ padding: '13px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <SkeletonLine width="45%" height={13} />
        <SkeletonLine width={30} height={12} />
      </div>
      <SkeletonLine width="100%" height={6} style={{ borderRadius: 4 }} />
    </div>
  );
}
JSXEOF
echo "3/4 Skeleton.jsx created"

# 4. Wire skeletons into Dashboard and Packages
python3 -c "
path = 'src/pages/Dashboard.jsx'
with open(path) as f:
    content = f.read()

content = content.replace(
    '''import { fetchPackages } from '../api/packages';''',
    '''import { fetchPackages } from '../api/packages';
import { SkeletonLine, SkeletonPackageCard, SkeletonRow } from '../components/Skeleton';'''
)
content = content.replace(
    '''              <p>
                {loading ? 'Loading your packages…' : (''',
    '''              <p>
                {loading ? <SkeletonLine width={220} height={13} /> : ('''
)
content = content.replace(
    '''            {loading ? (
              <div className=\"empty-state\"><div className=\"m\">Loading…</div></div>
            ) : enrolled.length === 0 ? (''',
    '''            {loading ? (
              <div>
                <SkeletonPackageCard />
                <SkeletonPackageCard />
                <SkeletonPackageCard />
              </div>
            ) : enrolled.length === 0 ? ('''
)
content = content.replace(
    '''          {loading ? (
            <div className=\"empty-state\" style={{ padding: '20px 0' }}><div className=\"m\">Loading…</div></div>
          ) : upcoming.length === 0 ? (''',
    '''          {loading ? (
            <div>
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : upcoming.length === 0 ? ('''
)
with open(path, 'w') as f:
    f.write(content)
print('4/4 Dashboard.jsx — skeletons wired')
"

python3 -c "
path = 'src/pages/Packages.jsx'
with open(path) as f:
    content = f.read()
content = content.replace(
    '''import { materials } from '../data/mock'; // course materials aren't wired to the database yet''',
    '''import { materials } from '../data/mock'; // course materials aren't wired to the database yet
import { SkeletonPackageCard } from '../components/Skeleton';'''
)
content = content.replace(
    '''      {loading ? (
        <div className=\"panel\"><div className=\"empty-state\"><div className=\"m\">Loading your packages…</div></div></div>
      ) : tab === 'enrolled' ? (''',
    '''      {loading ? (
        <div className=\"panel\">
          <SkeletonPackageCard />
          <SkeletonPackageCard />
          <SkeletonPackageCard />
        </div>
      ) : tab === 'enrolled' ? ('''
)
with open(path, 'w') as f:
    f.write(content)
print('   Packages.jsx — skeletons wired')
"

echo ""
echo "Done. Verify with: grep -c Skeleton src/pages/Dashboard.jsx src/pages/Packages.jsx"