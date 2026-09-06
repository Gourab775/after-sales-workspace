/**
 * Neon-backed store adapter.
 *
 * Exposes the same surface the agents expect from the EdgeOne runtime store:
 *   store.langgraphStore.{ get, put, delete, search }
 *   store.{ listConversations, deleteConversation, appendMessage }
 *
 * Namespaces are mapped onto Neon Postgres tables (see lib/neon-db.ts):
 *   ["kb","doc",category] + docId        → documents
 *   ["kb","doc_manifest"] / "all"         → derived from documents
 *   ["aftersales","orders"] + orderId     → orders
 *   ["aftersales","orders_manifest"]/"all"→ derived from orders
 *   ["aftersales","workflow"] + threadId  → conversation_states
 *
 * When DATABASE_URL is missing (e.g. plain `next dev` without env), the
 * adapter falls back to an in-memory Map so the UI remains explorable and
 * clearly reports the missing configuration via /health.
 */

import { getSql, ensureSchema } from "./neon-db";

type Namespace = string[];

interface KvItem {
  namespace: Namespace;
  key: string;
  value: any;
}

// ─── Row mappers ───

function docRowToRecord(row: any) {
  return {
    docId: row.doc_id,
    category: row.category,
    filename: row.filename,
    content: row.content,
    summary: row.summary,
    keywords: typeof row.keywords === "string" ? JSON.parse(row.keywords) : (row.keywords ?? []),
    charCount: row.char_count,
    uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : row.uploaded_at,
  };
}

function orderRowToValue(row: any) {
  const items = typeof row.items === "string" ? JSON.parse(row.items) : (row.items ?? []);
  const currentOrder = typeof row.current_order === "string" ? JSON.parse(row.current_order) : row.current_order;
  void currentOrder;
  return {
    orderId: row.order_id,
    userId: row.user_id,
    items,
    totalAmount: Number(row.total_amount ?? 0),
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    ...(row.tracking_number ? { trackingNumber: row.tracking_number } : {}),
    ...(row.carrier ? { carrier: row.carrier } : {}),
    ...(row.refund_reason ? { refundReason: row.refund_reason } : {}),
    ...(row.refund_amount != null ? { refundAmount: Number(row.refund_amount) } : {}),
    ...(row.exchange_reason ? { exchangeReason: row.exchange_reason } : {}),
    ...(row.exchange_new_item ? { exchangeNewItem: row.exchange_new_item } : {}),
  };
}

// ─── Neon langgraphStore ───

class NeonLanggraphStore {
  private env: Record<string, string | undefined>;
  private schemaReady: Promise<void> | null = null;

  constructor(env?: Record<string, string | undefined>) {
    this.env = env ?? (process.env as Record<string, string | undefined>);
  }

  private ready(): Promise<void> {
    if (!this.schemaReady) this.schemaReady = ensureSchema(this.env).catch(() => {});
    return this.schemaReady;
  }

