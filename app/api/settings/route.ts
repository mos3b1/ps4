import { NextResponse } from "next/server";
import { getSettings, updateSettings, GameSettings } from "@/lib/stationStore";

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
    const settings = getSettings();
    return NextResponse.json(
      { settings },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const partialSettings = body as Partial<GameSettings>;
    
    const updatedSettings = updateSettings(partialSettings);
    
    return NextResponse.json(
      { success: true, settings: updatedSettings },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 400, headers: corsHeaders }
    );
  }
}
