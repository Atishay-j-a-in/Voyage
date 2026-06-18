
import { bigint, integer, pgTable, text, timestamp , uuid, vector ,boolean, uniqueIndex, time} from 'drizzle-orm/pg-core';


export const userPreferences = pgTable('user_preferences', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantid:text('tenant_id').notNull().unique(),
    emailid: text('email_id').notNull(),
    summaryTime:time('summary_time').notNull().default('09:00:00'),
    isOrbActive: boolean('is_orb_active').notNull().default(true),
    isMailConnected: boolean('is_mail_connected').notNull().default(false),
    isCalendarConnected: boolean('is_calendar_connected').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const contactAlias = pgTable('contact_alias', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    emailid: text('email_id').notNull(),
    tenantid:text('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
},
(table) => ({
    uniqueContactAlias: uniqueIndex(
      "contact_alias_email_id_unique"
    ).on(table.name, table.tenantid),
  })
)

export const chatSessions = pgTable('chat_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantid:text('tenant_id').notNull(),
    title: text('title'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

})

export const chatMessages = pgTable('chat_messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').notNull().references(() => chatSessions.id),
    usertext: text('user_text').notNull(),
    agenttext: text('agent_text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})  

export const emailEmbeddings = pgTable('email_embeddings', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantid:text('tenant_id').notNull(),
    messageid: text('message_id').notNull().unique(),
    embedding: vector('embedding', { dimensions: 3072 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
   
},(table) => ({
    uniqueEmailEmbedding: uniqueIndex(
      "email_embedding_message_id_unique"
    ).on(table.messageid, table.tenantid),
  })
)

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: text("tenant_id")
      .notNull()
      .unique(),

    plan: text("plan")
      .notNull()
      .$type<"free" | "pro" | "enterprise">(),

    tokenLimit: bigint("token_limit", {
      mode: "number",
    }).notNull(),

    tokenUsed: bigint("token_used", {
      mode: "number",
    })
      .notNull()
      .default(0),

    currentPeriodStart: timestamp(
      "current_period_start",
      { withTimezone: true }
    ),

    currentPeriodEnd: timestamp(
      "current_period_end",
      { withTimezone: true }
    ),
  }
);

export const aiUsageEvents = pgTable(
  "ai_usage_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: text("tenant_id").notNull(),

    model: text("model").notNull(),

    totalTokens: integer("total_tokens").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  }
);

/**
 * Sync status for the per-tenant Gmail / Google Calendar
 * ingestion jobs. Currently unused but reserved for the Inngest
 * pipeline that will write to it when syncing is wired up.
 */
export const syncStatus = pgTable(
  "sync_status",
  {
    tenantId: text("tenant_id")
      .primaryKey(),

    gmailSync: text("gmail_sync")
      .$type<"idle" | "syncing" | "success" | "failure">(),

    calendarSync: text("calendar_sync")
      .$type<"idle" | "syncing" | "success" | "failure">(),

    gmailSyncedAt: timestamp("gmail_synced_at", {
      withTimezone: true,
    }),

    calendarSyncedAt: timestamp("calendar_synced_at", {
      withTimezone: true,
    }),

    gmailPageToken: text("gmail_page_token"),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  }
)
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: text("tenant_id").notNull(),

    title: text("title").notNull(),

    body: text("body").notNull(),

    isRead: boolean("is_read")
      .notNull()
      .default(false),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  }
);