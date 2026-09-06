/**
 * Shared helper for Next.js route handlers.
 *
 * Builds the `context` object that the service handlers under `agents/`
 * expect (mirroring the EdgeOne Makers runtime shape), backed by Neon DB
 * via `createStore()` when DATABASE_URL is set.
 */

import { createStore } from "./neon-store";

export interface RouteContext {
  request: { body: any; signal?: AbortSignal };
  env: Record<string, string | undefined>;
  store: ReturnType<typeof createStore>;
  conversation_id: string;
  conversationId: string;
  utils: { abortActiveRun: (id: string) => { aborted: boolean } };
}

export async function buildContext(req: Request, body: any): Promise<RouteContext> {
  const raw = process.env as Record<string, string | undefined>;
  // SERVICE_* is the canonical naming in docs; AI_GATEWAY_* is the runtime alias.
  const env: Record<string, string | undefined> = {
    ...raw,
    AI_GATEWAY_API_KEY: raw.AI_GATEWAY_API_KEY || raw.SERVICE_API_KEY,
    AI_GATEWAY_BASE_URL: raw.AI_GATEWAY_BASE_URL || raw.SERVICE_BASE_URL,
    AI_GATEWAY_MODEL: raw.AI_GATEWAY_MODEL || raw.SERVICE_MODEL,
    AI_GATEWAY_BACKUP_API_KEY: raw.AI_GATEWAY_BACKUP_API_KEY || raw.SERVICE_BACKUP_API_KEY,
    AI_GATEWAY_BACKUP_BASE_URL: raw.AI_GATEWAY_BACKUP_BASE_URL || raw.SERVICE_BACKUP_BASE_URL,
    AI_GATEWAY_BACKUP_MODEL: raw.AI_GATEWAY_BACKUP_MODEL || raw.SERVICE_BACKUP_MODEL,
  };
  const store = createStore(env);
  const headerId = req.headers.get("makers-conversation-id") || "";
  const conversationId =
    headerId ||
    (body?.conversation_id as string | undefined) ||
    (body?.conversationId as string | undefined) ||
    "";

  return {
    request: { body, signal: (req as any).signal as AbortSignal | undefined },
    env,
    store,
    conversation_id: conversationId,
    conversationId,
    utils: { abortActiveRun: () => ({ aborted: false }) },
  };
}

export async function readBody(req: Request): Promise<any> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
