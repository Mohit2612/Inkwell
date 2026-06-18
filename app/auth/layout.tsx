import Link from "next/link";
import { FileText } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-nav-bg text-nav-text">
      {/* Skip to main content */}
      <a
        href="#auth-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header className="flex items-center border-b border-nav-border px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-nav-bg rounded"
        >
          <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-lg font-bold text-nav-text">{BRAND.name}</span>
        </Link>
      </header>

      <main
        id="auth-main"
        className="flex flex-1 items-center justify-center px-4 py-12"
      >
        {children}
      </main>

      <footer className="py-6 text-center text-sm text-nav-muted">
        © {new Date().getFullYear()} {BRAND.legal}
      </footer>
    </div>
  );
}
