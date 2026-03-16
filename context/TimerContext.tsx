"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Station } from "@/lib/types";
import { GameSettings, DEFAULT_SETTINGS } from "@/lib/stationStore";

interface TimerContextType {
  stations: Station[];
  stationsCount: number;
  setStationsCount: (n: number) => void;
  startStation: (id: number, gameId: string, customerName: string, playerCount?: 2 | 4) => Promise<void>;
  stopStation: (id: number) => Promise<void>;
  switchGame: (id: number, gameId: string, playerCount?: 2 | 4) => Promise<void>;
  pauseStation: (id: number) => Promise<void>;
  resumeStation: (id: number) => Promise<void>;
  toast: string;
  refreshStations: () => Promise<void>;
  settings: GameSettings;
  updateSettings: (partial: Partial<GameSettings>) => Promise<void>;
  setCustomPrice: (stationId: number, price: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsCount, setStationsCount] = useState(4);
  const [toast, setToast] = useState("");
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [customPrices, setCustomPrices] = useState<Record<number, number>>({});

  const setCustomPrice = useCallback((stationId: number, price: number) => {
    setCustomPrices((prev) => ({ ...prev, [stationId]: price }));
  }, []);

  const refreshStations = useCallback(async () => {
    try {
      const response = await fetch("/api/station/status");
      const data = await response.json();
      if (data.stations) {
        setStations(data.stations);
        setStationsCount(data.stations.length);
      }
    } catch (error) {
      console.error("Failed to refresh stations:", error);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  }, []);

  const updateSettings = useCallback(async (partial: Partial<GameSettings>) => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
          setToast("✅ Settings saved");
          setTimeout(() => setToast(""), 3000);
        }
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      setToast("❌ Failed to save settings");
      setTimeout(() => setToast(""), 3000);
    }
  }, []);

  const startStation = useCallback(async (id: number, gameId: string, customerName: string, playerCount?: 2 | 4) => {
    try {
      const response = await fetch("/api/station/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: id, gameId, customerName, playerCount }),
      });
      
      if (response.ok) {
        await refreshStations();
      }
    } catch (error) {
      console.error("Failed to start station:", error);
    }
  }, [refreshStations]);

  const stopStation = useCallback(async (id: number) => {
    try {
      const response = await fetch("/api/station/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stationId: id,
          customPricePerMatch: customPrices[id]
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const station = stations.find(s => s.id === id);
        const customerName = station?.customerName || "Customer";
        
        // Show toast with total amount collected
        setToast(`💰 Station #${id} — ${data.totalBill} DZD collected (${customerName})`);
        
        // Auto-clear toast after 3 seconds
        setTimeout(() => {
          setToast("");
        }, 3000);
        
        // Reset custom price when session ends
        setCustomPrices(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        
        await refreshStations();
      }
    } catch (error) {
      console.error("Failed to stop station:", error);
    }
  }, [stations, refreshStations, customPrices]);

  const switchGame = useCallback(async (id: number, gameId: string, playerCount?: 2 | 4) => {
    try {
      const response = await fetch("/api/station/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stationId: id, 
          gameId, 
          mode: "switch", 
          playerCount,
          customPricePerMatch: customPrices[id]
        }),
      });
      
      if (response.ok) {
        await refreshStations();
      }
    } catch (error) {
      console.error("Failed to switch game:", error);
    }
  }, [refreshStations, customPrices]);

  const pauseStation = useCallback(async (id: number) => {
    try {
      const response = await fetch("/api/station/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: id }),
      });
      
      if (response.ok) {
        await refreshStations();
      }
    } catch (error) {
      console.error("Failed to pause station:", error);
    }
  }, [refreshStations]);

  const resumeStation = useCallback(async (id: number) => {
    try {
      const response = await fetch("/api/station/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: id }),
      });
      
      if (response.ok) {
        await refreshStations();
      }
    } catch (error) {
      console.error("Failed to resume station:", error);
    }
  }, [refreshStations]);

  // Poll for station status every 4 seconds
  useEffect(() => {
    refreshStations();
    fetchSettings();
    
    const interval = setInterval(() => {
      refreshStations();
    }, 4000);
    
    return () => clearInterval(interval);
  }, [refreshStations, fetchSettings]);

  const updateStationsCount = useCallback(async (n: number) => {
    const clamped = Math.max(1, Math.min(12, n));
    setStationsCount(clamped);
    // The server will handle the actual count update
    await refreshStations();
  }, [refreshStations]);

  const enrichedStations = React.useMemo(() => {
    return stations.map(s => ({
      ...s,
      customPricePerMatch: customPrices[s.id] ?? null
    }));
  }, [stations, customPrices]);

  return (
    <TimerContext.Provider
      value={{
        stations: enrichedStations,
        stationsCount,
        setStationsCount: updateStationsCount,
        startStation,
        stopStation,
        switchGame,
        pauseStation,
        resumeStation,
        toast,
        refreshStations,
        settings,
        updateSettings,
        setCustomPrice,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
