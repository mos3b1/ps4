import { GAMES, Game, calcBill, calcMatches } from "./pricing";
import { Station, Session, HistoryStore, GameSegment } from "./types";

type StationState = {
  running: boolean;
  paused: boolean;
  pausedAt: number | null;
  totalPausedSeconds: number;
  gameId: string | null;
  sessionStartEpoch: number | null;
  currentSegmentStart: number | null;
  customerName: string;
  source: "manual" | "ps4";
  segments: GameSegment[];
  unknownGame: {
    titleId: string;
    titleName: string;
  } | null;
  playerCount?: 2 | 4;
};

export interface CustomGame {
  titleId: string;
  titleName: string;        // real name from PS4
  gameId: string;           // "pes" | "fifa" | "gta" | "unknown"
  mode: "time-match" | "hour";
  price: number;
  matchCycleMinutes?: number;
  addedAt: string;          // date first seen
  isTemp?: boolean;         // true if user didn't check "Remember this game"
}

export interface GameSettings {
  pes: {
    pricePerMatch: number;
    matchDurationMin: number;
    breakDurationMin: number;
  };
  fifa: {
    pricePerMatch: number;
    matchDurationMin: number;
    breakDurationMin: number;
  };
  gta: {
    pricePerHour: number;
  };
  cod: {
    pricePerHour: number;
  };
  mk: {
    pricePerHour: number;
  };
  other: {
    pricePerHour: number;
  };
}

export const DEFAULT_SETTINGS: GameSettings = {
  pes: { pricePerMatch: 50, matchDurationMin: 11, breakDurationMin: 4 },
  fifa: { pricePerMatch: 50, matchDurationMin: 12, breakDurationMin: 4 },
  gta: { pricePerHour: 100 },
  cod: { pricePerHour: 80 },
  mk: { pricePerHour: 80 },
  other: { pricePerHour: 60 },
};

declare global {
  var __stationStore: Map<number, StationState> | undefined;
  var __historyStore: HistoryStore | undefined;
  var __settingsStore: GameSettings | undefined;
  var __gameRegistry: Map<string, CustomGame> | undefined;
}

function getStationStore(): Map<number, StationState> {
  if (!globalThis.__stationStore) {
    globalThis.__stationStore = new Map();
    for (let i = 1; i <= 4; i++) {
      globalThis.__stationStore.set(i, {
        running: false,
        paused: false,
        pausedAt: null,
        totalPausedSeconds: 0,
        gameId: null,
        sessionStartEpoch: null,
        currentSegmentStart: null,
        customerName: "",
        source: "manual",
        segments: [],
        unknownGame: null,
      });
    }
  }
  return globalThis.__stationStore;
}

function getHistoryStore(): HistoryStore {
  if (!globalThis.__historyStore) {
    globalThis.__historyStore = {};
  }
  return globalThis.__historyStore;
}

function getSettingsStore(): GameSettings {
  if (!globalThis.__settingsStore) {
    globalThis.__settingsStore = { ...DEFAULT_SETTINGS };
  }
  return globalThis.__settingsStore;
}

export function getSettings(): GameSettings {
  return getSettingsStore();
}

export function updateSettings(partial: Partial<GameSettings>): GameSettings {
  const current = getSettingsStore();
  globalThis.__settingsStore = { ...current, ...partial };
  return globalThis.__settingsStore;
}

export function getStation(id: number): StationState | undefined {
  return getStationStore().get(id);
}

export function setStation(id: number, state: StationState): void {
  getStationStore().set(id, state);
}

export function getAllStations(): StationState[] {
  const store = getStationStore();
  const stations: StationState[] = [];
  for (let i = 1; i <= store.size; i++) {
    const station = store.get(i);
    if (station) stations.push(station);
  }
  return stations;
}

export function resetStation(id: number): void {
  const store = getStationStore();
  store.set(id, {
    running: false,
    paused: false,
    pausedAt: null,
    totalPausedSeconds: 0,
    gameId: null,
    sessionStartEpoch: null,
    currentSegmentStart: null,
    customerName: "",
    source: "manual",
    segments: [],
    unknownGame: null,
    playerCount: undefined,
  });
}

export function resolveGame(gameId: string | null): Game | null {
  if (!gameId) return null;
  
  // 1. Check built-in games
  const builtin = GAMES.find(g => g.id === gameId);
  if (builtin) return builtin;
  
  // 2. Check custom registry
  const custom = getGameByTitleId(gameId);
  if (custom) {
    return {
      id: custom.titleId,
      label: custom.titleName,
      emoji: "🎮",
      mode: custom.mode,
      price: custom.price,
      matchCycleMinutes: custom.matchCycleMinutes,
    };
  }
  
  return null;
}

export function getStationsCount(): number {
  return getStationStore().size;
}

