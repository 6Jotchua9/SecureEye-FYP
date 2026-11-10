import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatStamp } from "../../../design-system/format.js";
import {
  Banner,
  Button,
  ConfirmDialog,
  EmptyState,
  Page,
  PageHeader,
  SkeletonTable,
} from "../../../design-system/ui.jsx";
import {
  apiApproveIncident,
  apiDownloadReport,
  apiGetTimeline,
  apiRejectIncident,
} from "../api";
import { RiskBadge, SensitivityBadge, StatusBadge } from "../components/Badges";

const ACTIONABLE_STATUSES = new Set(["QUARANTINED", "BLOCKED", "PENDING_APPROVAL"]);

function formatDetails(details) {
  if (!details || Object.keys(details).length === 0) return null;
  return Object.entries(details).map(([key, value]) => (
    <span key={key} className="gw-chip">
      <strong>{key}</strong>
      {typeof value === "object" ? JSON.stringify(value) : String(value)}
    </span>
  ));
}

export default function TimelinePage() {
  const { fileId } = useParams();
  const [file, setFile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiGetTimeline(fileId);
      setFile(data.file);
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message || "Could not load the timeline.");
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onApprove() {
    setActionBusy("approve");
    setError("");
    try {
      await apiApproveIncident(fileId);
      await load();
    } catch (err) {
      setError(err.message || "Approve failed.");
    } finally {
      setActionBusy("");
    }
  }

  async function onReject() {
    setActionBusy("reject");
    setError("");
    try {
      await apiRejectIncident(fileId);
      setConfirmReject(false);
      await load();
    } catch (err) {
      setError(err.message || "Reject failed.");
    } finally {
      setActionBusy("");
    }
  }

  async function onDownload() {
    setActionBusy("download");
    setError("");
    try {
      await apiDownloadReport(fileId, file ? `incident_${file.id}_report.pdf` : undefined);
    } catch (err) {
      setError(err.message || "Download failed.");
    } finally {
      setActionBusy("");
    }
  }

  const actionable = file ? ACTIONABLE_STATUSES.has((file.status || "").toUpperCase()) : false;

  return (
    <Page>
      <PageHeader
        kicker="Record"
        title="Incident timeline"
        lede="Forensic events for this file, oldest first."
        actions={
          <Button onClick={load} busy={loading}>
            Refresh timeline
          </Button>
        }
      />
      <p>
        <Link className="gw-back" to="/incidents">
          Back to incidents
        </Link>
      </p>

      {error ? (
        <Banner action={<Button size="sm" onClick={load}>Try again</Button>}>
          {error}
        </Banner>
      ) : null}

      {loading ? <SkeletonTable rows={6} cols={2} /> : null}

      {!loading && file ? (
        <section className="gw-summary">
          <div>
            <h2 className="t-h3" title={file.filename}>
              {file.filename}
            </h2>
            <p className="gw-mono">File #{file.id}</p>
          </div>
          <div className="gw-meta">
            <div>
              <span className="t-caption">Status</span>
              <StatusBadge status={file.status} />
            </div>
            <div>
              <span className="t-caption">Sensitivity</span>
              <SensitivityBadge label={file.sensitivity_label} />
            </div>
            <div>
              <span className="t-caption">Risk score</span>
              <RiskBadge score={file.risk_score} />
            </div>
            <div>
              <span className="t-caption">Uploaded by</span>
              <span>{file.uploaded_by_username || `user #${file.uploaded_by}`}</span>
            </div>
          </div>
          {file.reason ? <p className="t-body">Reason: {file.reason}</p> : null}
          <div className="gw-actions">
            <Button busy={actionBusy === "download"} onClick={onDownload}>
              Download report
            </Button>
            <Button variant="primary" busy={actionBusy === "approve"} disabled={!actionable} onClick={onApprove}>
              Approve file
            </Button>
            <Button variant="destructive" busy={actionBusy === "reject"} disabled={!actionable} onClick={() => setConfirmReject(true)}>
              Reject file
            </Button>
          </div>
        </section>
      ) : null}

      {!loading && !error && events.length === 0 ? (
        <EmptyState title="No events yet" body="Events appear here as the pipeline records them." />
      ) : null}

      {!loading && events.length > 0 ? (
        <ol className="gw-timeline">
          {events.map((event) => (
            <li key={event.id} className="gw-timeline-item">
              <span className="gw-timeline-dot" aria-hidden="true" />
              <div>
                <div className="gw-timeline-head">
                  <span className="cq-badge">{event.event_type}</span>
                  <time className="t-caption gw-tabular" dateTime={event.timestamp || undefined}>
                    {formatStamp(event.timestamp)}
                  </time>
                </div>
                {formatDetails(event.details) ? <div className="gw-chips">{formatDetails(event.details)}</div> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      <ConfirmDialog
        open={confirmReject}
        title="Reject this file?"
        body="The file stays blocked. The timeline keeps the decision."
        confirmLabel="Reject file"
        busy={actionBusy === "reject"}
        onCancel={() => setConfirmReject(false)}
        onConfirm={onReject}
      />
    </Page>
  );
}
