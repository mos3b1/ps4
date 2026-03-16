import { NextResponse } from "next/server";
import { PS4_TITLE_MAP, GAMES } from "@/lib/pricing";
import { getStation, startStation, switchGame, stopStation, getGameByTitleId, setUnknownGame } from "@/lib/stationStore";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stationId, event, titleId, titleName } = body;

    if (typeof stationId !== "number" || !event) {
      return NextResponse.json(
        { error: "Missing stationId or event" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (event === "start") {
      let game = null;
      let gameId = titleId ? PS4_TITLE_MAP[titleId] : null;

      // 1. Check GAMES list first
      if (gameId) {
        game = GAMES.find((g) => g.id === gameId);
      }

      // 2 & 3. If not found -> check gameRegistry by titleId
      if (!game && titleId) {
        const customGame = getGameByTitleId(titleId);
        if (customGame) {
          game = {
            id: customGame.gameId,
            label: customGame.titleName,
            emoji: "🎮", // fallback emoji for custom games
            mode: customGame.mode,
            price: customGame.price,
            matchCycleMinutes: customGame.matchCycleMinutes,
          };
          gameId = game.id;
        }
      }

      const existingStation = getStation(stationId);

      // 4. If NOT found anywhere -> mark station as unknown_game
      if (!game) {
        if (!titleId) {
          return NextResponse.json(
            { error: "Missing titleId for unknown game" },
            { status: 400, headers: corsHeaders }
          );
        }

        if (existingStation?.unknownGame?.titleId === titleId) {
           return NextResponse.json({ received: true, status: "unknown_game_already_running", titleName: titleName || titleId }, { headers: corsHeaders });
        }

        setUnknownGame(stationId, titleId, titleName || titleId);
        
        return NextResponse.json(
          { received: true, status: "unknown_game", titleName: titleName || titleId },
          { headers: corsHeaders }
        );
      }

      if (existingStation?.running) {
        if ((existingStation.segments ?? []).length > 0 || existingStation.gameId !== gameId) {
          // Already has segments running — switch game instead
          const closedSegment = switchGame(stationId, game);
          return NextResponse.json(
            { received: true, stationId, event, switched: true, closedSegment },
            { headers: corsHeaders }
          );
        }
        // Same game already running
        return NextResponse.json(
          { received: true, stationId, event, alreadyRunning: true },
          { headers: corsHeaders }
        );
      }

      // Fresh start with PS4 source (game found)
      startStation(stationId, game, "", "ps4");
    } else if (event === "stop") {
      // Use stopStation to save session to history (previously resetStation was used — bug)
      const existingStation = getStation(stationId);
      if (existingStation?.running) {
        stopStation(stationId);
      }
    }

    return NextResponse.json(
      { received: true, stationId, event },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("PS4 ping error:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers: corsHeaders }
    );
  }
}
