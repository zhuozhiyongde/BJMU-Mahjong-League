import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "bjmu-league.db");
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

// Initialize database tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    points REAL NOT NULL DEFAULT 0,
    base_points REAL NOT NULL DEFAULT 0,
    games INTEGER NOT NULL DEFAULT 0,
    first INTEGER NOT NULL DEFAULT 0,
    second INTEGER NOT NULL DEFAULT 0,
    third INTEGER NOT NULL DEFAULT 0,
    fourth INTEGER NOT NULL DEFAULT 0,
    highest_score INTEGER,
    cat_count INTEGER NOT NULL DEFAULT 0,
    negative_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS game_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL REFERENCES game_records(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id),
    member_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    rank_bonus REAL NOT NULL
  );
`);

export { schema };
