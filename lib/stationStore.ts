import { db, stations, sessions, settings, gameRegistry } from "./db";
import { eq } from "drizzle-orm";
import { 
  GAMES, Game, GameSettings, DEFAULT_SETTINGS, 
  calcBill, calcMatches, calcCycleMinutes, nowSeconds 
} from "./pricing";
import { Station, Session, GameSegment } from "./types";

export type { GameSettings };
export { DEFAULT_SETTINGS };

export interface CustomGame {
  titleId: string;
  titleName: string;
  gameId: string;
  mode: "time-match" | "hour";
  price: number;
  matchCycleMinutes?: number;
  addedAt: string;
  isTemp?: boolean;
}

type StationState = {
  id: number;
  running: boolean;
  paused: boolean;
  pausedAt: number | null;      // milliseconds since epoch
  totalPausedSeconds: number; // seconds
  gameId: string | null;
  sessionStartEpoch: number | null; // milliseconds since epoch
  currentSegmentStart: number | null; // milliseconds since epoch
  customerName: string;
  source: "manual" | "ps4";
  segments: GameSegment[];
  unknownGame: { titleId: string; titleName: string } | null;
  playerCount?: 2 | 4;
  customPricePerMatch?: number | null;
  currentGameJson?: any;
};

function rowToStationState(row: typeof stations.$inferSelect): StationState {
  return {
    id: row.id,
    running: row.running ?? false,
    paused: row.paused ?? false,
    pausedAt: row.pausedAt !== null ? Number(row.pausedAt) : null,
    totalPausedSeconds: row.totalPausedSeconds ?? 0,
    gameId: row.currentGameId ?? null,
    sessionStartEpoch: row.sessionStartEpoch !== null ? Number(row.sessionStartEpoch) : null,
    currentSegmentStart: row.segmentStartEpoch !== null ? Number(row.segmentStartEpoch) : null,
    customerName: row.customerName ?? "",
    source: (row.source as "manual" | "ps4") ?? "manual",
    segments: (row.segments as GameSegment[]) ?? [],
    unknownGame: row.unknownGame as { titleId: string; titleName: string } | null,
    playerCount: row.playerCount as 2 | 4 | undefined,
    customPricePerMatch: row.customPricePerMatch ?? null,
    currentGameJson: row.currentGameJson,
  };
}

function makeEmptyStation(id: number): typeof stations.$inferInsert {
  return {
    id,
    running: false,
    paused: false,
    pausedAt: null,
    totalPausedSeconds: 0,
    currentGameId: null,
    currentGameJson: null,
    sessionStartEpoch: null,
    segmentStartEpoch: null,
    customerName: "",
    source: "manual",
    segments: [],
    totalBill: 0,
    unknownGame: null,
    customPricePerMatch: null,
    playerCount: null,
  };
}

// ─────────────────────────────────────────────────────────────
// STATIONS
// ─────────────────────────────────────────────────────────────

export async function getAllStations(): Promise<StationState[]> {
  try {
    let rows = await db.select().from(stations).orderBy(stations.id);
    if (rows.length === 0) {
      // Seed 4 empty stations on first run
      await db.insert(stations).values(
        Array.from({ length: 4 }, (_, i) => makeEmptyStation(i + 1))
      );
      rows = await db.select().from(stations).orderBy(stations.id);
    }
    return rows.map(rowToStationState);
  } catch (error) {
    console.error("[DB ERROR] getAllStations:", error);
    throw error;
  }
}

export async function getStation(id: number): Promise<StationState | null> {
  try {
    const rows = await db.select().from(stations).where(eq(stations.id, id));
    if (rows.length === 0) {
      // Create station if doesn't exist
      await db.insert(stations).values(makeEmptyStation(id));
      const newRows = await db.select().from(stations).where(eq(stations.id, id));
      return newRows.length > 0 ? rowToStationState(newRows[0]) : null;
    }
    return rowToStationState(rows[0]);
  } catch (error) {
    console.error("[DB ERROR] getStation:", error);
    throw error;
  }
}

