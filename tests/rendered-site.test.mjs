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
  assert.match(html, /Good games\./i);
  assert.match(html, /Bad guesses\./i);
  assert.match(html, /Guess the Celebrity/i);
  assert.match(html, /Discord voice chat/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});
test("server-renders the host and join desk", async () => {
  const response = await render("/games/guess-the-celebrity");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Host game/i);
  assert.match(html, /Join game/i);
  assert.match(html, /LOW SCORE WINS/i);
});
