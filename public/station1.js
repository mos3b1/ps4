/**
 * PS4 Auto-Tracker Client Script
 * Run this on the PS4 via browser exploit / payload
 * Connects to the local Next.js server to report game starts/stops
 */

// Configuration
const STATION_ID = 1; 
const APP_URL = "http://192.168.1.100:3000"; // Replace with actual server IP

// State tracking
let lastKnownGameId = null;

// Read real game name from PS4 WebKit/Orbis API:
function getGameInfo() {
  try {
    // These APIs are typically available in the loaded PS4 WebKit exploit environment
    const titleId = ortys?.getCurrentAppTitleId?.() || document.titleId || null;
    
    // Try to get real name
    const titleName = ortys?.getCurrentAppTitleName?.()
      || ortys?.getAppParam?.(titleId, "TITLE")
      || titleId  // fallback to titleId if name unavailable
      || null;
      
    return titleId ? { titleId, titleName } : null;
  } catch(e) {
    console.error("Failed to read PS4 Game Info", e);
    return null;
  }
}

// Send both titleId AND titleName to app:
async function sendPing(event, gameInfo) {
  try {
    await fetch(`${APP_URL}/api/ps4/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationId: STATION_ID,
        event,
        titleId: gameInfo?.titleId || "",
        titleName: gameInfo?.titleName || "Unknown PS4 Game"
      })
    });
  } catch(err) {
    // Silently ignore ping network errors so PS4 browser doesn't block
  }
}

// Main polling loop
function pollPS4Status() {
  const gameInfo = getGameInfo();
  
  if (gameInfo && gameInfo.titleId) {
    if (lastKnownGameId !== gameInfo.titleId) {
      console.log(`PS4 Game Started: ${gameInfo.titleName} (${gameInfo.titleId})`);
      sendPing("start", gameInfo);
      lastKnownGameId = gameInfo.titleId;
    }
  } else {
    // If we suddenly read no game, but we used to have one, it stopped
    if (lastKnownGameId !== null) {
      console.log(`PS4 Game Stopped: ${lastKnownGameId}`);
      sendPing("stop", { titleId: lastKnownGameId, titleName: "" });
      lastKnownGameId = null;
    }
  }
}

// Start polling every 5 seconds
console.log("PS4 Tracker active for Station #" + STATION_ID);
setInterval(pollPS4Status, 5000);
