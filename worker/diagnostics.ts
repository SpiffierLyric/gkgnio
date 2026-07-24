import type { AppEnv } from "./env";

const MAX_RECORDS = 100;

export interface DiagnosticRecord {
  id: string;
  occurredAt: string;
  event: string;
  route: string;
  status: number | null;
  contentType: string | null;
  requestId: string;
}

function safeContentType(value: string | null) {
  if (!value) return null;
  return value.split(";", 1)[0].toLowerCase().replace(/[^a-z0-9./+-]/g, "").slice(0, 80) || null;
}

export async function recordDiagnostic(
  env: AppEnv,
  record: Omit<DiagnosticRecord, "id" | "occurredAt">,
) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      `INSERT INTO diagnostic_events (id, event, route, status, content_type, request_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), record.event, record.route, record.status, safeContentType(record.contentType), record.requestId).run();
    await env.DB.prepare(
      `DELETE FROM diagnostic_events
       WHERE id IN (
         SELECT id FROM diagnostic_events ORDER BY occurred_at DESC, id DESC LIMIT -1 OFFSET ?
       )`,
    ).bind(MAX_RECORDS).run();
  } catch {
    // Diagnostics must never interrupt a game request.
  }
}

export async function diagnosticsRoute(request: Request, env: AppEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/diagnostics") return null;
  if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405 });
  if (!env.DB) return Response.json({ records: [], available: false });
  try {
    const result = await env.DB.prepare(
      `SELECT id, occurred_at AS occurredAt, event, route, status, content_type AS contentType, request_id AS requestId
       FROM diagnostic_events ORDER BY occurred_at DESC, id DESC LIMIT ?`,
    ).bind(MAX_RECORDS).all<DiagnosticRecord>();
    return Response.json({ records: result.results, available: true });
  } catch {
    return Response.json({ records: [], available: false });
  }
}
