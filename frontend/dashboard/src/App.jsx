import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "../../design-system/ui.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext";
import IncidentsPage from "./pages/IncidentsPage";
import LoginPage from "./pages/LoginPage";
import StatsPage from "./pages/StatsPage";
import TimelinePage from "./pages/TimelinePage";

function AuthExpiryWatcher() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function onExpired() {
      logout();
      navigate("/login", { replace: true, state: { sessionExpired: true } });
    }
    window.addEventListener("gateway:auth-expired", onExpired);
    return () => window.removeEventListener("gateway:auth-expired", onExpired);
  }, [logout, navigate]);

  return null;
}

function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, sessionExpired: Boolean(location.state?.sessionExpired) }}
      />
    );
  }
  if (!isAdmin) {
    return <Navigate to="/login" replace state={{ deniedRole: true }} />;
  }
  return children;
}

function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  const nav = [
    { to: "/incidents", label: "Incidents", end: false },
    { to: "/stats", label: "Stats", end: true },
  ].map((item) => ({
    ...item,
    active: item.end
      ? location.pathname === item.to
      : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
  }));

  return (
    <AppShell product="Gateway admin" nav={nav} user={user} onSignOut={signOut}>
      {children}
    </AppShell>
  );
}

function DefaultRedirect() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated && isAdmin) {
    return <Navigate to="/incidents" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthExpiryWatcher />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/incidents"
          element={
            <RequireAdmin>
              <Shell>
                <IncidentsPage />
              </Shell>
            </RequireAdmin>
          }
        />
        <Route
          path="/incidents/:fileId/timeline"
          element={
            <RequireAdmin>
              <Shell>
                <TimelinePage />
              </Shell>
            </RequireAdmin>
          }
        />
        <Route
          path="/stats"
          element={
            <RequireAdmin>
              <Shell>
                <StatsPage />
              </Shell>
            </RequireAdmin>
          }
        />
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </AuthProvider>
  );
}
