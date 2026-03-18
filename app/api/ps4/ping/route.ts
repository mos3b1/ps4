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
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate body first
    const { stationId, event, titleId, titleName } = body;
    
    if (typeof stationId !== "number" || stationId < 1 || stationId > 12 || !event) {
      return NextResponse.json(
        { error: "stationId (1-12) and event required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (event !== "start" && event !== "stop") {
      return NextResponse.json(
        { error: "event must be 'start' or 'stop'" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Do the work
    if (event === "start") {
      let game = null;
      let gameId = titleId ? PS4_TITLE_MAP[titleId] : null;

      // 1. Check built-in games first
      if (gameId) {
        game = GAMES.find((g) => g.id === gameId);
      }

      // 2. Check custom registry by titleId
      if (!game && titleId) {
        const customGame = await getGameByTitleId(titleId);
        if (customGame) {
          game = {
            id: customGame.gameId,
            label: customGame.titleName,
            emoji: "🎮",
            mode: customGame.mode,
            price: customGame.price,
            matchCycleMinutes: customGame.matchCycleMinutes,
          };
          gameId = game.id;
        }
      }

      const existingStation = await getStation(stationId);

      // 3. Unknown game - needs owner resolution
      if (!game) {
        if (!titleId) {
          return NextResponse.json(
            { error: "titleId required for unknown game" },
            { status: 400, headers: corsHeaders }
          );
        }

        // Check if already running this unknown game
        if (existingStation?.unknownGame?.titleId === titleId) {
           return NextResponse.json({ 
             received: true, 
             status: "unknown_game_already_running", 
             titleName: titleName || titleId 
           }, { headers: corsHeaders });
        }

        await setUnknownGame(stationId, titleId, titleName || titleId);
        
        return NextResponse.json(
          { received: true, status: "unknown_game", titleName: titleName || titleId },
          { headers: corsHeaders }
        );
      }

      // 4. Known game - start or switch
      if (existingStation?.running) {
        // If already has segments or different game, switch
        if ((existingStation.segments ?? []).length > 0 || existingStation.gameId !== gameId) {
          const closedSegment = await switchGame(stationId, game, undefined, undefined);
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

      // Fresh start with PS4 source
      await startStation(stationId, game, "", "ps4", 2);
      
    } else if (event === "stop") {
      const existingStation = await getStation(stationId);
      if (existingStation?.running) {
        await stopStation(stationId, undefined);
      }
    }

    return NextResponse.json(
      { received: true, stationId, event },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("[API ERROR] /api/ps4/ping:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
