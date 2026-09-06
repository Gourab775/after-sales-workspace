"use client";

import { useState, useEffect } from "react";
import { ChatPanel } from "./components/chat-panel";
import { ManagePanel } from "./components/manage-panel";
import { ThemeToggle } from "./components/theme-toggle";
import { useT } from "../lib/i18n";

const GITHUB_URL = "https://github.com/Gourab775/after-sales-workspace";

interface HealthStatus {
  ok: boolean;
  hasAiGateway: boolean;
  hasDatabase?: boolean;
  missing: string[];
}

export default function Home() {
  const { t } = useT();
  const [showManage, setShowManage] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetch("/health")
      .then(r => r.json())
      .then((data: HealthStatus) => setHealth(data))
      .catch(() => {});
  }, []);

  const showWarning = health && !health.ok;

  const handleReset = async () => {
    if (isResetting) return;

    setShowResetModal(false);
    setIsResetting(true);
    try {
      const key = "after-sales-conversation-id";
      const conversationId = localStorage.getItem(key) || crypto.randomUUID();
      await fetch("/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "makers-conversation-id": conversationId,
        },
        body: JSON.stringify({ conversation_id: conversationId }),
      }).catch(() => {});
      const response = await fetch("/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "makers-conversation-id": conversationId,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error("Reset failed");

      localStorage.removeItem(key);
      setShowManage(false);
      setResetVersion(version => version + 1);
    } catch {
      window.alert(t("ui.header.resetFailed"));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="flex h-screen flex-col bg-[#f7f8fa] dark:bg-slate-950">
      {/* Env config warning banner */}
      {showWarning && (
        <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900/50 dark:bg-amber-950/40">
          <svg className="h-4 w-4 flex-shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.008M10.29 3.86 2.82 17.1A1.9 1.9 0 0 0 4.47 20h15.06a1.9 1.9 0 0 0 1.65-2.9L13.71 3.86a1.96 1.96 0 0 0-3.42 0Z" />
          </svg>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-medium text-amber-800 dark:text-amber-200">{t("ui.warn.envMissing")}</span>
            {!health.hasAiGateway && (health.missing?.length ?? 0) > 0 && (
              <span className="ml-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                {t("ui.warn.missing", { names: (health.missing ?? []).join(", ") })}
              </span>
            )}
          </div>
          <button
            onClick={() => setHealth(h => h ? { ...h, ok: true } : h)}
            className="flex-shrink-0 text-sm leading-none text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
            aria-label="Dismiss"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/90 px-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
            AI
          </div>
          <div>
            <h1 className="text-[15px] font-semibold leading-tight text-gray-900 dark:text-slate-100">{t("ui.header.title")}</h1>
            <p className="text-[11px] leading-tight text-gray-400 dark:text-slate-500">{t("ui.header.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub repository"
            aria-label="GitHub repository"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.96.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.42.36.8 1.08.8 2.18v3.23c0 .31.21.67.8.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.74 18.27.5 12 .5z" />
            </svg>
          </a>
          <ThemeToggle />
          <button
            onClick={() => setShowResetModal(true)}
            disabled={isResetting}
            className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
            title={t("ui.header.resetConfirm")}
          >
            {isResetting ? t("ui.header.resetting") : t("ui.header.reset")}
          </button>
          <button
            onClick={() => setShowManage(!showManage)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              showManage
                ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {t("ui.header.kb")}
          </button>
          <span className="hidden items-center gap-1.5 text-[11px] text-gray-400 sm:flex dark:text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {t("ui.header.online")}
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="min-w-0 flex-1">
          <ChatPanel key={resetVersion} />
        </div>

        {showManage && (
          <aside className="w-[380px] max-w-[90vw] flex-shrink-0 border-l border-gray-200/80 bg-white shadow-[-4px_0_12px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
            <ManagePanel onClose={() => setShowManage(false)} />
          </aside>
        )}
      </div>

      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onClick={() => setShowResetModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            aria-describedby="reset-modal-description"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={event => event.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-950/50 dark:text-red-400 dark:ring-red-900/50">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.008M10.29 3.86 2.82 17.1A1.9 1.9 0 0 0 4.47 20h15.06a1.9 1.9 0 0 0 1.65-2.9L13.71 3.86a1.96 1.96 0 0 0-3.42 0Z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="reset-modal-title" className="text-base font-semibold text-gray-900 dark:text-slate-100">
                    {t("ui.header.reset")}
                  </h2>
                  <p id="reset-modal-description" className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                    {t("ui.header.resetConfirm")}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={t("ui.manage.form.cancel")}
                  onClick={() => setShowResetModal(false)}
                  className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {t("ui.manage.form.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("ui.header.reset")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
