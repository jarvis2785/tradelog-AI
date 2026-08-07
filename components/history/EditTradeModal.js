"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { calculateRiskReward } from "@/lib/utils";
import { MistakePill, RuleBrokenBadge } from "@/components/Badge";
import RulesChecklist from "@/components/log-trade/RulesChecklist";

const FIELD_LABEL = "block text-small text-text-secondary mb-1.5";

function toEditable(trade) {
  return {
    date: trade.date || "",
    stock_name: trade.stock_name || "",
    exchange: trade.exchange || "NSE",
    quantity: trade.quantity ?? "",
    buy_avg_price: trade.buy_avg_price ?? "",
    sell_avg_price: trade.sell_avg_price ?? "",
    overall_pnl: trade.overall_pnl ?? "",
    target_price: trade.target_price ?? "",
    stop_loss_price: trade.stop_loss_price ?? "",
    entry_time: trade.entry_time || "",
    exit_time: trade.exit_time || "",
    description: trade.description || "",
  };
}

export default function EditTradeModal({ trade, onClose, onSave }) {
  const [form, setForm] = useState(() => toEditable(trade));
  const [rulesBrokenDetail, setRulesBrokenDetail] = useState(trade.rules_broken_detail || []);
  const [saving, setSaving] = useState(false);
  const autoCalcRef = useRef(true);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleOverallPnlChange(value) {
    autoCalcRef.current = false;
    update("overall_pnl", value);
  }

  const rr = calculateRiskReward(form.buy_avg_price, form.target_price, form.stop_loss_price);

  const valid =
    form.stock_name && form.quantity && form.buy_avg_price && form.sell_avg_price && form.date;

  async function handleSave() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({ id: trade.id, ...form, rules_broken_detail: rulesBrokenDetail });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={saving ? undefined : onClose}
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
            <h3 className="text-h3 text-text-primary">Edit Trade</h3>
            <button
              onClick={onClose}
              disabled={saving}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5">
            {(trade.mistake_types?.length > 0 || trade.rule_broken) && (
              <div className="rounded-control border border-border bg-overlay/[0.02] px-3.5 py-3">
                <p className="text-small text-text-muted mb-2">
                  Current tags (will be re-analysed on save)
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <RuleBrokenBadge broken={trade.rule_broken} />
                  {(trade.mistake_types || [])
                    .filter((m) => m && m.toLowerCase() !== "clean trade")
                    .map((m) => (
                      <MistakePill key={m} label={m} />
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={FIELD_LABEL}>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  className="input-field h-11"
                  disabled={saving}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>Stock Name</label>
                <input
                  type="text"
                  value={form.stock_name}
                  onChange={(e) => update("stock_name", e.target.value)}
                  placeholder="e.g. NALCO"
                  className="input-field h-11"
                  disabled={saving}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>Exchange</label>
                <select
                  value={form.exchange}
                  onChange={(e) => update("exchange", e.target.value)}
                  className="input-field h-11"
                  disabled={saving}
                >
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                </select>
              </div>

              <div>
                <label className={FIELD_LABEL}>Quantity</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => update("quantity", e.target.value)}
                  placeholder="0"
                  className="input-field h-11 font-mono"
                  disabled={saving}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>Buy Avg Price ₹</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.buy_avg_price}
                  onChange={(e) => update("buy_avg_price", e.target.value)}
                  placeholder="0.00"
                  className="input-field h-11 font-mono"
                  disabled={saving}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>Sell Avg Price ₹</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.sell_avg_price}
                  onChange={(e) => update("sell_avg_price", e.target.value)}
                  placeholder="0.00"
                  className="input-field h-11 font-mono"
                  disabled={saving}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>Overall P&L ₹</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.overall_pnl}
                  onChange={(e) => handleOverallPnlChange(e.target.value)}
                  placeholder="0.00"
                  className={`input-field h-11 font-mono ${
                    Number(form.overall_pnl) < 0
                      ? "text-loss"
                      : Number(form.overall_pnl) > 0
                      ? "text-profit"
                      : ""
                  }`}
                  disabled={saving}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>Target Price ₹ (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.target_price}
                  onChange={(e) => update("target_price", e.target.value)}
                  placeholder="0.00"
                  className="input-field h-11 font-mono"
                  disabled={saving}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>Stop Loss Price ₹ (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.stop_loss_price}
                  onChange={(e) => update("stop_loss_price", e.target.value)}
                  placeholder="0.00"
                  className="input-field h-11 font-mono"
                  disabled={saving}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>R:R Ratio</label>
                <input
                  type="text"
                  readOnly
                  value={rr !== null ? `${rr}` : "—"}
                  className="input-field h-11 font-mono text-text-secondary cursor-not-allowed"
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>Entry Time (optional)</label>
                <input
                  type="text"
                  value={form.entry_time}
                  onChange={(e) => update("entry_time", e.target.value)}
                  placeholder="HH:MM"
                  className="input-field h-11 font-mono"
                  disabled={saving}
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>Exit Time (optional)</label>
                <input
                  type="text"
                  value={form.exit_time}
                  onChange={(e) => update("exit_time", e.target.value)}
                  placeholder="HH:MM"
                  className="input-field h-11 font-mono"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className={FIELD_LABEL}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Describe your trade..."
                className="input-field min-h-[120px] resize-y leading-relaxed"
                disabled={saving}
              />
            </div>

            <RulesChecklist
              initialBrokenRules={trade.rules_broken_detail || []}
              onChange={setRulesBrokenDetail}
            />

            <button
              onClick={handleSave}
              disabled={!valid || saving}
              className="btn-primary w-full h-12"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
