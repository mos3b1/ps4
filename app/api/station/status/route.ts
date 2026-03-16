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
    const stationStates = getAllStations();
    const stations = stationStates.map((state, index) =>
      stationStateToStation(index + 1, state)
    );

    return NextResponse.json(
      { stations },
      { headers: corsHeaders }
    );
  } catch (error) {
    // Always return a valid shape — never 500 naked error
    console.error("Station status error:", error);
    return NextResponse.json(
      { stations: [] },
      { headers: corsHeaders }
    );
  }
}
