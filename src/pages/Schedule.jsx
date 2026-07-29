import Layout from '../components/Layout';
import { packages, enrolledPackageIds } from '../data/mock';

export default function Schedule() {
  const upcoming = packages
    .filter(p => enrolledPackageIds.includes(p.id) && p.nextClass)
    .sort((a, b) => a.nextClass.localeCompare(b.nextClass));

  return (
    <Layout title="Schedule">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Upcoming classes</h3>
            <p className="sub">Based on the packages you're currently enrolled in</p>
          </div>
        </div>

        {upcoming.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-calendar-off"></i>
            <div className="t">No upcoming classes</div>
            <div className="m">Register for a package to see its class schedule here.</div>
          </div>
        ) : (
          upcoming.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            }}>
              <div style={{ width: 3, height: 34, borderRadius: 2, flexShrink: 0, background: p.color }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 1 }}>{p.instructor}</div>
              </div>
              <span className="tag blue"><i className="ti ti-clock" style={{ fontSize: 11 }}></i>{p.nextClass}</span>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
