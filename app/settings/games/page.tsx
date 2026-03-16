"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CustomGame } from "@/lib/stationStore";

export default function GamesRegistry() {
  const [games, setGames] = useState<CustomGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch("/api/games");
      const data = await res.json();
      if (data.games) {
        setGames(data.games);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (titleId: string) => {
    if (!window.confirm("Delete this game from the registry? Stations currently playing it might break.")) return;
    
    try {
      await fetch("/api/games", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId })
      });
      fetchGames();
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-GB", { 
      day: "numeric", month: "short", year: "numeric" 
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Back Link */}
      <Link 
        href="/settings" 
        className="text-[#f0c040] hover:underline mb-4 inline-block"
      >
        ← Back to Settings
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 
          className="text-3xl text-white font-bold mb-2"
          style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
        >
          🎮 GAME REGISTRY
        </h1>
        <p className="text-gray-500">All custom games detected from PS4s</p>
      </div>

      <div className="bg-[#0d0d18] rounded-xl border border-[#1a1a2e] p-6 mb-6">
        {loading ? (
          <div className="text-[#888] text-center py-8">Loading registry...</div>
        ) : games.length === 0 ? (
          <div className="text-[#888] text-center py-8">
            <div className="text-4xl mb-4">🎮</div>
            <div>No custom games detected yet.</div>
            <div className="text-xs text-[#555] mt-2">When a PS4 launches an unknown game, it will appear here.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {games.map((game, idx) => (
              <div 
                key={game.titleId} 
                className="flex items-center justify-between bg-[#111] border border-[#2a2a3a] p-4 rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-bold text-white">{game.titleName}</span>
                    <span className="text-[10px] bg-[#333] text-[#aaa] tracking-wider px-2 py-0.5 rounded-sm font-mono">
                      {game.titleId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {game.mode === "time-match" ? (
                      <span className="text-[#44ff88]">⚽ Match</span>
                    ) : (
                      <span className="text-[#f0c040]">⏱ Hour</span>
                    )}
                    <span className="text-[#555]">•</span>
                    <span className="text-[#ccc]">
                      {game.price} DZD / {game.mode === "time-match" ? "match" : "hour"}
                    </span>
                    <span className="text-[#555]">•</span>
                    <span className="text-[#888] text-xs">Added {formatDate(game.addedAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDelete(game.titleId)}
                    className="px-3 py-1.5 bg-[#ff444415] hover:bg-[#ff444433] text-[#ff4444] border border-[#ff444444] rounded text-xs font-bold tracking-wider transition-colors"
                  >
                    🗑 DEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#1a1a2e] rounded-xl p-6 text-sm text-[#888]">
        <h3 className="text-[#e0e0e0] font-bold mb-2 uppercase tracking-wide">How it works</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>When a PS4 launches a game that isn't built-in (like PES/FIFA/GTA), it stays in an <strong>Unknown Game</strong> state.</li>
          <li>You will see a "Set Price" prompt on the dashboard for that station.</li>
          <li>Once you set the price and check "Remember this game", it gets saved to this registry.</li>
          <li>Future launches of that same game will automatically use your saved price and billing mode.</li>
        </ul>
      </div>
    </div>
  );
}
