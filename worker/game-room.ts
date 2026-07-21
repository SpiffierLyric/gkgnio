import { filterCatalog, identityImageUrl, SEED_CATALOG } from "../game/catalog";
import { lateJoinPenalty } from "../game/scoring";
import type {
  CatalogIdentity,
  GameSettings,
  RoomCommand,
  RoomSnapshot,
  RoundResult,
} from "../game/types";
import type { AppEnv } from "./env";

const encoder = new TextEncoder();
const ROOM_EMPTY_TTL = 6 * 60 * 60 * 1000;
const HOST_TRANSFER_DELAY = 60 * 1000;
const PLAYER_RESERVATION = 5 * 60 * 1000;
const VOTE_CLOSE_DELAY = 10 * 1000;
const OVERTIME_HOST_DELAY = 20 * 1000;

interface InternalPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
  tokenHash: string;
  joinedAt: number;
  connected: boolean;
  disconnectedAt: number | null;
  ready: boolean;
  role: "active" | "spectator" | "withdrawn";
  assignment: CatalogIdentity | null;
  solved: boolean;
  dnf: boolean;
  roundTurns: number;
  roundSlots: number;
  totalStrokes: number;
  totalSlots: number;
}

interface InternalVote {
  guesserId: string;
  guessText: string;
  votes: Record<string, "correct" | "wrong">;
  openedAt: number;
  remainingMs: number | null;
}

interface RoomData {
  roomName: string;
  passwordSalt: string;
  passwordHash: string;
  playerLimit: number;
  hostId: string;
  revision: number;
  status: "lobby" | "round" | "intermission" | "finished" | "closed";
  settings: GameSettings;
  eligibleIdentityCount: number;
  players: InternalPlayer[];
  roundNumber: number;
  completedRounds: RoundResult[];
  usedIdentityIds: string[];
  turnOrder: string[];
  turnCursor: number;
  activePlayerId: string | null;
  turnDeadlineAt: number | null;
  turnYielded: boolean;
  vote: InternalVote | null;
  processedCommands: string[];
  failedJoins: Record<string, { count: number; resetAt: number }>;
  emptySince: number | null;
  notice?: string;
}

interface SocketAttachment {
  playerId?: string;
}

