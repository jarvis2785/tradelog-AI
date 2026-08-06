"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, LogOut, Inbox, ArrowDown } from "lucide-react";
import { useTrades } from "@/lib/useTrades";
import { computeDashboardStats, computeWeeklyChartData } from "@/lib/stats";
import { getGreeting, formatCurrency, formatCompactCurrency } from "@/lib/utils";
import { clearSession } from "@/lib/auth";
import StatCard from "@/components/StatCard";
import { StatCardSkeleton } from "@/components/Skeleton";
import PnlChart from "@/components/PnlChart";
import RecentTrades from "@/components/RecentTrades";
import EmptyState from "@/components/EmptyState";

export default function DashboardPage() {
  const { trades, loading } = useTrades();
  const router = useRouter();

  const stats = useMemo(() => computeDashboardStats(trades), [trades]);
  const chartData = useMemo(() => computeWeeklyChartData(trades), [trades]);
  const recentTrades = useMemo(() => trades.slice(0, 5), [trades]);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 md:text-h1 text-text-primary">
            {getGreeting()}, Umesh
          </h1>
          <p className="text-body text-text-secondary mt-1">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/log-trade"
            className="btn-primary hidden md:inline-flex"
          >
            <Plus size={16} />
            Log Today&apos;s Trade
          </Link>
          <button
            onClick={handleLogout}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full border border-border text-text-secondary hover:text-loss hover:border-loss/40 transition-colors"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {!loading && trades.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Inbox}
            title="No trades logged yet. Start by tapping Log Trade."
            subtitle="Your dashboard will fill up once you log your first trade."
          />
          <div className="flex justify-center -mt-2 mb-2 text-text-muted">
            <ArrowDown size={18} className="animate-bounce" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <StatCard
                  label="Today's P&L"
                  value={stats.todaysPnl}
                  formatter={(v) => formatCurrency(v)}
                  tone={stats.todaysPnl >= 0 ? "profit" : "loss"}
                />
                <StatCard
                  label="This Week's P&L"
                  value={stats.weekPnl}
                  formatter={(v) => formatCurrency(v)}
                  tone={stats.weekPnl >= 0 ? "profit" : "loss"}
                />
                <StatCard
                  label="All Time Win Rate"
                  value={stats.winRate}
                  formatter={(v) => `${v.toFixed(1)}%`}
                  tone="accent"
                />
                <StatCard
                  label="Total Trades"
                  value={stats.totalTrades}
                  formatter={(v) => Math.round(v).toLocaleString("en-IN")}
                  tone="accent"
                />
                <StatCard
                  label="Rule Compliance"
                  value={stats.ruleCompliance}
                  formatter={(v) => `${v.toFixed(0)}%`}
                  tone={stats.ruleCompliance >= 70 ? "profit" : "loss"}
                />
                <StatCard
                  label="Current Streak"
                  raw={stats.streakLabel}
                  tone={
                    stats.streakType === "W"
                      ? "profit"
                      : stats.streakType === "L"
                      ? "loss"
                      : "neutral"
                  }
                />
              </>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-h3 text-text-primary">This Week&apos;s P&L</h3>
            </div>
            <PnlChart data={chartData} />
          </div>

          {!loading && recentTrades.length > 0 && (
            <RecentTrades trades={recentTrades} />
          )}
        </>
      )}

      {/* Mobile fixed CTA */}
      <Link
        href="/log-trade"
        className="md:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-4 right-4 z-30 btn-primary h-12 shadow-card-hover"
      >
        <Plus size={18} />
        Log Today&apos;s Trade
      </Link>
    </div>
  );
}
