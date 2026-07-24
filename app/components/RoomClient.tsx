"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { filterCatalog, SEED_CATALOG, TAGS } from "../../game/catalog";
import type { GameSettings, PublicPlayer, RoomCommand, RoomSnapshot } from "../../game/types";

interface Session { playerId: string; resumeToken: string }

function sessionKey(roomName: string) {
  return `spiffier-room:${roomName.trim().toLocaleLowerCase()}`;
}

function IdentityImage({ player }: { player: PublicPlayer }) {
  const [failed, setFailed] = useState(false);
  if (!player.identity || failed) {
    return <div className="identity-placeholder" aria-label={player.identity ? `${player.identity.canonicalName} image unavailable` : "Hidden identity"}>{player.identity ? player.identity.canonicalName.slice(0, 2).toUpperCase() : "?"}</div>;
  }
  // These URLs are application-controlled R2/media routes, so a raw image avoids
  // a second optimizer fetch while keeping the source private and cacheable.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={player.identity.imageUrl} alt="" onError={() => setFailed(true)} />;
}

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

const PLAYER_NAME_COLORS = ["#d93636", "#e47d28", "#d8bb22", "#2f943f", "#287bd0", "#6752b8", "#b34da8"];

function playerNameColors(playerId: string) {
  let seed = 0;
  for (const character of playerId) seed = (seed * 31 + character.charCodeAt(0)) >>> 0;

  const colors: string[] = [];
  while (colors.length < 3) {
    const candidate = PLAYER_NAME_COLORS[seed % PLAYER_NAME_COLORS.length];
    if (!colors.includes(candidate)) colors.push(candidate);
    seed = (seed * 1664525 + 1013904223) >>> 0;
  }
  return colors;
}

function WavingPlayerName({ name, playerId }: { name: string; playerId: string }) {
  const colors = playerNameColors(playerId);
  return (
    <strong className="roster-player-name" aria-label={name}>
      {Array.from(name).map((character, index) => (
        <span aria-hidden="true" className="roster-name-character" data-character={character === " " ? "\u00a0" : character} key={`${character}-${index}`} style={{ animationDelay: `${index * 65}ms`, "--name-stroke-color": colors[index % colors.length] } as CSSProperties}>
          <span className="roster-name-fill">{character === " " ? "\u00a0" : character}</span>
        </span>
      ))}
    </strong>
  );
}