function defaultSettings(): GameSettings {
  return {
    matchLength: 3,
    timerSeconds: 120,
    turnCap: null,
    allTags: [],
    anyTags: [],
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sha256(value: string) {
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

async function derivePassword(password: string, salt: string) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", iterations: 120_000, salt: encoder.encode(salt) },
    material,
    256,
  );
  return bytesToBase64Url(new Uint8Array(bits));
}

function shuffled<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const swap = bytes[0] % (index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export class GameRoom {
  private room: RoomData | null = null;
  private readonly ready: Promise<void>;

  constructor(
    private readonly state: DurableObjectState,
    private readonly env: AppEnv,
  ) {
    this.ready = this.state.blockConcurrencyWhile(async () => {
      this.room = (await this.state.storage.get<RoomData>("room")) ?? null;
      if (this.room) {
        const connectedIds = new Set(
          this.state
            .getWebSockets()
            .map((socket) => (socket.deserializeAttachment() as SocketAttachment | null)?.playerId)
            .filter(Boolean),
        );
        for (const player of this.room.players) player.connected = connectedIds.has(player.id);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    await this.ready;
    const url = new URL(request.url);

    if (url.pathname.endsWith("/create") && request.method === "POST") return this.create(request);
    if (url.pathname.endsWith("/join") && request.method === "POST") return this.join(request);
    if (url.pathname.endsWith("/socket") && request.headers.get("upgrade") === "websocket") {
      return this.openSocket();
    }
    return json({ error: "Not found" }, 404);
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer) {
    await this.ready;
    if (!this.room || typeof message !== "string") return;

    let parsed: { type?: string; token?: string; command?: RoomCommand };
    try {
      parsed = JSON.parse(message);
    } catch {
      socket.send(JSON.stringify({ type: "error", message: "Invalid message." }));
      return;
    }

    const attachment = (socket.deserializeAttachment() as SocketAttachment | null) ?? {};
    if (parsed.type === "authenticate" && parsed.token) {
      const tokenHash = await sha256(parsed.token);
      const player = this.room.players.find((candidate) => candidate.tokenHash === tokenHash);
      if (!player || player.role === "withdrawn") {
        socket.close(4001, "Session expired");
        return;
      }
      socket.serializeAttachment({ playerId: player.id } satisfies SocketAttachment);
      player.connected = true;
      player.disconnectedAt = null;
      this.room.emptySince = null;
      this.bump();
      await this.persistAndBroadcast();
      return;
    }

    if (!attachment.playerId || !parsed.command) {
      socket.send(JSON.stringify({ type: "error", message: "Authenticate first." }));
      return;
    }

    await this.applyCommand(attachment.playerId, parsed.command, socket);
  }

  async webSocketClose(socket: WebSocket) {
    await this.ready;
    if (!this.room) return;
    const playerId = (socket.deserializeAttachment() as SocketAttachment | null)?.playerId;
    if (playerId) {
      const stillConnected = this.state
        .getWebSockets()
        .some((candidate) => candidate !== socket && (candidate.deserializeAttachment() as SocketAttachment | null)?.playerId === playerId);
      const player = this.player(playerId);
      if (player && !stillConnected) {
        player.connected = false;
        player.disconnectedAt = Date.now();
      }
    }
    if (!this.room.players.some((player) => player.connected)) this.room.emptySince = Date.now();
    this.bump();
    await this.persistAndBroadcast();
    await this.scheduleAlarm();
  }

  async webSocketError(socket: WebSocket) {
    await this.webSocketClose(socket);
  }

  async alarm() {
    await this.ready;
    if (!this.room) return;
    const now = Date.now();
    const host = this.player(this.room.hostId);
    if (host && !host.connected && host.disconnectedAt && now - host.disconnectedAt >= HOST_TRANSFER_DELAY) {
      const successor = this.room.players
        .filter((player) => player.connected && player.role !== "withdrawn")
        .sort((a, b) => a.joinedAt - b.joinedAt)[0];
      if (successor) {
        this.room.hostId = successor.id;
        this.room.notice = `${successor.name} is now the host.`;
        this.bump();
      }
    }

    if (this.room.emptySince && now - this.room.emptySince >= ROOM_EMPTY_TTL) {
      await this.destroyRoom("Room expired after six disconnected hours.");
      return;
    }

    await this.persistAndBroadcast();
    await this.scheduleAlarm();
  }

  private async create(request: Request) {
    if (this.room && this.room.status !== "closed") return json({ error: "That room name is already in use." }, 409);
    const body = (await request.json()) as {
      roomName?: string;
      password?: string;
      playerLimit?: number;
      playerName?: string;
      avatarUrl?: string;
    };
    const roomName = normalizeName(body.roomName ?? "");
    const playerName = normalizeName(body.playerName ?? "");
    const playerLimit = Number(body.playerLimit);
    if (roomName.length < 3 || roomName.length > 32 || playerName.length < 1 || playerName.length > 24) {
      return json({ error: "Check the room and player names." }, 400);
    }
    if (!body.password || body.password.length < 6 || body.password.length > 64 || playerLimit < 3 || playerLimit > 12) {
      return json({ error: "Check the password and player limit." }, 400);
    }

    const salt = randomToken();
    const token = randomToken();
    const host: InternalPlayer = {
      id: crypto.randomUUID(),
      name: playerName,
      avatarUrl: body.avatarUrl,
      tokenHash: await sha256(token),
      joinedAt: Date.now(),
      connected: false,
      disconnectedAt: null,
      ready: false,
      role: "active",
      assignment: null,
      solved: false,
      dnf: false,
      roundTurns: 0,
      roundSlots: 0,
      totalStrokes: 0,
      totalSlots: 0,
    };
    this.room = {
      roomName,
      passwordSalt: salt,
      passwordHash: await derivePassword(body.password, salt),
      playerLimit,
      hostId: host.id,
      revision: 1,
      status: "lobby",
      settings: defaultSettings(),
      eligibleIdentityCount: SEED_CATALOG.length,
      players: [host],
      roundNumber: 0,
      completedRounds: [],
      usedIdentityIds: [],
      turnOrder: [],
      turnCursor: -1,
      activePlayerId: null,
      turnDeadlineAt: null,
      turnYielded: false,
      vote: null,
      processedCommands: [],
      failedJoins: {},
      emptySince: Date.now(),
    };
    await this.persist();
    await this.scheduleAlarm();
    return json({ roomName, playerId: host.id, resumeToken: token }, 201);
  }

  private async join(request: Request) {
    if (!this.room || this.room.status === "closed") return json({ error: "Room name or password is incorrect." }, 404);
    const body = (await request.json()) as { password?: string; playerName?: string; avatarUrl?: string };
    const ip = request.headers.get("cf-connecting-ip") ?? "local";
    const failure = this.room.failedJoins[ip];
    if (failure && failure.resetAt > Date.now() && failure.count >= 8) {
      return json({ error: "Room name or password is incorrect." }, 429);
    }
    if (!body.password || (await derivePassword(body.password, this.room.passwordSalt)) !== this.room.passwordHash) {
      const current = failure?.resetAt && failure.resetAt > Date.now() ? failure : { count: 0, resetAt: Date.now() + 10 * 60 * 1000 };
      this.room.failedJoins[ip] = { ...current, count: current.count + 1 };
      await this.persist();
      return json({ error: "Room name or password is incorrect." }, 401);
    }

    const playerName = normalizeName(body.playerName ?? "");
    if (playerName.length < 1 || playerName.length > 24) return json({ error: "Choose a player name." }, 400);
    if (this.room.players.some((player) => player.role !== "withdrawn" && player.name.toLowerCase() === playerName.toLowerCase())) {
      return json({ error: "That player name is already in the room." }, 409);
    }
    if (this.room.players.filter((player) => player.role !== "withdrawn").length >= this.room.playerLimit) {
      return json({ error: "This room is full." }, 409);
    }

    const token = randomToken();
    const player: InternalPlayer = {
      id: crypto.randomUUID(),
      name: playerName,
      avatarUrl: body.avatarUrl,
      tokenHash: await sha256(token),
      joinedAt: Date.now(),
      connected: false,
      disconnectedAt: null,
      ready: false,
      role: this.room.status === "lobby" ? "active" : "spectator",
      assignment: null,
      solved: false,
      dnf: false,
      roundTurns: 0,
      roundSlots: 0,
      totalStrokes: 0,
      totalSlots: 0,
    };
    this.room.players.push(player);
    delete this.room.failedJoins[ip];
    this.bump();
    await this.persist();
    return json({ roomName: this.room.roomName, playerId: player.id, resumeToken: token }, 201);
  }

  private openSocket() {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.state.acceptWebSocket(server);
    server.serializeAttachment({} satisfies SocketAttachment);
    return new Response(null, { status: 101, webSocket: client } as ResponseInit & { webSocket: WebSocket });
  }

  private async applyCommand(playerId: string, command: RoomCommand, socket: WebSocket) {
    if (!this.room) return;
    if (this.room.processedCommands.includes(command.commandId)) {
      socket.send(JSON.stringify({ type: "snapshot", snapshot: this.snapshot(playerId) }));
      return;
    }
    if (command.expectedRevision !== this.room.revision) {
      socket.send(JSON.stringify({ type: "stale", snapshot: this.snapshot(playerId) }));
      return;
    }

    let error: string | null = null;
    switch (command.type) {
      case "toggle-ready":
        error = this.toggleReady(playerId);
        break;
      case "update-settings":
        error = await this.updateSettings(playerId, command.payload as Partial<GameSettings>);
        break;
      case "start-match":
        error = await this.startMatch(playerId);
        break;
      case "start-next-round":
        error = await this.startNextRound(playerId);
        break;
      case "take-turn":
        error = await this.takeTurn(playerId);
        break;
      case "use-question":
        error = this.useQuestion(playerId);
        break;
      case "submit-guess":
        error = this.submitGuess(playerId, String((command.payload as { guessText?: string })?.guessText ?? ""));
        break;
      case "cast-vote":
        error = await this.castVote(playerId, (command.payload as { vote?: "correct" | "wrong" })?.vote);
        break;
      case "close-vote":
        error = await this.closeVote(playerId);
        break;
      case "yield-turn":
        error = this.yieldTurn(playerId);
        break;
      case "host-end-overtime":
        error = this.hostEndOvertime(playerId);
        break;
      case "promote-player":
        error = this.promotePlayer(playerId, String((command.payload as { playerId?: string })?.playerId ?? ""));
        break;
      case "remove-player":
        error = await this.removePlayer(playerId, String((command.payload as { playerId?: string })?.playerId ?? ""));
        break;
      case "close-room":
        if (!this.isHost(playerId)) error = "Only the host can close the room.";
        else {
          await this.destroyRoom("The host closed the room.");
          return;
        }
        break;
      case "new-match":
        error = this.newMatch(playerId);
        break;
      default:
        error = "Unknown action.";
    }

    if (error) {
      socket.send(JSON.stringify({ type: "error", message: error }));
      return;
    }

    this.room.processedCommands.push(command.commandId);
    this.room.processedCommands = this.room.processedCommands.slice(-100);
    this.bump();
    await this.persistAndBroadcast();
  }

  private toggleReady(playerId: string) {
    if (!this.room || this.room.status !== "lobby") return "Readiness can only change in the lobby.";
    const player = this.player(playerId);
    if (!player || player.role !== "active") return "You are not an active player.";
    player.ready = !player.ready;
    return null;
  }

  private async updateSettings(playerId: string, update: Partial<GameSettings>) {
    if (!this.room || !this.isHost(playerId)) return "Only the host can change settings.";
    if (this.room.status !== "lobby" && this.room.status !== "intermission") return "Settings are locked during a round.";
    const matchLength = Number(update.matchLength ?? this.room.settings.matchLength);
    const timerSeconds = update.timerSeconds === null ? null : Number(update.timerSeconds ?? this.room.settings.timerSeconds);
    const turnCap = update.turnCap === null ? null : Number(update.turnCap ?? this.room.settings.turnCap);
    if (matchLength < 1 || matchLength > 10) return "Match length must be between 1 and 10.";
    if (timerSeconds !== null && (timerSeconds < 60 || timerSeconds > 300)) return "Timer must be off or between 60 and 300 seconds.";
    if (turnCap !== null && (turnCap < 3 || turnCap > 20)) return "Turn cap must be off or between 3 and 20.";
    this.room.settings = {
      matchLength,
      timerSeconds,
      turnCap,
      allTags: [...new Set(update.allTags ?? this.room.settings.allTags)],
      anyTags: [...new Set(update.anyTags ?? this.room.settings.anyTags)],
    };
    this.room.eligibleIdentityCount = filterCatalog(
      await this.loadCatalog(),
      this.room.settings.allTags,
      this.room.settings.anyTags,
    ).length;
    return null;
  }

  private async startMatch(playerId: string) {
    if (!this.room || !this.isHost(playerId) || this.room.status !== "lobby") return "Only the host can start from the lobby.";
    const active = this.room.players.filter((player) => player.role === "active");
    if (active.length < 3) return "At least three active players are required.";
    if (active.some((player) => !player.ready)) return "Every active player must be ready.";
    this.room.roundNumber = 0;
    this.room.completedRounds = [];
    this.room.usedIdentityIds = [];
    for (const player of active) {
      player.totalStrokes = 0;
      player.totalSlots = 0;
    }
    return this.beginRound();
  }

  private async startNextRound(playerId: string) {
    if (!this.room || !this.isHost(playerId) || this.room.status !== "intermission") return "Only the host can start the next round.";
    return this.beginRound();
  }

  private newMatch(playerId: string) {
    if (!this.room || !this.isHost(playerId) || this.room.status !== "finished") return "Only the host can begin a new match.";
    this.room.status = "lobby";
    this.room.roundNumber = 0;
    this.room.completedRounds = [];
    this.room.usedIdentityIds = [];
    this.room.turnOrder = [];
    this.room.turnCursor = -1;
    this.room.activePlayerId = null;
    this.room.turnDeadlineAt = null;
    this.room.turnYielded = true;
    this.room.vote = null;
    for (const player of this.room.players) {
      if (player.role === "spectator") player.role = "active";
      player.assignment = null;
      player.solved = false;
      player.dnf = false;
      player.roundTurns = 0;
      player.roundSlots = 0;
      player.totalStrokes = 0;
      player.totalSlots = 0;
      player.ready = false;
    }
    this.room.notice = "A new match is ready in the lobby.";
    return null;
  }

  private async beginRound() {
    if (!this.room) return "Room is unavailable.";
    const participants = this.room.players.filter((player) => player.role === "active");
    const catalog = filterCatalog(await this.loadCatalog(), this.room.settings.allTags, this.room.settings.anyTags);
    if (catalog.length < participants.length) return "The selected tags do not contain enough unique identities.";

    let unused = catalog.filter((identity) => !this.room!.usedIdentityIds.includes(identity.id));
    if (unused.length < participants.length) unused = catalog;
    const assignments = shuffled(unused).slice(0, participants.length);
    this.room.roundNumber += 1;
    this.room.status = "round";
    this.room.turnOrder = shuffled(participants.map((player) => player.id));
    this.room.turnCursor = -1;
    this.room.activePlayerId = null;
    this.room.turnDeadlineAt = null;
    this.room.turnYielded = true;
    this.room.vote = null;
    participants.forEach((player, index) => {
      player.assignment = assignments[index];
      player.solved = false;
      player.dnf = false;
      player.roundTurns = 0;
      player.roundSlots = 0;
      player.ready = false;
      this.room!.usedIdentityIds.push(assignments[index].id);
    });
    this.room.notice = `Round ${this.room.roundNumber} is ready. ${this.player(this.nextPlayerId())?.name ?? "The first player"} may take the first turn.`;
    return null;
  }

  private async takeTurn(playerId: string) {
    if (!this.room || this.room.status !== "round" || this.room.vote) return "A turn cannot start right now.";
    const nextPlayerId = this.nextPlayerId();
    if (nextPlayerId !== playerId) return "It is not your turn next.";

    if (this.room.activePlayerId) {
      const active = this.player(this.room.activePlayerId);
      const overtime = this.room.turnDeadlineAt !== null && Date.now() >= this.room.turnDeadlineAt;
      const mayAdvance = !active || active.solved || active.dnf || active.role === "withdrawn" || active.roundSlots >= 2 || this.room.turnYielded || overtime;
      if (!mayAdvance) return "The current player still has the turn.";
      if (active && !active.solved && this.room.settings.turnCap !== null && active.roundTurns >= this.room.settings.turnCap) {
        active.dnf = true;
        active.solved = true;
      }
    }

    if (await this.finishRoundIfComplete()) return null;
    const player = this.player(playerId);
    if (!player || player.solved || player.role !== "active") return "You cannot take this turn.";
    this.room.turnCursor = this.room.turnOrder.indexOf(playerId);
    this.room.activePlayerId = playerId;
    this.room.turnYielded = false;
    player.roundTurns += 1;
    this.room.turnDeadlineAt = this.room.settings.timerSeconds === null ? null : Date.now() + this.room.settings.timerSeconds * 1000;
    this.room.notice = `${player.name} is asking questions.`;
    return null;
  }

  private useQuestion(playerId: string) {
    if (!this.room || this.room.activePlayerId !== playerId || this.room.vote) return "You do not control the active turn.";
    const player = this.player(playerId);
    if (!player || player.roundSlots >= 2) return "Both question slots are already used.";
    player.roundSlots += 1;
    if (player.roundSlots >= 2) this.room.turnYielded = true;
    return null;
  }

  private submitGuess(playerId: string, guessText: string) {
    if (!this.room || this.room.activePlayerId !== playerId || this.room.vote) return "You cannot guess right now.";
    const player = this.player(playerId);
    const normalizedGuess = normalizeName(guessText);
    if (!player || player.roundSlots >= 2 || normalizedGuess.length < 1 || normalizedGuess.length > 80) return "Enter a guess while a question slot is available.";
    player.roundSlots += 1;
    const remainingMs = this.room.turnDeadlineAt === null ? null : Math.max(0, this.room.turnDeadlineAt - Date.now());
    this.room.vote = { guesserId: playerId, guessText: normalizedGuess, votes: {}, openedAt: Date.now(), remainingMs };
    this.room.turnDeadlineAt = null;
    return null;
  }

  private async castVote(playerId: string, vote?: "correct" | "wrong") {
    if (!this.room?.vote || (vote !== "correct" && vote !== "wrong")) return "There is no vote to answer.";
    if (playerId === this.room.vote.guesserId) return "The guesser cannot vote.";
    const player = this.player(playerId);
    if (!player || player.role !== "active") return "Spectators cannot vote in this round.";
    this.room.vote.votes[playerId] = vote;
    const eligible = this.eligibleVoters();
    if (eligible.every((id) => this.room!.vote!.votes[id])) await this.resolveVote();
    return null;
  }

  private async closeVote(playerId: string) {
    if (!this.room?.vote || !this.isHost(playerId)) return "Only the host can close an active vote.";
    if (Date.now() - this.room.vote.openedAt < VOTE_CLOSE_DELAY) return "Voting must remain open for ten seconds.";
    if (Object.keys(this.room.vote.votes).length === 0) return "At least one vote is required.";
    await this.resolveVote();
    return null;
  }

  private async resolveVote() {
    if (!this.room?.vote) return;
    const vote = this.room.vote;
    const correctVotes = Object.values(vote.votes).filter((value) => value === "correct").length;
    const wrongVotes = Object.values(vote.votes).filter((value) => value === "wrong").length;
    const correct = correctVotes > wrongVotes;
    const player = this.player(vote.guesserId);
    this.room.vote = null;
    if (!player) return;
    if (correct) {
      player.solved = true;
      this.room.activePlayerId = null;
      this.room.turnDeadlineAt = null;
      this.room.turnYielded = true;
      this.room.notice = `${player.name} solved it in ${player.roundTurns} turn${player.roundTurns === 1 ? "" : "s"}.`;
      await this.finishRoundIfComplete();
    } else {
      this.room.turnDeadlineAt = vote.remainingMs === null ? null : Date.now() + vote.remainingMs;
      this.room.turnYielded = player.roundSlots >= 2;
      this.room.notice = `${player.name}'s guess was voted wrong.`;
    }
  }

  private yieldTurn(playerId: string) {
    if (!this.room || this.room.activePlayerId !== playerId || this.room.vote) return "You cannot yield this turn.";
    this.room.turnYielded = true;
    return null;
  }

  private hostEndOvertime(playerId: string) {
    if (!this.room || !this.isHost(playerId) || !this.room.activePlayerId || this.room.turnDeadlineAt === null) return "There is no overtime turn to end.";
    if (Date.now() - this.room.turnDeadlineAt < OVERTIME_HOST_DELAY) return "The host override appears twenty seconds into overtime.";
    this.room.turnYielded = true;
    this.room.turnDeadlineAt = null;
    return null;
  }

  private promotePlayer(hostId: string, targetId: string) {
    if (!this.room || !this.isHost(hostId) || this.room.status !== "intermission") return "Late players can only join at intermission.";
    const target = this.player(targetId);
    if (!target || target.role !== "spectator") return "That player is not waiting to join.";
    const penalty = lateJoinPenalty(this.room.completedRounds);
    target.totalStrokes += penalty.strokes;
    target.totalSlots += penalty.slots;
    target.role = "active";
    target.ready = true;
    return null;
  }

  private async removePlayer(hostId: string, targetId: string) {
    if (!this.room || !this.isHost(hostId) || hostId === targetId) return "The host cannot remove that player.";
    const target = this.player(targetId);
    if (!target || target.role === "withdrawn") return "That player is unavailable.";
    if (target.connected || !target.disconnectedAt || Date.now() - target.disconnectedAt < PLAYER_RESERVATION) {
      return "Disconnected players keep their place for five minutes.";
    }
    target.role = "withdrawn";
    target.solved = true;
    if (this.room.activePlayerId === targetId) {
      this.room.activePlayerId = null;
      this.room.turnYielded = true;
    }
    await this.finishRoundIfComplete();
    return null;
  }

  private async finishRoundIfComplete() {
    if (!this.room || this.room.status !== "round") return false;
    const ranked = this.room.players.filter((player) => player.role === "active");
    if (!ranked.every((player) => player.solved || player.dnf)) return false;

    const scores = ranked.map((player) => {
      const strokes = player.dnf && this.room!.settings.turnCap !== null ? this.room!.settings.turnCap + 2 : player.roundTurns;
      const slots = player.dnf && this.room!.settings.turnCap !== null ? this.room!.settings.turnCap * 2 : player.roundSlots;
      player.totalStrokes += strokes;
      player.totalSlots += slots;
      return {
        playerId: player.id,
        playerName: player.name,
        strokes,
        slots,
        dnf: player.dnf,
        identityName: player.assignment?.canonicalName ?? "Unknown",
      };
    });
    this.room.completedRounds.push({ round: this.room.roundNumber, scores });
    this.room.activePlayerId = null;
    this.room.turnDeadlineAt = null;
    this.room.turnYielded = true;
    this.room.vote = null;
    this.room.status = this.room.roundNumber >= this.room.settings.matchLength ? "finished" : "intermission";
    this.room.notice = this.room.status === "finished" ? "Match complete." : `Round ${this.room.roundNumber} complete.`;
    return true;
  }

  private nextPlayerId() {
    if (!this.room || this.room.status !== "round") return null;
    for (let offset = 1; offset <= this.room.turnOrder.length; offset += 1) {
      const index = (this.room.turnCursor + offset + this.room.turnOrder.length) % this.room.turnOrder.length;
      const player = this.player(this.room.turnOrder[index]);
      if (player && player.role === "active" && !player.solved && !player.dnf) return player.id;
    }
    return null;
  }

  private eligibleVoters() {
    if (!this.room?.vote) return [];
    return this.room.players
      .filter((player) => player.role === "active" && player.id !== this.room!.vote!.guesserId && player.connected)
      .map((player) => player.id);
  }

  private snapshot(viewerId: string): RoomSnapshot {
    if (!this.room) throw new Error("Room unavailable");
    const revealAll = this.room.status === "intermission" || this.room.status === "finished";
    const vote = this.room.vote;
    return {
      roomName: this.room.roomName,
      gameId: "guess-person",
      revision: this.room.revision,
      status: this.room.status,
      viewerId,
      hostId: this.room.hostId,
      playerLimit: this.room.playerLimit,
      settings: this.room.settings,
      eligibleIdentityCount: this.room.eligibleIdentityCount,
      players: this.room.players.map((player) => ({
        id: player.id,
        name: player.name,
        avatarUrl: player.avatarUrl,
        connected: player.connected,
        removable: Boolean(!player.connected && player.disconnectedAt && Date.now() - player.disconnectedAt >= PLAYER_RESERVATION),
        isHost: player.id === this.room!.hostId,
        ready: player.ready,
        role: player.role,
        solved: player.solved,
        dnf: player.dnf,
        identity:
          player.assignment && (player.id !== viewerId || player.solved || player.dnf || revealAll)
            ? {
                id: player.assignment.id,
                canonicalName: player.assignment.canonicalName,
                imageUrl: identityImageUrl(player.assignment),
              }
            : null,
        roundTurns: player.roundTurns,
        roundSlots: player.roundSlots,
        totalStrokes: player.totalStrokes,
        totalSlots: player.totalSlots,
      })),
      roundNumber: this.room.roundNumber,
      completedRounds: this.room.completedRounds,
      turnOrder: this.room.turnOrder,
      activePlayerId: this.room.activePlayerId,
      nextPlayerId: this.nextPlayerId(),
      turnDeadlineAt: this.room.turnDeadlineAt,
      turnYielded: this.room.turnYielded,
      vote: vote
        ? {
            guesserId: vote.guesserId,
            guessText: vote.guessText,
            submittedCount: Object.keys(vote.votes).length,
            eligibleCount: this.eligibleVoters().length,
            openedAt: vote.openedAt,
            mayCloseAt: vote.openedAt + VOTE_CLOSE_DELAY,
            viewerVote: vote.votes[viewerId],
          }
        : null,
      notice: this.room.notice,
    };
  }

  private async loadCatalog() {
    if (!this.env.DB) return SEED_CATALOG;
    try {
      const result = await this.env.DB.prepare(
        `SELECT i.id, i.canonical_name, i.kind, i.image_key, i.image_source_url,
                GROUP_CONCAT(t.slug) AS tag_slugs
         FROM identities i
         LEFT JOIN identity_tags it ON it.identity_id = i.id
         LEFT JOIN tags t ON t.id = it.tag_id
         WHERE i.status = 'published' AND i.image_key IS NOT NULL
         GROUP BY i.id`,
      ).all<{
        id: string;
        canonical_name: string;
        kind: CatalogIdentity["kind"];
        image_key: string;
        image_source_url: string;
        tag_slugs: string | null;
      }>();
      const custom = result.results.map((row) => ({
        id: row.id,
        canonicalName: row.canonical_name,
        aliases: [],
        imageKey: row.image_key,
        sourceUrl: row.image_source_url,
        kind: row.kind,
        tags: row.tag_slugs?.split(",").filter(Boolean) ?? [],
      }));
      const customIds = new Set(custom.map((identity) => identity.id));
      return [...custom, ...SEED_CATALOG.filter((identity) => !customIds.has(identity.id))];
    } catch {
      return SEED_CATALOG;
    }
  }

  private player(playerId: string | null) {
    return playerId && this.room ? this.room.players.find((player) => player.id === playerId) : undefined;
  }

  private isHost(playerId: string) {
    return this.room?.hostId === playerId;
  }

  private bump() {
    if (this.room) this.room.revision += 1;
  }

  private async persist() {
    if (this.room) await this.state.storage.put("room", this.room);
  }

  private async persistAndBroadcast() {
    if (!this.room) return;
    await this.persist();
    for (const socket of this.state.getWebSockets()) {
      const playerId = (socket.deserializeAttachment() as SocketAttachment | null)?.playerId;
      if (playerId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "snapshot", snapshot: this.snapshot(playerId) }));
      }
    }
  }

  private async scheduleAlarm() {
    if (!this.room) return;
    const times: number[] = [];
    const host = this.player(this.room.hostId);
    if (host?.disconnectedAt) times.push(host.disconnectedAt + HOST_TRANSFER_DELAY);
    if (this.room.emptySince) times.push(this.room.emptySince + ROOM_EMPTY_TTL);
    if (times.length > 0) await this.state.storage.setAlarm(Math.max(Date.now() + 1000, Math.min(...times)));
  }

  private async destroyRoom(reason: string) {
    if (!this.room) return;
    this.room.status = "closed";
    for (const socket of this.state.getWebSockets()) {
      try {
        socket.send(JSON.stringify({ type: "closed", message: reason }));
        socket.close(1000, reason);
      } catch {
        // Socket may already be closing.
      }
    }
    this.room = null;
    await this.state.storage.deleteAll();
  }
}
