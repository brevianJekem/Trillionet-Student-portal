import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Schedule from './pages/Schedule';
import Assignments from './pages/Assignments';
import Messages from './pages/Messages';
import Fees from './pages/Fees';
import Account from './pages/Account';

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/packages" element={<Protected><Packages /></Protected>} />
            <Route path="/schedule" element={<Protected><Schedule /></Protected>} />
            <Route path="/assignments" element={<Protected><Assignments /></Protected>} />
            <Route path="/messages" element={<Protected><Messages /></Protected>} />
            <Route path="/fees" element={<Protected><Fees /></Protected>} />
            <Route path="/account" element={<Protected><Account /></Protected>} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
