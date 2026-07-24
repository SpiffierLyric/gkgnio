"use client";

import { useEffect, useState } from "react";

interface DiagnosticRecord {
  id: string;
  occurredAt: string;
  event: string;
  route: string;
  status: number | null;
  contentType: string | null;
  requestId: string;
  detail: string | null;
}

export function DiagnosticsClient() {
  const [records, setRecords] = useState<DiagnosticRecord[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/diagnostics")
      .then((response) => response.json())
      .then((data) => {
        setRecords(Array.isArray(data.records) ? data.records : []);
        setAvailable(Boolean(data.available));
      })
      .catch(() => setAvailable(false));
  }, []);

  return (
    <section className="diagnostics-panel panel-raised" aria-labelledby="diagnostics-title">
      <div className="section-heading compact">
        <div><p className="eyebrow">PUBLIC-SAFE ROLLING BUFFER</p><h1 id="diagnostics-title">Service log</h1></div>
        <span className="counter">{records.length} EVENTS</span>
      </div>
      <p className="diagnostics-note">Shows only route, status, response type, and a support ID. It never records names, passwords, tokens, room names, or IP addresses.</p>
      {available === false ? <p className="form-error">LOG STORAGE IS NOT AVAILABLE YET.</p> : null}
      {available === null ? <p className="diagnostics-empty">LOADING RECENT EVENTS…</p> : null}
      {available && records.length === 0 ? <p className="diagnostics-empty">NO SERVICE ERRORS RECORDED.</p> : null}
      {records.length > 0 ? <div className="diagnostics-table" role="table" aria-label="Recent service errors">
        <div className="diagnostics-row diagnostics-heading" role="row"><span>TIME</span><span>EVENT</span><span>ROUTE</span><span>STATUS</span><span>TYPE / STAGE</span><span>SUPPORT ID</span></div>
        {records.map((record) => <div className="diagnostics-row" role="row" key={record.id}>
          <time dateTime={record.occurredAt}>{new Date(record.occurredAt).toLocaleString()}</time>
          <span>{record.event}</span><span>{record.route}</span><span>{record.status ?? "—"}</span><span>{record.contentType ?? "—"}{record.detail ? ` / ${record.detail}` : ""}</span><code>{record.requestId}</code>
        </div>)}
      </div> : null}
    </section>
  );
}
