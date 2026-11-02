import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  adminOnly = false,
  doctorOnly = false,
  patientOnly = false
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Account deactivated check
  if (user.isActive === false) {
    return <Navigate to="/login" state={{ error: 'Account has been deactivated.' }} replace />;
  }

  // Build target permitted roles
  const roles = [...allowedRoles];
  if (adminOnly) roles.push('admin');
  if (doctorOnly) roles.push('doctor');
  if (patientOnly) roles.push('patient');

  // If specific roles are specified and user's role is not included
  if (roles.length > 0 && !roles.includes(user.role)) {
    // Redirect to authorized home/dashboard for their respective role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'doctor') {
      return <Navigate to="/doctor-dashboard" replace />;
    } else {
      return <Navigate to="/my-appointments" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
