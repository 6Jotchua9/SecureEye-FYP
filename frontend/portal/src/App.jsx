import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "../../design-system/ui.jsx";
import { clearExpiredSession, clearSession, getStoredUser, getToken } from "./api";
import FilesPage from "./pages/FilesPage";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";

function RequireAuth({ children }) {
  clearExpiredSession();
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Shell({ children }) {
  const user = getStoredUser();
  const navigate = useNavigate();
  const location = useLocation();

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  const nav = [
    { to: "/upload", label: "Upload", end: true },
    { to: "/files", label: "My files", end: true },
  ].map((item) => ({
    ...item,
    active: location.pathname === item.to,
  }));

  return (
    <AppShell product="Gateway portal" nav={nav} user={user} onSignOut={logout}>
      {children}
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/upload"
        element={
          <RequireAuth>
            <Shell>
              <UploadPage />
            </Shell>
          </RequireAuth>
        }
      />
      <Route
        path="/files"
        element={
          <RequireAuth>
            <Shell>
              <FilesPage />
            </Shell>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to={getToken() ? "/upload" : "/login"} replace />} />
    </Routes>
  );
}
