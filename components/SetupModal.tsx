"use client";

import { useState } from "react";
import { GAMES } from "@/lib/pricing";

interface SetupModalProps {
  stationId: number;
  mode?: "new" | "switch";
  currentCustomerName?: string;
  onStart: (gameId: string, customerName: string) => void;
  onClose: () => void;
}

export default function SetupModal({
  stationId,
  mode = "new",
  currentCustomerName = "",
  onStart,
  onClose,
}: SetupModalProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState(currentCustomerName);

  const isNewMode = mode === "new";
  const selectedGameObj = GAMES.find((g) => g.id === selectedGame) ?? null;

  const handleConfirm = () => {
    if (!selectedGame) return;
    onStart(selectedGame, isNewMode ? customerName : currentCustomerName);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const accentColor = isNewMode ? "#f0c040" : "#44ff88";
  const title = isNewMode
    ? `PS4 #${stationId} — NEW SESSION`
    : `PS4 #${stationId} — SWITCH GAME`;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000cc",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          background: "#0d0d18",
          border: "1px solid #2a2a3a",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "380px",
          width: "100%",
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontFamily: "var(--font-orbitron), sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: accentColor,
            letterSpacing: "2px",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          {title}
        </h2>

        {/* Game grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          {GAMES.map((game) => {
            const isSelected = selectedGame === game.id;
            return (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                style={{
                  background: isSelected ? `${accentColor}14` : "#111",
                  border: `2px solid ${isSelected ? accentColor : "#1a1a2e"}`,
                  borderRadius: "10px",
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#333";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a1a2e";
                }}
              >
                <span style={{ fontSize: "22px" }}>{game.emoji}</span>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      color: isSelected ? accentColor : "#e0e0e0",
                    }}
                  >
                    {game.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
                    {game.mode === "time-match"
                      ? `${game.price} DZD/match`
                      : `${game.price} DZD/hr`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Customer name — new mode only */}
        {isNewMode && (
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                color: "#555",
                marginBottom: "6px",
                letterSpacing: "1px",
              }}
            >
              CUSTOMER NAME (OPTIONAL)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
              placeholder="Enter customer name"
              style={{
                width: "100%",
                background: "#111",
                border: "1px solid #1a1a2e",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#e0e0e0",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.15s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = "#f0c04055";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = "#1a1a2e";
              }}
            />
          </div>
        )}

        {/* Removed Player Count Toggle */}

        {/* Confirm button — always visible, disabled until game selected */}
        <button
          onClick={handleConfirm}
          disabled={!selectedGame}
          style={{
            display: "block",
            width: "100%",
            padding: "14px 0",
            background: selectedGame ? accentColor : "#1a1a1a",
            color: selectedGame ? "#0a0a14" : "#444",
            fontFamily: "var(--font-orbitron), sans-serif",
            fontSize: "13px",
            fontWeight: 900,
            letterSpacing: "2px",
            border: "none",
            borderRadius: "10px",
            cursor: selectedGame ? "pointer" : "not-allowed",
            transition: "background 0.2s, opacity 0.2s",
            opacity: selectedGame ? 1 : 0.5,
          }}
        >
          {selectedGameObj
            ? isNewMode
              ? `▶ START — ${selectedGameObj.label}`
              : `🔄 SWITCH TO ${selectedGameObj.label.toUpperCase()}`
            : isNewMode
            ? "SELECT A GAME TO START"
            : "SELECT A GAME TO SWITCH"}
        </button>
      </div>
    </div>
  );
}
