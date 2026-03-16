"use client";

import { useState, useEffect } from "react";
import { Session, HistoryStore } from "@/lib/types";
import { GAMES } from "@/lib/pricing";
import BillDisplay from "@/components/BillDisplay";

// Derive a display label for a session (could be multi-game)
function getSessionGameLabel(session: Session): string {
  const segs = session.segments ?? [];
  if (segs.length === 0) return "Unknown";
  const labels = [...new Set(segs.map((s) => s.gameLabel))];
  if (labels.length === 1) return labels[0];
  return labels.join(" + ");
}

// Derive primary emoji for a session
function getSessionEmoji(session: Session): string {
  const segs = session.segments ?? [];
  if (segs.length === 0) return "🎮";
  const firstGame = GAMES.find((g) => g.id === segs[0].gameId);
  return firstGame?.emoji ?? "🎮";
}

export default function Summary() {
  const [history, setHistory] = useState<HistoryStore>({});
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const getDateLabel = (offset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    if (offset === 0) return "Today";
    if (offset === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const getDateString = (offset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    return date.toISOString().split("T")[0];
  };

  const sessions: Session[] = history[selectedDate] ?? [];
  const totalDZD = sessions.reduce((sum, s) => sum + (s.totalBill ?? 0), 0);

  // Per-game breakdown — iterate over all segments of all sessions
  const gameStats = sessions.reduce((acc, session) => {
    const segs = session.segments ?? [];
    for (const seg of segs) {
      if (!acc[seg.gameLabel]) {
        acc[seg.gameLabel] = { count: 0, total: 0, emoji: seg.gameEmoji };
      }
      acc[seg.gameLabel].total += seg.bill ?? 0;
    }
    // Count sessions per unique primary game label
    const label = getSessionGameLabel(session);
    if (!acc[label]) {
      acc[label] = { count: 0, total: 0, emoji: getSessionEmoji(session) };
    }
    acc[label].count++;
    return acc;
  }, {} as Record<string, { count: number; total: number; emoji: string }>);

  const handleClear = async () => {
    if (window.confirm(`Clear all data for ${selectedDate}?`)) {
      try {
        await fetch("/api/history", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedDate }),
        });
        await fetchHistory();
      } catch (error) {
        console.error("Failed to clear history:", error);
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Format selected date nicely for hero
  const heroDateLabel = (() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })();

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>

      {/* ── Hero Card ───────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1500, #0f0f18)",
          border: "1px solid #f0c04033",
          borderRadius: "16px",
          padding: "32px",
          textAlign: "center",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#f0c04088",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Total Earned — {heroDateLabel}
        </div>
        <div
          style={{
            fontFamily: "var(--font-orbitron), sans-serif",
            fontSize: "56px",
            fontWeight: 900,
            color: "#f0c040",
            lineHeight: 1,
          }}
        >
          {totalDZD} <span style={{ fontSize: "24px", opacity: 0.7 }}>DZD</span>
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "#555",
            marginTop: "10px",
          }}
        >
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} · {heroDateLabel}
        </div>
      </div>

      {/* ── Date Tabs ──────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "6px",
          overflowX: "auto",
          marginBottom: "20px",
          paddingBottom: "4px",
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
          const dateStr = getDateString(offset);
          const isActive = dateStr === selectedDate;
          return (
            <button
              key={offset}
              onClick={() => setSelectedDate(dateStr)}
              style={{
                background: isActive ? "#f0c04015" : "#0d0d18",
                border: `1px solid ${isActive ? "#f0c040" : "#1a1a2e"}`,
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 700,
                color: isActive ? "#f0c040" : "#555",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              {getDateLabel(offset)}
            </button>
          );
        })}
      </div>

      {/* ── Per-Game Breakdown (only if data) ────────────── */}
      {Object.keys(gameStats).filter((k) => gameStats[k].total > 0).length > 0 && (
        <div
          style={{
            background: "#0d0d18",
            border: "1px solid #1a1a2e",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#444",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}
          >
            BY GAME
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "10px",
            }}
          >
            {Object.entries(gameStats)
              .filter(([, stats]) => stats.total > 0)
              .map(([gameName, stats]) => (
                <div
                  key={gameName}
                  style={{
                    background: "#0a0a14",
                    border: "1px solid #1a1a2e",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "18px" }}>{stats.emoji}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#e0e0e0" }}>{gameName}</span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-orbitron), sans-serif",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#f0c040",
                    }}
                  >
                    {stats.total} DZD
                  </div>
                  {stats.count > 0 && (
                    <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
                      {stats.count} session{stats.count !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Session Log ────────────────────────────────────── */}
      <div style={{ marginBottom: "8px" }}>
        <span
          style={{
            fontSize: "11px",
            color: "#444",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          SESSION LOG
        </span>
      </div>

      {sessions.length === 0 ? (
        <div
          style={{
            background: "#0d0d18",
            border: "1px solid #1a1a2e",
            borderRadius: "8px",
            padding: "40px",
            textAlign: "center",
            color: "#333",
            fontSize: "14px",
          }}
        >
          No sessions for this date
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[...sessions].reverse().map((session, index) => (
            <div
              key={index}
              style={{
                background: "#0d0d18",
                border: "1px solid #1a1a2e",
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "stretch",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {(() => {
                const totalMatches = (session.segments || []).reduce((acc, seg) => acc + (seg.matches || 0), 0);
                const isMatchBased = totalMatches > 0;
                
                let breakdownMath = "";
                if (isMatchBased) {
                  const pricePerMatch = session.totalBill / totalMatches;
                  breakdownMath = `${totalMatches} ${totalMatches === 1 ? "match" : "matches"} × ${pricePerMatch} DZD = ${session.totalBill} DZD`;
                } else {
                  const hoursBilled = Math.ceil((session.totalElapsed ?? 0) / 3600);
                  const rate = hoursBilled > 0 ? session.totalBill / hoursBilled : 0;
                  breakdownMath = `Per hour · ${rate} DZD/h = ${session.totalBill} DZD`;
                }

                return (
                  <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "20px" }}>{getSessionEmoji(session)}</span>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "#e0e0e0" }}>
                          {getSessionGameLabel(session)}
                        </div>
                        <div style={{ color: "#555", fontSize: "14px" }}>·</div>
                        <div style={{ fontSize: "13px", color: "#aaa" }}>
                          {session.customerName ? `👤 ${session.customerName}` : "—"}
                        </div>
                        <div style={{ color: "#555", fontSize: "14px" }}>·</div>
                        <div style={{ fontSize: "13px", color: "#888" }}>
                          {formatDuration(session.totalElapsed ?? 0)}
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: "#777" }}>
                        {session.time}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0a0a14", padding: "8px 12px", borderRadius: "6px", border: "1px solid #1a1a2e" }}>
                      <div style={{ fontSize: "13px", color: "#f0c040", fontWeight: 700, letterSpacing: "0.5px" }}>
                        {breakdownMath}
                      </div>
                      <span
                        style={{
                          background: session.source === "ps4" ? "#f0c04015" : "#ffffff08",
                          border: `1px solid ${session.source === "ps4" ? "#f0c04044" : "#333"}`,
                          color: session.source === "ps4" ? "#f0c040" : "#555",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          letterSpacing: "1px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {session.source === "ps4" ? "AUTO" : "MANUAL"}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* ── Clear Button ───────────────────────────────────── */}
      {sessions.length > 0 && (
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button
            onClick={handleClear}
            style={{
              padding: "10px 24px",
              background: "#ff444422",
              border: "1px solid #ff4444",
              color: "#ff4444",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "1px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#ff444433"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#ff444422"; }}
          >
            Clear {selectedDate} Data
          </button>
        </div>
      )}
    </div>
  );
}
