export type GameMode = "time-match" | "hour";

export interface Game {
  id: string;
  label: string;
  emoji: string;
  mode: GameMode;
  price: number;
  matchCycleMinutes?: number;
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

export const DEFAULT_SETTINGS: GameSettings = {
  pes: { pricePerMatch: 50, matchDurationMin: 11, breakDurationMin: 4 },
  fifa: { pricePerMatch: 50, matchDurationMin: 12, breakDurationMin: 4 },
  gta: { pricePerHour: 100 },
  cod: { pricePerHour: 80 },
  mk: { pricePerHour: 80 },
  other: { pricePerHour: 60 },
};

// Helper: Get current time in SECONDS (not milliseconds)
// Database stores seconds, JavaScript uses milliseconds
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function calcCycleMinutes(game: Game, settings: GameSettings): number {
  if (game.id === "pes") {
    return settings.pes.matchDurationMin + settings.pes.breakDurationMin;
  }
  if (game.id === "fifa") {
    return settings.fifa.matchDurationMin + settings.fifa.breakDurationMin;
  }
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
    let pricePerHour = game.price;
    if (game.id === "gta") pricePerHour = settings.gta.pricePerHour;
    else if (game.id === "cod") pricePerHour = settings.cod.pricePerHour;
    else if (game.id === "mk") pricePerHour = settings.mk.pricePerHour;
    else if (game.id === "other") pricePerHour = settings.other.pricePerHour;
    
    baseBill = Math.ceil(elapsedSeconds / 3600) * pricePerHour;
  }

  const multiplier = playerCount === 4 ? 2 : 1;
  return baseBill * multiplier;
}

// Calculate matches — minimum always 1
export function calcMatches(game: Game, elapsedSeconds: number, settings: GameSettings): number {
  if (game.mode === "time-match") {
    const cycleMinutes = calcCycleMinutes(game, settings);
    if (cycleMinutes > 0) {
      return Math.max(1, Math.floor(elapsedSeconds / 60 / cycleMinutes));
    }
  }
  return 0;
}

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
