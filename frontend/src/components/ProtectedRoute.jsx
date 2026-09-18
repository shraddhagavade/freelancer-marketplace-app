import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="section py-20 text-center text-brand-muted">Loading...</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Optional role restriction
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
