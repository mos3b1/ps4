// ============================================
// FULL SCENARIO TEST SUITE — PS4 Game Store
// Run in browser console on http://localhost:3000
// ============================================

const BASE = "http://localhost:3000";
const delay = ms => new Promise(r => setTimeout(r, ms));

async function post(url, body) {
  const r = await fetch(BASE + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.json();
}

async function get(url) {
  const r = await fetch(BASE + url);
  return r.json();
}

async function runAllTests() {
  console.log("=== STARTING FULL TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  function check(name, condition, got) {
    if (condition) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.error(`❌ ${name} — got:`, got);
      failed++;
    }
  }

  // ── TEST 1: Status returns all stations ──
  console.log("\n── TEST 1: Station Status ──");
  const status = await get("/api/station/status");
  check("Status returns stations array", Array.isArray(status.stations), status);
  check("Has at least 4 stations", status.stations.length >= 4, status.stations.length);
  check("Station has segments array", Array.isArray(status.stations[0]?.segments), status.stations[0]);

  // ── TEST 2: Manual start ──
  console.log("\n── TEST 2: Manual Start ──");
  const start = await post("/api/station/start", { stationId: 1, gameId: "pes", customerName: "TestCustomer" });
  check("Manual start success", start.success === true, start);
  await delay(1000);
  const s1 = await get("/api/station/status");
  const station1 = s1.stations.find(s => s.id === 1);
  check("Station 1 is running", station1?.running === true, station1);
  check("Station 1 game is PES", station1?.currentGame?.id === "pes", station1?.currentGame);
  check("Station 1 source is manual", station1?.source === "manual", station1?.source);
  check("Station 1 elapsed > 0", station1?.elapsed > 0, station1?.elapsed);

  // ── TEST 3: PS4 Auto start ──
  console.log("\n── TEST 3: PS4 Auto Start ──");
  const ping = await post("/api/ps4/ping", { stationId: 2, event: "start", titleId: "CUSA00625" });
  check("PS4 ping received", ping.received === true, ping);
  await delay(1000);
  const s2 = await get("/api/station/status");
  const station2 = s2.stations.find(s => s.id === 2);
  check("Station 2 is running", station2?.running === true, station2);
  check("Station 2 game is GTA", station2?.currentGame?.id === "gta", station2?.currentGame);
  check("Station 2 source is ps4", station2?.source === "ps4", station2?.source);

  // ── TEST 4: Switch game ──
  console.log("\n── TEST 4: Switch Game ──");
  await delay(2000);
  const sw = await post("/api/station/switch", { stationId: 1, gameId: "fifa" });
  check("Switch game success", sw.success === true, sw);
  await delay(500);
  const s3 = await get("/api/station/status");
  const station1after = s3.stations.find(s => s.id === 1);
  check("Station 1 now plays FIFA", station1after?.currentGame?.id === "fifa", station1after?.currentGame);
  check("Station 1 has 1 segment (PES)", station1after?.segments?.length === 1, station1after?.segments?.length);
  check("Previous segment is PES", station1after?.segments?.[0]?.gameId === "pes", station1after?.segments?.[0]);

  // ── TEST 5: Pause and resume ──
  console.log("\n── TEST 5: Pause & Resume ──");
  const pause = await post("/api/station/pause", { stationId: 1 });
  check("Pause success", pause.success === true, pause);
  await delay(500);
  const s4 = await get("/api/station/status");
  const pausedStation = s4.stations.find(s => s.id === 1);
  check("Station 1 is paused", pausedStation?.paused === true, pausedStation?.paused);
  const elapsedWhenPaused = pausedStation?.elapsed;
  await delay(2000); // elapsed should NOT increase while paused
  const s5 = await get("/api/station/status");
  const stillPaused = s5.stations.find(s => s.id === 1);
  check("Elapsed frozen while paused", stillPaused?.elapsed === elapsedWhenPaused, { before: elapsedWhenPaused, after: stillPaused?.elapsed });
  const resume = await post("/api/station/resume", { stationId: 1 });
  check("Resume success", resume.success === true, resume);
  await delay(1000);
  const s6 = await get("/api/station/status");
  const resumedStation = s6.stations.find(s => s.id === 1);
  check("Station 1 resumed running", resumedStation?.paused === false, resumedStation?.paused);
  check("Elapsed continues after resume", resumedStation?.elapsed > elapsedWhenPaused, { before: elapsedWhenPaused, after: resumedStation?.elapsed });

  // ── TEST 6: Bill calculation ──
  console.log("\n── TEST 6: Bill Calculation ──");
  await post("/api/station/start", { stationId: 3, gameId: "gta", customerName: "BillTest" });
  await delay(1000);
  const s7 = await get("/api/station/status");
  const gtaStation = s7.stations.find(s => s.id === 3);
  check("GTA V bill is 100 DZD (first hour)", gtaStation?.totalBill >= 100, gtaStation?.totalBill);

  // ── TEST 7: End & collect ──
  console.log("\n── TEST 7: End & Collect ──");
  const histBefore = await get("/api/history");
  const countBefore = Object.values(histBefore.history ?? {}).flat().length;
  const stop1 = await post("/api/station/stop", { stationId: 1 });
  check("Stop station 1 success", stop1.success === true, stop1);
  check("Stop returns bill", stop1.bill > 0, stop1.bill);
  check("Stop returns elapsed", stop1.elapsed > 0, stop1.elapsed);
  await delay(500);
  const s8 = await get("/api/station/status");
  const stoppedStation = s8.stations.find(s => s.id === 1);
  check("Station 1 back to idle", stoppedStation?.running === false, stoppedStation?.running);
  check("Station 1 segments cleared", stoppedStation?.segments?.length === 0, stoppedStation?.segments?.length);
  const histAfter = await get("/api/history");
  const countAfter = Object.values(histAfter.history ?? {}).flat().length;
  check("Session saved to history", countAfter > countBefore, { before: countBefore, after: countAfter });

  // ── TEST 8: PS4 game switch auto ──
  console.log("\n── TEST 8: PS4 Auto Switch ──");
  await post("/api/ps4/ping", { stationId: 4, event: "start", titleId: "CUSA00408" }); // PES
  await delay(1000);
  await post("/api/ps4/ping", { stationId: 4, event: "start", titleId: "CUSA00327" }); // FIFA
  await delay(500);
  const s9 = await get("/api/station/status");
  const autoSwitch = s9.stations.find(s => s.id === 4);
  check("Station 4 switched to FIFA", autoSwitch?.currentGame?.id === "fifa", autoSwitch?.currentGame);
  check("Station 4 has PES segment saved", autoSwitch?.segments?.length >= 1, autoSwitch?.segments?.length);

  // ── TEST 9: PS4 auto stop (saves to history) ──
  console.log("\n── TEST 9: PS4 Auto Stop ──");
  const histBeforePs4Stop = await get("/api/history");
  const countBeforePs4Stop = Object.values(histBeforePs4Stop.history ?? {}).flat().length;
  const pingStop = await post("/api/ps4/ping", { stationId: 2, event: "stop", titleId: "CUSA00625" });
  check("PS4 stop ping received", pingStop.received === true, pingStop);
  await delay(500);
  const s10 = await get("/api/station/status");
  const autoStopped = s10.stations.find(s => s.id === 2);
  check("Station 2 back to idle after PS4 stop", autoStopped?.running === false, autoStopped?.running);
  const histAfterPs4Stop = await get("/api/history");
  const countAfterPs4Stop = Object.values(histAfterPs4Stop.history ?? {}).flat().length;
  check("PS4 session saved to history on auto-stop", countAfterPs4Stop > countBeforePs4Stop, { before: countBeforePs4Stop, after: countAfterPs4Stop });

  // ── TEST 10: Settings ──
  console.log("\n── TEST 10: Settings ──");
  const settings = await get("/api/settings");
  check("Settings returns data", settings.settings !== undefined, settings);
  check("PES price exists", settings.settings?.pes?.pricePerMatch > 0, settings.settings?.pes);
  const updateSettings = await post("/api/settings", { pes: { pricePerMatch: 75 } });
  check("Update settings success", updateSettings.success === true, updateSettings);
  const settingsAfter = await get("/api/settings");
  check("PES price updated to 75", settingsAfter.settings?.pes?.pricePerMatch === 75, settingsAfter.settings?.pes?.pricePerMatch);
  // Reset back to 50
  await post("/api/settings", { pes: { pricePerMatch: 50 } });

  // ── FINAL RESULTS ──
  console.log("\n=== TEST RESULTS ===");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);
  if (failed === 0) {
    console.log("🎉 ALL TESTS PASSED — Ready to deploy!");
  } else {
    console.log("⚠️  Fix failed tests before deploying");
  }
}

runAllTests();
