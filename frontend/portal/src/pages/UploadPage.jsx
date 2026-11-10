import { useCallback, useState } from "react";
import { Banner, Button, Page, PageHeader, StatusBadge } from "../../../design-system/ui.jsx";
import { apiUpload } from "../api";

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const sendFile = useCallback(async (file) => {
    if (!file) return;
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const data = await apiUpload(file);
      setResult(data);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }, []);

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    sendFile(file);
  }

  function onPick(event) {
    const file = event.target.files?.[0];
    sendFile(file);
    event.target.value = "";
  }

  return (
    <Page>
      <PageHeader
        kicker="Intake"
        title="Upload"
        lede="PDF, Word, and text files are checked by the local semantic guard before the rest of the gateway pipeline."
      />

      <div
        className="gw-drop"
        data-dragging={dragging ? "true" : "false"}
        aria-busy={busy ? "true" : "false"}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <p className="t-h3">Drop a file here</p>
        <p className="t-body gw-hint">or choose one from this device</p>
        <label className="cq-btn cq-btn-primary cq-btn-no-ico gw-file">
          <input className="cq-sr-only" type="file" onChange={onPick} disabled={busy} />
          <span className="cq-btn-label">{busy ? "Checking the file" : "Choose a file"}</span>
        </label>
      </div>

      {error ? <Banner>{error}</Banner> : null}

      {result ? (
        <section className="gw-summary" aria-live="polite">
          <h2 className="t-h3">{result.status === "BLOCKED" ? "Upload blocked" : "Upload accepted"}</h2>
          <dl className="gw-result">
            <div>
              <dt className="t-caption">File ID</dt>
              <dd className="gw-mono">{result.file_id}</dd>
            </div>
            <div>
              <dt className="t-caption">Filename</dt>
              <dd>{result.filename}</dd>
            </div>
            <div>
              <dt className="t-caption">Status</dt>
              <dd>
                <StatusBadge status={result.status} />
              </dd>
            </div>
            {result.semantic ? (
              <>
                <div>
                  <dt className="t-caption">Semantic check</dt>
                  <dd>
                    <StatusBadge status={result.semantic.action} />
                  </dd>
                </div>
                <div>
                  <dt className="t-caption">Similarity</dt>
                  <dd className="gw-mono gw-tabular">{result.semantic.similarity_score}</dd>
                </div>
                <div>
                  <dt className="t-caption">Matched category</dt>
                  <dd>{result.semantic.matched_category_name || "None"}</dd>
                </div>
              </>
            ) : null}
          </dl>
          <p className="t-body gw-hint">
            {result.status === "BLOCKED"
              ? "The semantic guard blocked this document. It was not sent on through the rest of the pipeline."
              : "The gateway pipeline has finished this file. Check My files for the stored result."}
          </p>
          <Button onClick={() => setResult(null)}>Upload another file</Button>
        </section>
      ) : null}
    </Page>
  );
}
