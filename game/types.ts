export type GameAvailability = "playable" | "coming-soon";

export interface GameManifest {
  id: string;
  title: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  availability: GameAvailability;
  href: string;
}

export interface CatalogIdentity {
  id: string;
  canonicalName: string;
  aliases: string[];
  wikiTitle?: string;
  imageUrl?: string;
  imageKey?: string;
  sourceUrl: string;
  kind: "fictional" | "real" | "group";
  tags: string[];
}

export interface TagDefinition {
  slug: string;
  label: string;
  facet: string;
  implies?: string[];
}

export interface GameSettings {
  matchLength: number;
  timerSeconds: number | null;
  turnCap: number | null;
  allTags: string[];
  anyTags: string[];
}

export interface PublicIdentity {
  id: string;
  canonicalName: string;
  imageUrl: string;
}

export interface PublicPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
  connected: boolean;
  removable: boolean;
  isHost: boolean;
  ready: boolean;
  role: "active" | "spectator" | "withdrawn";
  solved: boolean;
  dnf: boolean;
  identity: PublicIdentity | null;
  roundTurns: number;
  roundSlots: number;
  totalStrokes: number;
  totalSlots: number;
}

export interface PublicVote {
  guesserId: string;
  guessText: string;
  submittedCount: number;
  eligibleCount: number;
  openedAt: number;
  mayCloseAt: number;
  viewerVote?: "correct" | "wrong";
}

export interface RoundResult {
  round: number;
  scores: Array<{
    playerId: string;
    playerName: string;
    strokes: number;
    slots: number;
    dnf: boolean;
    identityName: string;
  }>;
}

export interface RoomSnapshot {
  roomName: string;
  gameId: string;
  revision: number;
  status: "lobby" | "round" | "intermission" | "finished" | "closed";
  viewerId: string;
  hostId: string;
  playerLimit: number;
  settings: GameSettings;
  eligibleIdentityCount: number;
  players: PublicPlayer[];
  roundNumber: number;
  completedRounds: RoundResult[];
  turnOrder: string[];
  activePlayerId: string | null;
  nextPlayerId: string | null;
  turnDeadlineAt: number | null;
  turnYielded: boolean;
  vote: PublicVote | null;
  notice?: string;
}

export interface RoomCommand<T = unknown> {
  commandId: string;
  expectedRevision: number;
  type: string;
  payload?: T;
}

export const GAME_MANIFESTS: GameManifest[] = [
  {
    id: "guess-celebrity",
    title: "Guess the Celebrity",
    description: "Everyone knows your identity except you. Ask carefully and play the lowest score.",
    minPlayers: 3,
    maxPlayers: 12,
    availability: "playable",
    href: "/games/guess-the-celebrity",
  },
  {
    id: "caption-collision",
    title: "Caption Collision",
    description: "A future game about writing the answer everyone wishes they had said.",
    minPlayers: 3,
    maxPlayers: 12,
    availability: "coming-soon",
    href: "#",
  },
  {
    id: "signal-loss",
    title: "Signal Loss",
    description: "A future game about broken clues, bad relays, and confident mistakes.",
    minPlayers: 4,
    maxPlayers: 12,
    availability: "coming-soon",
    href: "#",
  },
];
