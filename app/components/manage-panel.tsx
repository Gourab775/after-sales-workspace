"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useT } from "../../lib/i18n";

interface DocItem {
  docId: string;
  category: string;
  filename: string;
  summary: string;
  keywords: string[];
  charCount: number;
  uploadedAt: string;
  totalAmount?: number;
  carrier?: string;
  trackingNumber?: string;
  itemNames?: string;
  status?: string;
}

interface OrderItem {
  productId: string;
  name: string;
  specs: string;
  quantity: number;
  price: number;
}

interface OrderRecord {
  orderId: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  carrier?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
  shipped: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
  delivered: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300",
  refund_requested: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300",
  refund_approved: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300",
  refund_completed: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300",
  exchange_requested: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300",
  exchange_shipped: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300",
};

// Order ID pattern (e.g. ORD-20250520-001)
const ORDER_FILENAME_RE = /^ORD-\d{8}-\d{3,}/i;

/** Detect order status from free-text (English keywords). */
function detectStatusFromText(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("exchange_requested") || lower.includes("exchange request")) return "exchange_requested";
  if (lower.includes("refund_requested") || lower.includes("refund request")) return "refund_requested";
  if (lower.includes("delivered")) return "delivered";
  if (lower.includes("shipped") || lower.includes("in transit")) return "shipped";
  if (lower.includes("pending")) return "pending";
  return null;
}

// Order example data for Tab autocomplete
const ORDER_EXAMPLES = [
  {
    id: "ORD-20250520-001",
    content: `Product: Wireless Noise-Cancelling Headphones Pro\nSpecs: Black / Standard\nQty: 1\nAmount: 1299\nStatus: Delivered\nOrdered: 2025-05-20\nDelivered: 2025-05-22\nShipping: SF Express SF1234567890\nNote: Customer confirmed receipt`,
  },
  {
    id: "ORD-20250518-002",
    content: `Product: Smart Watch Ultra\nSpecs: Titanium / 49mm\nQty: 1\nAmount: 3999\nStatus: Shipped\nOrdered: 2025-05-18\nShipping: YTO Express YT9876543210\nETA: 2025-05-23\nNote: Customer asking about delivery progress`,
  },
  {
    id: "ORD-20250515-003",
    content: `Product: Portable Bluetooth Speaker\nSpecs: Starry Blue / Standard\nQty: 2\nAmount: 598\nStatus: Delivered\nOrdered: 2025-05-15\nDelivered: 2025-05-17\nShipping: Yunda Express YD1122334455\nNote: Customer reports sound quality issue, requesting exchange`,
  },
  {
    id: "ORD-20250510-004",
    content: `Product: Mechanical Keyboard 87-key\nSpecs: Brown Switch / Black\nQty: 1\nAmount: 499\nStatus: Pending\nOrdered: 2025-05-10\nETA Shipping: 2025-05-25\nNote: Stock low, awaiting restock`,
  },
];

const CATEGORY_DOT: Record<string, string> = {
  faq: "bg-blue-500",
  policy: "bg-amber-500",
  product: "bg-emerald-500",
  order_doc: "bg-purple-500",
};

