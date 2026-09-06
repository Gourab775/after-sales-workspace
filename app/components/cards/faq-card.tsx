/**
 * FAQ sources card — shows which policy documents were referenced.
 */
"use client";

import { useT } from "../../../lib/i18n";

interface FaqSource {
  id: string;
  title: string;
  category: string;
}

export function FaqCard({ sources }: { sources: FaqSource[] }) {
  const { t } = useT();
  if (!sources || sources.length === 0) return null;

  return (
    <div className="max-w-sm overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm dark:border-blue-900/40 dark:bg-slate-900">
      <div className="border-b border-blue-100 bg-blue-50 px-4 py-2 dark:border-blue-900/40 dark:bg-blue-950/30">
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{t("ui.card.faq.title")}</span>
      </div>
      <div className="space-y-1 px-4 py-2">
        {sources.map(source => (
          <div key={source.id} className="flex items-center gap-2 text-xs">
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span className="text-gray-700 dark:text-slate-300">{source.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
