import { NextResponse } from "next/server";
import { getStation, pauseStation } from "@/lib/stationStore";

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
    const { stationId } = body;
    
    if (typeof stationId !== "number" || stationId < 1 || stationId > 12) {
      return NextResponse.json(
        { error: "stationId required (1-12)" },
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

    if (station.paused) {
      return NextResponse.json(
        { error: "Station already paused" },
        { status: 400, headers: corsHeaders }
      );
    }

    const pausedAt = await pauseStation(stationId);

    return NextResponse.json(
      { success: true, pausedAt },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("[API ERROR] /api/station/pause:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
