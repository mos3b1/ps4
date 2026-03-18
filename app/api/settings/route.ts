import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/stationStore";
import { GameSettings } from "@/lib/pricing";

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
    const settings = await getSettings();
    return NextResponse.json(
      { settings },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("[API ERROR] /api/settings GET:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate body first (at least check it's an object)
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be an object with game settings" },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const partialSettings = body as Partial<GameSettings>;
    
    // Do the work
    const updatedSettings = await updateSettings(partialSettings);
    
    return NextResponse.json(
      { success: true, settings: updatedSettings },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("[API ERROR] /api/settings POST:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
