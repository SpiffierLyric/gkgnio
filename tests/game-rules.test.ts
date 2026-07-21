import assert from "node:assert/strict";
import test from "node:test";
import { filterCatalog, SEED_CATALOG } from "../game/catalog";
import { lateJoinPenalty, rankScores } from "../game/scoring";

test("ships exactly 400 unique seed identities", () => {
  assert.equal(SEED_CATALOG.length, 400);
  assert.equal(new Set(SEED_CATALOG.map((identity) => identity.id)).size, 400);
});

test("category builder applies ALL and ANY buckets", () => {
  const result = filterCatalog(SEED_CATALOG, ["fictional-character", "tv-film"], ["anime", "spongebob"]);
  assert.ok(result.some((identity) => identity.canonicalName === "Jotaro Kujo"));
  assert.ok(result.some((identity) => identity.canonicalName === "SpongeBob SquarePants"));
  assert.ok(result.every((identity) => identity.tags.includes("anime") || identity.tags.includes("spongebob")));
  assert.ok(!result.some((identity) => identity.canonicalName === "Adam Sandler"));
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
