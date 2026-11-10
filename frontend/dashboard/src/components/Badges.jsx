import { badgeTone } from "../../../design-system/format.js";

const RISK_LOW_MAX = 30;
const RISK_HIGH_MAX = 70;

export function riskBand(score) {
  if (score === null || score === undefined) return "unknown";
  if (score < RISK_LOW_MAX) return "low";
  if (score > RISK_HIGH_MAX) return "high";
  return "medium";
}

export function StatusBadge({ status }) {
  const display = (status || "UNKNOWN").toUpperCase();
  const tone = badgeTone(display);
  return <span className={tone ? `cq-badge cq-badge-${tone}` : "cq-badge"}>{display}</span>;
}

export function SensitivityBadge({ label }) {
  const display = label || "Unclassified";
  const tone = badgeTone(display);
  return <span className={tone ? `cq-badge cq-badge-${tone}` : "cq-badge"}>{display}</span>;
}

export function RiskBadge({ score }) {
  const band = riskBand(score);
  const display = score === null || score === undefined ? "—" : Math.round(score);
  const tone = badgeTone(band);
  return (
    <span className={tone ? `cq-badge cq-badge-${tone} gw-tabular` : "cq-badge gw-tabular"}>
      {display}
    </span>
  );
}
