import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { creatorsTable } from "./creators";

export const funscriptsTable = pgTable("funscripts", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => creatorsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  contentUrl: text("content_url"),
  shareToken: text("share_token").notNull().unique(),
  viewCount: integer("view_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFunscriptSchema = createInsertSchema(funscriptsTable).omit({ id: true, shareToken: true, viewCount: true, createdAt: true, updatedAt: true });
export type InsertFunscript = z.infer<typeof insertFunscriptSchema>;
export type Funscript = typeof funscriptsTable.$inferSelect;
