/**
 * Graph nodes — each node is a function (state) => partial state update.
 * All user-facing strings are routed through agents/_i18n.ts (state.locale).
 *
 * `context` (carrying context.store) is closed over by the graph builder so that
 * every request binds its own store — no module-level mutable state, safe under
 * concurrency.
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";
import { createLogger, invokeWithFallback, streamWithFallback } from "../_shared";
import type { AfterSalesStateType } from "./state";

/** AI Gateway env, threaded from context.env through the graph builder. */
type AgentEnv = Record<string, string | undefined>;
import { getAllSummaries, getDocContent, saveDoc } from "../../lib/doc-store";
import type { Order } from "../_shared";
import { t, statusLabel, languageDirective, type Locale } from "../_i18n";

const logger = createLogger("nodes");

type StreamRuntime = {
  signal?: AbortSignal;
  writer?: (event: Record<string, unknown>) => void;
};

function emitDelta(runtime: StreamRuntime | undefined, node: string) {
  return (delta: string) => {
    runtime?.writer?.({ type: "ai_response_delta", node, delta });
  };
}

async function streamAnswer(
  env: AgentEnv,
  messages: Parameters<ChatOpenAI["invoke"]>[0],
  runtime: StreamRuntime | undefined,
  node: string,
): Promise<string> {
  return streamWithFallback(env, messages, emitDelta(runtime, node), { signal: runtime?.signal });
}

// ─── Store Order Helpers ───

const ORDERS_NAMESPACE = ["aftersales", "orders"];
const ORDERS_MANIFEST_NAMESPACE = ["aftersales", "orders_manifest"];

async function getAllOrders(context: any): Promise<Order[]> {
  try {
    const kv = context?.store?.langgraphStore;
    if (!kv) return [];
    const idx = await kv.get(ORDERS_MANIFEST_NAMESPACE, "all").catch(() => null);
    const ids: string[] = idx?.value?.ids || [];
    if (ids.length === 0) return [];
    const orders = await Promise.all(
      ids.map(async (id: string) => {
        const item = await kv.get(ORDERS_NAMESPACE, id).catch(() => null);
        return (item?.value as Order) || null;
      })
    );
    return orders.filter(Boolean) as Order[];
  } catch {}
  return [];
}

async function getOrderById(context: any, orderId: string): Promise<Order | null> {
  try {
    const kv = context?.store?.langgraphStore;
    if (!kv) return null;
    const item = await kv.get(ORDERS_NAMESPACE, orderId);
    return (item?.value as Order) ?? null;
  } catch {}
  return null;
}

// ─── Blob Order Helpers ───

const ORDER_FILENAME_RE = /^ORD-\d{8}-\d{3,}/i;

function filterOrderSummaries(summaries: Awaited<ReturnType<typeof getAllSummaries>>) {
  return summaries.filter(s => ORDER_FILENAME_RE.test(s.filename));
}

async function lookupBlobOrderDoc(context: any, orderId: string): Promise<{
  content: string;
  docId: string;
  summary: string;
  keywords: string[];
  filename: string;
} | null> {
  try {
    const summaries = await getAllSummaries(context.store, "order_doc");
    const needle = orderId.toUpperCase();
    const matchedDoc = summaries.find(
      s =>
        s.filename.toUpperCase() === needle ||
        s.keywords.some(k => k.toUpperCase() === needle)
    );
    if (!matchedDoc) return null;
    const content = await getDocContent(context.store, "order_doc", matchedDoc.docId);
    if (!content) return null;
    return {
      content,
      docId: matchedDoc.docId,
      summary: matchedDoc.summary,
      keywords: matchedDoc.keywords,
      filename: matchedDoc.filename,
    };
  } catch {
    return null;
  }
}

/** Detect order status from free-text content (English keywords). */
function detectStatusFromText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("exchange_requested") || lower.includes("exchange requested")) return "exchange_requested";
  if (lower.includes("refund_requested") || lower.includes("refund requested")) return "refund_requested";
  if (lower.includes("delivered")) return "delivered";
  if (lower.includes("shipped") || lower.includes("in transit")) return "shipped";
  if (lower.includes("pending")) return "pending";
  return "unknown";
}

// ─── Intent Recognition ───

