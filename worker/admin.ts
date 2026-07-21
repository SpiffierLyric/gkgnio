import { SEED_CATALOG, TAGS } from "../game/catalog";
import type { CatalogIdentity } from "../game/types";
import type { AppEnv } from "./env";
import { fetchValidatedImage } from "./media";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function adminEmail(request: Request) {
  return request.headers.get("cf-access-authenticated-user-email") ?? request.headers.get("x-spiffier-admin-email");
}

function isLocal(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function authorized(request: Request, env: AppEnv) {
  if (isLocal(request)) return true;
  const email = adminEmail(request)?.toLowerCase();
  const allowed = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && allowed.includes(email));
}

async function ensureTaxonomy(env: AppEnv) {
  if (!env.DB) return;
  const facets = [...new Set(TAGS.map((tag) => tag.facet))];
  const statements: D1PreparedStatement[] = [];
  facets.forEach((facet, index) => {
    const slug = slugify(facet);
    statements.push(
      env.DB!.prepare(
        `INSERT INTO facets (id, slug, label, sort_order) VALUES (?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET label = excluded.label, sort_order = excluded.sort_order`,
      ).bind(`facet:${slug}`, slug, facet, index),
    );
  });
  TAGS.forEach((tag) => {
    statements.push(
      env.DB!.prepare(
        `INSERT INTO tags (id, facet_id, slug, label, description, active) VALUES (?, ?, ?, ?, '', 1)
         ON CONFLICT(slug) DO UPDATE SET label = excluded.label, facet_id = excluded.facet_id, active = 1`,
      ).bind(`tag:${tag.slug}`, `facet:${slugify(tag.facet)}`, tag.slug, tag.label),
    );
  });
  for (let index = 0; index < statements.length; index += 50) await env.DB.batch(statements.slice(index, index + 50));

  const implications = TAGS.flatMap((tag) => (tag.implies ?? []).map((implied) => [tag.slug, implied] as const));
  if (implications.length > 0) {
    await env.DB.batch(
      implications.map(([source, implied]) =>
        env.DB!.prepare(
          `INSERT INTO tag_implications (source_tag_id, implied_tag_id) VALUES (?, ?)
           ON CONFLICT(source_tag_id, implied_tag_id) DO NOTHING`,
        ).bind(`tag:${source}`, `tag:${implied}`),
      ),
    );
  }
}

export async function adminRoute(request: Request, env: AppEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/admin/")) return null;
  if (!authorized(request, env)) return Response.json({ error: "Admin access is required." }, { status: 403 });
  if (!env.DB) return Response.json({ error: "The D1 database is not configured." }, { status: 503 });

  if (url.pathname === "/api/admin/catalog" && request.method === "GET") {
    try {
      await ensureTaxonomy(env);
      const custom = await env.DB.prepare(
        `SELECT id, canonical_name, kind, image_key, image_source_url, rights_status, status, updated_at
         FROM identities ORDER BY updated_at DESC LIMIT 500`,
      ).all();
      return Response.json({ seedCount: SEED_CATALOG.length, tags: TAGS, custom: custom.results });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Apply the database migration first." }, { status: 503 });
    }
  }

  if (url.pathname === "/api/admin/import" && request.method === "POST") {
    const body = (await request.json()) as {
      canonicalName?: string;
      aliases?: string[];
      kind?: CatalogIdentity["kind"];
      imageUrl?: string;
      sourceUrl?: string;
      tags?: string[];
      publish?: boolean;
      imageCredit?: string;
      rightsNotes?: string;
    };
    const canonicalName = body.canonicalName?.trim() ?? "";
    const slug = slugify(canonicalName);
    if (!canonicalName || !slug || !body.imageUrl || !body.sourceUrl || !["fictional", "real", "group"].includes(body.kind ?? "")) {
      return Response.json({ error: "Name, kind, source URL, and image URL are required." }, { status: 400 });
    }
    try {
      await ensureTaxonomy(env);
      const image = await fetchValidatedImage(body.imageUrl);
      if (!env.MEDIA) return Response.json({ error: "The R2 media bucket is not configured." }, { status: 503 });
      const extension = image.contentType === "image/png" ? "png" : image.contentType === "image/webp" ? "webp" : "jpg";
      const identityId = crypto.randomUUID();
      const imageKey = `identities/${identityId}.${extension}`;
      await env.MEDIA.put(imageKey, image.bytes, { httpMetadata: { contentType: image.contentType } });
      await env.DB.prepare(
        `INSERT INTO identities
          (id, slug, canonical_name, kind, image_key, image_source_url, image_credit, rights_status, rights_notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'unknown', ?, ?)`,
      )
        .bind(
          identityId,
          slug,
          canonicalName,
          body.kind,
          imageKey,
          body.sourceUrl,
          body.imageCredit?.trim() ?? "",
          body.rightsNotes?.trim() ?? "",
          body.publish ? "published" : "draft",
        )
        .run();

      const tagSlugs = [...new Set(body.tags ?? [])].filter((tag) => TAGS.some((definition) => definition.slug === tag));
      const statements: D1PreparedStatement[] = [
        ...tagSlugs.map((tag) =>
          env.DB!.prepare(
            `INSERT INTO identity_tags (identity_id, tag_id, source) VALUES (?, ?, 'direct')
             ON CONFLICT(identity_id, tag_id) DO NOTHING`,
          ).bind(identityId, `tag:${tag}`),
        ),
        ...(body.aliases ?? [])
          .map((alias) => alias.trim())
          .filter(Boolean)
          .map((alias) =>
            env.DB!.prepare(`INSERT INTO identity_aliases (id, identity_id, value) VALUES (?, ?, ?)`).bind(
              crypto.randomUUID(),
              identityId,
              alias,
            ),
          ),
      ];
      if (statements.length > 0) await env.DB.batch(statements);
      return Response.json({ id: identityId, imageKey, status: body.publish ? "published" : "draft" }, { status: 201 });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Import failed." }, { status: 400 });
    }
  }

  if (url.pathname === "/api/admin/unpublish" && request.method === "POST") {
    const body = (await request.json()) as { id?: string };
    if (!body.id) return Response.json({ error: "Identity ID is required." }, { status: 400 });
    await env.DB.prepare(`UPDATE identities SET status = 'unpublished', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(body.id)
      .run();
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}
