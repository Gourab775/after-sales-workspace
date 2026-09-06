import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "../lib/i18n";
import { ThemeProvider } from "../lib/theme";

export const metadata: Metadata = {
  title: "After-Sales Assistant",
  description: "AI-powered after-sales customer service assistant for order lookup, refunds, exchanges, and policy questions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("after-sales-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
