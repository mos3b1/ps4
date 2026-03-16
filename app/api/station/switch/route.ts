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
    const { stationId, gameId } = body;

    if (typeof stationId !== "number" || !gameId) {
      return NextResponse.json(
        { error: "Missing stationId or gameId" },
        { status: 400, headers: corsHeaders }
      );
    }

    const station = getStation(stationId);
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

    const closedSegment = switchGame(stationId, newGame);

    return NextResponse.json(
      { success: true, closedSegment },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers: corsHeaders }
    );
  }
}
