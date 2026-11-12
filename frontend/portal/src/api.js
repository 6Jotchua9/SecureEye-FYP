const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "");

function portalFetch(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "ngrok-skip-browser-warning": "true",
      ...(options.headers || {}),
    },
  });
}

const TOKEN_KEY = "gateway_jwt";
const USER_KEY = "gateway_user";

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

export function isTokenExpired(token, skewMs = 5000) {
  if (!token) return true;
  try {
    const part = token.split(".")[1];
    if (!part) return true;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
    const payload = JSON.parse(json);
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 <= Date.now() + skewMs;
  } catch {
    return true;
  }
}

export function clearExpiredSession() {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    clearSession();
    return true;
  }
  return false;
}

async function parseError(response) {
  try {
    const body = await response.json();
    return body.reason || body.error || body.message || response.statusText;
  } catch {
    return response.statusText || "Request failed";
  }
}

function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function apiLogin(username, password) {
  const response = await portalFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function apiUpload(file) {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const response = await portalFetch("/portal/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function apiListFiles() {
  const token = getToken();
  const response = await portalFetch("/portal/files", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function apiDownload(fileId, filename) {
  const token = getToken();
  const response = await portalFetch(`/portal/download/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const blob = await response.blob();
  triggerBrowserDownload(blob, filename || `file-${fileId}`);
}

export async function apiRequestDecryption(fileId, filename) {
  const token = getToken();
  const response = await portalFetch(`/portal/files/${fileId}/request-decryption`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const message = await parseError(response);
    const err = new Error(message);
    err.status = response.status;
    err.denied = response.status === 403;
    throw err;
  }
  const blob = await response.blob();
  triggerBrowserDownload(blob, filename || `file-${fileId}`);
}
