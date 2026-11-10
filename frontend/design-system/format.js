export function formatStamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${day}, ${time}`;
}

const POSITIVE = new Set(["APPROVED", "APPROVED_ENCRYPTED", "PUBLIC", "LOW"]);
const NEGATIVE = new Set(["BLOCKED", "REJECTED", "ERROR", "DECRYPTION_DENIED", "RESTRICTED", "HIGH"]);
const ATTENTION = new Set(["QUARANTINED", "PENDING_APPROVAL", "PENDING", "WARN", "CONFIDENTIAL", "MEDIUM"]);
const INFO = new Set(["INTERNAL", "CLASSIFIED", "SECRET_FOUND"]);

export function badgeTone(value) {
  const key = String(value || "").toUpperCase().replace(/\s+/g, "_");
  if (POSITIVE.has(key)) return "positive";
  if (NEGATIVE.has(key)) return "negative";
  if (ATTENTION.has(key)) return "attention";
  if (INFO.has(key)) return "info";
  return "";
}
