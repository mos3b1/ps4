import { NextResponse } from "next/server";
import { GAMES } from "@/lib/pricing";
import { getStation, switchGame } from "@/lib/stationStore";

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
    
    // Validate body first
    const { stationId, gameId } = body;
    
    if (typeof stationId !== "number" || stationId < 1 || stationId > 12 || !gameId) {
      return NextResponse.json(
        { error: "stationId (1-12) and gameId required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Do the work
    const station = await getStation(stationId);
    if (!station || !station.running) {
      return NextResponse.json(
        { error: "Station not running" },
        { status: 400, headers: corsHeaders }
      );
    }

    const newGame = GAMES.find(g => g.id === gameId);
    if (!newGame) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 400, headers: corsHeaders }
      );
    }

    const closedSegment = await switchGame(stationId, newGame);

    return NextResponse.json(
      { success: true, closedSegment },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("[API ERROR] /api/station/switch:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
