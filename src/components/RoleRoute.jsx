import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin"></div>
  </div>
);

function getRedirectPath(role) {
  if (role === 'member') return '/member';
  if (role === 'owner' || role === 'staff') return '/';
  return '/onboarding';
}

/**
 * Role-based route guard. Renders <Outlet /> only when the resolved business
 * role is in `allowedRoles`. While the role is still being resolved (or retried
 * after an error), shows a loading/error state — never the protected content.
 *
 * Must be nested inside <ProtectedRoute> so that authentication is checked first.
 */
export default function RoleRoute({ allowedRoles, fallback = <DefaultFallback /> }) {
  const { role, isLoadingRole, roleError, reloadRole } = useAuth();

  if (isLoadingRole) return fallback;

  if (roleError) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">We couldn't verify your access level. Please try again.</p>
        <button onClick={reloadRole} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRedirectPath(role)} replace />;
  }

  return <Outlet />;
}