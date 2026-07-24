import assert from "node:assert/strict";
import test from "node:test";
import { expandEffectiveTags, filterCatalog, MUSIC_2000S_IDS, SEED_CATALOG, TAGS } from "../game/catalog";
import { lateJoinPenalty, rankScores } from "../game/scoring";

test("ships exactly 750 valid, uniquely named seed identities", () => {
  assert.equal(SEED_CATALOG.length, 750);
  assert.equal(new Set(SEED_CATALOG.map((identity) => identity.id)).size, 750);
  assert.equal(new Set(SEED_CATALOG.map((identity) => identity.canonicalName.normalize("NFKC").toLocaleLowerCase())).size, 750);
  const validTags = new Set(TAGS.map((tag) => tag.slug));
  assert.ok(SEED_CATALOG.every((identity) => identity.tags.every((tag) => validTags.has(tag))));
  assert.ok(SEED_CATALOG.every((identity) => identity.sourceUrl.startsWith("https://en.wikipedia.org/wiki/")));
});

test("tag implications are cycle-free and every selectable tag has 20 effective identities", () => {
  const definitions = new Map(TAGS.map((tag) => [tag.slug, tag]));
  function visit(slug: string, active = new Set<string>(), seen = new Set<string>()) {
    assert.ok(!active.has(slug), `implication cycle at ${slug}`);
    if (seen.has(slug)) return;
    active.add(slug);
    for (const implied of definitions.get(slug)?.implies ?? []) visit(implied, active, seen);
    active.delete(slug);
    seen.add(slug);
  }
  for (const tag of TAGS) visit(tag.slug);
  for (const tag of TAGS) {
    const count = SEED_CATALOG.filter((identity) => expandEffectiveTags(identity.tags).includes(tag.slug)).length;
    assert.ok(count >= 20, `${tag.slug} only has ${count} effective identities`);
  }
});

test("music expansion has required identities and 2000s coverage", () => {
  const kanye = SEED_CATALOG.find((identity) => identity.canonicalName === "Kanye West");
  assert.ok(kanye?.aliases.includes("Ye"));
  assert.ok(expandEffectiveTags(kanye?.tags ?? []).includes("musician"));
  const daftPunk = SEED_CATALOG.find((identity) => identity.canonicalName === "Daft Punk");
  assert.equal(daftPunk?.kind, "group");
  for (const tag of ["group-duo", "musician", "music"]) assert.ok(expandEffectiveTags(daftPunk?.tags ?? []).includes(tag));
  const musicians = SEED_CATALOG.filter((identity) => expandEffectiveTags(identity.tags).includes("musician"));
  assert.ok(musicians.length >= 80);
  assert.ok(musicians.filter((identity) => MUSIC_2000S_IDS.has(identity.id)).length >= 35);
});

test("category builder applies ALL and ANY buckets", () => {
  const result = filterCatalog(SEED_CATALOG, ["fictional-character", "tv-film"], ["anime", "spongebob"]);
  assert.ok(result.some((identity) => identity.canonicalName === "Jotaro Kujo"));
  assert.ok(result.some((identity) => identity.canonicalName === "SpongeBob SquarePants"));
  assert.ok(result.every((identity) => identity.tags.includes("anime") || identity.tags.includes("spongebob")));
  assert.ok(!result.some((identity) => identity.canonicalName === "Adam Sandler"));
});

test("ALL filters can be checked against the ten-identity minimum", () => {
  assert.ok(filterCatalog(SEED_CATALOG, ["fictional-character", "anime"], []).length >= 10);
  assert.ok(filterCatalog(SEED_CATALOG, ["fictional-character", "anime", "spongebob"], []).length < 10);
});

test("tag implications make role filters include real people", () => {
  const actors = filterCatalog(SEED_CATALOG, ["real-person", "actor"], []);
  assert.ok(actors.some((identity) => identity.canonicalName === "Adam Sandler"));
});

test("late join penalty averages three scores closest to the median and rounds up", () => {
  const penalty = lateJoinPenalty([
    {
      round: 1,
      scores: [1, 2, 3, 7, 12].map((strokes, index) => ({
        playerId: String(index), playerName: String(index), strokes, slots: strokes * 2, dnf: false, identityName: "X",
      })),
    },
  ]);
  assert.deepEqual(penalty, { strokes: 2, slots: 4 });
});

test("golf rankings use questions as the secondary score", () => {
  const ranked = rankScores([
    { name: "B", totalStrokes: 3, totalSlots: 5 },
    { name: "A", totalStrokes: 3, totalSlots: 4 },
    { name: "C", totalStrokes: 4, totalSlots: 1 },
  ]);
  assert.deepEqual(ranked.map((player) => player.name), ["A", "B", "C"]);
});
