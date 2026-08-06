"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileBarChart, Download, RefreshCw, Sparkles } from "lucide-react";
import { supabase, TRADES_TABLE, REPORTS_TABLE } from "@/lib/supabase";
import { getLastNWeeks } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { generateReportPdf } from "@/lib/generatePdf";
import WeekSelector from "@/components/report/WeekSelector";
import ReportView from "@/components/report/ReportView";
import RegenerateConfirmDialog from "@/components/report/RegenerateConfirmDialog";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";

export default function ReportPage() {
  const toast = useToast();
  const weeks = useMemo(() => getLastNWeeks(8), []);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedWeek = weeks[selectedIndex];

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [weekTrades, setWeekTrades] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const [reportRes, tradesRes] = await Promise.all([
        supabase
          .from(REPORTS_TABLE)
          .select("*")
          .eq("week_start", selectedWeek.start)
          .maybeSingle(),
        supabase
          .from(TRADES_TABLE)
          .select("*")
          .gte("date", selectedWeek.start)
          .lte("date", selectedWeek.end),
      ]);

      if (cancelled) return;
      setReport(reportRes.data || null);
      setWeekTrades(tradesRes.data || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedWeek.start, selectedWeek.end]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: selectedWeek.start, week_end: selectedWeek.end }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setReport(data.report);
      toast.success("Weekly report generated");
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
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: selectedWeek.start, week_end: selectedWeek.end }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setReport(data.report);
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
      generateReportPdf(report, weekTrades);
    } catch (err) {
      toast.error("Could not generate PDF. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-h1 text-text-primary">Weekly Report</h1>
        <div className="flex items-center gap-3">
          <WeekSelector weeks={weeks} selectedIndex={selectedIndex} onChange={setSelectedIndex} />
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
            <div className="h-1.5 w-full max-w-xs bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-accent rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      ) : report ? (
        <>
          <ReportView report={report} trades={weekTrades} />
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
      ) : weekTrades.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileBarChart}
            title="No trades logged for this week. Log your trades daily to generate a report."
          />
        </div>
      ) : (
        <div className="card">
          <EmptyState icon={Sparkles} title="Generate This Week's Report" />
          <p className="text-small text-text-muted text-center -mt-4 mb-2">
            AI will analyse all your trades from this week
          </p>
          <div className="flex flex-col items-center gap-4 mt-2">
            {generating ? (
              <div className="w-full max-w-xs flex flex-col items-center gap-3">
                <p className="text-body text-text-secondary flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-accent" />
                  Analysing {weekTrades.length} trade{weekTrades.length !== 1 ? "s" : ""} from this
                  week...
                </p>
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-accent rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" />
                </div>
              </div>
            ) : (
              <button onClick={handleGenerate} className="btn-primary h-11 px-6">
                Generate This Week&apos;s Report
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
