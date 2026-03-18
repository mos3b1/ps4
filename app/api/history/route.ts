import { NextResponse } from "next/server";
import { getHistory, clearDay } from "@/lib/stationStore";

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
    const history = await getHistory();
    return NextResponse.json(
      { history },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("[API ERROR] /api/history GET:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    
    // Validate body first
    const { date } = body;
    
    if (!date) {
      return NextResponse.json(
        { error: "date required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Do the work
    await clearDay(date);

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("[API ERROR] /api/history DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
