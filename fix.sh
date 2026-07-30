cd "$(dirname "$0")"

cat > src/styles/login.css << 'CSSEOF'
.login-card {
  width: 100%; max-width: 920px; min-height: 600px;
  background: var(--surface);
  border-radius: 24px;
  box-shadow: var(--shadow-modal);
  display: grid; grid-template-columns: 1fr 1fr;
  overflow: hidden;
}

.brand-panel {
  position: relative;
  background:
    linear-gradient(155deg, rgba(2,16,36,0.88) 0%, rgba(5,38,89,0.82) 55%, rgba(84,131,179,0.75) 130%),
    url('/students.jpg') center/cover no-repeat;
  padding: 44px 40px;
  display: flex; flex-direction: column; justify-content: space-between;
  color: #fff;
  overflow: hidden;
}
.bp-top { position: relative; display: flex; align-items: center; gap: 10px; }
.bp-top .brand-mark { background: rgba(255,255,255,0.14); }
.bp-top .name { font-weight: 600; font-size: 15px; }

.bp-mid { position: relative; }
.bp-eyebrow {
  display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--ice); opacity: 0.9; margin-bottom: 14px;
}
.bp-mid h2 { font-size: 27px; font-weight: 600; line-height: 1.28; letter-spacing: -0.01em; margin: 0 0 14px; max-width: 300px; }
.bp-accent { color: var(--ice); }
.bp-mid p { font-size: 13.5px; color: rgba(255,255,255,0.75); line-height: 1.6; max-width: 270px; margin: 0; }

.bp-bottom { position: relative; display: flex; flex-direction: column; gap: 12px; }
.bp-stat { display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: rgba(255,255,255,0.85); }
.bp-stat i { font-size: 15px; color: var(--ice); }
.bp-foot { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 10px; }

.form-panel { padding: 52px 56px; display: flex; flex-direction: column; }
.logo-slot { width: 54px; height: 54px; border-radius: 14px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; color: var(--text-muted); font-size: 22px; }
.institution { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 26px; }
.institution i { font-size: 14px; color: var(--text-muted); }

.form-head { text-align: center; margin-bottom: 28px; }
.form-head h1 { font-size: 20px; font-weight: 600; margin: 0 0 5px; letter-spacing: -0.01em; }
.form-head p { font-size: 13px; color: var(--text-secondary); margin: 0; }

.input-wrap { position: relative; }
.input-wrap i { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-size: 16px; color: var(--text-muted); }
.input-wrap input { width: 100%; padding: 11px 14px 11px 38px; border: 1px solid var(--border); border-radius: 11px; font-size: 13.5px; color: var(--text-primary); background: var(--bg); outline: none; }
.input-wrap input:focus { border-color: var(--blue-light); background: var(--surface); }
.input-wrap .toggle-eye { left: auto; right: 13px; cursor: pointer; }

.field-row { display: flex; align-items: center; justify-content: space-between; margin: 2px 0 22px; }
.remember { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--text-secondary); }
.remember input { accent-color: var(--navy); width: 14px; height: 14px; }
.forgot { font-size: 12.5px; color: var(--blue); text-decoration: none; font-weight: 500; }

.divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; }
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: var(--border); }
.divider span { font-size: 11px; color: var(--text-muted); }

.signup-box { background: var(--blue-pale); border-radius: 14px; padding: 16px 18px; font-size: 12px; color: var(--text-secondary); line-height: 1.65; }
.signup-box b { color: var(--navy); font-weight: 600; }
.signup-box .step { display: flex; gap: 8px; margin-bottom: 6px; }
.signup-box .step:last-child { margin-bottom: 0; }
.signup-box .num { width: 16px; height: 16px; border-radius: 50%; background: var(--navy); color: #fff; font-size: 9.5px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
[data-theme="dark"] .signup-box .num { color: var(--navy-deep); }

.btn-signin {
  width: 100%; border: none; cursor: pointer;
  padding: 14px; border-radius: 12px;
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-deep) 100%);
  color: #fff; font-family: 'Inter'; font-size: 14.5px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 14px rgba(5, 38, 89, 0.28);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.btn-signin:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(5, 38, 89, 0.35); }