export async function setStation(id: number, state: Partial<StationState>): Promise<void> {
  try {
    const update: Partial<typeof stations.$inferInsert> = {};
    if (state.running !== undefined) update.running = state.running;
    if (state.paused !== undefined) update.paused = state.paused;
    if (state.pausedAt !== undefined) update.pausedAt = state.pausedAt;
    if (state.totalPausedSeconds !== undefined) update.totalPausedSeconds = state.totalPausedSeconds;
    if (state.gameId !== undefined) update.currentGameId = state.gameId;
    if (state.sessionStartEpoch !== undefined) update.sessionStartEpoch = state.sessionStartEpoch;
    if (state.currentSegmentStart !== undefined) update.segmentStartEpoch = state.currentSegmentStart;
    if (state.customerName !== undefined) update.customerName = state.customerName;
    if (state.source !== undefined) update.source = state.source;
    if (state.segments !== undefined) update.segments = state.segments;
    if (state.unknownGame !== undefined) update.unknownGame = state.unknownGame;
    if (state.playerCount !== undefined) update.playerCount = state.playerCount;
    if (state.customPricePerMatch !== undefined) update.customPricePerMatch = state.customPricePerMatch;
    if (state.currentGameJson !== undefined) update.currentGameJson = state.currentGameJson;
    
    update.updatedAt = new Date();
    
    await db.update(stations).set(update).where(eq(stations.id, id));
  } catch (error) {
    console.error("[DB ERROR] setStation:", error);
    throw error;
  }
}

