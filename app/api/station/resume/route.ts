import { NextResponse } from "next/server";
import { getStation, resumeStation } from "@/lib/stationStore";

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
    const { stationId } = body;

    if (typeof stationId !== "number") {
      return NextResponse.json(
        { error: "Missing stationId" },
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

    if (!station.paused) {
      return NextResponse.json(
        { error: "Station not paused" },
        { status: 400, headers: corsHeaders }
      );
    }

    const resumedAt = resumeStation(stationId);

    return NextResponse.json(
      { success: true, resumedAt },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers: corsHeaders }
    );
  }
}
