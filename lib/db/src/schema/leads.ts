import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  date,
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
  serviceType: varchar("service_type", { length: 40 }),
  propertySize: varchar("property_size", { length: 40 }),
  specialRequests: text("special_requests"),
  preferredDate: date("preferred_date", { mode: "string" }),
  preferredTimeWindows: text("preferred_time_windows").array(),
  cleaningFrequency: varchar("cleaning_frequency", { length: 30 }),
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
