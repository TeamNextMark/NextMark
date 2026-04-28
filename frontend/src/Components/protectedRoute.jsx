import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, allowedRoles = [], children }) {
  if (!user) return <Navigate to="/" replace />;

  const roles = user.roles || [];
  const ok =
    allowedRoles.length === 0 ||
    allowedRoles.some((r) => roles.includes(r));

  if (!ok) {
    if (roles.includes("admin")) return <Navigate to="/home/admin" replace />;
    if (roles.includes("faculty")) return <Navigate to="/home/faculty" replace />;
    if (roles.includes("ta")) return <Navigate to="/home/student" replace />;
    return <Navigate to="/home/student" replace />;
  }

  return children;
}