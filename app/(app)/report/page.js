"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileBarChart, Download, RefreshCw, Sparkles } from "lucide-react";
import { supabase, TRADES_TABLE, REPORTS_TABLE, CHARGES_TABLE } from "@/lib/supabase";
import { getLastNWeeks, getLastNMonths } from "@/lib/utils";
import { useRiskPerTrade } from "@/lib/useRiskPerTrade";
import { useToast } from "@/components/Toast";
import { generateReportPdf } from "@/lib/generatePdf";
import { computePerformanceStats, computeDayOfWeekAnalysis } from "@/lib/reportStats";
import ReportTabs from "@/components/report/ReportTabs";
import WeekSelector from "@/components/report/WeekSelector";
import MonthSelector from "@/components/report/MonthSelector";
import ReportView from "@/components/report/ReportView";
import RegenerateConfirmDialog from "@/components/report/RegenerateConfirmDialog";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";

const EMPTY_TITLE = {
  weekly: "No trades logged for this week. Log your trades daily to generate a report.",
  monthly: "No trades logged for this month. Log your trades daily to generate a report.",
  overall: "No trades logged yet. Log your first trade to generate a report.",
};

const GENERATE_LABEL = {
  weekly: "Generate This Week's Report",
  monthly: "Generate This Month's Report",
  overall: "Generate All-Time Report",
};

const PERIOD_LABEL = {
  weekly: "this week",
  monthly: "this month",
  overall: "all time",
};

function buildCalculatedStats(trades, riskPerTrade) {
  const perf = computePerformanceStats(trades, riskPerTrade);
  const dow = computeDayOfWeekAnalysis(trades, riskPerTrade);
  return { ...perf, dayOfWeek: dow.rows, bestDay: dow.bestDay, worstDay: dow.worstDay };
}

