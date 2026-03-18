import { NextResponse } from "next/server";
import { startStation, resolveGame, switchGame } from "@/lib/stationStore";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  console.log("[API] /api/station/start - Received request");
  
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
    console.log("[API] Request body:", JSON.stringify(body, null, 2));
    
    // Validate body first
    const { stationId, gameId, customerName, mode, playerCount, customPricePerMatch } = body;
    
    if (typeof stationId !== "number" || stationId < 1 || stationId > 12 || !gameId) {
      console.log("[API] Validation failed - stationId:", stationId, "gameId:", gameId);
      return NextResponse.json(
        { error: "stationId required (1-12) and gameId required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (playerCount !== undefined && playerCount !== 2 && playerCount !== 4) {
      return NextResponse.json(
        { error: "playerCount must be 2 or 4" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (customPricePerMatch !== undefined && customPricePerMatch !== null && typeof customPricePerMatch !== "number") {
      return NextResponse.json(
        { error: "customPricePerMatch must be a number or null" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (mode !== undefined && mode !== "switch") {
      return NextResponse.json(
        { error: "mode must be 'switch' if provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Resolve game
    const game = resolveGame(gameId);
    if (!game) {
      console.log("[API] Game not found for gameId:", gameId);
      return NextResponse.json(
        { error: "Game not found" },
        { status: 400, headers: corsHeaders }
      );
    }
    console.log("[API] Resolved game:", game.label);

    const parsedPlayerCount = playerCount === 4 ? 4 : 2;

    // Do the work
    console.log("[API] Calling startStation...");
    
    if (mode === "switch") {
      const closedSegment = await switchGame(stationId, game, parsedPlayerCount, customPricePerMatch);
      return NextResponse.json(
        { success: true, closedSegment },
        { headers: corsHeaders }
      );
    }

    const safeCustomerName = typeof customerName === 'string' ? customerName.trim() : "";
    await startStation(stationId, game, safeCustomerName, "manual", parsedPlayerCount);
    console.log("[API] startStation completed successfully");

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("[API ERROR] /api/station/start:", error);
    console.error("[API ERROR] Stack:", error instanceof Error ? error.stack : "No stack");
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}
