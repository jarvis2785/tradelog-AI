"use client";

import { useState } from "react";
import { Pencil, Check, X, Loader2, Target } from "lucide-react";
import { supabase, SETTINGS_TABLE } from "@/lib/supabase";
import { useRiskPerTrade } from "@/lib/useRiskPerTrade";
import { useToast } from "@/components/Toast";
import { formatCurrency } from "@/lib/utils";

export default function RiskPerTradeCard() {
  const toast = useToast();
  const { riskPerTrade, settingsId, loading, refetch } = useRiskPerTrade();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setValue(riskPerTrade != null ? String(riskPerTrade) : "");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setValue("");
  }

  async function handleSave() {
    const num = Number(value);
    if (!value || Number.isNaN(num) || num <= 0 || !settingsId) return;
    setSaving(true);
    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .update({ risk_per_trade: num, updated_at: new Date().toISOString() })
      .eq("id", settingsId);
    setSaving(false);
    if (error) {
      toast.error("Could not save risk per trade. Please try again.");
      return;
    }
    toast.success("Risk per trade updated");
    setEditing(false);
    setValue("");
    refetch();
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center">
          <Target size={20} className="text-accent" />
        </div>
        <div>
          <h3 className="text-h3 text-text-primary">Risk Per Trade</h3>
          <p className="text-small text-text-secondary mt-0.5">
            Base value for R-multiple calculations across the app.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-11 w-full" />
      ) : editing ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body text-text-secondary">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={saving}
              className="input-field h-11 pl-7 font-mono"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !value || Number(value) <= 0}
            className="btn-primary h-11 px-4"
            aria-label="Save risk per trade"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          </button>
          <button
            onClick={cancelEdit}
            disabled={saving}
            className="btn-secondary h-11 px-4"
            aria-label="Cancel"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between border border-border rounded-control px-3.5 py-3">
          <span className="font-mono text-h3 text-text-primary">
            {riskPerTrade != null ? formatCurrency(riskPerTrade) : "—"}
          </span>
          <button
            onClick={startEdit}
            className="w-9 h-9 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
            aria-label="Edit risk per trade"
          >
            <Pencil size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
