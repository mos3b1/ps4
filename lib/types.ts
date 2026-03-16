import { Game } from "./pricing";

export interface GameSegment {
  gameId: string;
  gameLabel: string;
  gameEmoji: string;
  startEpoch: number;
  endEpoch: number | null;
  elapsed: number;
  matches: number;
  bill: number;
  playerCount?: 2 | 4;
}

export interface Station {
  id: number;
  running: boolean;
  paused: boolean;
  pausedAt: number | null;
  totalPausedSeconds: number;
  currentGame: Game | null;
  sessionStartEpoch: number | null;
  currentSegmentStart: number | null;
  elapsed: number;
  totalElapsed: number;
  customerName: string;
  source: "manual" | "ps4";
  segments: GameSegment[];
  unknownGame: {
    titleId: string;
    titleName: string;
  } | null;
  playerCount?: 2 | 4;
  customPricePerMatch?: number | null;
}

export interface Session {
  date: string;
  time: string;
  customerName: string;
  source: "manual" | "ps4";
  totalElapsed: number;
  totalBill: number;
  segments: GameSegment[];
  playerCount?: 2 | 4;
}

export type HistoryStore = Record<string, Session[]>;
