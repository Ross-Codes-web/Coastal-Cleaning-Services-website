import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const leadsTable = pgTable("coastal_cleaning_leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadType: varchar("lead_type", { length: 20 }).notNull(),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  serviceAddress: text("service_address"),
  notificationSent: boolean("notification_sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
