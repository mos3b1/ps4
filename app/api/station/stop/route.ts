import { NextResponse } from "next/server";
import { stopStation } from "@/lib/stationStore";

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
    const { stationId, customPricePerMatch } = body;
    
    if (typeof stationId !== "number" || stationId < 1 || stationId > 12) {
      return NextResponse.json(
        { error: "stationId required (1-12)" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (customPricePerMatch !== undefined && customPricePerMatch !== null && typeof customPricePerMatch !== "number") {
      return NextResponse.json(
        { error: "customPricePerMatch must be a number or null" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Do the work
    const result = await stopStation(stationId, customPricePerMatch);

    if (!result) {
      return NextResponse.json(
        { error: "Station not running" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { session, totalBill } = result;

    return NextResponse.json(
      {
        success: true,
        totalBill,
        session,
        bill: totalBill,
        elapsed: session.totalElapsed,
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("[API ERROR] /api/station/stop:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
