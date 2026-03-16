"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTimer } from "@/context/TimerContext";
import { GameSettings } from "@/lib/stationStore";

export default function Settings() {
  const { settings, updateSettings, toast } = useTimer();
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);
  const [showToast, setShowToast] = useState(false);

  // Update local settings when context settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Show success toast when settings are saved
  useEffect(() => {
    if (toast === "✅ Settings saved") {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [toast]);

  const handleInputChange = (
    game: keyof GameSettings,
    field: string,
    value: number
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      [game]: {
        ...prev[game],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    await updateSettings(localSettings);
  };

  const getCycleMinutes = (game: "pes" | "fifa") => {
    const settings = localSettings[game] as { matchDurationMin: number; breakDurationMin: number };
    return settings.matchDurationMin + settings.breakDurationMin;
  };

  const calculateExample = (game: "pes" | "fifa") => {
    const s = localSettings[game];
    const cycleMinutes = s.matchDurationMin + s.breakDurationMin;
    const pricePerMatch = s.pricePerMatch;
    
    // Example: 30 minutes played
    const matches30min = Math.max(1, Math.floor(30 / cycleMinutes));
    const cost30min = matches30min * pricePerMatch;
    
    // Example: 45 minutes played  
    const matches45min = Math.max(1, Math.floor(45 / cycleMinutes));
    const cost45min = matches45min * pricePerMatch;
    
    return {
      cycleMinutes,
      matches30min,
      cost30min,
      matches45min,
      cost45min,
    };
  };

  const pesExample = calculateExample("pes");
  const fifaExample = calculateExample("fifa");

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Back Link */}
      <Link 
        href="/" 
        className="text-[#f0c040] hover:underline mb-4 inline-block"
      >
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 
            className="text-3xl text-white font-bold mb-2"
            style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
          >
            ⚙️ SETTINGS
          </h1>
          <p className="text-gray-500">Prices & match durations</p>
        </div>
        <Link 
          href="/settings/games"
          className="bg-[#111] hover:bg-[#1a1a2e] border border-[#2a2a3a] text-[#f0c040] px-4 py-2 rounded-lg text-sm font-bold tracking-wider transition-colors"
          style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
        >
          🎮 GAME REGISTRY
        </Link>
      </div>

      {/* Match-Based Games */}
      <div className="bg-[#0d0d18] rounded-xl border border-[#1a1a2e] p-6 mb-6">
        <h2 
          className="text-lg text-[#f0c040] font-bold mb-6 pb-2 border-b border-[#1a1a2e]"
          style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
        >
          MATCH-BASED GAMES
        </h2>

        {/* PES */}
        <div className="mb-8">
          <h3 className="text-xl text-white font-semibold mb-4 flex items-center gap-2">
            <span>⚽</span> PES
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-500 text-sm mb-2">
                Price per match
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  value={localSettings.pes.pricePerMatch}
                  onChange={(e) =>
                    handleInputChange("pes", "pricePerMatch", parseInt(e.target.value) || 10)
                  }
                  className="w-full bg-[#0a0a14] border border-[#1a1a2e] rounded-lg px-4 py-2 text-white focus:border-[#f0c040] focus:outline-none"
                />
                <span className="text-gray-500 whitespace-nowrap">DZD</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-500 text-sm mb-2">
                Match duration
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={localSettings.pes.matchDurationMin}
                  onChange={(e) =>
                    handleInputChange("pes", "matchDurationMin", parseInt(e.target.value) || 1)
                  }
                  className="w-full bg-[#0a0a14] border border-[#1a1a2e] rounded-lg px-4 py-2 text-white focus:border-[#f0c040] focus:outline-none"
                />
                <span className="text-gray-500 whitespace-nowrap">min</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-500 text-sm mb-2">
                Break between
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={localSettings.pes.breakDurationMin}
                  onChange={(e) =>
                    handleInputChange("pes", "breakDurationMin", parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-[#0a0a14] border border-[#1a1a2e] rounded-lg px-4 py-2 text-white focus:border-[#f0c040] focus:outline-none"
                />
                <span className="text-gray-500 whitespace-nowrap">min</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Cycle total: <span className="text-[#f0c040] font-semibold">{pesExample.cycleMinutes} min</span>
          </div>
        </div>

        {/* FIFA */}
        <div>
          <h3 className="text-xl text-white font-semibold mb-4 flex items-center gap-2">
            <span>🥅</span> FIFA
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-500 text-sm mb-2">
                Price per match
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  value={localSettings.fifa.pricePerMatch}
                  onChange={(e) =>
                    handleInputChange("fifa", "pricePerMatch", parseInt(e.target.value) || 10)
                  }
                  className="w-full bg-[#0a0a14] border border-[#1a1a2e] rounded-lg px-4 py-2 text-white focus:border-[#f0c040] focus:outline-none"
                />
                <span className="text-gray-500 whitespace-nowrap">DZD</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-500 text-sm mb-2">
                Match duration
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={localSettings.fifa.matchDurationMin}
                  onChange={(e) =>
                    handleInputChange("fifa", "matchDurationMin", parseInt(e.target.value) || 1)
                  }
                  className="w-full bg-[#0a0a14] border border-[#1a1a2e] rounded-lg px-4 py-2 text-white focus:border-[#f0c040] focus:outline-none"
                />
                <span className="text-gray-500 whitespace-nowrap">min</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-500 text-sm mb-2">
                Break between
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={localSettings.fifa.breakDurationMin}
                  onChange={(e) =>
                    handleInputChange("fifa", "breakDurationMin", parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-[#0a0a14] border border-[#1a1a2e] rounded-lg px-4 py-2 text-white focus:border-[#f0c040] focus:outline-none"
                />
                <span className="text-gray-500 whitespace-nowrap">min</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Cycle total: <span className="text-[#f0c040] font-semibold">{fifaExample.cycleMinutes} min</span>
          </div>
        </div>
      </div>

      {/* Hour-Based Games */}
      <div className="bg-[#0d0d18] rounded-xl border border-[#1a1a2e] p-6 mb-6">
        <h2 
          className="text-lg text-[#f0c040] font-bold mb-6 pb-2 border-b border-[#1a1a2e]"
          style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
        >
          HOUR-BASED GAMES
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GTA V */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚗</span>
              <span className="text-white font-medium">GTA V</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 text-sm">Price/hour:</label>
              <input
                type="number"
                min="10"
                value={localSettings.gta.pricePerHour}
                onChange={(e) =>
                  handleInputChange("gta", "pricePerHour", parseInt(e.target.value) || 10)
                }
                className="w-24 bg-[#0a0a14] border border-[#1a1a2e] rounded-lg px-3 py-2 text-white text-center focus:border-[#f0c040] focus:outline-none"
              />
              <span className="text-gray-500">DZD</span>
            </div>
          </div>

          {/* Call of Duty */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔫</span>
              <span className="text-white font-medium">Call of Duty</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 text-sm">Price/hour:</label>
              <input
                type="number"
                min="10"
                value={localSettings.cod.pricePerHour}
                onChange={(e) =>
                  handleInputChange("cod", "pricePerHour", parseInt(e.target.value) || 10)
                }
                className="w-24 bg-[#0a0a14] border border-[#1a1a2e] rounded-lg px-3 py-2 text-white text-center focus:border-[#f0c040] focus:outline-none"
              />
              <span className="text-gray-500">DZD</span>
            </div>
          </div>

          {/* Mortal Kombat */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥊</span>
              <span className="text-white font-medium">Mortal Kombat</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 text-sm">Price/hour:</label>
              <input
                type="number"
                min="10"
                value={localSettings.mk.pricePerHour}
                onChange={(e) =>
                  handleInputChange("mk", "pricePerHour", parseInt(e.target.value) || 10)
                }
                className="w-24 bg-[#0a0a14] border border-[#1a1a2e] rounded-lg px-3 py-2 text-white text-center focus:border-[#f0c040] focus:outline-none"
              />
              <span className="text-gray-500">DZD</span>
            </div>
          </div>

          {/* Other */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <span className="text-white font-medium">Other</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 text-sm">Price/hour:</label>
              <input
                type="number"
                min="10"
                value={localSettings.other.pricePerHour}
                onChange={(e) =>
                  handleInputChange("other", "pricePerHour", parseInt(e.target.value) || 10)
                }
                className="w-24 bg-[#0a0a14] border border-[#1a1a2e] rounded-lg px-3 py-2 text-white text-center focus:border-[#f0c040] focus:outline-none"
              />
              <span className="text-gray-500">DZD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleSave}
          className="px-12 py-4 bg-[#f0c040] hover:bg-[#f0c040cc] text-[#0a0a14] font-bold rounded-lg transition-all transform hover:scale-105"
          style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
        >
          💾 SAVE SETTINGS
        </button>
      </div>

      {/* How Billing Works */}
      <div className="bg-[#0d0d18] rounded-xl border border-[#1a1a2e] p-6">
        <h2 
          className="text-lg text-[#f0c040] font-bold mb-4"
          style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
        >
          HOW BILLING WORKS
        </h2>

        <div className="space-y-4 text-gray-400">
          <div className="bg-[#0a0a14] rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">⚽ PES Example:</h4>
            <p className="mb-1">
              {localSettings.pes.matchDurationMin}min match + {localSettings.pes.breakDurationMin}min break = {pesExample.cycleMinutes}min cycle
            </p>
            <p className="mb-1">
              30min played = {pesExample.matches30min} {pesExample.matches30min === 1 ? 'match' : 'matches'} = {pesExample.cost30min} DZD
            </p>
            <p>
              45min played = {pesExample.matches45min} {pesExample.matches45min === 1 ? 'match' : 'matches'} = {pesExample.cost45min} DZD
            </p>
          </div>

          <div className="bg-[#0a0a14] rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">🥅 FIFA Example:</h4>
            <p className="mb-1">
              {localSettings.fifa.matchDurationMin}min match + {localSettings.fifa.breakDurationMin}min break = {fifaExample.cycleMinutes}min cycle
            </p>
            <p className="mb-1">
              30min played = {fifaExample.matches30min} {fifaExample.matches30min === 1 ? 'match' : 'matches'} = {fifaExample.cost30min} DZD
            </p>
            <p>
              45min played = {fifaExample.matches45min} {fifaExample.matches45min === 1 ? 'match' : 'matches'} = {fifaExample.cost45min} DZD
            </p>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-[#0d0d18] border border-[#44ff88] text-[#44ff88] px-6 py-3 rounded-lg shadow-lg">
            <span className="font-semibold">✅ Settings saved</span>
          </div>
        </div>
      )}
    </div>
  );
}
