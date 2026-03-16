import { NextResponse } from "next/server";
import { getAllGames, saveCustomGame, deleteGame, CustomGame } from "@/lib/stationStore";

export async function GET() {
  try {
    const games = getAllGames().filter(g => !g.isTemp);
    return NextResponse.json({ games });
  } catch (error) {
    console.error("GET games error:", error);
    return NextResponse.json({ error: "Failed to get games" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { titleId, titleName, mode, price, matchCycleMinutes } = body;

    if (!titleId || !mode || typeof price !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const game: CustomGame = {
      titleId,
      titleName: titleName || titleId,
      gameId: "unknown", // Using 'unknown' to use generic Game structure or rely directly on price
      mode,
      price,
      matchCycleMinutes: mode === "time-match" ? matchCycleMinutes || 15 : undefined,
      addedAt: new Date().toISOString(),
    };

    saveCustomGame(game);
    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error("POST games error:", error);
    return NextResponse.json({ error: "Failed to save game" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { titleId } = body;

    if (!titleId) {
      return NextResponse.json({ error: "Missing titleId" }, { status: 400 });
    }

    deleteGame(titleId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE games error:", error);
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
  }
}
