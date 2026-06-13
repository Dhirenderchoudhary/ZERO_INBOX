import { pgTable, text, jsonb, timestamp, boolean, integer, serial } from 'drizzle-orm/pg-core';

export const corsairIntegrations = pgTable('corsair_integrations', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    name: text('name').notNull(),
    config: jsonb('config').notNull().default({}),
    dek: text('dek'),
});

export const corsairAccounts = pgTable('corsair_accounts', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    tenantId: text('tenant_id').notNull(),
    integrationId: text('integration_id').notNull().references(() => corsairIntegrations.id),
    config: jsonb('config').notNull().default({}),
    dek: text('dek'),
});

export const corsairEntities = pgTable('corsair_entities', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    accountId: text('account_id').notNull().references(() => corsairAccounts.id),
    entityId: text('entity_id').notNull(),
    entityType: text('entity_type').notNull(),
    version: text('version').notNull(),
    data: jsonb('data').notNull().default({}),
});

export const corsairEvents = pgTable('corsair_events', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    accountId: text('account_id').notNull().references(() => corsairAccounts.id),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull().default({}),
    status: text('status'),
});

export const emailTriage = pgTable('email_triage', {
  id: serial('id').primaryKey(),
  entityId: text('entity_id').unique().notNull(),
  priority: text('priority', {
    enum: ['urgent', 'needs_reply', 'fyi', 'newsletter', 'other']
  }).notNull().default('other'),
  isRead: boolean('is_read').default(false),
  isArchived: boolean('is_archived').default(false),
  isStarred: boolean('is_starred').default(false),
  triagedAt: timestamp('triaged_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const agentMessages = pgTable('agent_messages', {
  id: serial('id').primaryKey(),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  actionsJson: text('actions_json'),
  tokensUsed: integer('tokens_used'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const emailNotes = pgTable('email_notes', {
  id: serial('id').primaryKey(),
  entityId: text('entity_id').notNull(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});