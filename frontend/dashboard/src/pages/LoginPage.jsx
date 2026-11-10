import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthScreen } from "../../../design-system/ui.jsx";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => {
    if (location.state?.deniedRole) {
      return "That account does not have admin access to this dashboard.";
    }
    if (location.state?.sessionExpired) {
      return "Your session expired. Sign in again.";
    }
    return "";
  });
  const [busy, setBusy] = useState(false);

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/incidents" replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate("/incidents", { replace: true });
    } catch (err) {
      setError(err.message || "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      product="Gateway admin"
      kicker="Risk-aware data protection"
      title="Sign in"
      lede="Use an admin account to review gateway decisions."
      hint="Use your assigned administrator account."
      error={error}
      busy={busy}
      onSubmit={onSubmit}
      username={username}
      password={password}
      setUsername={setUsername}
      setPassword={setPassword}
    />
  );
}
