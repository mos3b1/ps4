"use client";

import { useState } from "react";
import { useTimer } from "@/context/TimerContext";
import StationCard from "@/components/StationCard";
import SetupModal from "@/components/SetupModal";

export default function Dashboard() {
  const { stations, stationsCount, setStationsCount, startStation } = useTimer();
  const [modalStationId, setModalStationId] = useState<number | null>(null);

  const handleIncrement = () => {
    if (stationsCount < 12) {
      const newCount = stationsCount + 1;
      setStationsCount(newCount);
    }
  };

  const handleDecrement = () => {
    if (stationsCount > 1) {
      const newCount = stationsCount - 1;
      setStationsCount(newCount);
    }
  };

  const handleStartClick = (stationId: number) => {
    setModalStationId(stationId);
  };

  const handleStartSession = (gameId: string, customerName: string) => {
    if (modalStationId !== null) {
      startStation(modalStationId, gameId, customerName, 2);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-orbitron), sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#444",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          STATIONS
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleDecrement}
            disabled={stationsCount <= 1}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#0d0d18",
              border: "1px solid #1a1a2e",
              color: "#e0e0e0",
              fontSize: "18px",
              cursor: stationsCount <= 1 ? "not-allowed" : "pointer",
              opacity: stationsCount <= 1 ? 0.4 : 1,
              transition: "border-color 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              if (stationsCount > 1) (e.currentTarget as HTMLButtonElement).style.borderColor = "#f0c040";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a1a2e";
            }}
          >
            −
          </button>
          <span
            style={{
              fontFamily: "var(--font-orbitron), sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "#f0c040",
              minWidth: "2.5rem",
              textAlign: "center",
            }}
          >
            {stationsCount}
          </span>
          <button
            onClick={handleIncrement}
            disabled={stationsCount >= 12}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#0d0d18",
              border: "1px solid #1a1a2e",
              color: "#e0e0e0",
              fontSize: "18px",
              cursor: stationsCount >= 12 ? "not-allowed" : "pointer",
              opacity: stationsCount >= 12 ? 0.4 : 1,
              transition: "border-color 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              if (stationsCount < 12) (e.currentTarget as HTMLButtonElement).style.borderColor = "#f0c040";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a1a2e";
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Station Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        {Array.from({ length: stationsCount }, (_, i) => i + 1).map((stationId) => {
          const station = stations.find(s => s.id === stationId) || {
            id: stationId,
            running: false,
            paused: false,
            pausedAt: null,
            totalPausedSeconds: 0,
            currentGame: null,
            sessionStartEpoch: null,
            currentSegmentStart: null,
            elapsed: 0,
            totalElapsed: 0,
            customerName: "",
            source: "manual" as const,
            segments: [],
            unknownGame: null,
          };

          return (
            <StationCard
              key={stationId}
              station={station}
              onStartClick={() => handleStartClick(stationId)}
            />
          );
        })}
      </div>

      {/* Setup Modal */}
      {modalStationId !== null && (
        <SetupModal
          stationId={modalStationId}
          onStart={handleStartSession}
          onClose={() => setModalStationId(null)}
        />
      )}
    </div>
  );
}
