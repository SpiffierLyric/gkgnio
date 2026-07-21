import type { AppEnv } from "./env";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function imageHeaders(contentType: string) {
  return {
    "content-type": contentType,
    "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
    "x-content-type-options": "nosniff",
  };
}
function isPrivateHost(hostname: string) {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".local") || lower === "0.0.0.0" || lower === "::1") return true;
  const match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const [, a, b] = match.map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export async function fetchValidatedImage(source: string) {
  let current = new URL(source);
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    if (current.protocol !== "https:" || isPrivateHost(current.hostname)) throw new Error("Only public HTTPS image URLs are allowed.");
    const response = await fetch(current, {
      redirect: "manual",
      headers: { accept: "image/avif,image/webp,image/png,image/jpeg" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === 3) throw new Error("The image redirected too many times.");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error("The remote image could not be downloaded.");
    const contentType = response.headers.get("content-type")?.split(";")[0].toLowerCase() ?? "";
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) throw new Error("Use a JPEG, PNG, or WebP image.");
    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_IMAGE_BYTES) throw new Error("The image is larger than 5 MB.");
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error("The image is larger than 5 MB.");
    return { bytes, contentType, finalUrl: current.toString() };
  }
  throw new Error("The remote image could not be downloaded.");
}

export async function mediaRoute(request: Request, env: AppEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/media/")) return null;

  const remainder = decodeURIComponent(url.pathname.slice("/api/media/".length));
  if (remainder.startsWith("wiki/")) {
    const wikiTitle = remainder.slice("wiki/".length).trim();
    if (!wikiTitle) return new Response("Not found", { status: 404 });
    const cacheKey = `wiki/${wikiTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (env.MEDIA) {
      const cached = await env.MEDIA.get(cacheKey);
      if (cached) {
        return new Response(cached.body, {
          headers: imageHeaders(cached.httpMetadata?.contentType ?? "image/jpeg"),
        });
      }
    }

    const summaryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`, {
      headers: { accept: "application/json", "user-agent": "SpiffierGames/1.0 (identity-card-cache)" },
    });
    if (!summaryResponse.ok) return new Response("Image unavailable", { status: 404 });
    const summary = (await summaryResponse.json()) as { thumbnail?: { source?: string }; originalimage?: { source?: string } };
    const source = summary.thumbnail?.source ?? summary.originalimage?.source;
    if (!source) return new Response("Image unavailable", { status: 404 });
    try {
      const image = await fetchValidatedImage(source);
      if (env.MEDIA) {
        await env.MEDIA.put(cacheKey, image.bytes, { httpMetadata: { contentType: image.contentType } });
      }
      return new Response(image.bytes, { headers: imageHeaders(image.contentType) });
    } catch {
      return new Response("Image unavailable", { status: 404 });
    }
  }

  if (!env.MEDIA || remainder.includes("..")) return new Response("Not found", { status: 404 });
  const object = await env.MEDIA.get(remainder);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: imageHeaders(object.httpMetadata?.contentType ?? "application/octet-stream"),
  });
}
