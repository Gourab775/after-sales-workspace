/**
 * Neon DB layer — Postgres persistence for the after-sales workspace.
 *
 * Uses `@neondatabase/serverless` (HTTP driver, works in Node, Vercel
 * serverless, and Edge runtimes). All tables live in the `after_sales`
 * database of the `after-sales-workspace` Neon project:
 *
 *   documents           knowledge-base docs (all categories)
 *   orders              customer orders + refund/exchange state
 *   conversation_states persisted workflow state per conversation
 *   messages            chat history per conversation
 *
 * Env: set DATABASE_URL (Neon pooled connection string). Falls back to
 * NEON_DATABASE_URL / POSTGRES_URL when present.
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

export function isNeonConfigured(env?: Record<string, string | undefined>): boolean {
  const e = env ?? process.env;
  return Boolean(e.DATABASE_URL || e.NEON_DATABASE_URL || e.POSTGRES_URL);
}

export function getDatabaseUrl(env?: Record<string, string | undefined>): string {
  const e = env ?? (process.env as Record<string, string | undefined>);
  const url = e.DATABASE_URL || e.NEON_DATABASE_URL || e.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured. Add your Neon connection string to .env");
  return url;
}

export function getSql(env?: Record<string, string | undefined>): NeonQueryFunction<false, false> {
  if (_sql && !env) return _sql;
  const sql = neon(getDatabaseUrl(env));
  if (!env) _sql = sql;
  return sql;
}

/** Create tables if they do not exist (safe to run on every boot). */
export async function ensureSchema(env?: Record<string, string | undefined>): Promise<void> {
  const sql = getSql(env);
  await sql`CREATE TABLE IF NOT EXISTS documents (
    doc_id TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('faq','policy','product','order_doc')),
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    keywords JSONB NOT NULL DEFAULT '[]',
    char_count INTEGER NOT NULL DEFAULT 0,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)`;
  await sql`CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'demo-user',
    items JSONB NOT NULL DEFAULT '[]',
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tracking_number TEXT,
    carrier TEXT,
    refund_reason TEXT,
    refund_amount NUMERIC,
    exchange_reason TEXT,
    exchange_new_item TEXT
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`;
  await sql`CREATE TABLE IF NOT EXISTS conversation_states (
    conversation_id TEXT PRIMARY KEY,
    intent TEXT,
    order_id TEXT,
    waiting_for_user BOOLEAN NOT NULL DEFAULT FALSE,
    locale TEXT NOT NULL DEFAULT 'en',
    current_order JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user','assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id)`;
}
