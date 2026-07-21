"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { TagDefinition } from "../../game/types";

interface CatalogResponse {
  seedCount: number;
  tags: TagDefinition[];
  custom: Array<Record<string, string>>;
  error?: string;
}

interface ImportRow {
  canonicalName: string;
  kind: "fictional" | "real" | "group";
  imageUrl: string;
  sourceUrl: string;
  tags: string[];
  aliases: string[];
  publish: boolean;
  imageCredit?: string;
  rightsNotes?: string;
}

function parseCsv(text: string): ImportRow[] {
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((row) => row.trim());
  if (rows.length < 2) return [];
  const split = (row: string) => {
    const cells: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < row.length; index += 1) {
      const character = row[index];
      if (character === '"' && row[index + 1] === '"' && quoted) { value += '"'; index += 1; }
      else if (character === '"') quoted = !quoted;
      else if (character === "," && !quoted) { cells.push(value.trim()); value = ""; }
      else value += character;
    }
    cells.push(value.trim());
    return cells;
  };
  const headers = split(rows[0]).map((header) => header.toLowerCase());
  return rows.slice(1).map((row) => {
    const values = split(row);
    const field = (name: string) => values[headers.indexOf(name)] ?? "";
    const kind = field("kind") as ImportRow["kind"];
    return {
      canonicalName: field("canonicalname") || field("name"),
      kind,
      imageUrl: field("imageurl"),
      sourceUrl: field("sourceurl"),
      tags: field("tags").split("|").map((value) => value.trim()).filter(Boolean),
      aliases: field("aliases").split("|").map((value) => value.trim()).filter(Boolean),
      publish: ["true", "1", "yes", "published"].includes(field("publish").toLowerCase()),
      imageCredit: field("imagecredit"),
      rightsNotes: field("rightsnotes"),
    };
  }).filter((row) => row.canonicalName && ["fictional", "real", "group"].includes(row.kind));
}

