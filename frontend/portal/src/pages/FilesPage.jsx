import { useEffect, useState } from "react";
import { formatStamp } from "../../../design-system/format.js";
import {
  Banner,
  Button,
  EmptyState,
  Page,
  PageHeader,
  SkeletonTable,
  StatusBadge,
} from "../../../design-system/ui.jsx";
import { apiDownload, apiListFiles, apiRequestDecryption } from "../api";

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await apiListFiles();
      setFiles(data.files || []);
    } catch (err) {
      setError(err.message || "Could not load files.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDownload(file) {
    setBusyId(file.id);
    setError("");
    try {
      await apiDownload(file.id, file.filename);
    } catch (err) {
      setError(err.message || "Download failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function onRequestDecryption(file) {
    setBusyId(file.id);
    setError("");
    try {
      await apiRequestDecryption(file.id, file.filename);
    } catch (err) {
      if (err.denied) {
        setError(`Decryption denied: ${err.message}`);
      } else {
        setError(err.message || "Decryption request failed.");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Page>
      <PageHeader
        kicker="Library"
        title="My files"
        lede="Status is the latest gateway decision for each upload."
        actions={
          <Button onClick={load} busy={loading}>
            Refresh files
          </Button>
        }
      />

      {error ? (
        <Banner action={<Button size="sm" onClick={load}>Try again</Button>}>
          {error}
        </Banner>
      ) : null}

      {loading ? <SkeletonTable rows={6} cols={5} /> : null}

      {!loading && !error && files.length === 0 ? (
        <EmptyState title="No uploads yet" body="Send a file from the Upload page. It will show up here." />
      ) : null}

      {!loading && !error && files.length > 0 ? (
        <div className="cq-table-wrap">
          <table className="cq-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Filename</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const status = (file.status || "").toUpperCase();
                const approved = status === "APPROVED";
                const encrypted = status === "APPROVED_ENCRYPTED";
                const busy = busyId === file.id;

                return (
                  <tr key={file.id}>
                    <td className="gw-mono">{file.id}</td>
                    <td>
                      <span className="gw-ellipsis" title={file.filename}>
                        {file.filename}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={file.status} />
                    </td>
                    <td className="gw-tabular" title={file.uploaded_at || undefined}>
                      {formatStamp(file.uploaded_at)}
                    </td>
                    <td>
                      {encrypted ? (
                        <Button
                          size="sm"
                          busy={busy}
                          onClick={() => onRequestDecryption(file)}
                          title="Re-check risk and policy, then decrypt and download"
                        >
                          Request decryption
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          busy={busy}
                          disabled={!approved}
                          onClick={() => onDownload(file)}
                          title={
                            approved
                              ? "Download approved file"
                              : `Download stays off while status is ${file.status}`
                          }
                        >
                          Download
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </Page>
  );
}
