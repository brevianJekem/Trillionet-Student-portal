import { useState } from 'react';
import Layout from '../components/Layout';
import { packages, enrolledPackageIds, materials } from '../data/mock';

const typeIcon = { pdf: 'ti-file-type-pdf', video: 'ti-player-play' };

export default function Packages() {
  const [tab, setTab] = useState('enrolled');
  const [enrolled, setEnrolled] = useState(enrolledPackageIds);
  const [expanded, setExpanded] = useState(null);

  const toggleEnroll = (id) => {
    setEnrolled(e => e.includes(id) ? e.filter(x => x !== id) : [...e, id]);
  };

  const enrolledPackages = packages.filter(p => enrolled.includes(p.id));
  const availablePackages = packages.filter(p => !enrolled.includes(p.id));

  return (
    <Layout title="My packages">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn btn-sm ${tab === 'enrolled' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('enrolled')}>
          Enrolled ({enrolledPackages.length})
        </button>
        <button className={`btn btn-sm ${tab === 'browse' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('browse')}>
          Browse & register
        </button>
      </div>

      {tab === 'enrolled' && (
        enrolledPackages.length === 0 ? (
          <div className="panel"><div className="empty-state">
            <i className="ti ti-apps-off"></i>
            <div className="t">No packages yet</div>
            <div className="m">Head to "Browse & register" to pick your first course.</div>
          </div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {enrolledPackages.map(p => {
              const pct = Math.round((p.completedLessons / p.totalLessons) * 100);
              const isOpen = expanded === p.id;
              return (
                <div className="panel" key={p.id}>
                  <div className="panel-head" style={{ marginBottom: isOpen ? 16 : 0 }}>
                    <div>
                      <h3>{p.name}</h3>
                      <p className="sub">{p.category} · {p.instructor}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.nextClass && <span className="tag blue"><i className="ti ti-clock" style={{ fontSize: 11 }}></i>{p.nextClass}</span>}
                      <button className="link-action" onClick={() => setExpanded(isOpen ? null : p.id)}>
                        {isOpen ? 'Hide materials' : 'View materials'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                    <div className="progress-track" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }}></div>
                    </div>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {p.completedLessons}/{p.totalLessons} lessons
                    </span>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      {(materials[p.id] || []).length === 0 ? (
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>No materials uploaded yet.</div>
                      ) : materials[p.id].map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <i className={`ti ${typeIcon[m.type]}`} style={{ color: 'var(--blue)', fontSize: 16 }}></i>
                            <span style={{ fontSize: 13 }}>{m.name}</span>
                          </div>
                          <button className="btn btn-secondary btn-sm"><i className="ti ti-download"></i>Download</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'browse' && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Available packages</h3>
              <p className="sub">New packages get added here as the center offers them</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Package</th><th>Category</th><th>Instructor</th><th></th></tr></thead>
              <tbody>
                {availablePackages.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td className="muted">{p.category}</td>
                    <td className="muted">{p.instructor}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => toggleEnroll(p.id)}>Register</button>
                    </td>
                  </tr>
                ))}
                {availablePackages.length === 0 && (
                  <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>You're registered for every package on offer</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
