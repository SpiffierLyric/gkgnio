import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`https://spiffiergames.io${pathname}`, { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      ROOMS: { idFromName() {}, get() {} },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Spiffier Games hub", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Spiffier Games<\/title>/i);
  assert.match(html, /Guess the Person/i);
  assert.equal((html.match(/<h3>Unreleased Game<\/h3>/gi) ?? []).length, 2);
  assert.doesNotMatch(html, /Good games\.|Bad guesses\.|Caption Collision|Signal Loss/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});
test("server-renders the host and join desk", async () => {
  const response = await render("/games/guess-the-person");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Host game/i);
  assert.match(html, /Join game/i);
  assert.match(html, /Guess the Person/i);
  assert.doesNotMatch(html, /ASK IN DISCORD|GROUP VOTES|LOW SCORE WINS/i);
});

test("server-renders the organized built-in identity browser", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Identity browser/i);
  assert.match(html, /750(?:<!-- -->)? BUILT IN/i);
  assert.match(html, /ALL IDENTITIES/i);
  assert.match(html, /Mario/i);
  assert.match(html, /Adam Sandler/i);
  assert.doesNotMatch(html, /Select a category|Tag taxonomy|Custom identities/i);
});
