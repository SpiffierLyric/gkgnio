/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { SEED_CATALOG, TAGS } from "../game/catalog";
import { adminRoute } from "./admin";
import { authRoutes } from "./auth";
import { diagnosticsRoute, recordDiagnostic } from "./diagnostics";
import type { AppEnv } from "./env";
import { GameRoom } from "./game-room";
import { mediaRoute } from "./media";

export { GameRoom };

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: AppEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const authResponse = await authRoutes(request, env);
    if (authResponse) return authResponse;

    const diagnosticsResponse = await diagnosticsRoute(request, env);
    if (diagnosticsResponse) return diagnosticsResponse;

    const adminResponse = await adminRoute(request, env);
    if (adminResponse) return adminResponse;

    const mediaResponse = await mediaRoute(request, env);
    if (mediaResponse) return mediaResponse;

    if (url.pathname === "/api/catalog") {
      return Response.json({ identityCount: SEED_CATALOG.length, tags: TAGS });
    }

    if (url.pathname === "/api/rooms/create" || url.pathname === "/api/rooms/join") {
      if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
      const bodyText = await request.text();
      let roomName = "";
      try {
        roomName = String((JSON.parse(bodyText) as { roomName?: string }).roomName ?? "").trim().replace(/\s+/g, " ");
      } catch {
        return Response.json({ error: "Invalid request." }, { status: 400 });
      }
      if (roomName.length < 3 || roomName.length > 32) return Response.json({ error: "Check the room name." }, { status: 400 });
      const action = url.pathname.endsWith("create") ? "create" : "join";
      const requestId = crypto.randomUUID();
      try {
        const id = env.ROOMS.idFromName(roomName.toLocaleLowerCase("en-US"));
        const stub = env.ROOMS.get(id);
        const response = await stub.fetch(
          new Request(`https://room.internal/${action}`, {
            method: "POST",
            headers: request.headers,
            body: bodyText,
          }),
        );
        const contentType = response.headers.get("content-type");
        if (response.status >= 500 || !contentType?.includes("application/json")) {
          const responseData = contentType?.includes("application/json")
            ? await response.clone().json().catch(() => null) as { detail?: unknown } | null
            : null;
          ctx.waitUntil(recordDiagnostic(env, {
            event: "room-service-invalid-response",
            route: url.pathname,
            status: response.status,
            contentType,
            requestId,
            detail: typeof responseData?.detail === "string" ? responseData.detail : null,
          }));
        }
        return response;
      } catch {
        ctx.waitUntil(recordDiagnostic(env, {
          event: "room-service-exception",
          route: url.pathname,
          status: 500,
          contentType: null,
          requestId,
          detail: null,
        }));
        return Response.json(
          { error: "The game service is unavailable. Please try again shortly.", requestId },
          { status: 503, headers: { "x-spiffier-request-id": requestId } },
        );
      }
    }

    const socketMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/socket$/);
    if (socketMatch) {
      const roomName = decodeURIComponent(socketMatch[1]).trim().replace(/\s+/g, " ");
      const id = env.ROOMS.idFromName(roomName.toLocaleLowerCase("en-US"));
      return env.ROOMS.get(id).fetch(
        new Request("https://room.internal/socket", {
          method: request.method,
          headers: request.headers,
        }),
      );
    }

    const images = env.IMAGES;
    if (url.pathname === "/_vinext/image" && images) {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await images.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