export async function resetStation(id: number): Promise<void> {
  try {
    await db.update(stations)
      .set(makeEmptyStation(id))
      .where(eq(stations.id, id));
  } catch (error) {
    console.error("[DB ERROR] resetStation:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────

export async function getSettings(): Promise<GameSettings> {
  try {
    const rows = await db.select().from(settings);
    if (rows.length === 0) {
      // Seed default settings
      const defaults = [
        { gameId: "pes", pricePerMatch: 50, matchDurationMin: 11, breakDurationMin: 4 },
        { gameId: "fifa", pricePerMatch: 50, matchDurationMin: 12, breakDurationMin: 4 },
        { gameId: "gta", pricePerHour: 100 },
        { gameId: "cod", pricePerHour: 80 },
        { gameId: "mk", pricePerHour: 80 },
        { gameId: "other", pricePerHour: 60 },
      ];
      await db.insert(settings).values(defaults);
      return DEFAULT_SETTINGS;
    }
    
    const result: GameSettings = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      if (row.gameId === "pes" || row.gameId === "fifa") {
        result[row.gameId] = {
          pricePerMatch: row.pricePerMatch ?? result[row.gameId].pricePerMatch,
          matchDurationMin: row.matchDurationMin ?? result[row.gameId].matchDurationMin,
          breakDurationMin: row.breakDurationMin ?? result[row.gameId].breakDurationMin,
        };
      } else {
        result[row.gameId as "gta" | "cod" | "mk" | "other"] = {
          pricePerHour: row.pricePerHour ?? result[row.gameId as "gta" | "cod" | "mk" | "other"].pricePerHour,
        };
      }
    }
    return result;
  } catch (error) {
    console.error("[DB ERROR] getSettings:", error);
    throw error;
  }
}

export async function updateSettings(partial: Partial<GameSettings>): Promise<GameSettings> {
  try {
    for (const [gameId, vals] of Object.entries(partial)) {
      const existing = await db.select().from(settings).where(eq(settings.gameId, gameId));
      if (existing.length > 0) {
        await db.update(settings)
          .set({ ...vals, updatedAt: new Date() })
          .where(eq(settings.gameId, gameId));
      } else {
        await db.insert(settings).values({ gameId, ...vals });
      }
    }
    return getSettings();
  } catch (error) {
    console.error("[DB ERROR] updateSettings:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// SESSIONS / HISTORY
// ─────────────────────────────────────────────────────────────

export async function getHistory(): Promise<Record<string, Session[]>> {
  try {
    const rows = await db.select().from(sessions).orderBy(sessions.createdAt);
    const grouped: Record<string, Session[]> = {};
    for (const row of rows) {
      const session: Session = {
        date: row.date,
        time: row.time,
        customerName: row.customerName ?? "",
        source: (row.source as "manual" | "ps4") ?? "manual",
        totalElapsed: row.elapsed ?? 0,
        totalBill: row.totalBill ?? 0,
        segments: (row.segments as GameSegment[]) ?? [],
        playerCount: row.playerCount as 2 | 4 | undefined,
      };
      if (!grouped[row.date]) grouped[row.date] = [];
      grouped[row.date].push(session);
    }
    return grouped;
  } catch (error) {
    console.error("[DB ERROR] getHistory:", error);
    throw error;
  }
}

export async function saveSession(session: Session): Promise<void> {
  try {
    await db.insert(sessions).values({
      date: session.date,
      time: session.time,
      stationId: null,
      customerName: session.customerName,
      gameLabel: session.segments[0]?.gameLabel ?? "",
      gameEmoji: session.segments[0]?.gameEmoji ?? "🎮",
      source: session.source,
      elapsed: session.totalElapsed ?? 0,
      totalBill: session.totalBill ?? 0,
      segments: session.segments ?? [],
      playerCount: session.playerCount ?? null,
    });
  } catch (error) {
    console.error("[DB ERROR] saveSession:", error);
    throw error;
  }
}

export async function clearDay(date: string): Promise<void> {
  try {
    await db.delete(sessions).where(eq(sessions.date, date));
  } catch (error) {
    console.error("[DB ERROR] clearDay:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// GAME REGISTRY
// ─────────────────────────────────────────────────────────────

export async function getGameRegistry(): Promise<Record<string, CustomGame>> {
  try {
    const rows = await db.select().from(gameRegistry);
    const result: Record<string, CustomGame> = {};
    for (const row of rows) {
      result[row.titleId] = {
        titleId: row.titleId,
        titleName: row.titleName,
        gameId: row.gameId,
        mode: row.mode as "time-match" | "hour",
        price: row.price,
        matchCycleMinutes: row.matchCycleMinutes ?? undefined,
        addedAt: row.addedAt ?? "",
        isTemp: row.isTemp ?? false,
      };
    }
    return result;
  } catch (error) {
    console.error("[DB ERROR] getGameRegistry:", error);
    throw error;
  }
}

export async function getGameByTitleId(titleId: string): Promise<CustomGame | null> {
  try {
    const rows = await db.select().from(gameRegistry).where(eq(gameRegistry.titleId, titleId));
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      titleId: row.titleId,
      titleName: row.titleName,
      gameId: row.gameId,
      mode: row.mode as "time-match" | "hour",
      price: row.price,
      matchCycleMinutes: row.matchCycleMinutes ?? undefined,
      addedAt: row.addedAt ?? "",
      isTemp: row.isTemp ?? false,
    };
  } catch (error) {
    console.error("[DB ERROR] getGameByTitleId:", error);
    throw error;
  }
}

export async function saveCustomGame(game: CustomGame): Promise<void> {
  try {
    await db.insert(gameRegistry)
      .values({
        titleId: game.titleId,
        titleName: game.titleName,
        gameId: game.gameId,
        mode: game.mode,
        price: game.price,
        matchCycleMinutes: game.matchCycleMinutes,
        addedAt: game.addedAt,
        isTemp: game.isTemp ?? false,
      })
      .onConflictDoUpdate({
        target: gameRegistry.titleId,
        set: {
          titleName: game.titleName,
          gameId: game.gameId,
          mode: game.mode,
          price: game.price,
          matchCycleMinutes: game.matchCycleMinutes,
          isTemp: game.isTemp ?? false,
        }
      });
  } catch (error) {
    console.error("[DB ERROR] saveCustomGame:", error);
    throw error;
  }
}

export async function getAllGames(): Promise<CustomGame[]> {
  try {
    const registry = await getGameRegistry();
    return Object.values(registry).filter(g => !g.isTemp);
  } catch (error) {
    console.error("[DB ERROR] getAllGames:", error);
    throw error;
  }
}

export async function deleteGame(titleId: string): Promise<void> {
  try {
    await db.delete(gameRegistry).where(eq(gameRegistry.titleId, titleId));
  } catch (error) {
    console.error("[DB ERROR] deleteGame:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// STATION ACTIONS
// ─────────────────────────────────────────────────────────────

export function resolveGame(gameId: string | null, customRegistry?: Record<string, CustomGame>): Game | null {
  if (!gameId) return null;
  
  const builtin = GAMES.find(g => g.id === gameId);
  if (builtin) return builtin;
  
  if (customRegistry && customRegistry[gameId]) {
    const custom = customRegistry[gameId];
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

function createSegment(
  game: Game,
  startEpochMs: number,
  endEpochMs: number,
  activeElapsedSeconds: number,
  gameSettings: GameSettings,
  playerCount?: 2 | 4,
  customPricePerMatch?: number | null
): GameSegment {
  const matches = calcMatches(game, activeElapsedSeconds, gameSettings);
  const bill = calcBill(game, activeElapsedSeconds, gameSettings, playerCount, customPricePerMatch);
  
  return {
    gameId: game.id,
    gameLabel: game.label,
    gameEmoji: game.emoji,
    startEpoch: startEpochMs,
    endEpoch: endEpochMs,
    elapsed: activeElapsedSeconds,
    matches,
    bill,
    playerCount,
  };
}

export async function startStation(
  id: number,
  game: Game,
  customerName: string,
  source: "manual" | "ps4",
  playerCount: 2 | 4 = 2
): Promise<void> {
  const existing = await getStation(id);
  const now = nowSeconds(); // seconds
  
  if (existing && existing.running && existing.segments.length > 0) {
    // Switch game within same session
    const gameSettings = await getSettings();
    const currentGame = resolveGame(existing.gameId);
    
    if (currentGame && existing.currentSegmentStart) {
      const { current: currentElapsed } = getElapsed(existing);
      const segment = createSegment(
        currentGame,
        existing.currentSegmentStart,
        now * 1000,
        currentElapsed,
        gameSettings,
        existing.playerCount
      );
      existing.segments.push(segment);
    }
    
    await setStation(id, {
      gameId: game.id,
      currentGameJson: game,
      currentSegmentStart: now * 1000, // store as ms for frontend consistency
      paused: false,
      pausedAt: null,
      playerCount,
      segments: existing.segments,
    });
  } else {
    // Fresh start
    await setStation(id, {
      running: true,
      paused: false,
      pausedAt: null,
      totalPausedSeconds: 0,
      gameId: game.id,
      currentGameJson: game,
      sessionStartEpoch: now * 1000,
      currentSegmentStart: now * 1000,
      customerName: customerName || "",
      source,
      segments: [],
      unknownGame: null,
      playerCount,
    });
  }
}

export async function switchGame(
  id: number, 
  newGame: Game, 
  newPlayerCount?: 2 | 4,
  customPricePerMatch?: number | null
): Promise<GameSegment | null> {
  const existing = await getStation(id);
  
  if (!existing || !existing.running) {
    return null;
  }

  if (!existing.segments) existing.segments = [];
  
  const gameSettings = await getSettings();
  const now = nowSeconds();
  
  const currentGame = resolveGame(existing.gameId);
  let closedSegment: GameSegment | null = null;
  
  if (currentGame && existing.currentSegmentStart) {
    const endEpochMs = existing.paused && existing.pausedAt 
      ? existing.pausedAt
      : now * 1000;
    
    const { current: currentElapsed } = getElapsed(existing);
    
    closedSegment = createSegment(
      currentGame,
      existing.currentSegmentStart,
      endEpochMs,
      currentElapsed,
      gameSettings,
      existing.playerCount,
      customPricePerMatch ?? existing.customPricePerMatch
    );
    existing.segments.push(closedSegment);
  }
  
  const update: Partial<StationState> = {
    gameId: newGame.id,
    currentGameJson: newGame,
    currentSegmentStart: now * 1000,
    segments: existing.segments,
  };
  
  if (newPlayerCount) update.playerCount = newPlayerCount;
  
  // If was paused, resume automatically on switch
  if (existing.paused && existing.pausedAt) {
    update.totalPausedSeconds = existing.totalPausedSeconds + (now - Math.floor(existing.pausedAt / 1000));
    update.paused = false;
    update.pausedAt = null;
  }
  
  await setStation(id, update);
  return closedSegment;
}

export async function pauseStation(id: number): Promise<number | null> {
  const existing = await getStation(id);
  
  if (!existing || !existing.running || existing.paused) {
    return null;
  }
  
  const now = nowSeconds();
  await setStation(id, {
    paused: true,
    pausedAt: now * 1000,
  });
  
  return now * 1000;
}

export async function resumeStation(id: number): Promise<number | null> {
  const existing = await getStation(id);
  
  if (!existing || !existing.running || !existing.paused || !existing.pausedAt) {
    return null;
  }
  
  const now = nowSeconds();
  const pausedAtSeconds = Math.floor(existing.pausedAt / 1000);
  await setStation(id, {
    totalPausedSeconds: existing.totalPausedSeconds + (now - pausedAtSeconds),
    paused: false,
    pausedAt: null,
  });
  
  return now * 1000;
}

export async function stopStation(
  id: number,
  customPricePerMatch?: number | null
): Promise<{ session: Session; totalBill: number } | null> {
  const existing = await getStation(id);
  
  if (!existing || !existing.running) {
    return null;
  }
  
  const gameSettings = await getSettings();
  const now = nowSeconds();
  
  if (!existing.segments) existing.segments = [];

  const currentGame = resolveGame(existing.gameId);
  if (currentGame && existing.currentSegmentStart) {
    const endEpochMs = existing.paused && existing.pausedAt 
      ? existing.pausedAt
      : now * 1000;
      
    const { current: currentElapsed } = getElapsed(existing);
    
    const segment = createSegment(
      currentGame,
      existing.currentSegmentStart,
      endEpochMs,
      currentElapsed,
      gameSettings,
      existing.playerCount,
      customPricePerMatch ?? existing.customPricePerMatch
    );
    existing.segments.push(segment);
  }
  
  const totalBill = existing.segments.reduce((sum, seg) => sum + (seg.bill ?? 0), 0);
  const totalElapsed = existing.segments.reduce((sum, seg) => sum + (seg.elapsed ?? 0), 0);
  
  const sessionDate = new Date();
  const date = sessionDate.toISOString().split("T")[0];
  const time = sessionDate.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false 
  });
  
  // Round to 2 decimal places to avoid floating point issues
  const roundedTotalBill = Math.round(totalBill * 100) / 100;
  
  const session: Session = {
    date,
    time,
    customerName: existing.customerName || "Customer",
    source: existing.source,
    totalElapsed,
    totalBill: roundedTotalBill,
    segments: existing.segments,
    playerCount: existing.playerCount,
  };
  
  await saveSession(session);
  await resetStation(id);
  
  return { session, totalBill: roundedTotalBill };
}

// Calculate elapsed from stored epochs (server-side, recalculated on every poll)
export function getElapsed(station: StationState): { current: number; total: number } {
  if (!station.segments) station.segments = [];
  
  if (!station.running || !station.currentSegmentStart) {
    return { 
      current: 0, 
      total: station.segments.reduce((sum, seg) => sum + (seg?.elapsed ?? 0), 0) 
    };
  }
  
  const now = nowSeconds();
  const segmentStartSeconds = Math.floor(station.currentSegmentStart / 1000);
  let currentElapsed: number;
  
  if (station.paused && station.pausedAt) {
    const pausedAtSeconds = Math.floor(station.pausedAt / 1000);
    currentElapsed = pausedAtSeconds - segmentStartSeconds - station.totalPausedSeconds;
  } else {
    currentElapsed = now - segmentStartSeconds - station.totalPausedSeconds;
  }
  
  const segmentsElapsed = station.segments.reduce((sum, seg) => sum + (seg?.elapsed ?? 0), 0);
  const totalElapsed = segmentsElapsed + currentElapsed;
  
  return { 
    current: Math.max(0, currentElapsed), 
    total: Math.max(0, totalElapsed) 
  };
}

export async function stationStateToStation(id: number, state: StationState): Promise<Station> {
  const game = resolveGame(state.gameId);
  const { current, total } = getElapsed(state);
  
  const gameSettings = await getSettings();
  let currentBill = 0;
  let currentMatches = 0;
  if (game && state.running) {
    currentBill = calcBill(game, current, gameSettings, state.playerCount, state.customPricePerMatch);
    currentMatches = calcMatches(game, current, gameSettings);
  }
  
  const segmentsBill = state.segments.reduce((sum, seg) => sum + (seg?.bill ?? 0), 0);
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
    segments: state.segments ?? [],
    unknownGame: state.unknownGame,
    playerCount: state.playerCount,
    customPricePerMatch: state.customPricePerMatch,
  };
}

export async function setUnknownGame(id: number, titleId: string, titleName: string): Promise<void> {
  const existing = await getStation(id);
  const now = nowSeconds();
  
  if (existing && existing.running) {
    await setStation(id, {
      unknownGame: { titleId, titleName },
    });
  } else {
    await setStation(id, {
      running: true,
      paused: false,
      pausedAt: null,
      totalPausedSeconds: 0,
      gameId: null,
      currentGameJson: null,
      sessionStartEpoch: now * 1000,
      currentSegmentStart: now * 1000,
      customerName: "",
      source: "ps4",
      segments: [],
      unknownGame: { titleId, titleName },
    });
  }
}

export async function getStationsCount(): Promise<number> {
  const allStations = await getAllStations();
  return allStations.length;
}