function DocIcon({ category, isOrder }: { category: string; isOrder: boolean }) {
  if (isOrder) {
    return (
      <svg className="h-3.5 w-3.5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14.25c0 2.485 2.686 4.5 6 4.5s6-2.015 6-4.5-2.686-4.5-6-4.5c-1.634 0-3.116.492-4.2 1.295M9 14.25c0-2.485 2.686-4.5 6-4.5m-6 4.5v-2.7c0-1.657 1.343-3 3-3h1.5M3 5.25h18M3 5.25v13.5h18V5.25M3 5.25l1.2-1.8h15.6L21 5.25" />
      </svg>
    );
  }
  return (
    <svg className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

export function ManagePanel({ onClose }: { onClose: () => void }) {
  const { t } = useT();

  const CATEGORIES = useMemo(() => [
    { value: "faq", label: t("ui.manage.cat.faq") },
    { value: "policy", label: t("ui.manage.cat.policy") },
    { value: "product", label: t("ui.manage.cat.product") },
    { value: "order_doc", label: t("ui.manage.cat.order_doc") },
  ], [t]);

  const [docs, setDocs] = useState<DocItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [uploadProgress, setUploadProgress] = useState("");
  const [demoProgress, setDemoProgress] = useState("");
  const [demoCurrentDoc, setDemoCurrentDoc] = useState<{ title: string; category: string } | null>(null);
  const [demoImportedCount, setDemoImportedCount] = useState(0);
  const [demoTotal, setDemoTotal] = useState(0);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("faq");
  const [viewingDoc, setViewingDoc] = useState<{ docId: string; category: string; filename: string; content: string } | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabCycleRef = useRef(0);
  const loadDocsAbortRef = useRef<AbortController | null>(null);
  const conversationId = useMemo(() => {
    const KEY = "after-sales-conversation-id";
    try {
      let id = localStorage.getItem(KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(KEY, id);
      }
      return id;
    } catch {
      return crypto.randomUUID();
    }
  }, []);

  const loadDocs = useCallback(async () => {
    loadDocsAbortRef.current?.abort();
    const ac = new AbortController();
    loadDocsAbortRef.current = ac;

    setIsLoading(true);
    try {
      const body: any = { action: "list", locale: "en" };
      if (activeCategory !== "all") body.category = activeCategory;
      const res = await fetch("/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "makers-conversation-id": conversationId,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") console.error(e);
    } finally {
      if (!ac.signal.aborted) setIsLoading(false);
    }
  }, [activeCategory, conversationId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const loadOrdersList = useCallback(async () => {
    try {
      const res = await fetch("/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "makers-conversation-id": conversationId,
        },
        body: JSON.stringify({ action: "list_orders", locale: "en" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.orders)) {
          setOrders(data.orders as OrderRecord[]);
        }
      }
    } catch {}
  }, [conversationId]);

  useEffect(() => { loadOrdersList(); }, [loadOrdersList]);

  const handleViewDoc = async (docId: string, category: string, filename: string) => {
    setLoadingContent(true);
    try {
      const res = await fetch("/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "makers-conversation-id": conversationId,
        },
        body: JSON.stringify({ action: "get", docId, category, locale: "en" }),
      });
      if (res.ok) {
        const data = await res.json();
        setViewingDoc({ docId, category, filename, content: data.content || "" });
      }
    } catch {} finally { setLoadingContent(false); }
  };

  const handleDelete = async (docId: string, category: string) => {
    if (!confirm(t("ui.manage.form.confirmDelete"))) return;
    try {
      await fetch("/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "makers-conversation-id": conversationId,
        },
        body: JSON.stringify({ action: "delete", docId, category, locale: "en" }),
      });
      setDocs(prev => prev.filter(d => d.docId !== docId));
    } catch {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(t("upload.parsing", { filename: file.name }));
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const uploadCategory = activeCategory !== "all" ? activeCategory : formCategory;
      try {
        const res = await fetch("/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "makers-conversation-id": conversationId,
          },
          body: JSON.stringify({ file: base64, filename: file.name, category: uploadCategory, locale: "en" }),
        });
        if (!res.ok) throw new Error("Upload failed");
        const reader2 = res.body?.getReader();
        if (reader2) {
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { value, done } = await reader2.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const ev = JSON.parse(line.slice(6));
                if (ev.type === "progress") setUploadProgress(ev.message);
                if (ev.type === "complete") { setUploadProgress(""); loadDocs(); }
              } catch {}
            }
          }
        }
      } catch (err) {
        setUploadProgress(t("upload.failure", { error: (err as Error).message }));
        setTimeout(() => setUploadProgress(""), 3000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddText = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setUploadProgress(t("upload.saving"));
    try {
      const res = await fetch("/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "makers-conversation-id": conversationId,
        },
        body: JSON.stringify({ text: formContent, title: formTitle, category: formCategory, locale: "en" }),
      });
      if (!res.ok) throw new Error("Save failed");
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const ev = JSON.parse(line.slice(6));
              if (ev.type === "progress") setUploadProgress(ev.message);
              if (ev.type === "complete") {
                setUploadProgress("");
                setShowAddForm(false);
                setFormTitle("");
                setFormContent("");
                loadDocs();
                loadOrdersList();
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setUploadProgress(t("upload.failure", { error: (err as Error).message }));
      setTimeout(() => setUploadProgress(""), 3000);
    }
  };

  const handleSeedDemo = async () => {
    setDemoProgress(t("ui.manage.demo.preparing"));
    setDemoCurrentDoc(null);
    setDemoImportedCount(0);
    setDemoTotal(0);
    try {
      const res = await fetch("/seed-demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "makers-conversation-id": conversationId,
        },
        body: JSON.stringify({ locale: "en" }),
      });
      if (!res.ok) throw new Error("Seed failed");
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            if (line.slice(6).trim() === "[DONE]") break;
            try {
              const ev = JSON.parse(line.slice(6));
              if (ev.type === "progress") {
                setDemoProgress(ev.message);
                if (ev.total) setDemoTotal(ev.total);
              }
              if (ev.type === "doc_imported" || ev.type === "order_imported") {
                setDemoCurrentDoc({ title: ev.title, category: ev.category || "order_doc" });
                setDemoImportedCount(c => c + 1);
              }
              if (ev.type === "complete") {
                setDemoProgress("");
                setDemoCurrentDoc(null);
                setDemoImportedCount(0);
                setDemoTotal(0);
                loadDocs();
                loadOrdersList();
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setDemoProgress(t("upload.failure", { error: (err as Error).message }));
      setTimeout(() => { setDemoProgress(""); setDemoCurrentDoc(null); }, 3000);
    }
  };

  const catMeta = (cat: string) => CATEGORIES.find(c => c.value === cat);
  const statusLabelOf = (s: string) => t(`status.${s}`);
  const orderTagLabel = t("ui.manage.label.order");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 dark:border-slate-800">
        <span className="text-[13px] font-semibold text-gray-800 dark:text-slate-100">{t("ui.manage.title")}</span>
        <button onClick={onClose} aria-label="Close" className="flex h-6 w-6 items-center justify-center rounded-md text-lg leading-none text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">&times;</button>
      </div>

      {/* Category filter */}
      <div className="flex flex-shrink-0 gap-1.5 border-b border-gray-50 px-3 py-2 dark:border-slate-800/60">
        <button
          onClick={() => setActiveCategory("all")}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
            activeCategory === "all" ? "bg-gray-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900" : "text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >{t("ui.manage.tabAll")}</button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
              activeCategory === cat.value ? "bg-gray-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900" : "text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[cat.value] || "bg-gray-400"}`} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-gray-50 px-3 py-2.5 dark:border-slate-800/60">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="h-7 rounded-md bg-gray-900 px-2.5 text-[11px] font-medium text-white transition-colors hover:bg-gray-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >{t("ui.manage.btn.upload")}</button>
        <button
          onClick={() => {
            if (!showAddForm && activeCategory !== "all") {
              setFormCategory(activeCategory);
            }
            setShowAddForm(!showAddForm);
          }}
          className="h-7 rounded-md border border-gray-200 px-2.5 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >{t("ui.manage.btn.addManual")}</button>
        <button
          onClick={handleSeedDemo}
          disabled={!!demoProgress}
          className="ml-auto h-7 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 text-[11px] font-medium text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
        >{t("ui.manage.btn.importDemo")}</button>
        <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.md,.pdf,.docx,.doc,.xlsx,.xls,.csv,.json" onChange={handleFileUpload} />
      </div>

      {/* Demo import progress */}
      {(demoProgress || demoCurrentDoc) && (
        <div className="flex-shrink-0 space-y-2 border-b border-indigo-100 bg-indigo-50 px-3 py-2.5 dark:border-indigo-900/40 dark:bg-indigo-950/30">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            <span className="flex-1 truncate text-[11px] font-medium text-indigo-700 dark:text-indigo-300">{demoProgress}</span>
            {demoTotal > 0 && (
              <span className="flex-shrink-0 text-[10px] text-indigo-400">{demoImportedCount}/{demoTotal}</span>
            )}
          </div>
          {demoTotal > 0 && (
            <div className="h-1 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${(demoImportedCount / demoTotal) * 100}%` }}
              />
            </div>
          )}
          {demoCurrentDoc && (
            <div className="flex items-center gap-2 rounded-md border border-indigo-100 bg-white px-2 py-1 dark:border-indigo-900/50 dark:bg-slate-900">
              <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${CATEGORY_DOT[demoCurrentDoc.category] || "bg-gray-400"}`} />
              <span className="flex-1 truncate text-[11px] text-gray-700 dark:text-slate-300">{demoCurrentDoc.title}</span>
              <span className="flex-shrink-0 text-[10px] text-indigo-400">{catMeta(demoCurrentDoc.category)?.label}</span>
            </div>
          )}
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress && (
        <div className="flex flex-shrink-0 items-center gap-2 bg-indigo-50 px-3 py-1.5 dark:bg-indigo-950/30">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <span className="text-[11px] text-indigo-700 dark:text-indigo-300">{uploadProgress}</span>
        </div>
      )}

      {/* Inline form */}
      {showAddForm && (
        <div className="flex-shrink-0 space-y-2 border-b border-gray-100 bg-gray-50/50 px-3 py-3 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex gap-2">
            <input
              value={formTitle}
              onChange={e => { setFormTitle(e.target.value); tabCycleRef.current = 0; }}
              onKeyDown={e => {
                if (e.key === "Tab" && formCategory === "order_doc") {
                  e.preventDefault();
                  const example = ORDER_EXAMPLES[tabCycleRef.current % ORDER_EXAMPLES.length];
                  tabCycleRef.current += 1;
                  setFormTitle(example.id);
                  setFormContent(example.content);
                }
              }}
              placeholder={formCategory === "order_doc" ? t("ui.manage.form.titleOrderPlaceholder") : t("ui.manage.form.titlePlaceholder")}
              className="h-8 flex-1 rounded-md border border-gray-200 bg-white px-3 text-[12px] text-gray-900 outline-none focus:ring-1 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <select
              value={formCategory}
              onChange={e => { setFormCategory(e.target.value); tabCycleRef.current = 0; setFormTitle(""); setFormContent(""); }}
              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-[11px] text-gray-700 outline-none focus:ring-1 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {formCategory === "order_doc" ? (
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 dark:text-slate-500">{t("ui.manage.form.orderHelper")}</p>
              <textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const example = ORDER_EXAMPLES[tabCycleRef.current % ORDER_EXAMPLES.length];
                    tabCycleRef.current += 1;
                    setFormTitle(example.id);
                    setFormContent(example.content);
                  }
                }}
                placeholder={t("ui.manage.form.orderPlaceholder")}
                rows={7}
                className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-[12px] text-gray-900 outline-none focus:ring-1 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          ) : (
            <textarea
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              placeholder={t("ui.manage.form.contentPlaceholder")}
              rows={5}
              className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-900 outline-none focus:ring-1 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="h-7 rounded-md px-3 text-[11px] text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800">{t("ui.manage.form.cancel")}</button>
            <button
              onClick={handleAddText}
              disabled={!formTitle.trim() || !formContent.trim()}
              className="h-7 rounded-md bg-indigo-600 px-3 text-[11px] font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
            >{t("ui.manage.form.save")}</button>
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        {(() => {
          const showOrders = activeCategory === "all" || activeCategory === "order_doc";
          const visibleOrders = showOrders ? orders : [];
          const isEmpty = docs.length === 0 && visibleOrders.length === 0;

          if (isLoading) {
            return (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500" />
              </div>
            );
          }
          if (isEmpty) {
            return (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
                  <svg className="h-5 w-5 text-gray-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <p className="text-[13px] font-medium text-gray-500 dark:text-slate-400">{t("ui.manage.empty.title")}</p>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">{t("ui.manage.empty.hint")}</p>
              </div>
            );
          }
          return (
            <div className="divide-y divide-gray-50 dark:divide-slate-800/60">
              {/* Real orders */}
              {visibleOrders.map(order => {
                const itemNames = order.items.map(i => i.name).join(", ");
                const sLabel = statusLabelOf(order.status);
                const sColor = STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400";
                return (
                  <div key={`order-${order.orderId}`} className="group px-3 py-3 transition-colors hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-purple-50 dark:bg-purple-950/40">
                        <DocIcon category="order_doc" isOrder />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[12px] font-medium text-gray-900 dark:text-slate-100">{order.orderId}</span>
                          <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] ${sColor}`}>
                            {sLabel}
                          </span>
                          <span className="flex-shrink-0 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-500 dark:bg-purple-950/40 dark:text-purple-300">{orderTagLabel}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-400 dark:text-slate-500">{itemNames}</p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          {order.carrier && (
                            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">{order.carrier}</span>
                          )}
                          {order.trackingNumber && (
                            <span className="rounded bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 dark:bg-slate-800 dark:text-slate-400">{order.trackingNumber}</span>
                          )}
                          <span className="ml-auto text-[10px] text-gray-300 dark:text-slate-500">{order.totalAmount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Knowledge base docs */}
              {docs.map(doc => {
                const isOrderDoc = doc.category === "order_doc" && ORDER_FILENAME_RE.test(doc.filename);
                const detectedStatus = isOrderDoc
                  ? (doc.status || detectStatusFromText(`${doc.summary} ${(doc.keywords || []).join(" ")}`))
                  : null;
                const sLabel = detectedStatus ? statusLabelOf(detectedStatus) : null;
                const sColor = detectedStatus ? STATUS_COLORS[detectedStatus] : null;
                const description = isOrderDoc && doc.itemNames ? doc.itemNames : doc.summary;
                return (
                <div key={doc.docId} className="group px-3 py-3 transition-colors hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${isOrderDoc ? "bg-purple-50 dark:bg-purple-950/40" : "bg-gray-100 dark:bg-slate-800"}`}>
                      <DocIcon category={doc.category} isOrder={isOrderDoc} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[12px] font-medium text-gray-900 dark:text-slate-100">{doc.filename}</span>
                        {sLabel && sColor && (
                          <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] ${sColor}`}>
                            {sLabel}
                          </span>
                        )}
                        <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] ${isOrderDoc ? "bg-purple-50 text-purple-500 dark:bg-purple-950/40 dark:text-purple-300" : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {catMeta(doc.category)?.label}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-400 dark:text-slate-500">{description}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {isOrderDoc ? (
                          <>
                            {doc.carrier && (
                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">{doc.carrier}</span>
                            )}
                            {doc.trackingNumber && (
                              <span className="rounded bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 dark:bg-slate-800 dark:text-slate-400">{doc.trackingNumber}</span>
                            )}
                            {doc.totalAmount !== undefined ? (
                              <span className="ml-auto text-[10px] text-gray-400 dark:text-slate-500">{doc.totalAmount}</span>
                            ) : (
                              <span className="ml-auto text-[10px] text-gray-300 dark:text-slate-500">{t("ui.manage.unitChars", { n: doc.charCount })}</span>
                            )}
                          </>
                        ) : (
                          <>
                            {doc.keywords?.slice(0, 3).map(kw => (
                              <span key={kw} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">{kw}</span>
                            ))}
                            <span className="ml-auto text-[10px] text-gray-300 dark:text-slate-500">{t("ui.manage.unitChars", { n: doc.charCount })}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDoc(doc.docId, doc.category, doc.filename)}
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 opacity-0 transition-all hover:bg-indigo-50 hover:text-indigo-500 group-hover:opacity-100 dark:hover:bg-indigo-950/50"
                      title={t("ui.manage.viewDoc")}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(doc.docId, doc.category)}
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/40"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Document Content Viewer */}
      {viewingDoc && (
        <div className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-slate-900">
          <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 dark:border-slate-800">
            <div className="flex min-w-0 items-center gap-2">
              <button onClick={() => setViewingDoc(null)} className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="truncate text-[12px] font-medium text-gray-800 dark:text-slate-100">{viewingDoc.filename}</span>
              <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                {catMeta(viewingDoc.category)?.label}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loadingContent ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500" />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-gray-700 dark:text-slate-300">{viewingDoc.content}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
