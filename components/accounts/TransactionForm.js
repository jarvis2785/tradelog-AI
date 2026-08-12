"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase, CAPITAL_TABLE } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { toISODate } from "@/lib/utils";

export const TX_TYPE_OPTIONS = [
  { value: "capital_added", label: "Capital Added" },
  { value: "withdrawal_ipo", label: "Withdrawal — IPO" },
  { value: "withdrawal_personal", label: "Withdrawal — Personal" },
  { value: "withdrawal_other", label: "Withdrawal — Other" },
  { value: "adjustment", label: "Adjustment" },
];

export default function TransactionForm({ onSaved }) {
  const toast = useToast();
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [type, setType] = useState("capital_added");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdjustment = type === "adjustment";
  const valid = amount !== "" && (isAdjustment ? Number(amount) !== 0 : Number(amount) > 0);

  async function handleSubmit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from(CAPITAL_TABLE).insert({
        date,
        type,
        amount: Number(amount),
        description: description.trim() || null,
      });
      if (error) throw new Error(error.message);
      toast.success("Transaction added");
      setAmount("");
      setDescription("");
      onSaved();
    } catch (err) {
      toast.error("Could not add transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-4">Add Transaction</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-small text-text-secondary mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            max={toISODate(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="input-field h-11"
            disabled={saving}
          />
        </div>
        <div>
          <label className="block text-small text-text-secondary mb-1.5">Transaction Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input-field h-11"
            disabled={saving}
          >
            {TX_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-small text-text-secondary mb-1.5">Amount ₹</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 10000"
            className="input-field h-11 font-mono"
            disabled={saving}
          />
          {isAdjustment && (
            <p className="text-small text-text-muted mt-1.5">
              Enter a negative number for a downward adjustment.
            </p>
          )}
        </div>
        <div>
          <label className="block text-small text-text-secondary mb-1.5">
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. IPO application for XYZ"
            className="input-field h-11"
            disabled={saving}
          />
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={saving || !valid}
        className="btn-primary h-11 w-full mt-4"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Adding...
          </>
        ) : (
          "Add Transaction"
        )}
      </button>
    </div>
  );
}