export function RoomClient({ roomName }: { roomName: string }) {
  const socketRef = useRef<WebSocket | null>(null);
  const snapshotRef = useRef<RoomSnapshot | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [connection, setConnection] = useState<"connecting" | "online" | "offline" | "expired">("connecting");
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(sessionKey(roomName));
    if (!stored) {
      queueMicrotask(() => setConnection("expired"));
      return;
    }
    const session = JSON.parse(stored) as Session;
    let stopped = false;
    let attempts = 0;

    const connect = () => {
      if (stopped) return;
      setConnection(attempts === 0 ? "connecting" : "offline");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(`${protocol}//${window.location.host}/api/rooms/${encodeURIComponent(roomName)}/socket`);
      socketRef.current = socket;
      socket.addEventListener("open", () => {
        attempts = 0;
        setConnection("online");
        socket.send(JSON.stringify({ type: "authenticate", token: session.resumeToken }));
      });
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(String(event.data)) as { type: string; snapshot?: RoomSnapshot; message?: string };
        if (message.snapshot) {
          setSnapshot(message.snapshot);
          setError("");
        } else if (message.type === "error") setError(message.message ?? "The room rejected that action.");
        else if (message.type === "closed") {
          sessionStorage.removeItem(sessionKey(roomName));
          setConnection("expired");
          setError(message.message ?? "The room closed.");
        }
      });
      socket.addEventListener("close", (event) => {
        if (stopped || event.code === 4001) {
          if (event.code === 4001) setConnection("expired");
          return;
        }
        setConnection("offline");
        attempts += 1;
        reconnectRef.current = window.setTimeout(connect, Math.min(1000 * 2 ** attempts, 15000));
      });
      socket.addEventListener("error", () => socket.close());
    };
    connect();
    return () => {
      stopped = true;
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
      socketRef.current?.close();
    };
  }, [roomName]);

  const send = useCallback((type: string, payload?: unknown) => {
    const current = snapshotRef.current;
    const socket = socketRef.current;
    if (!current || !socket || socket.readyState !== WebSocket.OPEN) return;
    const command: RoomCommand = {
      commandId: crypto.randomUUID(),
      expectedRevision: current.revision,
      type,
      payload,
    };
    socket.send(JSON.stringify({ type: "command", command }));
  }, []);

  const leaveRoom = useCallback(() => {
    sessionStorage.removeItem(sessionKey(roomName));
    socketRef.current?.close(1000, "Player left the lobby.");
    window.location.assign("/");
  }, [roomName]);

  if (connection === "expired") {
    return (
      <main className="room-shell center-screen">
        <section className="dialog panel-raised">
          <p className="eyebrow">SESSION UNAVAILABLE</p>
          <h1>Rejoin the room</h1>
          <p>{error || "This browser does not have a valid private resume token for this room."}</p>
          <Link className="button button-primary" href="/games/guess-the-person">RETURN TO JOIN DESK</Link>
        </section>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="room-shell center-screen">
        <section className="dialog panel-raised" role="status">
          <p className="eyebrow">ROOM / {roomName.toUpperCase()}</p>
          <h1>{connection === "offline" ? "Reconnecting…" : "Opening room…"}</h1>
          <div className="loading-bar panel-sunken"><span /></div>
        </section>
      </main>
    );
  }

  const viewer = snapshot.players.find((player) => player.id === snapshot.viewerId)!;
  const active = snapshot.players.find((player) => player.id === snapshot.activePlayerId);
  const next = snapshot.players.find((player) => player.id === snapshot.nextPlayerId);
  const deadlineRemaining = snapshot.turnDeadlineAt === null ? null : snapshot.turnDeadlineAt - now;
  const overtime = deadlineRemaining !== null && deadlineRemaining <= 0;
  const canTake = viewer.id === snapshot.nextPlayerId && !snapshot.vote && (
    !active || snapshot.turnYielded || active.turnSlots >= 2 || active.solved || overtime
  );

  return (
    <main className="room-shell">
      <header className="room-titlebar panel-raised">
        <div><span className={`connection-light ${connection}`} /> ROOM: <strong>{snapshot.roomName}</strong></div>
        <div>MATCH {Math.max(1, snapshot.roundNumber)} / {snapshot.settings.matchLength}</div>
        <div>{viewer.isHost ? "HOST CONTROL" : viewer.role.toUpperCase()}</div>
        <Link href="/">×</Link>
      </header>

      {error ? <div className="room-error" role="alert">{error}<button onClick={() => setError("")}>DISMISS</button></div> : null}
      {snapshot.notice ? <div className="room-notice panel-sunken">STATUS: {snapshot.notice}</div> : null}

      {snapshot.status === "lobby" ? (
        <Lobby snapshot={snapshot} viewer={viewer} send={send} onLeave={leaveRoom} />
      ) : (
        <div className="game-layout">
          <section className="board-area">
            <div className="section-heading compact"><div><p className="eyebrow">IDENTITY BOARD</p><h1>Round {snapshot.roundNumber}</h1></div><span className="counter">{snapshot.players.filter((player) => player.role === "active" && player.solved).length} SOLVED</span></div>
            <div className="identity-grid">
              {snapshot.players.filter((player) => player.role !== "withdrawn").map((player) => (
                <article className={`identity-card panel-raised ${player.id === snapshot.activePlayerId ? "is-active" : ""} ${player.solved ? "is-solved" : ""}`} key={player.id}>
                  <div className="identity-image"><IdentityImage player={player} /></div>
                  <div className="identity-meta">
                    <span>{player.id === viewer.id ? "YOU" : player.name}</span>
                    <strong>{player.identity?.canonicalName ?? "IDENTITY CONCEALED"}</strong>
                    <small>{player.connected ? "ONLINE" : "RECONNECTING"} · T{player.roundTurns} / Q{player.roundSlots}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="control-stack">
            <section className={`turn-console panel-raised ${overtime ? "is-overtime" : ""}`}>
              <p className="eyebrow">ACTIVE TURN</p>
              <h2>{active?.name ?? (next ? `${next.name} is next` : "Round complete")}</h2>
              <div className="timer panel-sunken">{deadlineRemaining === null ? "NO LIMIT" : overtime ? `+${formatTime(Math.abs(deadlineRemaining))}` : formatTime(deadlineRemaining)}</div>
              {active ? <p>{2 - active.turnSlots} question slot{2 - active.turnSlots === 1 ? "" : "s"} remaining</p> : <p>Waiting for the next player to take control.</p>}
              {active?.id === viewer.id && !snapshot.vote ? <ActiveControls active={active} send={send} /> : null}
              {canTake ? <button className="button button-primary button-large" onClick={() => send("take-turn")}>TAKE TURN →</button> : null}
              {viewer.isHost && overtime && deadlineRemaining !== null && Math.abs(deadlineRemaining) >= 20_000 ? (
                <button className="button" onClick={() => send("host-end-overtime")}>HOST: END OVERTIME</button>
              ) : null}
            </section>

            <Scoreboard snapshot={snapshot} />
            {snapshot.status === "intermission" || snapshot.status === "finished" ? <ResultsPanel snapshot={snapshot} viewer={viewer} send={send} /> : null}
          </aside>
        </div>
      )}

      {snapshot.vote ? <VoteDialog snapshot={snapshot} viewer={viewer} now={now} send={send} /> : null}
    </main>
  );
}

function Lobby({ snapshot, viewer, send, onLeave }: { snapshot: RoomSnapshot; viewer: PublicPlayer; send: (type: string, payload?: unknown) => void; onLeave: () => void }) {
  const activePlayers = snapshot.players.filter((player) => player.role === "active");
  return (
    <div className="lobby-layout">
      <section className="roster-panel panel-raised">
        <div className="section-heading compact"><div><p className="eyebrow">CONNECTED UNITS</p><h1>Lobby roster</h1></div><div className="roster-heading-actions"><span className="counter">{snapshot.players.length}/{snapshot.playerLimit}</span><button className="button button-compact button-danger" onClick={onLeave}>LEAVE</button></div></div>
        <div className="roster-list">
          {snapshot.players.map((player, index) => (
            <div className="roster-row panel-sunken" key={player.id}>
              <span className="roster-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="roster-player">
                <WavingPlayerName name={player.name} playerId={player.id} />
                {player.id === viewer.id ? <span className="viewer-marker">YOU</span> : null}
              </span>
              <span className="player-role">{player.isHost ? "HOST" : player.role.toUpperCase()}</span>
              {player.id === viewer.id && player.role === "active" ? (
                <button className={`ready-status ready-status-button ${player.ready ? "is-ready" : "is-actionable"}`} onClick={() => send("toggle-ready")}>
                  {player.ready ? <><span className="ready-status-label">READY</span><span className="ready-status-cancel">CANCEL?</span></> : "READY UP"}
                </button>
              ) : (
                <span className={`ready-status ${player.ready ? "is-ready" : "is-not-ready"}`}>{player.ready ? "READY" : "NOT READY"}</span>
              )}
              <span className="player-connection">{player.connected ? "ONLINE" : "OFFLINE"}</span>
              {viewer.isHost && player.removable ? <button className="button button-compact" onClick={() => send("remove-player", { playerId: player.id })}>REMOVE</button> : null}
            </div>
          ))}
        </div>
      </section>
      <SettingsPanel snapshot={snapshot} viewer={viewer} send={send} />
      {viewer.isHost ? <button className="button button-primary launch-button" disabled={activePlayers.length < 3 || activePlayers.some((player) => !player.ready) || snapshot.eligibleIdentityCount < activePlayers.length} onClick={() => send("start-match")}>START {snapshot.settings.matchLength}-ROUND MATCH →</button> : <div className="waiting-banner panel-sunken">WAITING FOR HOST TO START</div>}
    </div>
  );
}

function SettingsPanel({ snapshot, viewer, send }: { snapshot: RoomSnapshot; viewer: PublicPlayer; send: (type: string, payload?: unknown) => void }) {
  const disabled = !viewer.isHost;
  const update = (patch: Partial<GameSettings>) => send("update-settings", { ...snapshot.settings, ...patch });
  const facets = useMemo(() => [...new Set(TAGS.map((tag) => tag.facet))], []);
  const allModeEnabled = snapshot.settings.allTags.length > 0;
  const eligibleWithAllTag = (tag: string) => filterCatalog(
    SEED_CATALOG,
    [...snapshot.settings.allTags, tag],
    [],
  ).length;
  const toggleTag = (bucket: "allTags" | "anyTags", tag: string) => {
    const next = snapshot.settings[bucket].includes(tag)
      ? snapshot.settings[bucket].filter((value) => value !== tag)
      : [...snapshot.settings[bucket], tag];
    if (bucket === "allTags") {
      update({ allTags: next, anyTags: [] });
      return;
    }
    update({ anyTags: next });
  };
  return (
    <section className="settings-panel panel-raised">
      <div className="section-heading compact"><div><p className="eyebrow">MATCH PARAMETERS</p><h2>Round setup</h2></div><span className="counter">{snapshot.eligibleIdentityCount} ELIGIBLE</span></div>
      <div className="settings-row">
        <label>ROUNDS<select disabled={disabled} value={snapshot.settings.matchLength} onChange={(event) => update({ matchLength: Number(event.target.value) })}>{Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>TIMER<select disabled={disabled} value={snapshot.settings.timerSeconds ?? "off"} onChange={(event) => update({ timerSeconds: event.target.value === "off" ? null : Number(event.target.value) })}><option value="off">OFF</option>{[60,90,120,150,180,240,300].map((value) => <option key={value} value={value}>{value} SEC</option>)}</select></label>
        <label>TURN CAP<select disabled={disabled} value={snapshot.settings.turnCap ?? "off"} onChange={(event) => update({ turnCap: event.target.value === "off" ? null : Number(event.target.value) })}><option value="off">OFF</option>{Array.from({ length: 18 }, (_, index) => index + 3).map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <div className="tag-builder">
        {facets.map((facet) => (
          <fieldset key={facet} disabled={disabled}>
            <legend>{facet.toUpperCase()}</legend>
            {TAGS.filter((tag) => tag.facet === facet).map((tag) => (
              <div className="tag-control" key={tag.slug}>
                <span>{tag.label}</span>
                <button
                  type="button"
                  className={snapshot.settings.allTags.includes(tag.slug) ? "selected" : ""}
                  disabled={!snapshot.settings.allTags.includes(tag.slug) && eligibleWithAllTag(tag.slug) < 10}
                  title={!snapshot.settings.allTags.includes(tag.slug) && eligibleWithAllTag(tag.slug) < 10 ? "This ALL filter would leave fewer than 10 identities." : undefined}
                  onClick={() => toggleTag("allTags", tag.slug)}
                >ALL</button>
                <button type="button" className={snapshot.settings.anyTags.includes(tag.slug) ? "selected" : ""} disabled={allModeEnabled} onClick={() => toggleTag("anyTags", tag.slug)}>ANY</button>
              </div>
            ))}
          </fieldset>
        ))}
      </div>
    </section>
  );
}

function ActiveControls({ active, send }: { active: PublicPlayer; send: (type: string, payload?: unknown) => void }) {
  const [guess, setGuess] = useState("");
  return (
    <div className="active-controls">
      <button className="button" disabled={active.turnSlots >= 2} onClick={() => send("use-question")}>QUESTION USED ({active.turnSlots}/2)</button>
      <form onSubmit={(event) => { event.preventDefault(); if (guess.trim()) { send("submit-guess", { guessText: guess }); setGuess(""); } }}>
        <label htmlFor="guess">AM I…?</label>
        <input id="guess" value={guess} maxLength={80} disabled={active.turnSlots >= 2} onChange={(event) => setGuess(event.target.value)} placeholder="TYPE THE IDENTITY" />
        <button className="button button-primary" disabled={!guess.trim() || active.turnSlots >= 2}>SUBMIT GUESS</button>
      </form>
      <button className="button" onClick={() => send("yield-turn")}>YIELD TURN</button>
    </div>
  );
}

function VoteDialog({ snapshot, viewer, now, send }: { snapshot: RoomSnapshot; viewer: PublicPlayer; now: number; send: (type: string, payload?: unknown) => void }) {
  const vote = snapshot.vote!;
  const isGuesser = viewer.id === vote.guesserId;
  const mayVote = !isGuesser && viewer.role === "active" && !vote.viewerVote;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="vote-title">
      <section className="vote-dialog panel-raised">
        <p className="eyebrow">HIDDEN GROUP VOTE</p>
        <h2 id="vote-title">“Am I {vote.guessText}?”</h2>
        <div className="vote-progress panel-sunken">{vote.submittedCount} / {vote.eligibleCount} VOTES RECEIVED</div>
        {mayVote ? <div className="vote-actions"><button className="button button-primary" onClick={() => send("cast-vote", { vote: "correct" })}>CORRECT</button><button className="button" onClick={() => send("cast-vote", { vote: "wrong" })}>WRONG</button></div> : <p>{vote.viewerVote ? `YOUR VOTE: ${vote.viewerVote.toUpperCase()}` : isGuesser ? "THE GROUP IS DECIDING." : "SPECTATORS DO NOT VOTE."}</p>}
        {viewer.isHost && now >= vote.mayCloseAt && vote.submittedCount > 0 ? <button className="button" onClick={() => send("close-vote")}>CLOSE VOTING NOW</button> : null}
        <small>Votes stay hidden until the result. Ties count as wrong.</small>
      </section>
    </div>
  );
}

function Scoreboard({ snapshot }: { snapshot: RoomSnapshot }) {
  const standings = [...snapshot.players].filter((player) => player.role !== "withdrawn").sort((a, b) => a.totalStrokes - b.totalStrokes || a.totalSlots - b.totalSlots);
  return (
    <section className="scoreboard panel-raised">
      <p className="eyebrow">LIVE SCORECARD</p>
      {standings.map((player, index) => <div className="score-row" key={player.id}><span>{index + 1}</span><strong>{player.name}</strong><span>{player.totalStrokes}T</span><span>{player.totalSlots}Q</span></div>)}
    </section>
  );
}

function ResultsPanel({ snapshot, viewer, send }: { snapshot: RoomSnapshot; viewer: PublicPlayer; send: (type: string, payload?: unknown) => void }) {
  const result = snapshot.completedRounds.at(-1);
  return (
    <section className="results-panel panel-raised">
      <p className="eyebrow">{snapshot.status === "finished" ? "FINAL RESULTS" : `ROUND ${snapshot.roundNumber} RESULTS`}</p>
      {[...(result?.scores ?? [])].sort((a, b) => a.strokes - b.strokes || a.slots - b.slots).map((score) => <div className="result-row" key={score.playerId}><strong>{score.playerName}</strong><span>{score.identityName}</span><span>{score.strokes}T / {score.slots}Q</span></div>)}
      {snapshot.status === "intermission" ? (
        <>
          {viewer.isHost ? <SettingsPanel snapshot={snapshot} viewer={viewer} send={send} /> : null}
          {viewer.isHost ? snapshot.players.filter((player) => player.role === "spectator").map((player) => <button className="button" key={player.id} onClick={() => send("promote-player", { playerId: player.id })}>ADD {player.name.toUpperCase()} WITH PENALTY</button>) : null}
          {viewer.isHost ? <button className="button button-primary" onClick={() => send("start-next-round")}>START NEXT ROUND →</button> : <p>Waiting for the host to set the next round.</p>}
        </>
      ) : viewer.isHost ? <button className="button button-primary" onClick={() => send("new-match")}>NEW MATCH IN THIS ROOM</button> : <p>Match complete. The host can open a new lobby.</p>}
    </section>
  );
}
