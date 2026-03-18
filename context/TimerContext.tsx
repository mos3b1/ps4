"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Station } from "@/lib/types";
import { GameSettings, DEFAULT_SETTINGS } from "@/lib/pricing";

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
  isLoading: boolean;
  error: string | null;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsCount, setStationsCount] = useState(4);
  const [toast, setToast] = useState("");
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [customPrices, setCustomPrices] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCustomPrice = useCallback((stationId: number, price: number) => {
    setCustomPrices((prev) => ({ ...prev, [stationId]: price }));
  }, []);

  const showToast = useCallback((message: string, duration = 3000) => {
    setToast(message);
    setTimeout(() => setToast(""), duration);
  }, []);

  const refreshStations = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/station/status");
      const data = await response.json();
      if (data.stations) {
        setStations(data.stations);
        setStationsCount(data.stations.length);
      }
    } catch (error) {
      console.error("[TimerContext] Failed to refresh stations:", error);
      setError("Failed to load stations");
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("[TimerContext] Failed to fetch settings:", error);
      setError("Failed to load settings");
    }
  }, []);

  const updateSettings = useCallback(async (partial: Partial<GameSettings>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      
      const isJson = response.headers.get("content-type")?.includes("application/json");
      
      if (response.ok && isJson) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
          showToast("✅ Settings saved");
        }
      } else {
        const errorData = isJson ? await response.json() : { error: `Server error: ${response.status}` };
        showToast(`❌ ${errorData.error || "Failed to save settings"}`);
      }
    } catch (error) {
      console.error("[TimerContext] Failed to update settings:", error);
      showToast("❌ Failed to save settings");
      setError("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const startStation = useCallback(async (id: number, gameId: string, customerName: string, playerCount?: 2 | 4) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/station/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: id, gameId, customerName, playerCount }),
      });
      
      const isJson = response.headers.get("content-type")?.includes("application/json");
      
      if (response.ok) {
        await refreshStations();
        showToast(`✅ Station #${id} started`);
      } else {
        const errorData = isJson ? await response.json() : { error: `Server error: ${response.status}` };
        showToast(`❌ ${errorData.error || "Failed to start station"}`);
      }
    } catch (error) {
      console.error("[TimerContext] Failed to start station:", error);
      showToast("❌ Failed to start station");
      setError("Failed to start station");
    } finally {
      setIsLoading(false);
    }
  }, [refreshStations, showToast]);

  const stopStation = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/station/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stationId: id,
          customPricePerMatch: customPrices[id]
        }),
      });
      
      const isJson = response.headers.get("content-type")?.includes("application/json");
      
      if (response.ok && isJson) {
        const data = await response.json();
        const station = stations.find(s => s.id === id);
        const customerName = station?.customerName || "Customer";
        
        showToast(`💰 Station #${id} — ${data.totalBill} DZD collected (${customerName})`, 5000);
        
        // Reset custom price when session ends
        setCustomPrices(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        
        await refreshStations();
      } else {
        const errorData = isJson ? await response.json() : { error: `Server error: ${response.status}` };
        showToast(`❌ ${errorData.error || "Failed to stop station"}`);
      }
    } catch (error) {
      console.error("[TimerContext] Failed to stop station:", error);
      showToast("❌ Failed to stop station");
      setError("Failed to stop station");
    } finally {
      setIsLoading(false);
    }
  }, [stations, refreshStations, customPrices, showToast]);

  const switchGame = useCallback(async (id: number, gameId: string, playerCount?: 2 | 4) => {
    try {
      setIsLoading(true);
      setError(null);
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
      
      const isJson = response.headers.get("content-type")?.includes("application/json");
      
      if (response.ok) {
        await refreshStations();
        showToast(`🔄 Game switched on Station #${id}`);
      } else {
        const errorData = isJson ? await response.json() : { error: `Server error: ${response.status}` };
        showToast(`❌ ${errorData.error || "Failed to switch game"}`);
      }
    } catch (error) {
      console.error("[TimerContext] Failed to switch game:", error);
      showToast("❌ Failed to switch game");
      setError("Failed to switch game");
    } finally {
      setIsLoading(false);
    }
  }, [refreshStations, customPrices, showToast]);

  const pauseStation = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/station/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: id }),
      });
      
      const isJson = response.headers.get("content-type")?.includes("application/json");
      
      if (response.ok) {
        await refreshStations();
        showToast(`⏸ Station #${id} paused`);
      } else {
        const errorData = isJson ? await response.json() : { error: `Server error: ${response.status}` };
        showToast(`❌ ${errorData.error || "Failed to pause"}`);
      }
    } catch (error) {
      console.error("[TimerContext] Failed to pause station:", error);
      showToast("❌ Failed to pause");
      setError("Failed to pause station");
    } finally {
      setIsLoading(false);
    }
  }, [refreshStations, showToast]);

  const resumeStation = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/station/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: id }),
      });
      
      const isJson = response.headers.get("content-type")?.includes("application/json");
      
      if (response.ok) {
        await refreshStations();
        showToast(`▶ Station #${id} resumed`);
      } else {
        const errorData = isJson ? await response.json() : { error: `Server error: ${response.status}` };
        showToast(`❌ ${errorData.error || "Failed to resume"}`);
      }
    } catch (error) {
      console.error("[TimerContext] Failed to resume station:", error);
      showToast("❌ Failed to resume");
      setError("Failed to resume station");
    } finally {
      setIsLoading(false);
    }
  }, [refreshStations, showToast]);

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
        isLoading,
        error,
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