export default function ReportPage() {
  const toast = useToast();
  const { riskPerTrade } = useRiskPerTrade();

  const weeks = useMemo(() => getLastNWeeks(8), []);
  const months = useMemo(() => getLastNMonths(12), []);

  const [activeTab, setActiveTab] = useState("weekly");
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

  const activeRange = useMemo(() => {
    if (activeTab === "weekly") {
      const w = weeks[selectedWeekIndex];
      return { start: w.start, end: w.end, monthYear: null };
    }
    if (activeTab === "monthly") {
      const m = months[selectedMonthIndex];
      return { start: m.start, end: m.end, monthYear: m.label };
    }
    return { start: null, end: null, monthYear: null };
  }, [activeTab, selectedWeekIndex, selectedMonthIndex, weeks, months]);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [periodTrades, setPeriodTrades] = useState([]);
  const [periodCharges, setPeriodCharges] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      let reportQuery = supabase.from(REPORTS_TABLE).select("*").eq("report_type", activeTab);
      if (activeTab === "weekly") reportQuery = reportQuery.eq("week_start", activeRange.start);
      if (activeTab === "monthly")
        reportQuery = reportQuery.eq("month_year", activeRange.monthYear);

      let tradesQuery = supabase.from(TRADES_TABLE).select("*").order("date", { ascending: true });
      if (activeRange.start) tradesQuery = tradesQuery.gte("date", activeRange.start);
      if (activeRange.end) tradesQuery = tradesQuery.lte("date", activeRange.end);

      let chargesQuery = supabase.from(CHARGES_TABLE).select("*");
      if (activeRange.start) chargesQuery = chargesQuery.gte("date", activeRange.start);
      if (activeRange.end) chargesQuery = chargesQuery.lte("date", activeRange.end);

      const [reportRes, tradesRes, chargesRes] = await Promise.all([
        reportQuery.maybeSingle(),
        tradesQuery,
        chargesQuery,
      ]);

      if (cancelled) return;
      setReport(reportRes.data || null);
      setPeriodTrades(tradesRes.data || []);
      setPeriodCharges(chargesRes.data || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, activeRange]);

  async function runGenerate() {
    const calculated_stats = buildCalculatedStats(periodTrades, riskPerTrade);
    const body = { report_type: activeTab, calculated_stats };
    if (activeTab === "weekly") {
      body.week_start = activeRange.start;
      body.week_end = activeRange.end;
    } else if (activeTab === "monthly") {
      body.month_year = activeRange.monthYear;
    }

    const res = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Something went wrong. Please try again.");
    }
    return data.report;
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const generated = await runGenerate();
      setReport(generated);
      toast.success("Report generated");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate() {
    setShowRegenerateConfirm(false);
    setRegenerating(true);
    try {
      const generated = await runGenerate();
      setReport(generated);
      toast.success("Report regenerated successfully");
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setRegenerating(false);
    }
  }

  function handleDownloadPdf() {
    if (!report) return;
    try {
      generateReportPdf(report, periodTrades, periodCharges, riskPerTrade);
    } catch (err) {
      toast.error("Could not generate PDF. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-20">
      <div className="flex flex-col gap-3">
        <h1 className="text-h1 text-text-primary">Performance Report</h1>
        <ReportTabs active={activeTab} onChange={setActiveTab} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {activeTab === "weekly" && (
            <WeekSelector
              weeks={weeks}
              selectedIndex={selectedWeekIndex}
              onChange={setSelectedWeekIndex}
            />
          )}
          {activeTab === "monthly" && (
            <MonthSelector
              months={months}
              selectedIndex={selectedMonthIndex}
              onChange={setSelectedMonthIndex}
            />
          )}
          {activeTab === "overall" && <div />}
          {!loading && report && !regenerating && (
            <button
              onClick={() => setShowRegenerateConfirm(true)}
              className="btn-outline-accent h-11 px-4 shrink-0"
            >
              <RefreshCw size={16} />
              Regenerate Report
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : regenerating ? (
        <div className="card">
          <div className="flex flex-col items-center gap-4 py-10">
            <p className="text-body text-text-secondary flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-accent" />
              Regenerating report...
            </p>
            <div className="h-1.5 w-full max-w-xs bg-overlay/[0.06] rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-accent rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      ) : report ? (
        <>
          <ReportView
            report={report}
            trades={periodTrades}
            dailyCharges={periodCharges}
            riskPerTrade={riskPerTrade}
          />
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleDownloadPdf}
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 z-30 btn-primary h-12 px-5 shadow-card-hover"
          >
            <Download size={18} />
            Download PDF
          </motion.button>
        </>
      ) : periodTrades.length === 0 ? (
        <div className="card">
          <EmptyState icon={FileBarChart} title={EMPTY_TITLE[activeTab]} />
        </div>
      ) : (
        <div className="card">
          <EmptyState icon={Sparkles} title={GENERATE_LABEL[activeTab]} />
          <p className="text-small text-text-muted text-center -mt-4 mb-2">
            AI will analyse all your trades from {PERIOD_LABEL[activeTab]}
          </p>
          <div className="flex flex-col items-center gap-4 mt-2">
            {generating ? (
              <div className="w-full max-w-xs flex flex-col items-center gap-3">
                <p className="text-body text-text-secondary flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-accent" />
                  Analysing {periodTrades.length} trade{periodTrades.length !== 1 ? "s" : ""} from{" "}
                  {PERIOD_LABEL[activeTab]}...
                </p>
                <div className="h-1.5 w-full bg-overlay/[0.06] rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-accent rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" />
                </div>
              </div>
            ) : (
              <button onClick={handleGenerate} className="btn-primary h-11 px-6">
                {GENERATE_LABEL[activeTab]}
              </button>
            )}
            {error && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-small text-loss">{error}</p>
                <button onClick={handleGenerate} className="btn-secondary h-9 px-4 text-small">
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showRegenerateConfirm && (
        <RegenerateConfirmDialog
          regenerating={regenerating}
          onCancel={() => setShowRegenerateConfirm(false)}
          onConfirm={handleRegenerate}
        />
      )}
    </div>
  );
}
