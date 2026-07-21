import type { Metadata } from "next";
import { SiteHeader } from "../../components/SiteHeader";
import { GameEntryClient } from "../../components/GameEntryClient";

export const metadata: Metadata = {
  title: "Guess the Person",
  description: "Host or join a private Guess the Person room.",
};

export default function GuessThePersonEntry() {
  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="game-intro panel-raised">
        <h1>Guess the Person</h1>
      </section>
      <GameEntryClient />
    </main>
  );
}
