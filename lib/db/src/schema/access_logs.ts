import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { funscriptsTable } from "./funscripts";

export const accessLogsTable = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  funScriptId: integer("fun_script_id").notNull().references(() => funscriptsTable.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  accessedAt: timestamp("accessed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAccessLogSchema = createInsertSchema(accessLogsTable).omit({ id: true, accessedAt: true });
export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;
export type AccessLog = typeof accessLogsTable.$inferSelect;
