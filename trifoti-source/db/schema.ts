import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicId: text("public_id").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  status: text("status").notNull().default("Новая"),
  publicToken: text("public_token").unique(),
  salesStage: text("sales_stage").notNull().default("Не указан"),
  quoteAmount: integer("quote_amount"),
  paidAmount: integer("paid_amount"),
  lostReason: text("lost_reason").notNull().default(""),
  salesRevision: integer("sales_revision").notNull().default(0),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  contactMethod: text("contact_method").notNull(),
  projectType: text("project_type").notNull(),
  projectFormat: text("project_format").notNull(),
  budget: text("budget").notNull(),
  deadline: text("deadline").notNull().default(""),
  details: text("details").notNull(),
  source: text("source").notNull().default("website"),
  estimateMin: integer("estimate_min"),
  estimateMax: integer("estimate_max"),
  estimateSummary: text("estimate_summary").notNull().default(""),
  utmSource: text("utm_source").notNull().default(""),
  utmMedium: text("utm_medium").notNull().default(""),
  utmCampaign: text("utm_campaign").notNull().default(""),
  referrer: text("referrer").notNull().default(""),
  ipHash: text("ip_hash").notNull(),
  userAgent: text("user_agent").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leadFiles = sqliteTable("lead_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull().unique(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const analyticsEvents = sqliteTable("analytics_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  event: text("event").notNull(),
  path: text("path").notNull().default("/"),
  source: text("source").notNull().default("site"),
  sessionId: text("session_id").notNull(),
  utmSource: text("utm_source").notNull().default(""),
  utmMedium: text("utm_medium").notNull().default(""),
  utmCampaign: text("utm_campaign").notNull().default(""),
  referrer: text("referrer").notNull().default(""),
  details: text("details").notNull().default("{}"),
}, (table) => [
  index("analytics_events_created_at_idx").on(table.createdAt),
  index("analytics_events_event_created_at_idx").on(table.event, table.createdAt),
  index("analytics_events_session_created_at_idx").on(table.sessionId, table.createdAt),
]);
