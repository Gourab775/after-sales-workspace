/**
 * Shared utilities for after-sales assistant agent.
 */
import { ChatOpenAI } from "@langchain/openai";

// ─── Model (primary + optional backup provider) ───

type AgentEnv = Record<string, string | undefined>;

export interface ModelConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

/** Primary provider. Works with any OpenAI-compatible gateway (OpenRouter, etc.). */
export function getPrimaryConfig(env: AgentEnv): ModelConfig {
  return {
    apiKey: env.AI_GATEWAY_API_KEY!,
    baseURL: env.AI_GATEWAY_BASE_URL!,
    model: env.AI_GATEWAY_MODEL || env.AI_MODEL || "deepseek/deepseek-chat",
  };
}

/**
 * Backup provider (optional). Configure AI_GATEWAY_BACKUP_API_KEY +
 * AI_GATEWAY_BACKUP_BASE_URL (+ optional AI_GATEWAY_BACKUP_MODEL) to enable
 * automatic failover when the primary provider errors.
 */
export function getBackupConfig(env: AgentEnv): ModelConfig | null {
  const apiKey = env.AI_GATEWAY_BACKUP_API_KEY;
  const baseURL = env.AI_GATEWAY_BACKUP_BASE_URL;
  if (!apiKey || !baseURL) return null;
  return { apiKey, baseURL, model: env.AI_GATEWAY_BACKUP_MODEL || "deepseek/deepseek-chat" };
}

// Cache models by credential fingerprint (baseURL::apiKey::model). No module-level
// mutable env state — env is always passed in per request, so concurrent
// requests never clobber each other.
const _modelCache = new Map<string, ChatOpenAI>();

function buildModel(cfg: ModelConfig): ChatOpenAI {
  const cacheKey = `${cfg.baseURL}::${cfg.apiKey}::${cfg.model}`;

  let cached = _modelCache.get(cacheKey);
  if (cached) return cached;

  const defaultHeaders: Record<string, string> = {};
  if (cfg.baseURL.includes("openrouter.ai")) {
    defaultHeaders["HTTP-Referer"] = "https://after-sales-workspace.vercel.app";
    defaultHeaders["X-Title"] = "After-Sales Assistant";
  }

  cached = new ChatOpenAI({
    model: cfg.model,
    apiKey: cfg.apiKey,
    configuration: {
      baseURL: cfg.baseURL,
      defaultHeaders,
    },
    timeout: 300_000,
  });
  _modelCache.set(cacheKey, cached);
  return cached;
}

export function createModel(env: AgentEnv): ChatOpenAI {
  return buildModel(getPrimaryConfig(env));
}

/** Backup model instance, or null when no backup provider is configured. */
export function createBackupModel(env: AgentEnv): ChatOpenAI | null {
  const cfg = getBackupConfig(env);
  return cfg ? buildModel(cfg) : null;
}

type InvokeMessages = Parameters<ChatOpenAI["invoke"]>[0];

function chunkText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map(part => {
    if (typeof part === "string") return part;
    if (part && typeof part === "object" && "text" in part) return String((part as { text?: unknown }).text ?? "");
    return "";
  }).join("");
}

/** Non-streaming call with automatic failover to the backup provider. */
export async function invokeWithFallback(
  env: AgentEnv,
  messages: InvokeMessages,
  opts?: { signal?: AbortSignal }
) {
  const invokeOpts = opts?.signal ? { signal: opts.signal } : undefined;
  try {
    return await createModel(env).invoke(messages, invokeOpts);
  } catch (e) {
    const backup = createBackupModel(env);
    if (!backup) throw e;
    createLogger("model").log("Primary model failed, trying backup:", (e as Error).message);
    return await backup.invoke(messages, invokeOpts);
  }
}

/**
 * Streaming call with automatic failover. Deltas go to onDelta; resolves with
 * the full concatenated text. If the primary stream fails before/without
 * producing output, the backup provider is tried.
 */
export async function streamWithFallback(
  env: AgentEnv,
  messages: InvokeMessages,
  onDelta: (delta: string) => void,
  opts?: { signal?: AbortSignal }
): Promise<string> {
  const tryStream = async (model: ChatOpenAI): Promise<string> => {
    let answer = "";
    const stream = await (model as any).stream(messages, opts?.signal ? { signal: opts.signal } : undefined);
    for await (const chunk of stream) {
      if (opts?.signal?.aborted) break;
      const delta = chunkText(chunk?.content);
      if (!delta) continue;
      answer += delta;
      onDelta(delta);
    }
    return answer;
  };

  try {
    return await tryStream(createModel(env));
  } catch (e) {
    const backup = createBackupModel(env);
    if (!backup) throw e;
    createLogger("model").log("Primary stream failed, trying backup:", (e as Error).message);
    return await tryStream(backup);
  }
}

// ─── Logger ───

export function createLogger(name: string) {
  return {
    log(...args: unknown[]) { console.log(`[${name}][${new Date().toISOString()}]`, ...args); },
    error(...args: unknown[]) { console.error(`[${name}][${new Date().toISOString()}]`, ...args); },
  };
}

// ─── SSE Helpers ───

export function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export function createSSEResponse(generator: AsyncGenerator<string>, signal?: AbortSignal): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(sseEvent({ type: "ping", ts: Date.now() }))); } catch {}
      }, 5_000);
      try {
        for await (const chunk of generator) {
          if (signal?.aborted) break;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        const error = e as Error;
        if (error.name !== "AbortError" && !signal?.aborted) {
          controller.enqueue(encoder.encode(sseEvent({ type: "error_message", content: error.message })));
        }
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
    cancel() {},
  });

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ─── Order Types ───

export type OrderStatus = "pending" | "shipped" | "delivered" | "refund_requested" | "refund_approved" | "refund_completed" | "exchange_requested" | "exchange_shipped";

export interface OrderItem {
  productId: string;
  name: string;
  specs: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface Order {
  orderId: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  carrier?: string;
  refundReason?: string;
  refundAmount?: number;
  exchangeReason?: string;
  exchangeNewItem?: string;
}

// ─── Order Persistence ───

const ORDER_NAMESPACE = ["aftersales", "orders"];

export async function getOrder(context: any, orderId: string): Promise<Order | null> {
  try {
    const item = await context.store.langgraphStore.get(ORDER_NAMESPACE, orderId);
    if (item?.value) return item.value as Order;
  } catch {}
  return null;
}

export async function saveOrder(context: any, order: Order): Promise<void> {
  try {
    await context.store.langgraphStore.put(ORDER_NAMESPACE, order.orderId, { ...order });
  } catch (e) {
    createLogger("store").error("Failed to save order:", e);
  }
}

export async function listUserOrders(context: any, userId: string): Promise<Order[]> {
  try {
    const results = await context.store.langgraphStore.search(ORDER_NAMESPACE, {
      filter: { userId: { $eq: userId } },
      limit: 50,
    });
    return results.map((item: any) => item.value as Order)
      .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {}
  return [];
}
