import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-root">
      <TopNav onToggleSidebar={() => setCollapsed(c => !c)} />
      <div className="app-shell">
        <Sidebar collapsed={collapsed} />
        <main className="content">
          {title && <div className="page-title-row"><h1>{title}</h1></div>}
          {children}
        </main>
      </div>
    </div>
  );
}
