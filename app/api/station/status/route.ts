import { NextResponse } from "next/server";
import { getAllStations, stationStateToStation } from "@/lib/stationStore";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Do the work
    const stationStates = await getAllStations();
    const stations = await Promise.all(
      stationStates.map((state, index) => stationStateToStation(index + 1, state))
    );

    return NextResponse.json(
      { stations },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("[API ERROR] /api/station/status:", error);
    // Always return valid shape even on error
    return NextResponse.json(
      { stations: [], error: String(error) },
      { headers: corsHeaders }
    );
  }
}
