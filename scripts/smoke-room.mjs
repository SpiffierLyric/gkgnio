const baseUrl = process.env.SPIFFIER_BASE_URL ?? "http://localhost:3000";
const roomName = `smoke-${crypto.randomUUID().slice(0, 8)}`;

async function enter(path, playerName) {
  const response = await fetch(`${baseUrl}/api/rooms/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ roomName, password: "correct-horse", playerName, playerLimit: 3 }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? `${path} failed`);
  return result;
}

class RoomClient {
  constructor(session) {
    this.session = session;
    this.snapshot = null;
    this.waiters = [];
  }

  async connect() {
    const socketUrl = new URL(`${baseUrl}/api/rooms/${encodeURIComponent(roomName)}/socket`);
    socketUrl.protocol = socketUrl.protocol === "https:" ? "wss:" : "ws:";
    this.socket = new WebSocket(socketUrl);
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.snapshot) {
        this.snapshot = message.snapshot;
        for (const waiter of this.waiters.splice(0)) waiter();
      }
      if (message.type === "error") this.lastError = message.message;
    });
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.send(JSON.stringify({ type: "authenticate", token: this.session.resumeToken }));
    await this.waitFor((snapshot) => snapshot.players.length === 3);
  }

  waitFor(predicate, timeoutMs = 5_000) {
    if (this.snapshot && predicate(this.snapshot)) return Promise.resolve(this.snapshot);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out waiting for synchronized room state.${this.lastError ? ` Server: ${this.lastError}.` : ""} Latest: ${JSON.stringify(this.snapshot)}`)), timeoutMs);
      const check = () => {
        if (this.snapshot && predicate(this.snapshot)) {
          clearTimeout(timeout);
          resolve(this.snapshot);
        } else this.waiters.push(check);
      };
      this.waiters.push(check);
    });
  }

  async command(type, payload) {
    const previousRevision = this.snapshot.revision;
    this.socket.send(JSON.stringify({
      type: "command",
      command: { commandId: crypto.randomUUID(), expectedRevision: previousRevision, type, payload },
    }));
    return this.waitFor((snapshot) => snapshot.revision > previousRevision);
  }

  close() {
    this.socket.close();
  }
}

const sessions = [
  await enter("create", "Host"),
  await enter("join", "Friend One"),
  await enter("join", "Friend Two"),
];
const clients = sessions.map((session) => new RoomClient(session));

try {
  await Promise.all(clients.map((client) => client.connect()));
  for (const client of clients) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (client.snapshot.players.find((player) => player.id === client.session.playerId)?.ready) break;
      const synchronized = await client.command("toggle-ready");
      await Promise.all(clients.map((candidate) => candidate.waitFor((snapshot) => snapshot.revision >= synchronized.revision)));
    }
  }
  if (clients[0].snapshot.players.some((player) => !player.ready)) throw new Error("Readiness did not synchronize across clients.");
  const started = await clients[0].command("start-match");
  await Promise.all(clients.map((client) => client.waitFor((snapshot) => snapshot.revision >= started.revision)));
  await Promise.all(clients.map((client) => client.waitFor((snapshot) => snapshot.status === "round")));

  for (const client of clients) {
    const ownPlayer = client.snapshot.players.find((player) => player.id === client.snapshot.viewerId);
    const otherPlayers = client.snapshot.players.filter((player) => player.id !== client.snapshot.viewerId);
    if (ownPlayer.identity) throw new Error("Protocol leaked the viewer's concealed identity.");
    if (otherPlayers.some((player) => !player.identity)) throw new Error("A visible opponent identity is missing.");
  }

  console.log(JSON.stringify({ roomName, clients: clients.length, status: "round", ownIdentityRedacted: true }));
  clients[0].socket.send(JSON.stringify({
    type: "command",
    command: { commandId: crypto.randomUUID(), expectedRevision: clients[0].snapshot.revision, type: "close-room" },
  }));
} finally {
  for (const client of clients) client.close();
}
