/**
 * Refund progress card — shows refund status and timeline.
 */
"use client";

import { useT } from "../../../lib/i18n";

interface Order {
  orderId: string;
  status: string;
  refundReason?: string;
  refundAmount?: number;
  totalAmount: number;
  items: Array<{ name: string }>;
  updatedAt: string;
}

export function RefundCard({ order }: { order: Order }) {
  const { t } = useT();
  const steps = [
    { label: t("ui.card.refund.step.submit"), done: true },
    { label: t("ui.card.refund.step.review"), done: order.status !== "refund_requested" },
    { label: t("ui.card.refund.step.complete"), done: order.status === "refund_completed" },
  ];

  return (
    <div className="max-w-sm overflow-hidden rounded-xl border border-orange-200 bg-white shadow-sm dark:border-orange-900/50 dark:bg-slate-900">
      <div className="border-b border-orange-100 bg-orange-50 px-4 py-3 dark:border-orange-900/40 dark:bg-orange-950/30">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14.25c0 2.485 2.686 4.5 6 4.5s6-2.015 6-4.5-2.686-4.5-6-4.5c-1.634 0-3.116.492-4.2 1.295M9 14.25c0-2.485 2.686-4.5 6-4.5m-6 4.5v-2.7c0-1.657 1.343-3 3-3h1.5M3 5.25h18M3 5.25v13.5h18V5.25M3 5.25l1.2-1.8h15.6L21 5.25" />
          </svg>
          <span className="text-sm font-medium text-orange-800 dark:text-orange-200">{t("ui.card.refund.title")}</span>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-slate-400">{t("ui.card.refund.orderId")}</span>
            <span className="font-mono text-gray-700 dark:text-slate-300">{order.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-slate-400">{t("ui.card.refund.product")}</span>
            <span className="text-gray-700 dark:text-slate-300">{order.items.map(i => i.name).join(", ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-slate-400">{t("ui.card.refund.amount")}</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">{order.refundAmount || order.totalAmount}</span>
          </div>
          {order.refundReason && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-slate-400">{t("ui.card.refund.reason")}</span>
              <span className="text-gray-700 dark:text-slate-300">{order.refundReason}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-2 pt-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                step.done ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-400 dark:bg-slate-700 dark:text-slate-500"
              }`}>
                {step.done ? (
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m5 13 4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-xs ${step.done ? "text-orange-700 dark:text-orange-300" : "text-gray-400 dark:text-slate-500"}`}>{step.label}</span>
              {i < steps.length - 1 && (
                <div className={`mx-1 h-0.5 w-6 ${step.done ? "bg-orange-300" : "bg-gray-200 dark:bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
