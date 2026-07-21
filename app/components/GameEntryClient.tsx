"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Profile { name: string; avatarUrl?: string }

function sessionKey(roomName: string) {
  return `spiffier-room:${roomName.trim().toLocaleLowerCase()}`;
}
export function GameEntryClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState<"host" | "join" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((response) => response.json()).then((data) => setProfile(data.profile ?? null)).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>, mode: "host" | "join") {
    event.preventDefault();
    setBusy(mode);
    setError("");
    const form = new FormData(event.currentTarget);
    const roomName = String(form.get("roomName") ?? "");
    const payload = {
      roomName,
      password: String(form.get("password") ?? ""),
      playerName: String(form.get("playerName") ?? profile?.name ?? ""),
      avatarUrl: profile?.avatarUrl,
      playerLimit: Number(form.get("playerLimit") ?? 8),
    };
    try {
      const response = await fetch(`/api/rooms/${mode === "host" ? "create" : "join"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to enter the room.");
      sessionStorage.setItem(sessionKey(data.roomName), JSON.stringify({ playerId: data.playerId, resumeToken: data.resumeToken }));
      router.push(`/room/${encodeURIComponent(data.roomName)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to enter the room.");
      setBusy(null);
    }
  }

  return (
    <section className="entry-grid" aria-label="Room controls">
      <form className="entry-panel panel-raised" onSubmit={(event) => submit(event, "host")}>
        <div className="entry-title"><span className="window-control">H</span><div><p className="eyebrow">NEW SESSION</p><h2>Host game</h2></div></div>
        <label>ROOM NAME<input name="roomName" minLength={3} maxLength={32} required placeholder="FRIDAY NIGHT" /></label>
        <label>PASSWORD<input name="password" type="password" minLength={6} maxLength={64} required placeholder="6+ CHARACTERS" /></label>
        <label>YOUR NAME<input name="playerName" maxLength={24} required defaultValue={profile?.name ?? ""} placeholder="PLAYER ONE" /></label>
        <label>PLAYER LIMIT<select name="playerLimit" defaultValue="8">{Array.from({ length: 10 }, (_, index) => index + 3).map((count) => <option key={count}>{count}</option>)}</select></label>
        <button className="button button-primary" disabled={busy !== null}>{busy === "host" ? "CREATING…" : "CREATE ROOM →"}</button>
      </form>

      <form className="entry-panel panel-raised" onSubmit={(event) => submit(event, "join")}>
        <div className="entry-title"><span className="window-control">J</span><div><p className="eyebrow">EXISTING SESSION</p><h2>Join game</h2></div></div>
        <label>ROOM NAME<input name="roomName" minLength={3} maxLength={32} required placeholder="ASK YOUR HOST" /></label>
        <label>PASSWORD<input name="password" type="password" minLength={6} maxLength={64} required placeholder="REQUIRED" /></label>
        <label>YOUR NAME<input name="playerName" maxLength={24} required defaultValue={profile?.name ?? ""} placeholder="PLAYER TWO" /></label>
        <div className="entry-spacer panel-sunken"><strong>PRIVATE ROOM</strong><span>No public directory. Names are reusable after rooms expire.</span></div>
        <button className="button" disabled={busy !== null}>{busy === "join" ? "JOINING…" : "JOIN ROOM →"}</button>
      </form>
      {error ? <p className="form-error" role="alert">ERROR: {error}</p> : null}
    </section>
  );
}
