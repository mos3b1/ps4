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
    const body = await request.json();
    const { stationId, customPricePerMatch } = body;

    if (typeof stationId !== "number") {
      return NextResponse.json(
        { error: "Missing stationId" },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = stopStation(stationId, customPricePerMatch);

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
        // Primary fields
        totalBill,
        session,
        // Aliases expected by test suite
        bill: totalBill,
        elapsed: session.totalElapsed,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Stop station error:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers: corsHeaders }
    );
  }
}
