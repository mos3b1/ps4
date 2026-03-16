import { GameSettings } from "./stationStore";

export type GameMode = "time-match" | "hour";

export interface Game {
  id: string;
  label: string;
  emoji: string;
  mode: GameMode;
  price: number;
  matchCycleMinutes?: number;
}

export const GAMES: Game[] = [
  { id:"pes",  label:"PES",           emoji:"⚽", mode:"time-match", price:50,  matchCycleMinutes:15 },
  { id:"fifa", label:"FIFA",          emoji:"🥅", mode:"time-match", price:50,  matchCycleMinutes:16 },
  { id:"gta",  label:"GTA V",         emoji:"🚗", mode:"hour",       price:100 },
  { id:"cod",  label:"Call of Duty",  emoji:"🔫", mode:"hour",       price:80  },
  { id:"mk",   label:"Mortal Kombat", emoji:"🥊", mode:"hour",       price:80  },
  { id:"other",label:"Other",         emoji:"🎮", mode:"hour",       price:60  },
];

export const PS4_TITLE_MAP: Record<string, string> = {
  "CUSA00408": "pes",
  "CUSA00327": "fifa",
  "CUSA00625": "gta",
  "CUSA03023": "cod",
  "CUSA11310": "mk",
};

export function calcCycleMinutes(game: Game, settings: GameSettings): number {
  if (game.id === "pes") {
    return settings.pes.matchDurationMin + settings.pes.breakDurationMin;
  }
  if (game.id === "fifa") {
    return settings.fifa.matchDurationMin + settings.fifa.breakDurationMin;
  }
  // Custom game fallback
  return game.matchCycleMinutes || 15;
}

export function calcBill(
  game: Game, 
  elapsedSeconds: number, 
  settings: GameSettings, 
  playerCount?: 2 | 4,
  customPricePerMatch?: number | null
): number {
  let baseBill = 0;

  if (game.mode === "time-match") {
    const cycleMinutes = calcCycleMinutes(game, settings);
    if (cycleMinutes > 0) {
      const matches = Math.max(1, Math.floor(elapsedSeconds / 60 / cycleMinutes));
      
      let price = game.price; 
      if (customPricePerMatch != null) {
        price = customPricePerMatch;
      } else if (game.id === "pes") {
        price = settings.pes.pricePerMatch;
      } else if (game.id === "fifa") {
        price = settings.fifa.pricePerMatch;
      }
      
      baseBill = matches * price;
    }
  } else {
    // Hour-based games
    let pricePerHour = game.price; // fallback to intrinsic
    if (game.id === "gta") pricePerHour = settings.gta.pricePerHour;
    else if (game.id === "cod") pricePerHour = settings.cod.pricePerHour;
    else if (game.id === "mk") pricePerHour = settings.mk.pricePerHour;
    else if (game.id === "other") pricePerHour = settings.other.pricePerHour;
    
    baseBill = Math.ceil(elapsedSeconds / 3600) * pricePerHour;
  }

  // Apply multiplier: 4 players = double price (unless overridden via custom string)
  const multiplier = playerCount === 4 ? 2 : 1;
  return baseBill * multiplier;
}

export function calcMatches(game: Game, elapsedSeconds: number, settings: GameSettings): number {
  if (game.mode === "time-match") {
    const cycleMinutes = calcCycleMinutes(game, settings);
    if (cycleMinutes > 0) {
      return Math.max(1, Math.floor(elapsedSeconds / 60 / cycleMinutes));
    }
  }
  return 0;
}

// Legacy functions for backward compatibility (use defaults)
export function calcBillLegacy(game: Game, elapsedSeconds: number): number {
  if (game.mode === "time-match" && game.matchCycleMinutes) {
    const matches = Math.floor(elapsedSeconds / 60 / game.matchCycleMinutes);
    return Math.max(1, matches) * game.price;
  }
  return Math.ceil(elapsedSeconds / 3600) * game.price;
}

export function calcMatchesLegacy(game: Game, elapsedSeconds: number): number {
  if (game.mode === "time-match" && game.matchCycleMinutes)
    return Math.max(1, Math.floor(elapsedSeconds / 60 / game.matchCycleMinutes));
  return 0;
}
