const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");

async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const method = options.method || "GET";
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { "ngrok-skip-browser-warning": "true", ...(options.headers || {}) },
    });
  } catch {
    // Never log request headers, tokens, passwords or response bodies.
    console.error("[SecureEye API] Network request failed", { method, url });
    throw new Error("Cannot reach the backend. Check the ngrok tunnel, VITE_API_BASE_URL and backend CORS configuration, then retry.");
  }
  if ((response.headers.get("Content-Type") || "").includes("text/html")) {
    console.error("[SecureEye API] Expected API response, received HTML", {
      method, url, status: response.status,
    });
    throw new Error("The backend returned an HTML page. Check that VITE_API_BASE_URL points to the active backend tunnel, not the frontend.");
  }
  return response;
}

const TOKEN_KEY = "gateway_admin_jwt";
const USER_KEY = "gateway_admin_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Decode JWT payload without verifying signature (client-side expiry check only). */
export function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token, skewMs = 5000) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return payload.exp * 1000 <= Date.now() + skewMs;
}

/** Drop a stale browser session so the UI cannot look "logged in" with a dead JWT. */
export function clearExpiredSession() {
  const token = getToken();
  if (!token) {
    clearSession();
    return true;
  }
  if (isTokenExpired(token)) {
    clearSession();
    return true;
  }
  return false;
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(response) {
  try {
    const body = await response.json();
    return body.error || body.message || response.statusText;
  } catch {
    return response.statusText || "Request failed";
  }
}

function handleAuthFailure(response, message) {
  const authErrors = new Set([
    "token expired",
    "invalid token",
    "missing or invalid Authorization header",
    "missing bearer token",
    "token missing required claims",
  ]);
  if (response.status === 401 && authErrors.has(message)) {
    clearSession();
    window.dispatchEvent(new CustomEvent("gateway:auth-expired", { detail: message }));
  }
  return message;
}

export async function apiLogin(username, password) {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

async function adminFetch(url, options = {}) {
  const response = await apiFetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const message = handleAuthFailure(response, await parseError(response));
    console.error("[SecureEye API] Admin request rejected", {
      method: options.method || "GET", path: url.split("?")[0], status: response.status,
    });
    throw new Error(message);
  }
  return response;
}

export async function apiListIncidents({ sort = "uploaded_at", order = "desc" } = {}) {
  const params = new URLSearchParams({ sort, order });
  const response = await adminFetch(`/admin/incidents?${params.toString()}`);
  return response.json();
}

export async function apiGetTimeline(fileId) {
  const response = await adminFetch(`/admin/incidents/${fileId}/timeline`);
  return response.json();
}

export async function apiApproveIncident(fileId) {
  const response = await adminFetch(`/admin/incidents/${fileId}/approve`, {
    method: "POST",
  });
  return response.json();
}

export async function apiRejectIncident(fileId) {
  const response = await adminFetch(`/admin/incidents/${fileId}/reject`, {
    method: "POST",
  });
  return response.json();
}

export async function apiDownloadReport(fileId, filename) {
  const response = await adminFetch(`/admin/incidents/${fileId}/report.pdf`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || `incident-${fileId}-report.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** A successful quarantine may be metadata-only when ingress retained no file. */
export async function apiQuarantineIncident(fileId) {
  const response = await adminFetch(`/admin/incidents/${fileId}/quarantine`, {
    method: "POST",
  });
  return response.json();
}

export async function apiGetStats(days = 30) {
  const response = await adminFetch(`/admin/stats?days=${days}`);
  return response.json();
}
