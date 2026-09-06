"use client";

/**
 * Frontend i18n module — English-only.
 *
 * The app ships in English. `useT()` / `t()` are kept so existing components
 * continue to work unchanged; `locale` is always "en" and `setLocale` is a
 * no-op retained for API compatibility.
 */

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

export type Locale = "en";

// ─── Translation table (English only, no emojis) ───

const EN: Record<string, string> = {
  // Header / page chrome
  "ui.header.title": "After-Sales Assistant",
  "ui.header.subtitle": "Order lookup · Refund · Exchange · Policy",
  "ui.header.kb": "Knowledge Base",
  "ui.header.online": "Online",
  "ui.header.reset": "Reset all data",
  "ui.header.resetting": "Resetting...",
  "ui.header.resetConfirm": "Reset all application data? This will permanently delete all conversations, knowledge-base documents, and orders.",
  "ui.header.resetFailed": "Reset failed. Please try again later.",
  "ui.header.themeLight": "Switch to light mode",
  "ui.header.themeDark": "Switch to dark mode",
  "ui.warn.envMissing": "Environment variables not configured. Some features unavailable.",
  "ui.warn.missing": "Missing: {names}",

  // Chat panel
  "ui.chat.welcome": "Hello! I'm the after-sales assistant. How can I help?\n\nFirst time? Open the Knowledge Base on the top-right and import the demo data.",
  "ui.chat.placeholder": "Describe your issue or enter an order ID...",
  "ui.chat.send": "Send",
  "ui.chat.processing": "Processing...",
  "ui.chat.errorPrefix": "Error: ",
  "ui.chat.errorRequest": "Request failed ({status})",
  "ui.chat.errorQuota": "AI quota exhausted. Please try again later or upgrade your plan.",

  // Suggestions in welcome screen
  "sug.faqPolicy": "What's the return policy?",
  "sug.lookupOrder": "Check order status",
  "sug.refund": "I want a refund",
  "sug.exchange": "I want to exchange",
  "sug.refundApply": "Apply for a refund",
  "sug.lookupOther": "Look up another order",
  "sug.faqGeneral": "After-sales policies",
  "sug.timelineRefund": "How long for refund?",
  "sug.address": "What's the return address?",
  "sug.timelineExchange": "How long for exchange?",
  "sug.lookupMyOrders": "Look up my orders",

  // Manage panel
  "ui.manage.title": "Knowledge Base",
  "ui.manage.tabAll": "All",
  "ui.manage.cat.faq": "FAQ",
  "ui.manage.cat.policy": "Policy",
  "ui.manage.cat.product": "Product",
  "ui.manage.cat.order_doc": "Order",
  "ui.manage.btn.upload": "Upload",
  "ui.manage.btn.addManual": "+ Add Text",
  "ui.manage.btn.importDemo": "Import Demo",
  "ui.manage.demo.preparing": "Preparing import...",
  "ui.manage.empty.title": "No documents yet",
  "ui.manage.empty.hint": "Click \"Import Demo\" on the top-right to get started",
  "ui.manage.form.titleOrderPlaceholder": "Order ID (press Tab to fill an example)",
  "ui.manage.form.titlePlaceholder": "Document title",
  "ui.manage.form.orderHelper": "Enter order info. AI will use it to answer customer questions.",
  "ui.manage.form.orderPlaceholder": "Press Tab to insert an example, or enter manually:\nProduct: Smart Watch Ultra\nSpecs: Titanium / 49mm\nQty: 1\nAmount: 3999\nStatus: Delivered\nOrdered: 2025-05-18\nShipping: YTO Express YT9876543210\nNote: customer requested invoice",
  "ui.manage.form.contentPlaceholder": "Document content (multi-paragraph supported)...",
  "ui.manage.form.cancel": "Cancel",
  "ui.manage.form.save": "Save",
  "ui.manage.form.confirmDelete": "Delete this document?",
  "ui.manage.viewDoc": "View Original",
  "ui.manage.label.order": "Order",
  "ui.manage.unitChars": "{n} chars",

  // Status labels
  "status.pending": "Pending",
  "status.shipped": "Shipped",
  "status.delivered": "Delivered",
  "status.refund_requested": "Refund Requested",
  "status.refund_approved": "Refund Approved",
  "status.refund_completed": "Refund Completed",
  "status.exchange_requested": "Exchange Requested",
  "status.exchange_shipped": "Exchange Shipped",

  // Cards
  "ui.card.order.total": "Total",
  "ui.card.order.shipping": "Shipping",
  "ui.card.order.placedAt": "Ordered",
  "ui.card.refund.title": "Refund Progress",
  "ui.card.refund.orderId": "Order ID",
  "ui.card.refund.product": "Product",
  "ui.card.refund.amount": "Amount",
  "ui.card.refund.reason": "Reason",
  "ui.card.refund.step.submit": "Submitted",
  "ui.card.refund.step.review": "In Review",
  "ui.card.refund.step.complete": "Refunded",
  "ui.card.exchange.title": "Exchange Request",
  "ui.card.exchange.orderId": "Order ID",
  "ui.card.exchange.product": "Product",
  "ui.card.exchange.status": "Status",
  "ui.card.exchange.shipped": "New item shipped",
  "ui.card.exchange.pending": "Awaiting review",
  "ui.card.exchange.notesTitle": "Exchange Notes:",
  "ui.card.exchange.note1": "Keep the item in pristine condition",
  "ui.card.exchange.note2": "Include original packaging and accessories",
  "ui.card.exchange.note3": "New item ships within 3 business days of receipt",
  "ui.card.faq.title": "References",
};

// ─── Context ───

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let str = EN[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.split(`{${k}}`).join(String(v));
        }
      }
      return str;
    },
    []
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale: "en", setLocale: () => {}, t }),
    [t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "en",
      setLocale: () => {},
      t: (key, params) => {
        let str = EN[key] ?? key;
        if (params) for (const [k, v] of Object.entries(params)) str = str.split(`{${k}}`).join(String(v));
        return str;
      },
    };
  }
  return ctx;
}
