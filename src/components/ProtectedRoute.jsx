
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const userData = localStorage.getItem("user");
    if (!userData) return <Navigate to="/login" replace />;

    try {
      const user = JSON.parse(userData);
      const rol = (user.rol || "").toLowerCase();

      const allowedRoles = Array.isArray(requiredRole)
        ? requiredRole
        : [requiredRole];

      // Comprobamos si el rol del usuario está permitido
      const allowed = allowedRoles
        .map(r => r.toLowerCase())
        .includes(rol);

      if (!allowed) {
        return <Navigate to="/panel" replace />;
      }

    } catch {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
