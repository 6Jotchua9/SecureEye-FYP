import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthScreen } from "../../../design-system/ui.jsx";
import { apiLogin, getToken, setSession } from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (getToken()) {
    return <Navigate to="/upload" replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await apiLogin(username.trim(), password);
      setSession(data.access_token, data.user);
      navigate("/upload", { replace: true });
    } catch (err) {
      setError(err.message || "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      product="Gateway portal"
      kicker="Risk-aware data protection"
      title="Sign in"
      lede="Upload files into the protected staging pipeline."
      hint="Use your assigned employee account."
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
