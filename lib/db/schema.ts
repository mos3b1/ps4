import {
  pgTable, serial, integer, bigint, text,
  boolean, timestamp, jsonb, real
} from "drizzle-orm/pg-core";

// Store timestamps as BIGINT (milliseconds) to handle JavaScript Date.now() values
// JavaScript Date.now() returns milliseconds since epoch
// Max safe integer in JavaScript: 9,007,199,254,740,991 (year ~285,428)
// PostgreSQL bigint max: 9,223,372,036,854,775,807 (plenty of room)

export const stations = pgTable("stations", {
  id:                   integer("id").primaryKey(),
  running:              boolean("running").default(false),
  paused:               boolean("paused").default(false),
  pausedAt:             bigint("paused_at", { mode: "number" }),           // milliseconds since epoch
  totalPausedSeconds:   integer("total_paused_seconds").default(0),
  currentGameId:        text("current_game_id"),
  currentGameJson:      jsonb("current_game_json"),
  sessionStartEpoch:    bigint("session_start_epoch", { mode: "number" }), // milliseconds since epoch
  segmentStartEpoch:    bigint("segment_start_epoch", { mode: "number" }), // milliseconds since epoch
  customerName:         text("customer_name").default(""),
  source:               text("source").default("manual"),
  segments:             jsonb("segments").default([]),
  totalBill:            real("total_bill").default(0),
  unknownGame:          jsonb("unknown_game"),
  customPricePerMatch:  real("custom_price_per_match"),
  playerCount:          integer("player_count"),
  updatedAt:            timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id:           serial("id").primaryKey(),
  date:         text("date").notNull(),        // YYYY-MM-DD
  time:         text("time").notNull(),        // HH:MM
  stationId:    integer("station_id"),
  customerName: text("customer_name"),
  gameLabel:    text("game_label"),
  gameEmoji:    text("game_emoji"),
  source:       text("source"),               // manual | ps4
  elapsed:      integer("elapsed"),           // seconds
  totalBill:    real("total_bill"),
  segments:     jsonb("segments"),
  playerCount:  integer("player_count"),
  createdAt:    timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id:                  serial("id").primaryKey(),
  gameId:              text("game_id").notNull().unique(),
  pricePerMatch:       real("price_per_match"),
  pricePerHour:        real("price_per_hour"),
  matchDurationMin:    integer("match_duration_min"),
  breakDurationMin:    integer("break_duration_min"),
  updatedAt:           timestamp("updated_at").defaultNow(),
});

export const gameRegistry = pgTable("game_registry", {
  titleId:          text("title_id").primaryKey(),
  titleName:        text("title_name").notNull(),
  gameId:           text("game_id").notNull(),
  mode:             text("mode").notNull(),    // time-match | hour
  price:            real("price").notNull(),
  matchCycleMinutes:integer("match_cycle_minutes"),
  addedAt:          text("added_at"),
  isTemp:           boolean("is_temp").default(false),
});
