import Layout from '../components/Layout';
import Rings from '../components/Rings';
import { useAuth } from '../context/AuthContext';
import { student, packages, enrolledPackageIds, announcements } from '../data/mock';

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = (user?.name || student.name).split(' ')[0];
  const enrolled = packages.filter(p => enrolledPackageIds.includes(p.id));
  const overallProgress = enrolled.length
    ? Math.round(enrolled.reduce((s, p) => s + p.completedLessons / p.totalLessons, 0) / enrolled.length * 100)
    : 0;
  const upcoming = enrolled.filter(p => p.nextClass).sort((a, b) => a.nextClass.localeCompare(b.nextClass));

  return (
    <Layout title="Dashboard">
      <div className="hero-row">
        {/* Left column: welcome hero + enrolled packages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <section className="hero-panel">
            <div>
              <h2 className="heading">Welcome back, {firstName}</h2>
              <p>
                You're enrolled in {enrolled.length} package{enrolled.length !== 1 ? 's' : ''} and have
                {' '}{upcoming.length} class{upcoming.length !== 1 ? 'es' : ''} coming up.
              </p>
            </div>
            <Rings
              outer={overallProgress}
              inner={student.attendance}
              centerValue={`${overallProgress}%`}
              centerLabel="progress"
            />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>My packages</h3>
              <a href="#/packages" className="link-action">View all</a>
            </div>

            {enrolled.length === 0 ? (
              <div className="empty-state">
                <i className="ti ti-apps-off"></i>
                <div className="t">No packages registered</div>
                <div className="m">Browse available packages to get started.</div>
              </div>
            ) : (
              enrolled.map((p, i) => {
                const pct = Math.round((p.completedLessons / p.totalLessons) * 100);
                return (
                  <div key={p.id} style={{ padding: '13px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 1 }}>{p.instructor}</div>
                      </div>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pct}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* Right column: fee balance, attendance, support */}
        <div className="side-cards">
          <div className="info-card tone-blue">
            <div className="ic-icon"><i className="ti ti-coin"></i></div>
            <div className="ic-label">Fee balance</div>
            <div className="ic-value">KSh {student.feeBalance.toLocaleString()}</div>
            <button className="btn-ghost-light">Pay now</button>
          </div>

          <div className="info-card tone-navy">
            <div className="ic-icon"><i className="ti ti-calendar-check"></i></div>
            <div className="ic-label">Attendance</div>
            <div className="ic-value" style={{ fontSize: 13, marginBottom: 10 }}>Across all enrolled packages</div>
            <div className="progress-track-light">
              <div className="progress-fill-light" style={{ width: `${student.attendance}%` }}></div>
            </div>
            <div className="ic-meta" style={{ marginTop: 8, marginBottom: 0 }}>{student.attendance}% attendance</div>
          </div>

          <div className="panel support-card">
            <div className="panel-head" style={{ marginBottom: 8 }}><h3>Support</h3></div>
            <a href="#/messages" className="support-link"><i className="ti ti-message-circle"></i>Message an instructor</a>
            <a href="#/messages" className="support-link"><i className="ti ti-flag"></i>File a complaint</a>
            <a href="#" className="support-link"><i className="ti ti-mail"></i>Contact administration</a>
          </div>
        </div>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 16 }}>
        <div className="panel">
          <div className="panel-head">
            <h3>Upcoming classes</h3>
            <a href="#/schedule" className="link-action">Full schedule</a>
          </div>
          {upcoming.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="m">No upcoming classes scheduled.</div>
            </div>
          ) : upcoming.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <div style={{ width: 3, height: 32, borderRadius: 2, flexShrink: 0, background: p.color }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 1 }}>{p.instructor}</div>
              </div>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{p.nextClass}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Announcements</h3>
            <a href="#" className="link-action">View all</a>
          </div>
          {announcements.map((a, i) => (
            <div key={i} style={{ padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.body}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>{a.date}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="quick">
        <a href="#/packages" className="quick-btn"><i className="ti ti-apps"></i>Register a package</a>
        <a href="#/fees" className="quick-btn"><i className="ti ti-credit-card"></i>Pay fees</a>
        <a href="#/assignments" className="quick-btn"><i className="ti ti-file-upload"></i>Submit assignment</a>
        <a href="#/messages" className="quick-btn"><i className="ti ti-flag"></i>File a complaint</a>
      </div>
    </Layout>
  );
}