export function AdminClient() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/catalog");
    const data = await response.json() as CatalogResponse;
    if (!response.ok) setError(data.error ?? "Admin access is unavailable.");
    else { setCatalog(data); setError(""); }
  }

  useEffect(() => {
    queueMicrotask(() => load().catch(() => setError("Admin access is unavailable.")));
  }, []);

  async function importRows(rows: ImportRow[]) {
    setBusy(true);
    let imported = 0;
    const failures: string[] = [];
    for (const [index, row] of rows.entries()) {
      setProgress(`IMPORTING ${index + 1} / ${rows.length}: ${row.canonicalName}`);
      try {
        const response = await fetch("/api/admin/import", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(row),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Import failed");
        imported += 1;
      } catch (caught) {
        failures.push(`${row.canonicalName}: ${caught instanceof Error ? caught.message : "failed"}`);
      }
    }
    setProgress(`COMPLETE: ${imported} IMPORTED / ${failures.length} FAILED${failures.length ? ` — ${failures.join("; ")}` : ""}`);
    setBusy(false);
    await load();
  }

  async function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await importRows([{
      canonicalName: String(form.get("canonicalName") ?? ""),
      kind: String(form.get("kind") ?? "fictional") as ImportRow["kind"],
      imageUrl: String(form.get("imageUrl") ?? ""),
      sourceUrl: String(form.get("sourceUrl") ?? ""),
      tags: String(form.get("tags") ?? "").split("|").map((value) => value.trim()).filter(Boolean),
      aliases: String(form.get("aliases") ?? "").split("|").map((value) => value.trim()).filter(Boolean),
      imageCredit: String(form.get("imageCredit") ?? ""),
      rightsNotes: String(form.get("rightsNotes") ?? ""),
      publish: form.get("publish") === "on",
    }]);
    event.currentTarget.reset();
  }

  async function unpublish(id: string) {
    await fetch("/api/admin/unpublish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  }

  return (
    <section className="admin-shell">
      <div className="section-heading"><div><p className="eyebrow">PROTECTED CONTENT DESK</p><h1>Identity library</h1></div><span className="counter">{catalog ? `${catalog.seedCount} SEED / ${catalog.custom.length} CUSTOM` : "CONNECTING"}</span></div>
      <div className="rights-warning panel-raised"><strong>MEDIA NOTICE</strong><p>Remote images are copied into R2 and recorded as rights status “unknown.” Source tracking does not grant permission. Unpublish or replace disputed media immediately.</p></div>
      {error ? <div className="form-error" role="alert">{error}</div> : null}
      <div className="admin-grid">
        <form className="admin-form panel-raised" onSubmit={submitManual}>
          <p className="eyebrow">SINGLE RECORD</p><h2>Add identity</h2>
          <label>CANONICAL NAME<input name="canonicalName" required /></label>
          <label>KIND<select name="kind"><option value="fictional">FICTIONAL</option><option value="real">REAL PERSON</option><option value="group">GROUP / DUO</option></select></label>
          <label>IMAGE URL<input name="imageUrl" type="url" required placeholder="HTTPS://" /></label>
          <label>SOURCE PAGE URL<input name="sourceUrl" type="url" required placeholder="HTTPS://" /></label>
          <label>TAGS, SEPARATED BY |<input name="tags" placeholder="fictional-character|tv-film|cartoon" /></label>
          <label>ALIASES, SEPARATED BY |<input name="aliases" /></label>
          <label>IMAGE CREDIT<input name="imageCredit" /></label>
          <label>RIGHTS NOTES<textarea name="rightsNotes" rows={3} /></label>
          <label className="checkbox-label"><input name="publish" type="checkbox" /> PUBLISH AFTER VALIDATION</label>
          <button className="button button-primary" disabled={busy}>FETCH IMAGE + SAVE</button>
        </form>

        <section className="bulk-panel panel-raised">
          <p className="eyebrow">RESUMABLE BATCH</p><h2>CSV import</h2>
          <p>Required headers: <code>canonicalName,kind,imageUrl,sourceUrl,tags,aliases,publish</code>. Separate tags and aliases with a vertical bar.</p>
          <label className="file-drop panel-sunken">SELECT CSV<input type="file" accept=".csv,text/csv" disabled={busy} onChange={async (event) => { const file = event.target.files?.[0]; if (file) await importRows(parseCsv(await file.text())); }} /></label>
          <a className="button" href="data:text/csv;charset=utf-8,canonicalName%2Ckind%2CimageUrl%2CsourceUrl%2Ctags%2Caliases%2Cpublish%0AMega%20Man%2Cfictional%2Chttps%3A%2F%2Fexample.com%2Fimage.jpg%2Chttps%3A%2F%2Fexample.com%2Cfictional-character%7Cvideo-games%2CRockman%2Cfalse" download="spiffier-identities-template.csv">DOWNLOAD TEMPLATE</a>
          {progress ? <pre className="import-progress panel-sunken">{progress}</pre> : null}
        </section>

        <section className="taxonomy-panel panel-raised">
          <p className="eyebrow">CONTROLLED VOCABULARY</p><h2>Tag taxonomy</h2>
          {[...new Set((catalog?.tags ?? []).map((tag) => tag.facet))].map((facet) => <div className="taxonomy-group" key={facet}><strong>{facet}</strong><div>{catalog?.tags.filter((tag) => tag.facet === facet).map((tag) => <span key={tag.slug}>{tag.label}{tag.implies?.length ? ` → ${tag.implies.join(", ")}` : ""}</span>)}</div></div>)}
        </section>
      </div>

      <section className="library-table panel-raised">
        <div className="section-heading compact"><div><p className="eyebrow">DATABASE RECORDS</p><h2>Custom identities</h2></div></div>
        {catalog?.custom.length ? catalog.custom.map((identity) => <div className="library-row" key={identity.id}><strong>{identity.canonical_name}</strong><span>{identity.kind}</span><span>{identity.rights_status}</span><span>{identity.status}</span><button className="button button-compact" disabled={identity.status === "unpublished"} onClick={() => unpublish(identity.id)}>UNPUBLISH</button></div>) : <p>No custom records yet. The built-in 400-entry catalog remains available to games.</p>}
      </section>
    </section>
  );
}
