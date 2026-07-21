import type { AppEnv } from "./env";

const encoder = new TextEncoder();

export interface DiscordProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  exp: number;
}
function base64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return new TextDecoder().decode(Uint8Array.from(atob(padded), (character) => character.charCodeAt(0)));
}

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  for (const part of cookies.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

function secureCookie(request: Request) {
  return new URL(request.url).protocol === "https:" ? "; Secure" : "";
}

export async function authRoutes(request: Request, env: AppEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/auth/")) return null;

  if (url.pathname === "/api/auth/discord/start") {
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.APP_SESSION_SECRET) {
      return Response.json({ error: "Discord sign-in is not configured yet." }, { status: 503 });
    }
    const stateBytes = new Uint8Array(24);
    crypto.getRandomValues(stateBytes);
    const state = base64Url(stateBytes);
    const redirectUri = `${url.origin}/api/auth/discord/callback`;
    const authorize = new URL("https://discord.com/oauth2/authorize");
    authorize.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("scope", "identify");
    authorize.searchParams.set("state", state);
    return new Response(null, {
      status: 302,
      headers: {
        location: authorize.toString(),
        "set-cookie": `spiffier_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/api/auth/discord; Max-Age=600${secureCookie(request)}`,
      },
    });
  }

  if (url.pathname === "/api/auth/discord/callback") {
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.APP_SESSION_SECRET) {
      return Response.json({ error: "Discord sign-in is not configured yet." }, { status: 503 });
    }
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    if (!state || !code || state !== cookieValue(request, "spiffier_oauth_state")) {
      return Response.json({ error: "The Discord sign-in request expired." }, { status: 400 });
    }

    const redirectUri = `${url.origin}/api/auth/discord/callback`;
    const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenResponse.ok) return Response.json({ error: "Discord did not complete sign-in." }, { status: 502 });
    const token = (await tokenResponse.json()) as { access_token: string };
    const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    if (!userResponse.ok) return Response.json({ error: "Discord profile lookup failed." }, { status: 502 });
    const user = (await userResponse.json()) as { id: string; username: string; global_name?: string | null; avatar?: string | null };
    const profile: DiscordProfile = {
      id: user.id,
      name: user.global_name || user.username,
      avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : undefined,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO users (id, discord_id, display_name, avatar_url)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(discord_id) DO UPDATE SET display_name = excluded.display_name,
             avatar_url = excluded.avatar_url, updated_at = CURRENT_TIMESTAMP`,
        )
          .bind(`discord:${user.id}`, user.id, profile.name, profile.avatarUrl ?? null)
          .run();
      } catch {
        // The identity still works in local previews before migrations are applied.
      }
    }

    const payload = base64Url(JSON.stringify(profile));
    const signature = await hmac(env.APP_SESSION_SECRET, payload);
    return new Response(null, {
      status: 302,
      headers: {
        location: "/games/guess-the-celebrity",
        "set-cookie": `spiffier_session=${payload}.${signature}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secureCookie(request)}`,
      },
    });
  }

  if (url.pathname === "/api/auth/me") {
    const profile = await readSession(request, env);
    return Response.json({ profile });
  }

  if (url.pathname === "/api/auth/logout") {
    return new Response(null, {
      status: 302,
      headers: {
        location: "/",
        "set-cookie": `spiffier_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureCookie(request)}`,
      },
    });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}

export async function readSession(request: Request, env: AppEnv): Promise<DiscordProfile | null> {
  if (!env.APP_SESSION_SECRET) return null;
  const session = cookieValue(request, "spiffier_session");
  if (!session) return null;
  const [payload, signature] = session.split(".");
  if (!payload || !signature || (await hmac(env.APP_SESSION_SECRET, payload)) !== signature) return null;
  try {
    const profile = JSON.parse(decodeBase64Url(payload)) as DiscordProfile;
    return profile.exp > Date.now() ? profile : null;
  } catch {
    return null;
  }
}
