import { NextResponse } from "next/server";
import { getStation, setStation, saveCustomGame, startStation, CustomGame } from "@/lib/stationStore";
import { Game, GameMode } from "@/lib/pricing";

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
    const { stationId, mode, price, matchCycleMinutes, remember } = body;

    if (typeof stationId !== "number" || !mode || typeof price !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate mode
    if (mode !== "time-match" && mode !== "hour") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'time-match' or 'hour'" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate matchCycleMinutes for time-match mode
    if (mode === "time-match" && (typeof matchCycleMinutes !== "number" || matchCycleMinutes <= 0)) {
      return NextResponse.json(
        { error: "matchCycleMinutes must be a positive number for time-match mode" },
        { status: 400, headers: corsHeaders }
      );
    }

    const existing = getStation(stationId);
    if (!existing || !existing.unknownGame) {
      return NextResponse.json(
        { error: "Station is not in unknown game state" },
        { status: 400, headers: corsHeaders }
      );
    }

    const titleId = existing.unknownGame.titleId;
    const titleName = existing.unknownGame.titleName;

    // Save to registry (either permanent or temporary)
    const customGame: CustomGame = {
      titleId,
      titleName,
      gameId: titleId,
      mode,
      price,
      matchCycleMinutes: mode === "time-match" ? matchCycleMinutes : undefined,
      addedAt: new Date().toISOString(),
      isTemp: !remember,
    };
    saveCustomGame(customGame);

    // Create the Game object for pricing logic
    const resolvedGame: Game = {
      id: titleId,
      label: titleName,
      emoji: "🎮", // default emoji for custom games
      mode: mode as GameMode,
      price,
      matchCycleMinutes: mode === "time-match" ? matchCycleMinutes : undefined,
    };

    // Clear unknown state
    existing.unknownGame = null;
    setStation(stationId, existing);

    // Call startStation which handles either fresh start or closing old segment
    // It will set the gameId and start tracking billing properly.
    startStation(stationId, resolvedGame, existing.customerName, existing.source);

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Resolve unknown game error:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 500, headers: corsHeaders }
    );
  }
}
