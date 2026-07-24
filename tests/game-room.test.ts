import assert from "node:assert/strict";
import test from "node:test";
import { GameRoom } from "../worker/game-room";

function roomHarness() {
  let stored: unknown = null;
  let alarmAt: number | null = null;
  const state = {
    blockConcurrencyWhile: async (callback: () => Promise<void>) => callback(),
    getWebSockets: () => [],
    storage: {
      get: async () => stored,
      put: async (_key: string, value: unknown) => { stored = value; },
      setAlarm: async (time: number) => { alarmAt = time; },
      deleteAll: async () => { stored = null; },
    },
  };
  return {
    room: new GameRoom(state as never, {} as never),
    alarmAt: () => alarmAt,
  };
}

async function post(room: GameRoom, path: string, body: unknown) {
  return room.fetch(new Request(`https://room.internal/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

test("a reserved seat can be reclaimed with the room password and rotates its token", async () => {
  const { room } = roomHarness();
  const create = await post(room, "create", { roomName: "Reclaim test", password: "secret", playerLimit: 3, playerName: "Host" });
  assert.equal(create.status, 201);
  const joined = await post(room, "join", { password: "secret", playerName: "Player Two" });
  const original = await joined.json() as { playerId: string; resumeToken: string };
  const internal = (room as never as { room: { players: Array<{ id: string; connected: boolean; disconnectedAt: number | null }> } }).room;
  const player = internal.players.find((candidate) => candidate.id === original.playerId)!;
  player.connected = false;
  player.disconnectedAt = Date.now();

  const reclaim = await post(room, "join", { password: "secret", playerName: "Player Two" });
  const replacement = await reclaim.json() as { playerId: string; resumeToken: string; reclaimed: boolean };
  assert.equal(reclaim.status, 200);
  assert.equal(replacement.reclaimed, true);
  assert.equal(replacement.playerId, original.playerId);
  assert.notEqual(replacement.resumeToken, original.resumeToken);
});

test("a reservation expiry is scheduled and exposed in the room snapshot", async () => {
  const { room, alarmAt } = roomHarness();
  await post(room, "create", { roomName: "Expiry test", password: "secret", playerLimit: 3, playerName: "Host" });
  const joined = await post(room, "join", { password: "secret", playerName: "Player Two" });
  const playerId = (await joined.json() as { playerId: string }).playerId;
  const internal = (room as never as { room: { players: Array<{ id: string; connected: boolean; disconnectedAt: number | null }>; hostId: string } }).room;
  const player = internal.players.find((candidate) => candidate.id === playerId)!;
  player.connected = false;
  player.disconnectedAt = Date.now();

  await (room as never as { scheduleAlarm: () => Promise<void> }).scheduleAlarm();
  const snapshot = (room as never as { snapshot: (viewerId: string) => { players: Array<{ id: string; reservationExpiresAt: number | null }> } }).snapshot(internal.hostId);
  const publicPlayer = snapshot.players.find((candidate) => candidate.id === playerId)!;
  assert.ok(alarmAt() && alarmAt()! >= player.disconnectedAt + 299_000);
  assert.ok(publicPlayer.reservationExpiresAt && publicPlayer.reservationExpiresAt >= player.disconnectedAt + 300_000);
});

test("room creation remains available when the runtime has no alarm API", async () => {
  const { room } = roomHarness();
  const state = (room as never as { state: { storage: { setAlarm?: unknown } } }).state;
  delete state.storage.setAlarm;

  const response = await post(room, "create", {
    roomName: "No alarm support",
    password: "secret",
    playerLimit: 3,
    playerName: "Host",
  });

  assert.equal(response.status, 201);
});

test("room creation remains available when the runtime rejects cleanup alarms", async () => {
  const { room } = roomHarness();
  const state = (room as never as { state: { storage: { setAlarm: (time: number) => Promise<void> } } }).state;
  state.storage.setAlarm = async () => { throw new Error("Alarms are unavailable"); };

  const response = await post(room, "create", {
    roomName: "Alarm rejection",
    password: "secret",
    playerLimit: 3,
    playerName: "Host",
  });

  assert.equal(response.status, 201);
});

test("diagnostic records keep only the public-safe rolling service metadata", async () => {
  const { room } = roomHarness();
  const record = await room.fetch(new Request("https://room.internal/diagnostics/record", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event: "room-service-invalid-response",
      route: "/api/rooms/create",
      status: 500,
      contentType: "text/plain; charset=utf-8",
      requestId: "5b05e0e5-bf10-49e0-a084-cfb2f7e3c6a7",
      password: "must-not-be-stored",
    }),
  }));
  assert.equal(record.status, 202);

  const list = await room.fetch(new Request("https://room.internal/diagnostics/list"));
  const data = await list.json() as { available: boolean; records: Array<Record<string, unknown>> };
  assert.equal(data.available, true);
  assert.equal(data.records.length, 1);
  assert.deepEqual(Object.keys(data.records[0]).sort(), ["contentType", "detail", "event", "id", "occurredAt", "requestId", "route", "status"]);
  assert.equal(data.records[0].contentType, "text/plain");
  assert.equal(data.records[0].route, "/api/rooms/create");
});
