"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { supabase, CAPITAL_TABLE } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { toISODate } from "@/lib/utils";

export default function SetupCapitalForm({ onSaved }) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [saving, setSaving] = useState(false);

  const valid = amount !== "" && Number(amount) > 0;

  async function handleSubmit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from(CAPITAL_TABLE).insert({
        date,
        type: "initial_capital",
        amount: Number(amount),
        description: "Initial trading capital",
      });
      if (error) throw new Error(error.message);
      toast.success("Starting capital set");
      onSaved();
    } catch (err) {
      toast.error("Could not save starting capital. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card max-w-lg mx-auto mt-6">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <Wallet size={24} className="text-accent" />
        </div>
        <h2 className="text-h2 text-text-primary mb-2">Set Up Your Trading Account</h2>
        <p className="text-body text-text-secondary max-w-sm">
          Enter your starting capital to begin tracking your account value, returns, and capital
          movements.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-small text-text-secondary mb-1.5">Starting Capital ₹</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50000"
            className="input-field h-12 text-h3 font-mono"
            disabled={saving}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-small text-text-secondary mb-1.5">
            Date you started trading
          </label>
          <input
            type="date"
            value={date}
            max={toISODate(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="input-field h-11"
            disabled={saving}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !valid}
          className="btn-primary h-12 w-full"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            "Set Starting Capital"
          )}
        </button>
      </div>
    </div>
  );
}
