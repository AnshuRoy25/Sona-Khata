import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLang } from "../context/LanguageContext.jsx";

export default function ProtectedRoute({ children, role }) {
  const { user, checking } = useAuth();
  const { t } = useLang();

  if (checking) {
    return <div className="page-loading">{t("common.loading")}</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
