import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  apiListIncidents,
  apiRejectIncident,
  apiQuarantineIncident,
} from "../api";
import { RiskBadge, SensitivityBadge, StatusBadge } from "../components/Badges";

function SortHeader({ column, label, sort, onSort }) {
  const active = sort.field === column;
  const arrow = active ? (sort.order === "asc" ? "↑" : "↓") : "";
  return (
    <th aria-sort={active ? (sort.order === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(column)}>
        {label} <span aria-hidden="true">{arrow}</span>
      </button>
    </th>
  );
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ field: "uploaded_at", order: "desc" });
  const [busyId, setBusyId] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [rejectId, setRejectId] = useState(null);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiListIncidents({ sort: sort.field, order: sort.order });
      setIncidents(data.incidents || []);
    } catch (err) {
      setError(err.message || "Could not load incidents.");
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    load();
  }, [load]);

  function onSort(field) {
    setSort((prev) =>
      prev.field === field
        ? { field, order: prev.order === "asc" ? "desc" : "asc" }
        : { field, order: "desc" }
    );
  }

  async function onApprove(fileId) {
    setBusyId(fileId);
    setBusyAction("approve");
    setError("");
    try {
      await apiApproveIncident(fileId);
      await load();
    } catch (err) {
      setError(err.message || "Approve failed.");
    } finally {
      setBusyId(null);
      setBusyAction("");
    }
  }

  async function onReject(fileId) {
    setBusyId(fileId);
    setBusyAction("reject");
    setError("");
    try {
      await apiRejectIncident(fileId);
      setRejectId(null);
      await load();
    } catch (err) {
      setError(err.message || "Reject failed.");
    } finally {
      setBusyId(null);
      setBusyAction("");
    }
  }

  async function onQuarantine(fileId) {
    setBusyId(fileId);
    setBusyAction("quarantine");
    setError("");
    try {
      await apiQuarantineIncident(fileId);
      await load();
    } catch (err) {
      // A cleanup failure can leave the file safely quarantined already.
      await load();
      setError(err.message || "Quarantine failed.");
    } finally {
      setBusyId(null);
      setBusyAction("");
    }
  }

  async function onDownload(incident) {
    setBusyId(incident.id);
    setBusyAction("download");
    setError("");
    try {
      await apiDownloadReport(incident.id, `incident_${incident.id}_report.pdf`);
    } catch (err) {
      setError(err.message || "Download failed.");
    } finally {
      setBusyId(null);
      setBusyAction("");
    }
  }

  return (
    <Page>
      <PageHeader
        kicker="Queue"
        title="Incidents"
        lede="Files the gateway quarantined, blocked, or held for approval. Approve to release a file. Reject to keep it blocked."
        actions={
          <Button onClick={load} busy={loading}>
            Refresh queue
          </Button>
        }
      />

      {error ? (
        <Banner action={<Button size="sm" onClick={load}>Try again</Button>}>
          {error}
        </Banner>
      ) : null}

      {loading ? <SkeletonTable rows={8} cols={8} /> : null}

      {!loading && !error && incidents.length === 0 ? (
        <EmptyState
          title="No incidents in the queue"
          body="Nothing needs review right now. New quarantines and blocks show up here."
        />
      ) : null}

      {!loading && !error && incidents.length > 0 ? (
        <div className="cq-table-wrap">
          <table className="cq-table gw-incidents-table">
            <thead>
              <tr>
                <th className="cq-sticky">File</th>
                <th>Status</th>
                <th>Sensitivity</th>
                <SortHeader column="risk_score" label="Risk" sort={sort} onSort={onSort} />
                <th>Uploaded by</th>
                <SortHeader column="uploaded_at" label="Uploaded" sort={sort} onSort={onSort} />
                <th>Reason</th>
                <th className="gw-incident-actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => {
                const rowBusy = busyId === incident.id;
                return (
                  <tr key={incident.id}>
                    <td className="cq-sticky">
                      <span className="gw-ellipsis" title={incident.filename}>
                        {incident.filename}
                      </span>
                      <span className="gw-mono">#{incident.id}</span>
                    </td>
                    <td>
                      <StatusBadge status={incident.status} />
                    </td>
                    <td>
                      <SensitivityBadge label={incident.sensitivity_label} />
                    </td>
                    <td className="cq-num">
                      <RiskBadge score={incident.risk_score} />
                    </td>
                    <td>
                      <span className="gw-ellipsis">
                        {incident.uploaded_by_username || `user #${incident.uploaded_by}`}
                      </span>
                    </td>
                    <td className="gw-tabular" title={incident.uploaded_at || undefined}>
                      {formatStamp(incident.uploaded_at)}
                    </td>
                    <td title={incident.reason || ""}>
                      <span className="gw-ellipsis">{incident.reason || "—"}</span>
                    </td>
                    <td className="gw-incident-actions-cell">
                      <div className="gw-row-actions gw-incident-actions">
                        <Link className="cq-btn cq-btn-ghost cq-btn-sm cq-btn-no-ico" to={`/incidents/${incident.id}/timeline`}>
                          <span className="cq-btn-label">Open timeline</span>
                        </Link>
                        <Button
                          size="sm"
                          busy={rowBusy && busyAction === "download"}
                          disabled={rowBusy}
                          onClick={() => onDownload(incident)}
                        >
                          Download report
                        </Button>
                        <Button
                          size="sm"
                          busy={rowBusy && busyAction === "approve"}
                          disabled={rowBusy}
                          onClick={() => onApprove(incident.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          busy={rowBusy && busyAction === "quarantine"}
                          disabled={busyId !== null}
                          onClick={() => onQuarantine(incident.id)}
                        >
                          Quarantine
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          busy={rowBusy && busyAction === "reject"}
                          disabled={rowBusy}
                          onClick={() => setRejectId(incident.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <ConfirmDialog
        open={rejectId !== null}
        title="Reject this file?"
        body="The file stays blocked. It remains in the queue so you can review it again."
        confirmLabel="Reject file"
        busy={busyAction === "reject"}
        onCancel={() => setRejectId(null)}
        onConfirm={() => onReject(rejectId)}
      />
    </Page>
  );
}
