import Link from "next/link";
import DotField from "./components/DotField";
import { SiteHeader } from "./components/SiteHeader";
import { GAME_MANIFESTS } from "../game/types";

export default function Home() {
  return (
    <main className="site-shell home-shell">
      <div className="home-dot-field" aria-hidden="true">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={160}
          gradientFrom="#808080"
          gradientTo="#808080"
          glowColor="#f1f1f1"
        />
      </div>
      <div className="home-content">
        <SiteHeader />
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
              <p className="eyebrow">{game.availability === "playable" ? `${game.minPlayers}–${game.maxPlayers} PLAYERS` : "UNRELEASED"}</p>
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
      </div>
    </main>
  );
}
