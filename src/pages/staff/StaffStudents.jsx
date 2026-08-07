import { useEffect, useState } from 'react';
import StaffLayout from '../../components/StaffLayout';
import { fetchStudents } from '../../api/staff';
import { SkeletonRow } from '../../components/Skeleton';

export default function StaffStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setStudents(await fetchStudents());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? students.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.regNo.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.email.toLowerCase().includes(q)
      )
    : students;

  return (
    <StaffLayout title="Students">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>All students</h3>
            <p className="sub">{students.length} registered</p>
          </div>
          <a href="#/staff/students/new" className="btn btn-primary btn-sm">
            <i className="ti ti-user-plus"></i>Register student
          </a>
        </div>

        <div className="field" style={{ marginBottom: 18 }}>
          <div className="input-wrap">
            <i className="ti ti-search"></i>
            <input
              type="text"
              placeholder="Search by name, admission number, phone, or email…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div><SkeletonRow withBar={false} /><SkeletonRow withBar={false} /><SkeletonRow withBar={false} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-users"></i>
            <div className="t">{q ? 'No matches' : 'No students yet'}</div>
            <div className="m">{q ? 'Try a different search term.' : 'Register your first student to get started.'}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Admission No.</th><th>Name</th><th>Phone</th><th>Parent phone</th><th>Fees paid</th><th>Packages</th></tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td className="mono">{s.regNo}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td className="muted">{s.phone || '—'}</td>
                    <td className="muted">{s.parentPhone || '—'}</td>
                    <td>KSh {s.totalPaid.toLocaleString()}</td>
                    <td className="muted">{s.packageCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
