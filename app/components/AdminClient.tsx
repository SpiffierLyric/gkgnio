"use client";

import { useMemo, useState, type FormEvent } from "react";
import { expandEffectiveTags, SEED_CATALOG, TAGS } from "../../game/catalog";
import "./AdminBrowser.css";

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

const tagLabels = new Map(TAGS.map((tag) => [tag.slug, tag.label]));
const builtInIdentities = SEED_CATALOG
  .map((identity) => ({ ...identity, effectiveTags: expandEffectiveTags(identity.tags) }))
  .sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));
const tagCounts = new Map(
  TAGS.map((tag) => [tag.slug, builtInIdentities.filter((identity) => identity.effectiveTags.includes(tag.slug)).length]),
);
const categoryGroups = [...new Set(TAGS.map((tag) => tag.facet))].map((facet) => ({
  facet,
  tags: TAGS.filter((tag) => tag.facet === facet),
}));

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
      tags: field("tags").split("|").map((entry) => entry.trim()).filter(Boolean),
      aliases: field("aliases").split("|").map((entry) => entry.trim()).filter(Boolean),
      publish: ["true", "1", "yes", "published"].includes(field("publish").toLowerCase()),
      imageCredit: field("imagecredit"),
      rightsNotes: field("rightsnotes"),
    };
  }).filter((row) => row.canonicalName && ["fictional", "real", "group"].includes(row.kind));
}

export function AdminClient() {
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [identitySearch, setIdentitySearch] = useState("");

  const visibleIdentities = useMemo(() => {
    const query = identitySearch.trim().toLocaleLowerCase();
    return builtInIdentities.filter((identity) => {
      const matchesCategory = selectedCategory === "all" || identity.effectiveTags.includes(selectedCategory);
      const matchesSearch = !query || [identity.canonicalName, ...identity.aliases]
        .some((name) => name.toLocaleLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [identitySearch, selectedCategory]);

  async function importRows(rows: ImportRow[]) {
    setBusy(true);
    setError("");
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
    if (failures.length) setError("Some records could not be imported. See the batch report.");
    setBusy(false);
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

  return (
    <section className="admin-shell">
      <div className="section-heading">
        <div><p className="eyebrow">PROTECTED CONTENT DESK</p><h1>Identity library</h1></div>
        <span className="counter">{builtInIdentities.length} BUILT IN</span>
      </div>
      <div className="rights-warning panel-raised"><strong>MEDIA NOTICE</strong><p>Remote images are copied into R2 and recorded with unknown rights status. Source tracking does not grant permission. Unpublish or replace disputed media immediately.</p></div>
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
      </div>

      <section className="identity-browser-card panel-raised" aria-labelledby="identity-browser-title">
        <div className="identity-browser-heading">
          <div><p className="eyebrow">BUILT-IN LIBRARY</p><h2 id="identity-browser-title">Identity browser</h2></div>
          <span className="counter">{visibleIdentities.length} OF {builtInIdentities.length}</span>
        </div>

        <div className="identity-browser-toolbar">
          <label>SEARCH IDENTITIES<input value={identitySearch} onChange={(event) => setIdentitySearch(event.target.value)} placeholder="NAME OR ALIAS" /></label>
          <label>CATEGORY<select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
            <option value="all">ALL IDENTITIES ({builtInIdentities.length})</option>
            {categoryGroups.map((group) => <optgroup label={group.facet.toUpperCase()} key={group.facet}>{group.tags.map((tag) => <option value={tag.slug} key={tag.slug}>{tag.label.toUpperCase()} ({tagCounts.get(tag.slug) ?? 0})</option>)}</optgroup>)}
          </select></label>
        </div>

        <div className="identity-browser-results panel-sunken" role="list" aria-live="polite">
          {visibleIdentities.length ? visibleIdentities.map((identity) => (
            <article className="identity-browser-entry" role="listitem" key={identity.id}>
              <div className="identity-browser-entry-heading">
                <h3>{identity.canonicalName}</h3>
                <span>{identity.kind === "real" ? "REAL" : identity.kind.toUpperCase()}</span>
              </div>
              <div className="identity-browser-tags">
                {identity.tags.slice(0, 4).map((tag) => <span key={tag}>{tagLabels.get(tag) ?? tag}</span>)}
              </div>
            </article>
          )) : <p className="identity-browser-empty">No built-in identities match these filters.</p>}
        </div>
      </section>
    </section>
  );
}
