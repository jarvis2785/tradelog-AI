"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toDDMMYYYY, formatCurrency } from "@/lib/utils";
import { MistakePill } from "@/components/Badge";

export default function TradeDetailModal({ trade, onClose }) {
  const [expandedImage, setExpandedImage] = useState(false);

  if (!trade) return null;

  const positive = Number(trade.net_pnl) >= 0;
  const mistakes = (trade.mistake_types || []).filter(
    (m) => m && m.toLowerCase() !== "clean trade"
  );

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
              <span
                className={`font-mono text-2xl font-semibold ${
                  positive ? "text-profit" : "text-loss"
                }`}
              >
                {formatCurrency(trade.net_pnl)}
              </span>
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