  async get(namespace: Namespace, key: string): Promise<{ value: any } | null> {
    await this.ready();
    const sql = getSql(this.env);

    // Document record
    if (namespace.length === 3 && namespace[0] === "kb" && namespace[1] === "doc") {
      const rows = await sql`SELECT * FROM documents WHERE doc_id = ${key} AND category = ${namespace[2]}`;
      if (rows.length === 0) return null;
      return { value: docRowToRecord(rows[0]) };
    }
    // Document manifest (derived)
    if (namespace.length === 2 && namespace[0] === "kb" && namespace[1] === "doc_manifest") {
      const rows = await sql`SELECT doc_id, category, filename, summary, keywords, char_count, uploaded_at FROM documents ORDER BY uploaded_at DESC`;
      return {
        value: {
          entries: rows.map(r => ({
            docId: r.doc_id,
            category: r.category,
            filename: r.filename,
            summary: r.summary,
            keywords: typeof r.keywords === "string" ? JSON.parse(r.keywords) : (r.keywords ?? []),
            charCount: r.char_count,
            uploadedAt: r.uploaded_at instanceof Date ? r.uploaded_at.toISOString() : r.uploaded_at,
          })),
        },
      };
    }
    // Order record
    if (namespace.length === 2 && namespace[0] === "aftersales" && namespace[1] === "orders") {
      const rows = await sql`SELECT * FROM orders WHERE order_id = ${key}`;
      if (rows.length === 0) return null;
      return { value: orderRowToValue(rows[0]) };
    }
    // Orders manifest (derived)
    if (namespace.length === 2 && namespace[0] === "aftersales" && namespace[1] === "orders_manifest") {
      const rows = await sql`SELECT order_id FROM orders ORDER BY created_at DESC`;
      return { value: { ids: rows.map(r => r.order_id) } };
    }
    // Workflow / conversation state
    if (namespace.length === 2 && namespace[0] === "aftersales" && namespace[1] === "workflow") {
      const rows = await sql`SELECT * FROM conversation_states WHERE conversation_id = ${key}`;
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        value: {
          currentOrder: typeof r.current_order === "string" ? JSON.parse(r.current_order) : r.current_order,
          orderId: r.order_id,
          intent: r.intent,
          waitingForUser: r.waiting_for_user,
          locale: r.locale,
        },
      };
    }
    return null;
  }

  async put(namespace: Namespace, key: string, value: any): Promise<void> {
    await this.ready();
    const sql = getSql(this.env);

    if (namespace.length === 3 && namespace[0] === "kb" && namespace[1] === "doc") {
      const v = value ?? {};
      await sql`INSERT INTO documents (doc_id, category, filename, content, summary, keywords, char_count, uploaded_at)
        VALUES (${key}, ${namespace[2]}, ${v.filename ?? key}, ${v.content ?? ""}, ${v.summary ?? ""}, ${JSON.stringify(v.keywords ?? [])}::jsonb, ${v.charCount ?? (v.content ?? "").length}, ${v.uploadedAt ?? new Date().toISOString()})
        ON CONFLICT (doc_id) DO UPDATE SET
          category = EXCLUDED.category, filename = EXCLUDED.filename, content = EXCLUDED.content,
          summary = EXCLUDED.summary, keywords = EXCLUDED.keywords, char_count = EXCLUDED.char_count,
          uploaded_at = EXCLUDED.uploaded_at`;
      return;
    }
    if (namespace.length === 2 && namespace[0] === "aftersales" && namespace[1] === "orders") {
      const v = value ?? {};
      await sql`INSERT INTO orders (order_id, user_id, items, total_amount, status, created_at, updated_at,
          tracking_number, carrier, refund_reason, refund_amount, exchange_reason, exchange_new_item)
        VALUES (${key}, ${v.userId ?? "demo-user"}, ${JSON.stringify(v.items ?? [])}::jsonb, ${v.totalAmount ?? 0},
          ${v.status ?? "pending"}, ${v.createdAt ?? new Date().toISOString()}, ${v.updatedAt ?? new Date().toISOString()},
          ${v.trackingNumber ?? null}, ${v.carrier ?? null}, ${v.refundReason ?? null},
          ${v.refundAmount ?? null}, ${v.exchangeReason ?? null}, ${v.exchangeNewItem ?? null})
        ON CONFLICT (order_id) DO UPDATE SET
          user_id = EXCLUDED.user_id, items = EXCLUDED.items, total_amount = EXCLUDED.total_amount,
          status = EXCLUDED.status, updated_at = NOW(),
          tracking_number = EXCLUDED.tracking_number, carrier = EXCLUDED.carrier,
          refund_reason = EXCLUDED.refund_reason, refund_amount = EXCLUDED.refund_amount,
          exchange_reason = EXCLUDED.exchange_reason, exchange_new_item = EXCLUDED.exchange_new_item`;
      return;
    }
    if (namespace.length === 2 && namespace[0] === "aftersales" && namespace[1] === "workflow") {
      const v = value ?? {};
      await sql`INSERT INTO conversation_states (conversation_id, intent, order_id, waiting_for_user, locale, current_order, updated_at)
        VALUES (${key}, ${v.intent ?? null}, ${v.orderId ?? null}, ${v.waitingForUser ?? false}, ${v.locale ?? "en"},
          ${v.currentOrder != null ? JSON.stringify(v.currentOrder) : null}::jsonb, NOW())
        ON CONFLICT (conversation_id) DO UPDATE SET
          intent = EXCLUDED.intent, order_id = EXCLUDED.order_id,
          waiting_for_user = EXCLUDED.waiting_for_user, locale = EXCLUDED.locale,
          current_order = EXCLUDED.current_order, updated_at = NOW()`;
      return;
    }
    // Manifest namespaces are derived — nothing to persist.
  }

  async delete(namespace: Namespace, key: string): Promise<void> {
    await this.ready();
    const sql = getSql(this.env);

    if (namespace.length === 3 && namespace[0] === "kb" && namespace[1] === "doc") {
      await sql`DELETE FROM documents WHERE doc_id = ${key}`;
      return;
    }
    if (namespace.length === 2 && namespace[0] === "aftersales" && namespace[1] === "orders") {
      await sql`DELETE FROM orders WHERE order_id = ${key}`;
      return;
    }
    if (namespace.length === 2 && namespace[0] === "aftersales" && namespace[1] === "workflow") {
      await sql`DELETE FROM conversation_states WHERE conversation_id = ${key}`;
      return;
    }
  }

  async search(namespace: Namespace, opts?: { filter?: Record<string, any>; limit?: number }): Promise<KvItem[]> {
    await this.ready();
    const sql = getSql(this.env);
    const limit = opts?.limit ?? 50;

    // Single-doc namespace (3 parts) → all docs in that category
    if (namespace.length === 3 && namespace[0] === "kb" && namespace[1] === "doc") {
      const rows = await sql`SELECT * FROM documents WHERE category = ${namespace[2]} ORDER BY uploaded_at DESC LIMIT ${limit}`;
      return rows.map(r => ({ namespace, key: r.doc_id, value: docRowToRecord(r) }));
    }
    // Prefix search ["kb","doc"] → all docs across categories
    if (namespace.length === 2 && namespace[0] === "kb" && namespace[1] === "doc") {
      const rows = await sql`SELECT * FROM documents ORDER BY uploaded_at DESC LIMIT ${limit}`;
      return rows.map(r => ({ namespace: ["kb", "doc", r.category], key: r.doc_id, value: docRowToRecord(r) }));
    }
    if (namespace.length === 2 && namespace[0] === "aftersales" && namespace[1] === "orders") {
      const filter = opts?.filter ?? {};
      const userIdEq = filter?.userId?.["$eq"];
      const rows = userIdEq
        ? await sql`SELECT * FROM orders WHERE user_id = ${userIdEq} ORDER BY created_at DESC LIMIT ${limit}`
        : await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT ${limit}`;
      return rows.map(r => ({ namespace, key: r.order_id, value: orderRowToValue(r) }));
    }
    if (namespace.length === 2 && namespace[0] === "aftersales" && namespace[1] === "workflow") {
      const rows = await sql`SELECT * FROM conversation_states ORDER BY updated_at DESC LIMIT ${limit}`;
      return rows.map(r => ({
        namespace,
        key: r.conversation_id,
        value: {
          currentOrder: typeof r.current_order === "string" ? JSON.parse(r.current_order) : r.current_order,
          orderId: r.order_id,
          intent: r.intent,
          waitingForUser: r.waiting_for_user,
          locale: r.locale,
        },
      }));
    }
    return [];
  }
}

// ─── In-memory fallback (no DATABASE_URL) ───

class MemoryLanggraphStore {
  private map = new Map<string, any>();

  private k(namespace: Namespace, key: string) {
    return `${namespace.join("/")}::${key}`;
  }

  async get(namespace: Namespace, key: string) {
    // Derived manifests
    if (namespace.join("/") === "kb/doc_manifest") {
      const entries: any[] = [];
      for (const [k, v] of this.map) {
        if (k.startsWith("kb/doc/")) {
          const { content, ...summary } = v;
          void content;
          entries.push(summary);
        }
      }
      return { value: { entries } };
    }
    if (namespace.join("/") === "aftersales/orders_manifest") {
      const ids: string[] = [];
      for (const [k] of this.map) {
        if (k.startsWith("aftersales/orders::")) ids.push(k.split("::")[1]);
      }
      return { value: { ids } };
    }
    const v = this.map.get(this.k(namespace, key));
    return v === undefined ? null : { value: v };
  }

  async put(namespace: Namespace, key: string, value: any) {
    if (namespace.join("/") === "kb/doc_manifest" || namespace.join("/") === "aftersales/orders_manifest") return;
    this.map.set(this.k(namespace, key), value);
  }

  async delete(namespace: Namespace, key: string) {
    this.map.delete(this.k(namespace, key));
  }

  async search(namespace: Namespace, opts?: { filter?: Record<string, any>; limit?: number }): Promise<KvItem[]> {
    const prefix = `${namespace.join("/")}`;
    const out: KvItem[] = [];
    for (const [k, v] of this.map) {
      if (!k.startsWith(prefix)) continue;
      const key = k.slice(prefix.length + 2);
      if (opts?.filter?.userId?.["$eq"] && v?.userId !== opts.filter.userId["$eq"]) continue;
      const nsParts = k.split("::")[0].split("/");
      out.push({ namespace: nsParts, key, value: v });
      if (out.length >= (opts?.limit ?? 50)) break;
    }
    return out;
  }

  clear() {
    this.map.clear();
  }
}

const _memory = new MemoryLanggraphStore();

// ─── Public factory ───

export interface NeonStore {
  langgraphStore: NeonLanggraphStore | MemoryLanggraphStore;
  listConversations: (opts?: { limit?: number }) => Promise<{ items: Array<{ conversationId: string }> }>;
  deleteConversation: (opts: { conversationId: string }) => Promise<void>;
  appendMessage: (opts: { conversationId: string; role: string; content: string }) => Promise<void>;
}

export function isDatabaseConfigured(env?: Record<string, string | undefined>): boolean {
  const e = env ?? (process.env as Record<string, string | undefined>);
  return Boolean(e.DATABASE_URL || e.NEON_DATABASE_URL || e.POSTGRES_URL);
}

export function createStore(env?: Record<string, string | undefined>): NeonStore {
  const e = env ?? (process.env as Record<string, string | undefined>);
  if (!isDatabaseConfigured(e)) {
    const langgraphStore = _memory;
    return {
      langgraphStore,
      listConversations: async () => ({ items: [] }),
      deleteConversation: async () => {},
      appendMessage: async () => {},
    };
  }

  const langgraphStore = new NeonLanggraphStore(e);
  const db = getSql(e);

  return {
    langgraphStore,
    listConversations: async (opts?: { limit?: number }) => {
      const limit = opts?.limit ?? 100;
      const rows = await db`SELECT conversation_id FROM conversation_states ORDER BY updated_at DESC LIMIT ${limit}`;
      return { items: (rows as any[]).map(r => ({ conversationId: r.conversation_id })) };
    },
    deleteConversation: async (opts: { conversationId: string }) => {
      await db`DELETE FROM conversation_states WHERE conversation_id = ${opts.conversationId}`;
      await db`DELETE FROM messages WHERE conversation_id = ${opts.conversationId}`;
    },
    appendMessage: async (opts: { conversationId: string; role: string; content: string }) => {
      if (opts.role !== "user" && opts.role !== "assistant") return;
      await db`INSERT INTO messages (conversation_id, role, content) VALUES (${opts.conversationId}, ${opts.role}, ${opts.content})`;
    },
  };
}

/** Delete all app data (used by /reset). Works for both Neon and memory backends. */
export async function clearAllData(store: NeonStore): Promise<{ conversations: number; workflowRecords: number; documents: number; orders: number }> {
  const kv: any = store.langgraphStore;

  if (kv instanceof NeonLanggraphStore) {
    const env = (kv as any).env as Record<string, string | undefined>;
    const sql = getSql(env);
    const docs = await sql`DELETE FROM documents RETURNING doc_id`;
    const ords = await sql`DELETE FROM orders RETURNING order_id`;
    const states = await sql`DELETE FROM conversation_states RETURNING conversation_id`;
    await sql`DELETE FROM messages`;
    return {
      conversations: (states as any[]).length,
      workflowRecords: (states as any[]).length,
      documents: (docs as any[]).length,
      orders: (ords as any[]).length,
    };
  }

  const docs = await kv.search(["kb", "doc"], { limit: 1000 });
  const ords = await kv.search(["aftersales", "orders"], { limit: 1000 });
  const states = await kv.search(["aftersales", "workflow"], { limit: 1000 });
  for (const item of [...docs, ...ords, ...states]) {
    await kv.delete(item.namespace, item.key);
  }
  (kv as MemoryLanggraphStore).clear();
  return {
    conversations: states.length,
    workflowRecords: states.length,
    documents: docs.length,
    orders: ords.length,
  };
}
