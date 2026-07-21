import type { RoundResult } from "./types";

export function lateJoinPenalty(rounds: RoundResult[]) {
  return rounds.reduce(
    (total, round) => {
      const scores = round.scores
        .filter((score) => Number.isFinite(score.strokes))
        .map((score) => score.strokes)
        .sort((a, b) => a - b);

      if (scores.length === 0) return total;

      const middle = Math.floor(scores.length / 2);
      const median =
        scores.length % 2 === 1
          ? scores[middle]
          : (scores[middle - 1] + scores[middle]) / 2;

      const closest = [...scores]
        .sort((a, b) => Math.abs(a - median) - Math.abs(b - median) || a - b)
        .slice(0, 3);
      const strokes = Math.ceil(
        closest.reduce((sum, value) => sum + value, 0) / closest.length,
      );

      return {
        strokes: total.strokes + strokes,
        slots: total.slots + strokes * 2,
      };
    },
    { strokes: 0, slots: 0 },
  );
}
export function rankScores<T extends { totalStrokes: number; totalSlots: number }>(players: T[]) {
  return [...players].sort(
    (a, b) => a.totalStrokes - b.totalStrokes || a.totalSlots - b.totalSlots,
  );
}
