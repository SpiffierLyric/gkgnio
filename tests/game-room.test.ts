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