export function setStationsCount(count: number): void {
  const store = getStationStore();
  const currentSize = store.size;
  
  if (count > currentSize) {
    for (let i = currentSize + 1; i <= count; i++) {
      store.set(i, {
        running: false,
        paused: false,
        pausedAt: null,
        totalPausedSeconds: 0,
        gameId: null,
        sessionStartEpoch: null,
        currentSegmentStart: null,
        customerName: "",
        source: "manual",
        segments: [],
        unknownGame: null,
        playerCount: undefined,
      });
    }
  } else if (count < currentSize) {
    for (let i = currentSize; i > count; i--) {
      const station = store.get(i);
      if (station && !station.running) {
        store.delete(i);
      }
    }
  }
}

export function getHistory(): HistoryStore {
  return getHistoryStore();
}

export function saveSession(session: Session): void {
  const store = getHistoryStore();
  if (!store[session.date]) {
    store[session.date] = [];
  }
  store[session.date].push(session);
}

export function clearDay(date: string): void {
  const store = getHistoryStore();
  delete store[date];
}

function createSegment(
  game: Game,
  startEpoch: number,
  endEpoch: number,
  settings: GameSettings,
  playerCount?: 2 | 4,
  customPricePerMatch?: number | null
): GameSegment {
  const elapsed = Math.floor((endEpoch - startEpoch) / 1000);
  const matches = calcMatches(game, elapsed, settings);
  const bill = calcBill(game, elapsed, settings, playerCount, customPricePerMatch);
  
  return {
    gameId: game.id,
    gameLabel: game.label,
    gameEmoji: game.emoji,
    startEpoch,
    endEpoch,
    elapsed,
    matches,
    bill,
    playerCount,
  };
}

export function startStation(
  id: number,
  game: Game,
  customerName: string,
  source: "manual" | "ps4",
  playerCount: 2 | 4 = 2
): void {
  const store = getStationStore();
  const existing = store.get(id);
  const now = Date.now();
  
  if (existing && existing.running && existing.segments.length > 0) {
    // Close current segment and start new one
    const settings = getSettings();
    const currentGame = resolveGame(existing.gameId);
    
    if (currentGame && existing.currentSegmentStart) {
      const segment = createSegment(
        currentGame,
        existing.currentSegmentStart,
        now,
        settings,
        existing.playerCount
      );
      existing.segments.push(segment);
    }
    
    // Start new segment with same session
    existing.gameId = game.id;
    existing.currentSegmentStart = now;
    existing.paused = false;
    existing.pausedAt = null;
    existing.playerCount = playerCount;
    store.set(id, existing);
  } else {
    // Fresh start - new session
    store.set(id, {
      running: true,
      paused: false,
      pausedAt: null,
      totalPausedSeconds: 0,
      gameId: game.id,
      sessionStartEpoch: now,
      currentSegmentStart: now,
      customerName: customerName || "",
      source,
      segments: [],
      unknownGame: null,
      playerCount,
    });
  }
}

export function switchGame(
  id: number, 
  newGame: Game, 
  newPlayerCount?: 2 | 4,
  customPricePerMatch?: number | null
): GameSegment | null {
  const store = getStationStore();
  const existing = store.get(id);
  
  if (!existing || !existing.running) {
    return null;
  }

  // Guard against legacy state with undefined segments
  if (!existing.segments) existing.segments = [];
  
  const settings = getSettings();
  const now = Date.now();
  
  // Close current segment if exists
  const currentGame = resolveGame(existing.gameId);
  let closedSegment: GameSegment | null = null;
  
  if (currentGame && existing.currentSegmentStart) {
    const adjustedNow = existing.paused && existing.pausedAt 
      ? existing.pausedAt 
      : now;
    
    closedSegment = createSegment(
      currentGame,
      existing.currentSegmentStart,
      adjustedNow,
      settings,
      existing.playerCount,
      customPricePerMatch
    );
    existing.segments.push(closedSegment);
  }
  
  // Start new segment immediately
  existing.gameId = newGame.id;
  existing.currentSegmentStart = now;
  if (newPlayerCount) existing.playerCount = newPlayerCount;
  
  // If was paused, resume it
  if (existing.paused && existing.pausedAt) {
    existing.totalPausedSeconds += now - existing.pausedAt;
    existing.paused = false;
    existing.pausedAt = null;
  }
  
  store.set(id, existing);
  return closedSegment;
}

export function pauseStation(id: number): number | null {
  const store = getStationStore();
  const existing = store.get(id);
  
  if (!existing || !existing.running || existing.paused) {
    return null;
  }
  
  const now = Date.now();
  existing.paused = true;
  existing.pausedAt = now;
  store.set(id, existing);
  
  return now;
}

export function resumeStation(id: number): number | null {
  const store = getStationStore();
  const existing = store.get(id);
  
  if (!existing || !existing.running || !existing.paused || !existing.pausedAt) {
    return null;
  }
  
  const now = Date.now();
  existing.totalPausedSeconds += now - existing.pausedAt;
  existing.paused = false;
  existing.pausedAt = null;
  store.set(id, existing);
  
  return now;
}

