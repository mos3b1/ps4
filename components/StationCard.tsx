"use client";

import { useState } from "react";
import { Station } from "@/lib/types";
import { calcBill, calcMatches, calcCycleMinutes } from "@/lib/pricing";
import { useTimer } from "@/context/TimerContext";
import LiveTimer from "./LiveTimer";
import SetupModal from "./SetupModal";

interface StationCardProps {
  station: Station;
  onStartClick: () => void;
}

export default function StationCard({ station, onStartClick }: StationCardProps) {
  const { stopStation, switchGame, pauseStation, resumeStation, settings, setCustomPrice } = useTimer();
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  
  // Unknown Game Resolution State
  const [unknownMode, setUnknownMode] = useState<"time-match" | "hour">("time-match");
  const [unknownPrice, setUnknownPrice] = useState<string>("");
  const [unknownCycleMinutes, setUnknownCycleMinutes] = useState<string>("15");
  const [unknownRemember, setUnknownRemember] = useState(true);
  const [resolving, setResolving] = useState(false);

  // Safe defaults with null checks
  const isRunning = station?.running ?? false;
  const isPaused = station?.paused ?? false;
  const game = station?.currentGame ?? null;
  const segments = station?.segments ?? [];

  const handleStop = () => {
    if (!station?.id) return;
    stopStation(station.id);
  };

  const handleSwitchGame = (gameId: string, _customerName: string) => {
    if (!station?.id) return;
    switchGame(station.id, gameId, 2);
    setShowSwitchModal(false);
  };

  const handlePause = () => {
    if (!station?.id) return;
    pauseStation(station.id);
  };

  const handleResume = () => {
    if (!station?.id) return;
    resumeStation(station.id);
  };

  // Calculate current segment bill and matches with null checks
  const currentBill = game 
    ? calcBill(game, station?.elapsed ?? 0, settings, station?.playerCount, station?.customPricePerMatch ?? null) 
    : 0;
  const currentMatches = game 
    ? calcMatches(game, station?.elapsed ?? 0, settings) 
    : 0;
  const cycleMinutes = game && game.mode === "time-match" 
    ? calcCycleMinutes(game, settings) 
    : 0;

  // Calculate total bill (segments + current) with null checks
  const segmentsBill = segments.reduce((sum, seg) => sum + (seg?.bill ?? 0), 0);
  const totalBill = segmentsBill + currentBill;

  // Format duration helper
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}min`;
  };

  if (!isRunning) {
    // ── IDLE STATE ──────────────────────────────────────────
    return (
      <div
        style={{
          background: "#0d0d18",
          border: "1px solid #1a1a2e",
          borderRadius: "14px",
          padding: "20px",
          minHeight: "180px",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: "12px",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: "var(--font-orbitron), sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "#333",
              letterSpacing: "2px",
            }}
          >
            PS4 #{station?.id ?? "?"}
          </span>
          <span
            style={{
              background: "#111",
              border: "1px solid #222",
              color: "#333",
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "4px",
              letterSpacing: "1px",
              fontWeight: 700,
            }}
          >
            IDLE
          </span>
        </div>

        {/* Icon */}
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            opacity: 0.15,
          }}
        >
          🎮
        </div>

        {/* Start button */}
        <button
          onClick={onStartClick}
          className="btn-gold"
        >
          ▶ START
        </button>
      </div>
    );
  }

  // ── UNKNOWN GAME STATE ────────────────────────────────────
  if (isRunning && station?.unknownGame) {
    const titleName = station.unknownGame.titleName;

    const handleResolve = async () => {
      const priceNum = parseInt(unknownPrice, 10);
      if (isNaN(priceNum) || priceNum <= 0) {
        alert("Please enter a valid price");
        return;
      }
      
      const cycleNum = parseInt(unknownCycleMinutes, 10);
      if (unknownMode === "time-match" && (isNaN(cycleNum) || cycleNum <= 0)) {
        alert("Please enter a valid match duration");
        return;
      }
      
      setResolving(true);
      try {
        await fetch("/api/station/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stationId: station.id,
            mode: unknownMode,
            price: priceNum,
            matchCycleMinutes: unknownMode === "time-match" ? cycleNum : undefined,
            remember: unknownRemember,
          }),
        });
        // The global polling will pick up the resolved state shortly
      } catch (e) {
        console.error("Failed to resolve game", e);
      } finally {
        setResolving(false);
      }
    };

    return (
      <div
        className="animate-fade-in"
        style={{
          background: "#1a0f0f",
          border: "1px solid #ff444455",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-orbitron), sans-serif", fontSize: "12px", fontWeight: 700, color: "#ff4444", letterSpacing: "2px" }}>
            PS4 #{station.id}
          </span>
          <span style={{ background: "#ff444422", border: "1px solid #ff444444", color: "#ff4444", fontSize: "10px", padding: "2px 7px", borderRadius: "3px", letterSpacing: "1px", fontWeight: 700 }}>
            ● LIVE
          </span>
        </div>

        <div style={{ textAlign: "center", margin: "5px 0" }}>
          <div style={{ fontSize: "28px", marginBottom: "4px" }}>❓</div>
          <div style={{ fontWeight: 700, fontSize: "16px", color: "#e0e0e0" }}>{titleName}</div>
          <div style={{ fontSize: "11px", color: "#ff4444", marginTop: "4px", letterSpacing: "1px" }}>NEW GAME — SET PRICE</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#110a0a", padding: "12px", borderRadius: "8px", border: "1px solid #331111" }}>
          <div style={{ fontSize: "11px", color: "#aa6666", letterSpacing: "1px", textAlign: "center", marginBottom: "4px" }}>HOW TO CHARGE?</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setUnknownMode("time-match")}
              style={{ flex: 1, padding: "8px", borderRadius: "6px", border: `1px solid ${unknownMode === "time-match" ? "#44ff88" : "#331111"}`, background: unknownMode === "time-match" ? "#44ff8811" : "#000", color: unknownMode === "time-match" ? "#44ff88" : "#888", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
            >
              ⚽ MATCH<br/><span style={{ fontSize: "10px", fontWeight: 400 }}>per game</span>
            </button>
            <button
              onClick={() => setUnknownMode("hour")}
              style={{ flex: 1, padding: "8px", borderRadius: "6px", border: `1px solid ${unknownMode === "hour" ? "#44ff88" : "#331111"}`, background: unknownMode === "hour" ? "#44ff8811" : "#000", color: unknownMode === "hour" ? "#44ff88" : "#888", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
            >
              ⏱ HOURLY<br/><span style={{ fontSize: "10px", fontWeight: 400 }}>per hour</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
            <span style={{ fontSize: "12px", color: "#aa6666", width: "40px" }}>Price:</span>
            <input 
              type="number" 
              value={unknownPrice} 
              onChange={(e) => setUnknownPrice(e.target.value)}
              placeholder="0"
              style={{ flex: 1, background: "#000", border: "1px solid #331111", borderRadius: "4px", padding: "6px 10px", color: "#fff", fontSize: "14px", outline: "none" }}
            />
            <span style={{ fontSize: "12px", color: "#aa6666" }}>DZD</span>
          </div>

          {unknownMode === "time-match" && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
              <span style={{ fontSize: "12px", color: "#aa6666", width: "40px", lineHeight: 1.1 }}>Match<br/>Time:</span>
              <input 
                type="number" 
                value={unknownCycleMinutes} 
                onChange={(e) => setUnknownCycleMinutes(e.target.value)}
                placeholder="15"
                style={{ flex: 1, background: "#000", border: "1px solid #331111", borderRadius: "4px", padding: "6px 10px", color: "#fff", fontSize: "14px", outline: "none" }}
              />
              <span style={{ fontSize: "12px", color: "#aa6666" }}>mins</span>
            </div>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#aa6666", cursor: "pointer", marginTop: "4px", padding: "4px 0" }}>
            <input 
              type="checkbox" 
              checked={unknownRemember}
              onChange={(e) => setUnknownRemember(e.target.checked)}
              style={{ accentColor: "#44ff88" }}
            />
            Remember this game
          </label>
        </div>

        <button 
          onClick={handleResolve}
          disabled={!unknownPrice || resolving}
          className="btn-green"
          style={{ opacity: (!unknownPrice || resolving) ? 0.5 : 1, cursor: (!unknownPrice || resolving) ? "not-allowed" : "pointer", padding: "12px 0" }}
        >
          {resolving ? "SAVING..." : "✅ START TRACKING"}
        </button>
      </div>
    );
  }

  // ── LIVE STATE ────────────────────────────────────────────
  return (
    <>
      <div
        className={isPaused ? "" : "animate-gold-glow"}
        style={{
          background: isPaused ? "#1a1500" : "#0f0f1c",
          border: isPaused ? "2px solid #f0c040" : "1px solid #f0c04033",
          borderTop: isPaused ? "2px solid #f0c040" : "2px solid #f0c040",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: "var(--font-orbitron), sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "#555",
              letterSpacing: "2px",
            }}
          >
            PS4 #{station?.id ?? "?"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className={isPaused ? "" : "animate-pulse-dot"}
              style={{
                fontSize: "11px",
                color: isPaused ? "#f0c040" : "#44ff88",
                fontWeight: 700,
                letterSpacing: "1px",
              }}
            >
              {isPaused ? "⏸ PAUSED" : "● LIVE"}
            </span>
            <span
              style={{
                background: station?.source === "ps4" ? "#f0c04015" : "#ffffff08",
                border: station?.source === "ps4" ? "1px solid #f0c04044" : "1px solid #333",
                color: station?.source === "ps4" ? "#f0c040" : "#555",
                fontSize: "10px",
                padding: "2px 7px",
                borderRadius: "3px",
                letterSpacing: "1px",
                fontWeight: 700,
              }}
            >
              {station?.source === "ps4" ? "AUTO" : "MANUAL"}
            </span>
          </div>
        </div>

        {/* Game info */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "28px" }}>{game?.emoji || "🎮"}</span>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "15px",
                color: "#e0e0e0",
              }}
            >
              {game?.label || "Unknown"}
            </div>
            {station?.customerName && (
              <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>
                👤 {station.customerName}
              </div>
            )}
          </div>
        </div>

        {/* Current segment info */}
        <div>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <LiveTimer elapsedSeconds={station?.elapsed ?? 0} />
          </div>
          
          {game?.mode === "time-match" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              <div style={{ 
                border: "1px solid #1a1a2e", 
                borderRadius: "8px", 
                padding: "16px", 
                textAlign: "center",
                background: "#0a0a14" 
              }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#fff", letterSpacing: "1px" }}>
                  {currentMatches} {currentMatches === 1 ? "MATCH" : "MATCHES"}
                </div>
                {cycleMinutes > 0 && (
                  <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>
                    1 match ≈ {cycleMinutes} min
                  </div>
                )}
              </div>

              <div style={{ padding: "0 4px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", color: "#888" }}>
                  <span>Price per match:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input 
                      type="number"
                      value={station?.customPricePerMatch ?? (game.id === "pes" ? settings.pes.pricePerMatch : game.id === "fifa" ? settings.fifa.pricePerMatch : game.price)}
                      onChange={(e) => setCustomPrice(station?.id ?? 0, parseInt(e.target.value) || 0)}
                      style={{ 
                        width: "60px", 
                        background: "#000", 
                        border: "1px solid #1a1a2e", 
                        color: "#fff", 
                        padding: "6px 8px", 
                        borderRadius: "4px", 
                        textAlign: "center",
                        fontSize: "14px",
                        outline: "none",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#f0c040"}
                      onBlur={(e) => e.target.style.borderColor = "#1a1a2e"}
                    />
                    <span>DZD</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", color: "#ddd" }}>
                  <span>× {currentMatches} {currentMatches === 1 ? "match" : "matches"} =</span>
                  <span style={{ fontWeight: 800, color: "#f0c040", fontSize: "16px" }}>
                    {currentBill} DZD
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Previous games */}
        {segments.length > 0 && (
          <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: "12px" }}>
            <div style={{ fontSize: "11px", color: "#444", marginBottom: "8px", letterSpacing: "1px" }}>
              ── PREVIOUS GAMES ──
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {segments.map((segment, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "#888",
                  }}
                >
                  <span>{segment?.gameEmoji ?? "🎮"}</span>
                  <span style={{ flex: 1 }}>{segment?.gameLabel ?? "Unknown"}</span>
                  <span>{formatDuration(segment?.elapsed ?? 0)}</span>
                  {segment?.matches > 0 && <span>{segment.matches} match</span>}
                  <span style={{ color: "#f0c040" }}>{segment?.bill ?? 0}DZD</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total bill - Only for hourly games */}
        {game?.mode !== "time-match" && (
          <div
            style={{
              background: "#0a0a14",
              border: "1px solid #f0c04033",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "11px", color: "#555", letterSpacing: "1px" }}>
              TOTAL
            </div>
            <div
              style={{
                fontFamily: "var(--font-orbitron), sans-serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "#f0c040",
              }}
            >
              {totalBill} DZD
            </div>
          </div>
        )}

        {/* Pause info */}
        {isPaused && (
          <div style={{ textAlign: "center", fontSize: "12px", color: "#f0c040" }}>
            ⏸ PAUSED — break time excluded from billing
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {!isPaused ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowSwitchModal(true)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#111",
                  border: "1px solid #2a2a3a",
                  borderRadius: "8px",
                  color: "#e0e0e0",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#f0c040";
                  (e.currentTarget as HTMLButtonElement).style.color = "#f0c040";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a3a";
                  (e.currentTarget as HTMLButtonElement).style.color = "#e0e0e0";
                }}
              >
                🔄 SWITCH GAME
              </button>
              <button
                onClick={handlePause}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#111",
                  border: "1px solid #2a2a3a",
                  borderRadius: "8px",
                  color: "#e0e0e0",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#f0c040";
                  (e.currentTarget as HTMLButtonElement).style.color = "#f0c040";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a3a";
                  (e.currentTarget as HTMLButtonElement).style.color = "#e0e0e0";
                }}
              >
                ⏸ PAUSE
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleResume}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#f0c04015",
                  border: "1px solid #f0c040",
                  borderRadius: "8px",
                  color: "#f0c040",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#f0c04025";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#f0c04015";
                }}
              >
                ▶ RESUME
              </button>
            </div>
          )}
          
          <button onClick={handleStop} className="btn-red">
            ⏹ END &amp; COLLECT
          </button>
        </div>
      </div>

      {/* Switch Game Modal */}
      {showSwitchModal && (
        <SetupModal
          stationId={station?.id ?? 0}
          mode="switch"
          currentCustomerName={station?.customerName ?? ""}
          onStart={handleSwitchGame}
          onClose={() => setShowSwitchModal(false)}
        />
      )}
    </>
  );
}
