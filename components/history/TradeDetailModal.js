"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, AlertTriangle, CheckCircle2, Receipt } from "lucide-react";
import { toDDMMYYYY, formatCurrency } from "@/lib/utils";
import { MistakePill } from "@/components/Badge";
import { supabase, TRADES_TABLE, CHARGES_TABLE } from "@/lib/supabase";

export default function TradeDetailModal({ trade, onClose }) {
  const [expandedImage, setExpandedImage] = useState(false);
  const [dayCharges, setDayCharges] = useState(null);
  const [dayOverallPnl, setDayOverallPnl] = useState(0);
  const [loadingCharges, setLoadingCharges] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingCharges(true);
      const [chargesRes, dayTradesRes] = await Promise.all([
        supabase.from(CHARGES_TABLE).select("*").eq("date", trade.date).maybeSingle(),
        supabase.from(TRADES_TABLE).select("overall_pnl").eq("date", trade.date),
      ]);
      if (!cancelled) {
        setDayCharges(chargesRes.data || null);
        const sum = (dayTradesRes.data || []).reduce(
          (s, t) => s + (Number(t.overall_pnl) || 0),
          0
        );
        setDayOverallPnl(sum);
        setLoadingCharges(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [trade.date]);

  if (!trade) return null;

  const positive = Number(trade.overall_pnl) >= 0;
  const mistakes = (trade.mistake_types || []).filter(
    (m) => m && m.toLowerCase() !== "clean trade"
  );
  const rulesBroken = trade.rules_broken_detail || [];

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface border border-border-hover rounded-t-card sm:rounded-card w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-surface border-b border-border flex items-center justify-between px-5 py-4 z-10">
            <div>
              <h3 className="text-h3 text-text-primary">{trade.stock_name}</h3>
              <p className="text-small text-text-muted mt-0.5">
                {toDDMMYYYY(trade.date)} · {trade.exchange}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-text-secondary mb-1">Overall P&L</p>
                <span
                  className={`font-mono text-2xl font-semibold ${
                    positive ? "text-profit" : "text-loss"
                  }`}
                >
                  {formatCurrency(trade.overall_pnl)}
                </span>
              </div>
              {trade.rule_broken ? (
                <span className="badge-rule-broken flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Rule Broken
                </span>
              ) : (
                <span className="badge-profit flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Clean Trade
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DetailField label="Quantity" value={trade.quantity} />
              <DetailField label="Buy Avg" value={formatCurrency(trade.buy_avg_price)} />
              <DetailField label="Sell Avg" value={formatCurrency(trade.sell_avg_price)} />
              <DetailField label="LTP" value={trade.ltp != null ? formatCurrency(trade.ltp) : "—"} />
              <DetailField
                label="Target"
                value={trade.target_price != null ? formatCurrency(trade.target_price) : "—"}
              />
              <DetailField
                label="Stop Loss"
                value={trade.stop_loss_price != null ? formatCurrency(trade.stop_loss_price) : "—"}
              />
              <DetailField
                label="R:R Ratio"
                value={trade.risk_reward_ratio != null ? trade.risk_reward_ratio : "—"}
              />
              <DetailField
                label="Entry / Exit"
                value={`${trade.entry_time || "—"} / ${trade.exit_time || "—"}`}
              />
            </div>

            {mistakes.length > 0 && (
              <div>
                <p className="text-small text-text-secondary mb-2">Mistakes</p>
                <div className="flex flex-wrap gap-1.5">
                  {mistakes.map((m) => (
                    <MistakePill key={m} label={m} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-small text-text-secondary mb-2">Rules Broken</p>
              {rulesBroken.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {rulesBroken.map((r) => (
                    <span key={r} className="badge-loss">
                      {r}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="badge-profit">All rules followed</span>
              )}
            </div>

            <div className="rounded-control border border-border px-3.5 py-3">
              <div className="flex items-center gap-2 mb-2.5">
                <Receipt size={14} className="text-text-secondary" />
                <p className="text-small font-medium text-text-secondary">Day&apos;s Charges</p>
              </div>
              {loadingCharges ? (
                <div className="skeleton h-4 w-40" />
              ) : dayCharges ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-small text-text-muted mb-0.5">Overall P&L</p>
                    <p
                      className={`font-mono text-body ${
                        dayOverallPnl >= 0 ? "text-profit" : "text-loss"
                      }`}
                    >
                      {formatCurrency(dayOverallPnl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-text-muted mb-0.5">Govt Charges</p>
                    <p className="font-mono text-body text-text-primary">
                      {formatCurrency(dayCharges.govt_charges)}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-text-muted mb-0.5">Brokerage</p>
                    <p className="font-mono text-body text-text-primary">
                      {formatCurrency(dayCharges.brokerage)}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-text-muted mb-0.5">Net P&L</p>
                    <p
                      className={`font-mono text-body font-semibold ${
                        Number(dayCharges.net_pnl) >= 0 ? "text-profit" : "text-loss"
                      }`}
                    >
                      {formatCurrency(dayCharges.net_pnl)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-small text-text-muted">
                  Charges not yet entered —{" "}
                  <Link href="/charges" className="text-accent hover:underline">
                    add them in the Charges section
                  </Link>
                  .
                </p>
              )}
            </div>

            {trade.screenshot_url && (
              <div>
                <p className="text-small text-text-secondary mb-2">Screenshot</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={trade.screenshot_url}
                  alt="Trade screenshot"
                  onClick={() => setExpandedImage(true)}
                  className="w-full max-h-64 object-contain rounded-control border border-border cursor-zoom-in bg-black/40"
                />
              </div>
            )}

            {trade.description && (
              <div>
                <p className="text-small text-text-secondary mb-2">Description</p>
                <blockquote className="border-l-2 border-border-hover pl-3.5 text-body text-text-secondary italic leading-relaxed">
                  {trade.description}
                </blockquote>
              </div>
            )}

            {trade.ai_analysis && (
              <div className="rounded-card border border-accent/30 bg-accent/[0.06] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <Bot size={13} className="text-accent" />
                  </div>
                  <p className="text-small font-medium text-accent">AI Analysis</p>
                </div>
                <p className="text-body text-text-primary leading-relaxed">
                  {trade.ai_analysis}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {expandedImage && trade.screenshot_url && (
        <motion.div
          key="image-expand"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(false)}
        >
          <button
            onClick={() => setExpandedImage(false)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full border border-border-hover text-text-secondary hover:text-text-primary"
          >
            <X size={16} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={trade.screenshot_url}
            alt="Trade screenshot expanded"
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="border border-border rounded-control px-3 py-2.5">
      <p className="text-small text-text-muted mb-0.5">{label}</p>
      <p className="font-mono text-body text-text-primary">{value}</p>
    </div>
  );
}
