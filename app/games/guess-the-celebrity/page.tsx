import type { Metadata } from "next";
import { SiteHeader } from "../../components/SiteHeader";
import { GameEntryClient } from "../../components/GameEntryClient";

export const metadata: Metadata = {
  title: "Guess the Celebrity",
  description: "Host or join a private Guess the Celebrity room.",
};

export default function GuessTheCelebrityEntry() {
  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="game-intro panel-raised">
        <div>
          <p className="eyebrow">PROGRAM 01 / READY</p>
          <h1>Guess the Celebrity</h1>
          <p>Everyone can see everyone else’s identity. Ask two questions per turn, risk a guess, and keep your score low.</p>
        </div>
        <ol className="rule-strip">
          <li><strong>01</strong><span>ASK IN DISCORD</span></li>
          <li><strong>02</strong><span>GROUP VOTES</span></li>
          <li><strong>03</strong><span>LOW SCORE WINS</span></li>
        </ol>
      </section>
      <GameEntryClient />
    </main>
  );
}
