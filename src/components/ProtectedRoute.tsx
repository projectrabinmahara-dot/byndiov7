import { ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'buyer' | 'seller' | 'influencer' | 'admin';
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requireAuth = true,
}: ProtectedRouteProps) {
  const user = useAppStore(state => state.user);
  const isAuthLoading = useAppStore(state => state.isAuthLoading);

  // Show spinner while auth is resolving
  if (isAuthLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0D47A1] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  // Not logged in
  if (requireAuth && !user) {
    return <Navigate to="/" replace />;
  }

  // Banned users are blocked from everything
  if (user?.role === ('banned' as any)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <span className="text-6xl mb-4">🚫</span>
        <h2 className="text-xl font-black mb-2">Account Suspended</h2>
        <p className="text-gray-500 mb-5 max-w-xs">
          Your account has been suspended. If you believe this is a mistake, contact{' '}
          <a href="mailto:grievance@byndio.in" className="text-[#1565C0] underline">grievance@byndio.in</a>.
        </p>
      </div>
    );
  }

  // Role check: admin can access ALL protected pages
  // Other roles must match exactly
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <span className="text-6xl mb-4">🚫</span>
        <h2 className="text-xl font-black mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-5 max-w-xs">
          This page requires the <strong>{requiredRole}</strong> role.
          {user ? ` You are logged in as a ${user.role}.` : ''}
        </p>
        <Link to="/" className="bg-[#0D47A1] text-white px-5 py-2 rounded-md font-bold text-sm hover:bg-[#1565C0] transition-colors">
          Go Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