.btn-signin:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

.form-foot { margin-top: auto; padding-top: 24px; text-align: center; font-size: 12.5px; color: var(--text-secondary); }
.form-foot a { color: var(--blue); text-decoration: none; font-weight: 500; }

@media (max-width: 760px) {
  .login-card { grid-template-columns: 1fr; }
  .brand-panel { display: none; }
  .form-panel { padding: 40px 28px; }
  .input-wrap input { font-size: 16px; }
}
CSSEOF
echo "1/5 login.css done"

cat > src/components/Layout.jsx << 'JSXEOF'
import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout({ title, children }) {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );

  return (
    <div className="app-root">
      <TopNav onToggleSidebar={() => setCollapsed(c => !c)} />
      <div className="app-shell">
        <Sidebar collapsed={collapsed} />
        {!collapsed && <div className="mobile-backdrop" onClick={() => setCollapsed(true)}></div>}
        <main className="content">
          {title && <div className="page-title-row"><h1>{title}</h1></div>}
          {children}
        </main>
      </div>
    </div>
  );
}
JSXEOF
echo "2/5 Layout.jsx done"

cat >> src/styles/app.css << 'MOBILEEOF'

/* ---------- Mobile ---------- */
@media (max-width: 768px) {
  .topnav-brand span { display: none; }
  .sidebar-dark {
    position: fixed;
    top: 64px;
    left: 0;
    z-index: 50;
    width: 240px;
    transform: translateX(-100%);
    box-shadow: 8px 0 24px rgba(0, 0, 0, 0.25);
    transition: transform 0.2s ease;
  }
  .sidebar-dark:not(.collapsed) { transform: translateX(0); }
  .sidebar-dark.collapsed { width: 240px; padding: 16px 12px; }
  .mobile-backdrop {
    display: block;
    position: fixed;
    inset: 64px 0 0 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 40;
  }
  main.content { padding: 16px 14px 40px; width: 100%; max-width: 100%; }
  .page-title-row h1 { font-size: 19px; }
  .hero-row { grid-template-columns: 1fr; gap: 12px; }
  .hero-panel { flex-direction: column; align-items: flex-start; gap: 20px; padding: 22px; }
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  section[style*="grid-template-columns: 1.35fr 1fr"] { grid-template-columns: 1fr !important; }
  div[style*="grid-template-columns: 240px 1fr"] { grid-template-columns: 1fr !important; }
  .field select, .field input, .input-wrap input, textarea { font-size: 16px; }
  .btn, .quick-btn, .icon-btn { min-height: 40px; }
  .icon-btn { width: 40px; height: 40px; }
  table.data-table { min-width: 480px; }
}
MOBILEEOF
echo "3/5 app.css mobile block done"

W=$(sips -g pixelWidth public/logo.png | awk '/pixelWidth/{print $2}')
H=$(sips -g pixelHeight public/logo.png | awk '/pixelHeight/{print $2}')
MAX=$(( W > H ? W : H ))
cp public/logo.png /tmp/favicon-square.png
sips --padToHeightWidth $MAX $MAX --padColor FFFFFF /tmp/favicon-square.png
sips -z 512 512 /tmp/favicon-square.png --out public/favicon.png
echo "4/5 favicon.png generated"

sed -i.bak 's|<link rel="icon" type="image/svg+xml" href="/favicon.svg" />|<link rel="icon" type="image/png" href="/favicon.png" />|' index.html
sed -i.bak 's|<link rel="icon" type="image/png" href="/logo.png" />|<link rel="icon" type="image/png" href="/favicon.png" />|' index.html
rm -f index.html.bak
echo "5/5 index.html updated"

grep favicon index.html
echo "All done."