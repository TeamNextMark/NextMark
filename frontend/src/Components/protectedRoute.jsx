import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, allowedRoles = [], children }) {
  if (!user) return <Navigate to="/" replace />;

  if (allowedRoles.length > 0) {
    const roles = user.roles || [];
    const ok = allowedRoles.some((r) => roles.includes(r));
    if (!ok) return <Navigate to="/home" replace />;
  }

  return children;
}