export async function intentRecognition(state: AfterSalesStateType, env: AgentEnv, runtime?: StreamRuntime) {
  const ORDER_ID_RE = /ORD-\d{8}-\d{3}/i;
  if (
    state.waitingForUser &&
    (state.intent === "exchange" || state.intent === "refund") &&
    ORDER_ID_RE.test(state.userInput.trim())
  ) {
    const orderId = state.userInput.trim().match(ORDER_ID_RE)![0].toUpperCase();
    logger.log(`Context carry-forward: intent=${state.intent}, orderId=${orderId}`);
    return { intent: state.intent, orderId, waitingForUser: false };
  }
  // Intent prompt returns a fixed JSON schema; classification works on English input.
  const response = await invokeWithFallback(env, [
    new SystemMessage(`You are an after-sales support intent classifier. The user may write in English, Hindi, or Hinglish (Hindi-English mix in Roman script, e.g. "mujhe refund chahiye", "mera order kahan hai", "return policy kya hai"). Understand the meaning regardless of language and output JSON:
{"intent": "faq"|"lookup_order"|"refund"|"exchange"|"general", "orderId": "extract the order ID if mentioned, otherwise null", "reason": "brief explanation"}

Intent guide with examples:
- faq: policy/rules/process/product info questions. Ex: "What is the return policy?", "return policy kya hai?", "refund kitne din me aata hai?", "exchange me kitna time lagta hai?", "warranty hai kya?"
- lookup_order: check order/shipping status. Ex: "Where is my order?", "mera order kahan hai?", "order track karo", "ORD-20250520-001 status?", "delivery kab hogi?"
- refund: return/refund requests. Ex: "I want a refund", "mujhe refund chahiye", "paise wapas karo", "return karna hai", "refund apply karo"
- exchange: exchange requests. Ex: "I want to exchange", "exchange karna hai", "size change karna hai", "dusra piece chahiye", "replace karo"
- general: greetings/chit-chat. Ex: "hi", "hello", "namaste", "thanks", "shukriya", "kaise ho?"

If the user mentions both an order ID and a return, prefer refund/exchange.`),
    new HumanMessage(state.userInput),
  ], runtime?.signal ? { signal: runtime.signal } : undefined);

  const text = typeof response.content === "string" ? response.content : "";
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      logger.log(`Intent: ${parsed.intent}, orderId: ${parsed.orderId}`);
      return {
        intent: parsed.intent || "general",
        orderId: parsed.orderId || state.orderId || null,
      };
    }
  } catch {}
  return { intent: "general" as const, orderId: state.orderId || null };
}

// ─── FAQ Search (Knowledge Base) ───

export async function faqSearch(state: AfterSalesStateType, env: AgentEnv, context: any, runtime?: StreamRuntime) {
  const locale = (state.locale || "en");
  const summaries = await getAllSummaries(context.store);
  logger.log(`Knowledge base has ${summaries.length} documents`);

  if (summaries.length === 0) {
    return {
      aiResponse: t(locale, "ai.kbEmpty"),
      faqResults: [],
      cardEvent: null,
    };
  }

  const summaryList = summaries.map((s, i) => `[${i}] 【${s.category}】${s.filename}: ${s.summary} (keywords: ${s.keywords.join(", ")})`).join("\n");

  // Routing prompt — output is a fixed JSON schema.
  const routeResponse = await invokeWithFallback(env, [
    new SystemMessage(`You are a document routing assistant. Given the user question, pick the 1-3 most relevant documents from the list below.
Return strict JSON: {"indices": [0, 2]}

If no document is relevant, return: {"indices": []}

Document list:
${summaryList}`),
    new HumanMessage(state.userInput),
  ], runtime?.signal ? { signal: runtime.signal } : undefined);

  const routeText = typeof routeResponse.content === "string" ? routeResponse.content : "";
  let selectedIndices: number[] = [];

  try {
    const match = routeText.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed.indices)) {
        selectedIndices = parsed.indices.filter((i: number) => i >= 0 && i < summaries.length);
      }
    }
  } catch {}

  if (selectedIndices.length === 0) {
    return {
      aiResponse: t(locale, "ai.faqNotFound"),
      faqResults: [],
      cardEvent: null,
    };
  }

  const selectedDocs = selectedIndices.map(i => summaries[i]);
  const contents = await Promise.all(
    selectedDocs.map(async (doc) => {
      const content = await getDocContent(context.store, doc.category, doc.docId);
      return { ...doc, content: content || doc.summary };
    })
  );

  logger.log(`Selected ${contents.length} docs for answer generation (locale=${locale})`);

  const contextText = contents.map(d => `【${d.category}/${d.filename}】\n${d.content}`).join("\n\n");

  // Answer generation — language directive forces English output.
  const answer = await streamAnswer(env, [
    new SystemMessage(`You are an after-sales support assistant. Answer the user question using the knowledge-base documents below.
Requirements:
- Be concise and friendly; don't copy the source text verbatim
- For procedures, give clear steps
- If the user needs further help, ask them to share their order ID
- Mention the document category your information comes from
- The user may write in English, Hindi, or Hinglish. The language directive below tells you which language and tone to reply in.

Knowledge-base documents:
${contextText}${languageDirective(locale)}`),
    new HumanMessage(state.userInput),
  ], runtime, "faq_search");
  return {
    aiResponse: answer,
    faqResults: contents.map(d => ({ id: d.docId, title: d.filename, content: d.content })),
    cardEvent: {
      type: "faq_sources",
      data: { sources: selectedDocs.map(d => ({ id: d.docId, title: d.filename, category: d.category })) },
    },
  };
}

