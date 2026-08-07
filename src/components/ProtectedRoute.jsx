import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, staffOnly = false, neutral = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 13.5 }}>
        Loading your portal…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!neutral) {
    if (staffOnly && user.role !== 'staff') return <Navigate to="/" replace />;
    if (!staffOnly && user.role === 'staff') return <Navigate to="/staff/students" replace />;
  }

  return children;
}
