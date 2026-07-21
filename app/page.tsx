import Link from "next/link";
import { SiteHeader } from "./components/SiteHeader";
import { GAME_MANIFESTS } from "../game/types";

export default function Home() {
  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="hero panel-raised" aria-labelledby="hub-title">
        <div>
          <p className="eyebrow">SOCIAL GAME DESK / BUILD 01</p>
          <h1 id="hub-title">Good games.<br />Bad guesses.</h1>
          <p className="hero-copy">
            Keep Discord open. Put this beside it. Host a room, hand your friends impossible identities,
            and let the group decide who guessed correctly.
          </p>
          <Link className="button button-primary button-large" href="/games/guess-the-celebrity">
            OPEN GAME DESK →
          </Link>
        </div>
        <div className="status-terminal panel-sunken" aria-label="Service summary">
          <div className="terminal-row"><span>TRANSPORT</span><strong>ROOM SOCKET</strong></div>
          <div className="terminal-row"><span>VOICE</span><strong>DISCORD</strong></div>
          <div className="terminal-row"><span>SCORING</span><strong>LOWEST WINS</strong></div>
          <div className="terminal-row"><span>ROOMS</span><strong>PRIVATE</strong></div>
          <p className="terminal-note">NO DOWNLOAD. NO PUBLIC LOBBY. NO CHAT BOT.</p>
        </div>
      </section>

      <section className="section-block" aria-labelledby="games-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PROGRAMS</p>
            <h2 id="games-title">Game directory</h2>
          </div>
          <span className="counter">{GAME_MANIFESTS.filter((game) => game.availability === "playable").length} ONLINE</span>
        </div>
        <div className="game-grid">
          {GAME_MANIFESTS.map((game, index) => (
            <article className={`game-card panel-raised ${game.availability !== "playable" ? "is-disabled" : ""}`} key={game.id}>
              <div className="game-number">0{index + 1}</div>
              <p className="eyebrow">{game.minPlayers}–{game.maxPlayers} PLAYERS</p>
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              {game.availability === "playable" ? (
                <Link className="button" href={game.href}>HOST OR JOIN →</Link>
              ) : (
                <button className="button" disabled>COMING SOON</button>
              )}
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <span>SPIFFIER GAMES</span>
        <span>BUILT FOR FRIENDS IN VOICE CHAT</span>
      </footer>
    </main>
  );
}
