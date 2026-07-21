"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Profile {
  id: string;
  name: string;
  avatarUrl?: string;
}

export function SiteHeader() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setProfile(data.profile ?? null))
      .catch(() => setProfile(null));
  }, []);

  return (
    <header className="site-header panel-raised">
      <Link className="brand" href="/" aria-label="Spiffier Games home">
        <span className="brand-mark" aria-hidden="true">SG</span>
        <span>SPIFFIER<br />GAMES</span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/">HUB</Link>
        <Link href="/games/guess-the-person">PLAY</Link>
        <Link href="/admin">ADMIN</Link>
      </nav>
      <div className="account-block">
        {profile ? (
          <>
            {/* Discord CDN avatars are already size-addressed and cacheable. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span className="account-initial">{profile.name[0]}</span>}
            <span>{profile.name}</span>
            <a href="/api/auth/logout">SIGN OUT</a>
          </>
        ) : (
          <a className="button button-compact" href="/api/auth/discord/start">DISCORD SIGN-IN</a>
        )}
      </div>
    </header>
  );
}
