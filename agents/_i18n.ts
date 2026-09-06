/**
 * Backend i18n module — English-only strings shared by agents and cloud-functions.
 *
 * Usage:
 *   import { t, getLocale, languageDirective } from "../_i18n";
 *   const msg = t(locale, "ai.refundSubmitted", { orderId });
 *
 * The frontend (lib/i18n.tsx) maintains a parallel table with the
 * same keys for client-side rendering.
 */

export type Locale = "en";

/** English-only: always returns "en" regardless of request body. */
export function getLocale(_body?: any): Locale {
  return "en";
}

/** Appended to LLM system prompts to force English responses. */
export function languageDirective(_locale?: Locale): string {
  return "\n\nIMPORTANT: Respond entirely in English.";
}

// ─── Translation table (English only) ───

const EN: Record<string, string> = {
  // Status labels
  "status.pending": "Pending",
  "status.shipped": "Shipped",
  "status.delivered": "Delivered",
  "status.refund_requested": "Refund Requested",
  "status.refund_approved": "Refund Approved",
  "status.refund_completed": "Refund Completed",
  "status.exchange_requested": "Exchange Requested",
  "status.exchange_shipped": "Exchange Shipped",
  "status.unknown": "Unknown",

  // Workflow steps
  "step.intent_recognition": "Understanding your question...",
  "step.faq_search": "Searching policies...",
  "step.lookup_order": "Looking up your order...",
  "step.request_refund": "Processing refund request...",
  "step.request_exchange": "Processing exchange request...",
  "step.general_chat": "Thinking...",

  // AI static responses
  "ai.kbEmpty": "Sorry, no relevant documents found in the knowledge base. Please rephrase your question or share your order ID and I'll help.",
  "ai.faqNotFound": "Sorry, I couldn't find any documents matching your question. Please rephrase or share your order ID.",
  "ai.noOrders": "No orders found. Please provide an order ID, or import the demo data from the Knowledge Base.",
  "ai.orderListPrompt": "You have the following orders. Which one would you like to look up?\n\n{lines}",
  "ai.orderFound": "Found your order {orderId}. Current status: **{statusLabel}**.{tracking}",
  "ai.trackingLine": "\nShipping: {carrier} {trackingNumber}",
  "ai.orderNotFound": "Sorry, order {orderId} was not found. Please double-check the ID, or import the demo data from the Knowledge Base.",
  "ai.orderFoundFromBlob": "Found details for order **{orderId}**:\n\n{content}",
  "ai.refundNoOrders": "No orders found, can't process refund. Please import demo data or provide an order ID.",
  "ai.refundOrderListPrompt": "Please choose the order to refund (only Shipped or Delivered orders are eligible):\n\n{lines}\n\nReply with the order ID.",
  "ai.refundDuplicate": "Order {orderId} already has a refund record, no need to apply again.\n\nDetails:\n{content}",
  "ai.refundDuplicateShort": "Order {orderId} already has a refund record (current status: {statusLabel}). No need to apply again.",
  "ai.refundIneligible": "Order {orderId} is currently \"{statusLabel}\" and not eligible for refund. Only Shipped or Delivered orders can be refunded.",
  "ai.refundIneligibleWithDetail": "Order {orderId} is currently \"{statusLabel}\" and not eligible for refund. Only Shipped or Delivered orders can be refunded.\n\nDetails:\n{content}",
  "ai.refundSubmittedSimple": "Refund submitted!\n\n- Order: {orderId}\n- Funds will return to original payment method in 3-5 business days\n\nIf this is a quality issue, we'll provide free pickup service.",
  "ai.refundSubmitted": "Refund submitted!\n\n- Order: {orderId}\n- Refund amount: ¥{amount}\n- Funds will return to original payment method in 3-5 business days\n\nIf this is a quality issue, we'll provide free pickup service.",
  "ai.exchangeNoOrders": "No orders found, can't process exchange. Please import demo data or provide an order ID.",
  "ai.exchangeOrderListPrompt": "Please choose the order to exchange (only Delivered orders are eligible):\n\n{lines}\n\nReply with the order ID.",
  "ai.exchangeDuplicate": "Order {orderId} already has an exchange record, no need to apply again.\n\nDetails:\n{content}",
  "ai.exchangeIneligible": "Order {orderId} is currently \"{statusLabel}\". Only Delivered items can be exchanged.\n\nDetails:\n{content}",
  "ai.exchangeIneligibleShort": "Order {orderId} is currently \"{statusLabel}\". Only Delivered items can be exchanged.",
  "ai.exchangeSubmittedNoItems": "Exchange submitted!\n\n- Order: {orderId}\n- Processing time: new item ships within 3 business days of receiving the old one\n\nPlease return the item in pristine condition with original packaging.",
  "ai.exchangeSubmitted": "Exchange submitted!\n\n- Order: {orderId}\n- Items: {items}\n- Processing time: new item ships within 3 business days of receiving the old one\n\nPlease return the item in pristine condition with original packaging.",
  "ai.orderNotFoundShort": "Order {orderId} not found, please verify the order ID.",

  // Suggestions
  "sug.refund": "Refund this order",
  "sug.exchange": "Exchange this order",
  "sug.refundActionTpl": "I want a refund for {orderId}",
  "sug.exchangeActionTpl": "I want to exchange {orderId}",
  "sug.delivery": "When will it arrive?",
  "sug.deliveryActionTpl": "When will {orderId} arrive?",
  "sug.eta": "When will it ship?",
  "sug.etaActionTpl": "When will {orderId} ship?",
  "sug.cancel": "Cancel this order",
  "sug.cancelActionTpl": "I want to cancel order {orderId}",
  "sug.status": "What's the latest status?",
  "sug.statusActionTpl": "What's the latest status of {orderId}?",
  "sug.lookupOther": "Look up another order",
  "sug.faqGeneral": "After-sales policies",
  "sug.refundApply": "Apply for a refund",
  "sug.timelineRefund": "How long for refund?",
  "sug.address": "What's the return address?",
  "sug.timelineExchange": "How long for exchange?",
  "sug.lookupMyOrders": "Look up my orders",

  // SSE: seed-demo
  "seed.start": "Importing {docs} docs + {orders} orders...",
  "seed.indexing": "[{i}/{n}] Indexing: {title}",
  "seed.importingOrder": "[{i}/{n}] Importing order: {orderId}",
  "seed.failure": "Import failed: {failed} entries had errors. Check storage configuration.",
  "seed.successOnly": "Done! Imported {imported} entries",
  "seed.successWithFailures": "Done! Imported {imported}, failed {failed}",

  // SSE: upload
  "upload.parsing": "Parsing document: {filename}",
  "upload.parseDone": "Parsed, extracted {chars} chars",
  "upload.summarizing": "Generating summary and keywords...",
  "upload.saving": "Saving document...",
  "upload.noText": "Could not extract text from the document.",
  "upload.failure": "Upload failed: {error}",
};

const TABLES: Record<string, Record<string, string>> = { en: EN };

/** Translate `key` to target locale, with optional `{name}` template params. */
export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  let str = TABLES[locale]?.[key] ?? TABLES.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}

/** Get the localized status label. */
export function statusLabel(locale: Locale, status: string): string {
  return t(locale, `status.${status}`);
}
