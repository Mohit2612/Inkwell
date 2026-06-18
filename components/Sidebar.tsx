"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  LayoutDashboard,
  Sparkles,
  Video,
  Briefcase,
  Library,
  ShieldCheck,
  Target,
  X,
  LogOut,
  Crown,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useAuth } from "./AuthProvider";

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  href?: string;
  badge?: string;
  soon?: boolean;
};

const nav: NavItem[] = [
  { label: "My Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "AI Resume Agent", icon: Sparkles, href: "/agent", badge: "NEW" },
  { label: "Resume Checker", icon: ShieldCheck, href: "/checker" },
  { label: "Keyword Targeting", icon: Target, href: "/keywords" },
  { label: "Sample Library", icon: Library, href: "/samples" },
  { label: "Job Tracker", icon: Briefcase, soon: true },
  { label: "AI Interview", icon: Video, soon: true },
];

const roleColors: Record<string, string> = {
  free: "bg-nav-card text-nav-muted",
  pro: "bg-accent/15 text-accent",
  team: "bg-nav-indigo/15 text-nav-indigo",
  admin: "bg-red-500/15 text-red-400",
};

interface SidebarProps {
  onCreate: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  onCreate,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "flex w-64 shrink-0 flex-col gap-6 border-r border-nav-border bg-nav-bg px-4 py-6",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:static md:translate-x-0",
        ].join(" ")}
        aria-label="Application sidebar"
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="px-2 text-xl font-bold tracking-wide text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {BRAND.name}
          </Link>
          <button
            onClick={onMobileClose}
            className="rounded-md p-1 text-nav-muted hover:bg-nav-card hover:text-nav-text md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={onCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nav-blue to-nav-indigo px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-nav-indigo/20 transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-nav-bg"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create new resume
        </button>

        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = !!item.href && pathname?.startsWith(item.href);
            const classes = `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active
                ? "bg-nav-card text-nav-text"
                : "text-nav-muted hover:bg-nav-card/60 hover:text-nav-text"
            } ${item.soon ? "cursor-not-allowed opacity-60" : ""}`;

            const inner = (
              <>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    {item.badge}
                  </span>
                )}
                {item.soon && (
                  <span className="rounded-full bg-nav-card px-1.5 py-0.5 text-[10px] font-bold text-nav-muted">
                    SOON
                  </span>
                )}
              </>
            );

            if (item.soon || !item.href) {
              return (
                <button key={item.label} className={classes} disabled aria-disabled="true">
                  {inner}
                </button>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onMobileClose}
                aria-current={active ? "page" : undefined}
                className={classes}
              >
                {inner}
              </Link>
            );
          })}
        </nav>

        {/* Pro upsell — only shown on free tier */}
        {profile?.role === "free" && (
          <div className="rounded-xl border border-nav-indigo/30 bg-nav-indigo/10 p-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-nav-indigo" aria-hidden="true" />
              <span className="text-xs font-bold text-nav-text">Upgrade to Pro</span>
            </div>
            <p className="mt-1 text-xs text-nav-muted">
              Unlock AI rewrites, unlimited resumes, and cover letters.
            </p>
            <button className="mt-2.5 w-full rounded-lg bg-nav-indigo/20 py-1.5 text-xs font-semibold text-nav-indigo transition hover:bg-nav-indigo/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo">
              See plans →
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* User footer */}
        {user && (
          <div className="border-t border-nav-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nav-blue to-nav-indigo text-xs font-bold text-white"
                  aria-hidden="true"
                >
                  {(user.email?.[0] ?? "U").toUpperCase()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-nav-text">
                  {user.email}
                </div>
                {profile && (
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      roleColors[profile.role] ?? roleColors.free
                    }`}
                  >
                    {profile.role}
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="rounded-md p-1.5 text-nav-muted hover:bg-nav-card hover:text-red-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
