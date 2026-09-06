/**
 * Exchange confirmation card.
 */
"use client";

import { useT } from "../../../lib/i18n";

interface Order {
  orderId: string;
  status: string;
  items: Array<{ name: string; specs: string }>;
  exchangeReason?: string;
  updatedAt: string;
}

export function ExchangeCard({ order }: { order: Order }) {
  const { t } = useT();
  return (
    <div className="max-w-sm overflow-hidden rounded-xl border border-purple-200 bg-white shadow-sm dark:border-purple-900/50 dark:bg-slate-900">
      <div className="border-b border-purple-100 bg-purple-50 px-4 py-3 dark:border-purple-900/40 dark:bg-purple-950/30">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span className="text-sm font-medium text-purple-800 dark:text-purple-200">{t("ui.card.exchange.title")}</span>
        </div>
      </div>

      <div className="space-y-2 px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-slate-400">{t("ui.card.exchange.orderId")}</span>
          <span className="font-mono text-gray-700 dark:text-slate-300">{order.orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-slate-400">{t("ui.card.exchange.product")}</span>
          <span className="text-gray-700 dark:text-slate-300">{order.items.map(i => `${i.name}(${i.specs})`).join(", ")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-slate-400">{t("ui.card.exchange.status")}</span>
          <span className="font-medium text-purple-600 dark:text-purple-300">
            {order.status === "exchange_shipped" ? t("ui.card.exchange.shipped") : t("ui.card.exchange.pending")}
          </span>
        </div>

        <div className="mt-3 rounded-lg bg-purple-50 p-2 text-xs text-purple-700 dark:bg-purple-950/30 dark:text-purple-300">
          <p className="mb-1 font-medium">{t("ui.card.exchange.notesTitle")}</p>
          <ul className="list-inside list-disc space-y-0.5 text-purple-600 dark:text-purple-400">
            <li>{t("ui.card.exchange.note1")}</li>
            <li>{t("ui.card.exchange.note2")}</li>
            <li>{t("ui.card.exchange.note3")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
