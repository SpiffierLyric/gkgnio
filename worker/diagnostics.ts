import type { AppEnv } from "./env";

export interface DiagnosticRecord {
  id: string;
  occurredAt: string;
  event: string;
  route: string;
  status: number | null;
  contentType: string | null;
  requestId: string;
}

const DIAGNOSTICS_OBJECT_NAME = "spiffier-system-diagnostics";

function diagnosticsStub(env: AppEnv) {
  return env.ROOMS.get(env.ROOMS.idFromName(DIAGNOSTICS_OBJECT_NAME));
}

export async function recordDiagnostic(
  env: AppEnv,
  record: Omit<DiagnosticRecord, "id" | "occurredAt">,
) {
  try {
    await diagnosticsStub(env).fetch(new Request("https://room.internal/diagnostics/record", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(record),
    }));
  } catch {
    // Diagnostics must never interrupt a game request.
  }
}

export async function diagnosticsRoute(request: Request, env: AppEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/diagnostics") return null;
  if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405 });
  try {
    const response = await diagnosticsStub(env).fetch(new Request("https://room.internal/diagnostics/list"));
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Diagnostics response was invalid.");
    return response;
  } catch {
    return Response.json({ records: [], available: false });
  }
}
