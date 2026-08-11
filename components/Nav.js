"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Plus, List, Receipt, BarChart2, LogOut, User } from "lucide-react";
import { clearSession } from "@/lib/auth";
import { classNames } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const DESKTOP_NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/log-trade", label: "Log Trade", icon: Plus, accent: true },
  { href: "/history", label: "History", icon: List },
  { href: "/charges", label: "Charges", icon: Receipt },
  { href: "/report", label: "Report", icon: BarChart2 },
];

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/history", label: "History", icon: List },
  { href: "/charges", label: "Charges", icon: Receipt },
  { href: "/report", label: "Report", icon: BarChart2 },
];

const PROFILE_ITEM = { href: "/profile", label: "Profile", icon: User };

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  function navLinkClass(item) {
    const active = isActive(pathname, item.href);
    return classNames(
      "flex items-center gap-3 px-3 h-11 rounded-control text-body font-medium transition-colors duration-150",
      item.accent
        ? "bg-accent text-white hover:bg-accent-hover"
        : active
        ? "bg-overlay/[0.06] text-text-primary"
        : "text-text-secondary hover:text-text-primary hover:bg-overlay/[0.04]"
    );
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-[240px] md:shrink-0 md:h-dvh md:sticky md:top-0 border-r border-border bg-background">
      <div className="flex items-center justify-between gap-2.5 px-6 h-[72px] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">TL</span>
          </div>
          <span className="text-text-primary font-semibold text-body truncate">
            TradeLog AI
          </span>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3 mt-2">
        {DESKTOP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={navLinkClass(item)}>
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border flex flex-col gap-1">
        <Link href={PROFILE_ITEM.href} className={navLinkClass(PROFILE_ITEM)}>
          <User size={18} strokeWidth={2} />
          Profile
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 h-11 w-full rounded-control text-body font-medium text-text-secondary hover:text-loss hover:bg-loss/10 transition-colors duration-150"
        >
          <LogOut size={18} strokeWidth={2} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const items = [...MOBILE_NAV_ITEMS, PROFILE_ITEM];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="flex items-stretch justify-around h-16">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]"
            >
              <div
                className={classNames(
                  "flex items-center justify-center rounded-full transition-colors duration-150",
                  item.accent
                    ? "w-10 h-10 bg-accent text-white"
                    : "w-10 h-10"
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={2.25}
                  className={
                    item.accent
                      ? "text-white"
                      : active
                      ? "text-accent"
                      : "text-text-muted"
                  }
                />
              </div>
              <span
                className={classNames(
                  "text-[10px] font-medium",
                  active || item.accent ? "text-text-primary" : "text-text-muted"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
