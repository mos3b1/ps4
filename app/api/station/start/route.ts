import { NextResponse } from "next/server";
import { startStation, resolveGame, switchGame } from "@/lib/stationStore";

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
    const { stationId, gameId, customerName, mode, playerCount, customPricePerMatch } = body;

    if (typeof stationId !== "number" || stationId < 1 || stationId > 12 || !gameId) {
      return NextResponse.json(
        { error: "Missing stationId or gameId. stationId must be a number between 1 and 12" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (playerCount !== undefined && playerCount !== 2 && playerCount !== 4) {
      return NextResponse.json(
        { error: "playerCount must be 2 or 4" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (customPricePerMatch !== undefined && customPricePerMatch !== null && typeof customPricePerMatch !== "number") {
      return NextResponse.json(
        { error: "customPricePerMatch must be a number or null" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (mode !== undefined && mode !== "switch") {
      return NextResponse.json(
        { error: "mode must be 'switch' if provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    const game = resolveGame(gameId);
    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 400, headers: corsHeaders }
      );
    }

    const parsedPlayerCount = playerCount === 4 ? 4 : 2;

    if (mode === "switch") {
      // Assuming switchGame is defined elsewhere and imported
      // For now, I'll just return a placeholder if switchGame is not available
      // You'll need to import or define `switchGame` and `resolveGame`
      // For the purpose of this edit, I'm assuming `GAMES.find` is `resolveGame`
      // and `switchGame` is a function that takes these arguments.
      const closedSegment = switchGame(stationId, game, parsedPlayerCount, customPricePerMatch);
      return NextResponse.json(
        { success: true, closedSegment },
        { headers: corsHeaders }
      );
    }

    // Default: new session
    startStation(stationId, game, customerName || "", "manual", parsedPlayerCount);

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Start station error:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers: corsHeaders }
    );
  }
}
