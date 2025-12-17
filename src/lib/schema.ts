import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  points: real("points").notNull().default(0),
  basePoints: real("base_points").notNull().default(0),
  games: integer("games").notNull().default(0),
  first: integer("first").notNull().default(0),
  second: integer("second").notNull().default(0),
  third: integer("third").notNull().default(0),
  fourth: integer("fourth").notNull().default(0),
  highestScore: integer("highest_score"),
  catCount: integer("cat_count").notNull().default(0),
  negativeCount: integer("negative_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
});

export const gameRecords = sqliteTable("game_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: text("timestamp").notNull(),
});

export const gameResults = sqliteTable("game_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id")
    .notNull()
    .references(() => gameRecords.id, { onDelete: "cascade" }),
  memberId: integer("member_id").references(() => members.id),
  memberName: text("member_name").notNull(),
  score: integer("score").notNull(),
  rank: integer("rank").notNull(),
  rankBonus: real("rank_bonus").notNull(),
});

// Types
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type GameRecord = typeof gameRecords.$inferSelect;
export type NewGameRecord = typeof gameRecords.$inferInsert;
export type GameResult = typeof gameResults.$inferSelect;
export type NewGameResult = typeof gameResults.$inferInsert;
