import { useState } from 'react';
import Layout from '../components/Layout';
import { assignments } from '../data/mock';

export default function Assignments() {
  const [filter, setFilter] = useState('all');
  const filtered = assignments.filter(a => filter === 'all' ? true : a.status === filter);

  return (
    <Layout title="Assignments">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'pending', 'graded'].map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Graded'}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Package</th><th>Assignment</th><th>Due</th><th>Status</th><th>Grade</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i}>
                  <td className="muted">{a.package}</td>
                  <td>{a.title}</td>
                  <td className="muted">{a.due}</td>
                  <td>
                    {a.status === 'pending'
                      ? <span className="tag amber"><span className="dot"></span>Pending</span>
                      : <span className="tag green"><span className="dot"></span>Graded</span>}
                  </td>
                  <td className="muted">{a.grade ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {a.status === 'pending'
                      ? <button className="btn btn-secondary btn-sm"><i className="ti ti-file-upload"></i>Submit</button>
                      : <button className="btn btn-secondary btn-sm"><i className="ti ti-message-circle"></i>Feedback</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
