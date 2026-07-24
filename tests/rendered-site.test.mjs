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

async function roomApi(pathname, body) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("room-api-test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  const roomRequest = new Request(`https://room.internal/${pathname.split("/").at(-1)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return worker.fetch(
    new Request(`https://spiffiergames.io${pathname}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      ROOMS: { idFromName: () => ({}), get: () => ({ fetch: async () => new Response(JSON.stringify({ forwardedTo: roomRequest.url }), { headers: { "content-type": "application/json" } }) }) },
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

test("server-renders the public-safe service log", async () => {
  const response = await render("/logs");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Service log/i);
  assert.match(html, /PUBLIC-SAFE ROLLING BUFFER/i);
  assert.match(html, /LOGS/i);
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

test("room create and join APIs stay ahead of the app fallback and return JSON", async () => {
  for (const pathname of ["/api/rooms/create", "/api/rooms/join"]) {
    const response = await roomApi(pathname, { roomName: "Production smoke" });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^application\/json/);
    assert.equal((await response.json()).forwardedTo, `https://room.internal/${pathname.split("/").at(-1)}`);
  }
});

test("room API validation errors are JSON", async () => {
  const response = await roomApi("/api/rooms/create", { roomName: "x" });
  assert.equal(response.status, 400);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json/);
  assert.deepEqual(await response.json(), { error: "Check the room name." });
});

test("the diagnostics API is safe when its storage service is unavailable", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("diagnostics-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("https://spiffiergames.io/api/diagnostics"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, ROOMS: { idFromName() {}, get() {} } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { records: [], available: false });
});
