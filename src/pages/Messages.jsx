import { useState } from 'react';
import Layout from '../components/Layout';
import { conversations, complaints } from '../data/mock';

const statusTone = { 'in-progress': 'amber', resolved: 'green' };
const statusLabel = { 'in-progress': 'In progress', resolved: 'Resolved' };

export default function Messages() {
  const [tab, setTab] = useState('messages');
  const [activeConvo, setActiveConvo] = useState(conversations[0]?.id);
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  const convo = conversations.find(c => c.id === activeConvo);

  return (
    <Layout title="Messages & complaints">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn btn-sm ${tab === 'messages' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('messages')}>
          Messages
        </button>
        <button className={`btn btn-sm ${tab === 'complaints' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('complaints')}>
          Complaints
        </button>
      </div>

      {tab === 'messages' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          <div className="panel" style={{ padding: 10 }}>
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveConvo(c.id)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: activeConvo === c.id ? 'var(--blue-pale)' : 'transparent',
                }}
              >
                <div className="avatar-sm" style={{ background: 'var(--navy)', flexShrink: 0 }}>
                  {c.with.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.with}</span>
                    {c.unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: 4 }}></span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>{c.role}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
            {convo && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="avatar-sm" style={{ background: 'var(--navy)' }}>{convo.with.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{convo.with}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{convo.role}</div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', marginBottom: 14 }}>
                  <div style={{ background: 'var(--bg)', borderRadius: '4px 14px 14px 14px', padding: '10px 14px', fontSize: 13, maxWidth: '80%' }}>
                    {convo.lastMessage}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="text" placeholder={`Message ${convo.with}...`} style={{ flex: 1, padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 11, fontSize: 13, background: 'var(--bg)', outline: 'none' }} />
                  <button className="btn btn-primary btn-sm"><i className="ti ti-send"></i></button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'complaints' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowComplaintForm(s => !s)}>
              <i className="ti ti-plus"></i>New complaint
            </button>
          </div>

          {showComplaintForm && (
            <div className="panel" style={{ marginBottom: 16, maxWidth: 480 }}>
              <div className="panel-head"><h3>Submit a complaint</h3></div>
              <div className="field">
                <label>Category</label>
                <select><option>Academic</option><option>Facilities</option><option>Fees</option><option>Other</option></select>
              </div>
              <div className="field"><label>Subject</label><input type="text" placeholder="Brief summary" /></div>
              <div className="field">
                <label>Details</label>
                <textarea rows={4} style={{ width: '100%', padding: '10px 13px', border: '1px solid var(--border)', borderRadius: 11, fontSize: 13.5, fontFamily: 'Inter', background: 'var(--bg)', outline: 'none', resize: 'vertical' }} placeholder="Describe the issue..."></textarea>
              </div>
              <button className="btn btn-primary btn-sm">Submit complaint</button>
            </div>
          )}

          <div className="panel">
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Subject</th><th>Category</th><th>Status</th><th>Filed</th></tr></thead>
                <tbody>
                  {complaints.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.subject}</td>
                      <td className="muted">{c.category}</td>
                      <td><span className={`tag ${statusTone[c.status]}`}><span className="dot"></span>{statusLabel[c.status]}</span></td>
                      <td className="muted">{c.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
