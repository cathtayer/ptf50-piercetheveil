import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Only admins sign in (customers book as guests). This only controls what the UI shows;
// the REAL protection is RLS in the database.
export default function ProtectedRoute({ requireAdmin = true, children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-10 text-center text-brand-muted">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children ?? <Outlet />;
}