// ─── Lookup Order ───

export async function lookupOrder(state: AfterSalesStateType, context: any) {
  const locale = (state.locale || "en");
  const sep = ", ";
  const orderId = state.orderId;

  if (!orderId) {
    const [storeOrders, blobSummaries] = await Promise.all([
      getAllOrders(context),
      getAllSummaries(context.store, "order_doc").then(filterOrderSummaries),
    ]);

    const storeLines = storeOrders.map(o => {
      const itemNames = o.items.map(i => i.name).join(sep);
      return `- **${o.orderId}**: ${itemNames} (${statusLabel(locale, o.status)}, ¥${o.totalAmount})`;
    });

    const blobLines = blobSummaries.map(s => {
      const status = detectStatusFromText(s.summary + " " + s.keywords.join(" "));
      return `- **${s.filename}**: ${s.summary.slice(0, 40)} (${statusLabel(locale, status)})`;
    });

    const allLines = [...storeLines, ...blobLines].join("\n");

    if (!allLines.trim()) {
      return {
        aiResponse: t(locale, "ai.noOrders"),
        waitingForUser: false,
        cardEvent: null,
      };
    }

    return {
      aiResponse: t(locale, "ai.orderListPrompt", { lines: allLines }),
      waitingForUser: true,
      cardEvent: null,
    };
  }

  let order = (state.currentOrder?.orderId === orderId) ? state.currentOrder : null;
  if (!order) {
    order = await getOrderById(context, orderId);
  }

  if (!order) {
    const blobDoc = await lookupBlobOrderDoc(context, orderId);
    if (blobDoc) {
      return {
        aiResponse: t(locale, "ai.orderFoundFromBlob", { orderId, content: blobDoc.content }),
        cardEvent: null,
      };
    }

    return {
      aiResponse: t(locale, "ai.orderNotFound", { orderId }),
      currentOrder: null,
      cardEvent: null,
    };
  }

  const tracking = order.trackingNumber
    ? t(locale, "ai.trackingLine", { carrier: order.carrier || "", trackingNumber: order.trackingNumber })
    : "";
  return {
    currentOrder: order,
    aiResponse: t(locale, "ai.orderFound", {
      orderId: order.orderId,
      statusLabel: statusLabel(locale, order.status),
      tracking,
    }),
    cardEvent: { type: "order_detail", data: { order } },
  };
}

// ─── Request Refund ───

