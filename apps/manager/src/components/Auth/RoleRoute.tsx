import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RoleRouteProps {
  children: React.ReactNode;
  minRole: number;
  redirectTo?: string;
}

function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-orange-500 mb-4">403</div>
        <h1 className="text-2xl font-semibold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6">
          You don't have permission to access this page. Contact your administrator if you believe this is an error.
        </p>
        <Link
          to="/"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

/**
 * RoleRoute — renders children only if user's roleLevel >= minRole.
 * Renders a 403 page otherwise.
 * Must be used inside ProtectedRoute (assumes user is already authenticated).
 *
 * @param minRole - Minimum numeric role level required (Admin=100, Manager=80, Supervisor=60, Technician=40, Support=20)
 * @param redirectTo - Optional redirect path instead of 403 page
 */
export default function RoleRoute({ children, minRole, redirectTo }: RoleRouteProps) {
  const { roleLevel, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" aria-busy="true">
        <div>
          <span className="sr-only">Loading...</span>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (roleLevel == null || !Number.isFinite(roleLevel) || roleLevel < minRole) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
