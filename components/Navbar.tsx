"use client";

import { useTimer } from "@/context/TimerContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { stations } = useTimer();
  const pathname = usePathname();
  const [todayEarnings, setTodayEarnings] = useState(0);

  const activeStations = stations.filter(s => s.running).length;
  const totalStations = stations.length;

  // Fetch today's earnings from history API
  useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (data.history) {
          const today = new Date().toISOString().split("T")[0];
          const sessions = data.history[today] || [];
          const total = sessions.reduce((sum: number, s: { totalBill: number }) => sum + (s.totalBill ?? 0), 0);
          setTodayEarnings(total);
        }
      } catch {}
    };
    fetchToday();
    const interval = setInterval(fetchToday, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "#0a0a14",
        borderBottom: "1px solid #1a1a2e",
      }}
    >
      {/* Top row — brand + stats */}
      <div
        style={{
          height: "64px",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🎮</span>
          <span
            style={{
              fontFamily: "var(--font-orbitron), sans-serif",
              fontSize: "18px",
              fontWeight: 900,
              color: "#f0c040",
              letterSpacing: "3px",
            }}
          >
            GAME STORE
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {/* Today earnings */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontFamily: "var(--font-orbitron), sans-serif",
                fontSize: "20px",
                fontWeight: 700,
                color: "#f0c040",
                lineHeight: 1,
              }}
            >
              {todayEarnings}
            </span>
            <span style={{ fontSize: "11px", color: "#888", letterSpacing: "1px" }}>
              DZD today
            </span>
          </div>

          {/* Active counter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: activeStations > 0 ? "#44ff88" : "#333",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: activeStations > 0 ? "#44ff88" : "#333",
              }}
            >
              {activeStations}/{totalStations} active
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row — nav links */}
      <div
        style={{
          height: "36px",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          borderTop: "1px solid #0f0f1c",
        }}
      >
        {[
          { href: "/", label: "Dashboard" },
          { href: "/summary", label: "Summary" },
          { href: "/settings", label: "⚙️ Settings" },
        ].map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: "0 14px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: isActive ? "#f0c040" : "#555",
                borderBottom: isActive ? "2px solid #f0c040" : "2px solid transparent",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