export function stopStation(
  id: number,
  customPricePerMatch?: number | null
): { session: Session; totalBill: number } | null {
  const store = getStationStore();
  const existing = store.get(id);
  
  if (!existing || !existing.running) {
    return null;
  }
  
  const settings = getSettings();
  const now = Date.now();
  
  // Ensure segments is always an array (guard against legacy state with undefined segments)
  if (!existing.segments) existing.segments = [];

  // Close current segment
  const currentGame = resolveGame(existing.gameId);
  if (currentGame && existing.currentSegmentStart) {
    const adjustedNow = existing.paused && existing.pausedAt 
      ? existing.pausedAt 
      : now;
    
    const segment = createSegment(
      currentGame,
      existing.currentSegmentStart,
      adjustedNow,
      settings,
      existing.playerCount,
      customPricePerMatch
    );
    existing.segments.push(segment);
  }
  
  // Calculate totals
  const totalBill = existing.segments.reduce((sum, seg) => sum + (seg.bill ?? 0), 0);
  const totalElapsed = existing.segments.reduce((sum, seg) => sum + (seg.elapsed ?? 0), 0);
  
  // Create session
  const sessionDate = new Date();
  const date = sessionDate.toISOString().split("T")[0];
  const time = sessionDate.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false 
  });
  
  const session: Session = {
    date,
    time,
    customerName: existing.customerName,
    source: existing.source,
    totalElapsed,
    totalBill,
    segments: existing.segments,
    playerCount: existing.playerCount,
  };
  
  // Save to history
  saveSession(session);
  
  // Reset station
  resetStation(id);
  
  return { session, totalBill };
}

export function getElapsed(station: StationState): { current: number; total: number } {
  if (!station.running || !station.currentSegmentStart) {
    return { current: 0, total: (station.segments || []).reduce((sum, seg) => sum + seg.elapsed, 0) };
  }
  
  const now = Date.now();
  let currentElapsed: number;
  
  if (station.paused && station.pausedAt) {
    currentElapsed = Math.floor((station.pausedAt - station.currentSegmentStart - station.totalPausedSeconds) / 1000);
  } else {
    currentElapsed = Math.floor((now - station.currentSegmentStart - station.totalPausedSeconds) / 1000);
  }
  
  const totalElapsed = (station.segments || []).reduce((sum, seg) => sum + seg.elapsed, 0) + currentElapsed;
  
  return { current: Math.max(0, currentElapsed), total: Math.max(0, totalElapsed) };
}

export function stationStateToStation(id: number, state: StationState): Station {
  const game = resolveGame(state.gameId);
  const { current, total } = getElapsed(state);
  
  // Calculate current bill
  const settings = getSettings();
  let currentBill = 0;
  let currentMatches = 0;
  if (game && state.running) {
    currentBill = calcBill(game, current, settings, state.playerCount);
    currentMatches = calcMatches(game, current, settings);
  }
  
  // Calculate total bill from segments + current
  const segmentsBill = (state.segments || []).reduce((sum, seg) => sum + seg.bill, 0);
  const totalBill = segmentsBill + currentBill;
  
  return {
    id,
    running: state.running,
    paused: state.paused,
    pausedAt: state.pausedAt,
    totalPausedSeconds: state.totalPausedSeconds,
    currentGame: game,
    sessionStartEpoch: state.sessionStartEpoch,
    currentSegmentStart: state.currentSegmentStart,
    elapsed: current,
    totalElapsed: total,
    customerName: state.customerName,
    source: state.source,
    segments: state.segments,
    unknownGame: state.unknownGame,
    playerCount: state.playerCount,
  };
}

export function getGameRegistry(): Map<string, CustomGame> {
  if (!globalThis.__gameRegistry) {
    globalThis.__gameRegistry = new Map();
  }
  return globalThis.__gameRegistry;
}

export function getGameByTitleId(titleId: string): CustomGame | null {
  return getGameRegistry().get(titleId) || null;
}

export function saveCustomGame(game: CustomGame): void {
  getGameRegistry().set(game.titleId, game);
}

export function getAllGames(): CustomGame[] {
  return Array.from(getGameRegistry().values());
}

export function deleteGame(titleId: string): void {
  getGameRegistry().delete(titleId);
}

export function setUnknownGame(id: number, titleId: string, titleName: string): void {
  const store = getStationStore();
  const existing = store.get(id);
  const now = Date.now();
  
  if (existing && existing.running) {
    // If it's already running, it means we switched to an unknown game
    existing.unknownGame = { titleId, titleName };
    store.set(id, existing);
  } else {
    // Fresh start in unknown state
    store.set(id, {
      running: true,
      paused: false,
      pausedAt: null,
      totalPausedSeconds: 0,
      gameId: null,
      sessionStartEpoch: now,
      currentSegmentStart: now,
      customerName: "",
      source: "ps4",
      segments: [],
      unknownGame: { titleId, titleName },
    });
  }
}
