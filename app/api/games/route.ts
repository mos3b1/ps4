import { NextResponse } from "next/server";
import { getAllGames, saveCustomGame, deleteGame, CustomGame } from "@/lib/stationStore";

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
    const games = (await getAllGames()).filter((g: CustomGame) => !g.isTemp);
    return NextResponse.json({ games }, { headers: corsHeaders });

  } catch (error) {
    console.error("[API ERROR] /api/games GET:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate body first
    const { titleId, titleName, mode, price, matchCycleMinutes } = body;
    
    if (!titleId || !mode || typeof price !== "number") {
      return NextResponse.json(
        { error: "titleId, mode, and price required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Do the work
    const game: CustomGame = {
      titleId,
      titleName: titleName || titleId,
      gameId: "unknown",
      mode,
      price,
      matchCycleMinutes: mode === "time-match" ? matchCycleMinutes || 15 : undefined,
      addedAt: new Date().toISOString(),
    };

    await saveCustomGame(game);
    return NextResponse.json({ success: true, game }, { headers: corsHeaders });

  } catch (error) {
    console.error("[API ERROR] /api/games POST:", error);
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
    const { titleId } = body;
    
    if (!titleId) {
      return NextResponse.json(
        { error: "titleId required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Do the work
    await deleteGame(titleId);
    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    console.error("[API ERROR] /api/games DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
