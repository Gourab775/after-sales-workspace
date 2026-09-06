/**
 * Order detail card — shows order info, items, status, tracking.
 */
"use client";

import { useT } from "../../../lib/i18n";

interface OrderItem {
  name: string;
  specs: string;
  quantity: number;
  price: number;
}

interface Order {
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  trackingNumber?: string;
  carrier?: string;
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  pending: { color: "text-yellow-700 dark:text-yellow-300", bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-900/50" },
  shipped: { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/50" },
  delivered: { color: "text-green-700 dark:text-green-300", bg: "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-900/50" },
  refund_requested: { color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900/50" },
  refund_approved: { color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900/50" },
  refund_completed: { color: "text-gray-700 dark:text-slate-300", bg: "bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-slate-700" },
  exchange_requested: { color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900/50" },
  exchange_shipped: { color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900/50" },
};

export function OrderCard({ order }: { order: Order }) {
  const { t } = useT();
  const colors = STATUS_COLORS[order.status] || { color: "text-gray-700 dark:text-slate-300", bg: "bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-slate-700" };
  const label = t(`status.${order.status}`);

  return (
    <div className="max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
        <span className="font-mono text-xs text-gray-500 dark:text-slate-400">{order.orderId}</span>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.color}`}>
          {label}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-2 px-4 py-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{item.name}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{item.specs} x{item.quantity}</p>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{item.price}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="space-y-1 border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">{t("ui.card.order.total")}</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">{order.totalAmount}</span>
        </div>
        {order.trackingNumber && (
          <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
            <span>{t("ui.card.order.shipping")}</span>
            <span>{order.carrier} {order.trackingNumber}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500">
          <span>{t("ui.card.order.placedAt")}</span>
          <span>{new Date(order.createdAt).toLocaleDateString("en-US")}</span>
        </div>
      </div>
    </div>
  );
}