export async function requestRefund(state: AfterSalesStateType, context: any) {
  const locale = (state.locale || "en");
  const sep = ", ";
  const ineligibleNote = (label: string) => ` *(${label}, not eligible for refund)*`;

  if (!state.currentOrder && !state.orderId) {
    const [storeOrders, blobSummaries] = await Promise.all([
      getAllOrders(context),
      getAllSummaries(context.store, "order_doc").then(filterOrderSummaries),
    ]);

    const storeLines = storeOrders.map(o => {
      const itemNames = o.items.map(i => i.name).join(sep);
      const eligible = o.status === "delivered" || o.status === "shipped";
      const note = eligible ? "" : ineligibleNote(statusLabel(locale, o.status));
      return `- **${o.orderId}**: ${itemNames} (¥${o.totalAmount})${note}`;
    });

    const blobLines = blobSummaries.map(s => {
      const status = detectStatusFromText(s.summary + " " + s.keywords.join(" "));
      const eligible = status === "delivered" || status === "shipped";
      const note = eligible ? "" : ineligibleNote(statusLabel(locale, status));
      return `- **${s.filename}**: ${s.summary.slice(0, 30)}...${note}`;
    });

    const allLines = [...storeLines, ...blobLines].join("\n");
    if (!allLines.trim()) {
      return { aiResponse: t(locale, "ai.refundNoOrders"), waitingForUser: false, cardEvent: null };
    }
    return {
      aiResponse: t(locale, "ai.refundOrderListPrompt", { lines: allLines }),
      waitingForUser: true,
      cardEvent: null,
    };
  }

  let order = state.currentOrder;
  if (!order && state.orderId) {
    order = await getOrderById(context, state.orderId);
  }

  if (!order) {
    const orderId = state.orderId!;
    const blobDoc = await lookupBlobOrderDoc(context, orderId);
    if (blobDoc) {
      const status = detectStatusFromText(blobDoc.content + " " + blobDoc.keywords.join(" "));

      if (status === "refund_requested" || status === "refund_completed") {
        return {
          aiResponse: t(locale, "ai.refundDuplicate", { orderId, content: blobDoc.content }),
          cardEvent: null,
        };
      }

      if (status !== "delivered" && status !== "shipped") {
        return {
          aiResponse: t(locale, "ai.refundIneligibleWithDetail", {
            orderId,
            statusLabel: statusLabel(locale, status),
            content: blobDoc.content,
          }),
          cardEvent: null,
        };
      }

      const refundMarker = `\n\n---\nRefund request submitted (${new Date().toISOString().split("T")[0]})`;
      const updatedContent = `${blobDoc.content}${refundMarker}`;
      const refundKeyword = "refund_requested";
      try {
        await saveDoc(
          context.store,
          "order_doc",
          blobDoc.docId,
          blobDoc.filename,
          updatedContent,
          blobDoc.summary,
          [
            ...blobDoc.keywords.filter(k => !k.includes("refund") && !k.includes("exchange")),
            refundKeyword,
          ]
        );
      } catch {}

      return {
        aiResponse: t(locale, "ai.refundSubmittedSimple", { orderId }),
        cardEvent: {
          type: "refund_progress",
          data: {
            order: {
              orderId,
              status: "refund_requested",
              refundReason: "Customer requested refund",
              refundAmount: 0,
              totalAmount: 0,
              items: [{ name: "Item (see order document)" }],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      };
    }

    return { aiResponse: t(locale, "ai.orderNotFoundShort", { orderId: state.orderId || "" }), cardEvent: null };
  }

  if (order.status === "refund_requested" || order.status === "refund_approved" || order.status === "refund_completed") {
    return {
      aiResponse: t(locale, "ai.refundDuplicateShort", {
        orderId: order.orderId,
        statusLabel: statusLabel(locale, order.status),
      }),
      currentOrder: order,
      cardEvent: { type: "refund_progress", data: { order } },
    };
  }

  if (order.status !== "delivered" && order.status !== "shipped") {
    return {
      aiResponse: t(locale, "ai.refundIneligible", {
        orderId: order.orderId,
        statusLabel: statusLabel(locale, order.status),
      }),
      cardEvent: null,
    };
  }

  const updatedOrder = {
    ...order,
    status: "refund_requested" as const,
    refundReason: state.refundReason || "Customer requested refund",
    refundAmount: order.totalAmount,
    updatedAt: new Date().toISOString(),
  };

  return {
    currentOrder: updatedOrder,
    aiResponse: t(locale, "ai.refundSubmitted", {
      orderId: updatedOrder.orderId,
      amount: updatedOrder.refundAmount,
    }),
    cardEvent: { type: "refund_progress", data: { order: updatedOrder } },
  };
}

// ─── Request Exchange ───

export async function requestExchange(state: AfterSalesStateType, context: any) {
  const locale = (state.locale || "en");
  const sep = ", ";
  const ineligibleNote = (label: string) => ` *(${label}, not eligible for exchange)*`;

  if (!state.currentOrder && !state.orderId) {
    const [storeOrders, blobSummaries] = await Promise.all([
      getAllOrders(context),
      getAllSummaries(context.store, "order_doc").then(filterOrderSummaries),
    ]);

    const storeLines = storeOrders.map(o => {
      const itemNames = o.items.map(i => i.name).join(sep);
      const eligible = o.status === "delivered";
      const note = eligible ? "" : ineligibleNote(statusLabel(locale, o.status));
      return `- **${o.orderId}**: ${itemNames} (¥${o.totalAmount})${note}`;
    });

    const blobLines = blobSummaries.map(s => {
      const status = detectStatusFromText(s.summary + " " + s.keywords.join(" "));
      const eligible = status === "delivered";
      const note = eligible ? "" : ineligibleNote(statusLabel(locale, status));
      return `- **${s.filename}**: ${s.summary.slice(0, 30)}...${note}`;
    });

    const allLines = [...storeLines, ...blobLines].join("\n");
    if (!allLines.trim()) {
      return { aiResponse: t(locale, "ai.exchangeNoOrders"), waitingForUser: false, cardEvent: null };
    }
    return {
      aiResponse: t(locale, "ai.exchangeOrderListPrompt", { lines: allLines }),
      waitingForUser: true,
      cardEvent: null,
    };
  }

  let order = state.currentOrder;
  if (!order && state.orderId) {
    order = await getOrderById(context, state.orderId);
  }

  if (!order) {
    const orderId = state.orderId!;
    const blobDoc = await lookupBlobOrderDoc(context, orderId);
    if (blobDoc) {
      const status = detectStatusFromText(blobDoc.content + " " + blobDoc.keywords.join(" "));

      if (status === "exchange_requested") {
        return {
          aiResponse: t(locale, "ai.exchangeDuplicate", { orderId, content: blobDoc.content }),
          cardEvent: null,
        };
      }

      if (status !== "delivered") {
        return {
          aiResponse: t(locale, "ai.exchangeIneligible", {
            orderId,
            statusLabel: statusLabel(locale, status),
            content: blobDoc.content,
          }),
          cardEvent: null,
        };
      }

      const exchangeMarker = `\n\n---\nExchange request submitted (${new Date().toISOString().split("T")[0]})`;
      const updatedContent = `${blobDoc.content}${exchangeMarker}`;
      const exchangeKeyword = "exchange_requested";
      try {
        await saveDoc(
          context.store,
          "order_doc",
          blobDoc.docId,
          blobDoc.filename,
          updatedContent,
          blobDoc.summary,
          [
            ...blobDoc.keywords.filter(k => !k.includes("refund") && !k.includes("exchange")),
            exchangeKeyword,
          ]
        );
      } catch {}

      return {
        aiResponse: t(locale, "ai.exchangeSubmittedNoItems", { orderId }),
        cardEvent: {
          type: "exchange_confirm",
          data: {
            order: {
              orderId,
              status: "exchange_requested",
              items: [{ name: "Item (see order document)", specs: "-" }],
              exchangeReason: state.exchangeTarget || "Customer requested exchange",
              updatedAt: new Date().toISOString(),
            },
          },
        },
      };
    }

    return { aiResponse: t(locale, "ai.orderNotFoundShort", { orderId: state.orderId || "" }), cardEvent: null };
  }

  if (order.status !== "delivered") {
    return {
      aiResponse: t(locale, "ai.exchangeIneligibleShort", {
        orderId: order.orderId,
        statusLabel: statusLabel(locale, order.status),
      }),
      cardEvent: null,
    };
  }

  const updatedOrder = {
    ...order,
    status: "exchange_requested" as const,
    exchangeReason: state.exchangeTarget || "Customer requested exchange",
    updatedAt: new Date().toISOString(),
  };

  return {
    currentOrder: updatedOrder,
    aiResponse: t(locale, "ai.exchangeSubmitted", {
      orderId: updatedOrder.orderId,
      items: order.items.map(i => i.name).join(sep),
    }),
    cardEvent: { type: "exchange_confirm", data: { order: updatedOrder } },
  };
}

// ─── General Chat ───

export async function generalChat(state: AfterSalesStateType, env: AgentEnv, runtime?: StreamRuntime) {
  const locale = (state.locale || "en");
  const answer = await streamAnswer(env, [
    new SystemMessage(`You are a friendly after-sales support assistant. You can help users:
- Look up order status (needs an order ID)
- Request a return / refund
- Request an exchange
- Answer after-sales policy questions

If the user's question is vague, guide them to share more details. Keep it concise and friendly. The user may write in English, Hindi, or Hinglish — the language directive below tells you which language and tone to reply in.${languageDirective(locale)}`),
    new HumanMessage(state.userInput),
  ], runtime, "general_chat");
  return {
    aiResponse: answer,
    cardEvent: null,
  };
}
