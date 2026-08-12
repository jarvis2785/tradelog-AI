"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Loader2, Wallet } from "lucide-react";
import { supabase, EXPENSES_TABLE } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { formatCurrency, getLastNMonths, getMonthRange } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import MonthSelector from "@/components/report/MonthSelector";

function defaultLineItems() {
  return [
    { id: crypto.randomUUID(), category: "Scanner", amount: "0" },
    { id: crypto.randomUUID(), category: "Mentorship", amount: "0" },
    { id: crypto.randomUUID(), category: "Internet", amount: "0" },
  ];
}

export default function ExpensesManager() {
  const toast = useToast();
  const topRef = useRef(null);
  const months = useMemo(() => getLastNMonths(12), []);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [lineItems, setLineItems] = useState(defaultLineItems);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedMonth = months[selectedMonthIndex];

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from(EXPENSES_TABLE).select("*");
    const sorted = (data || []).slice().sort((a, b) => {
      const rangeA = getMonthRange(a.month_year);
      const rangeB = getMonthRange(b.month_year);
      if (!rangeA || !rangeB) return 0;
      return rangeB.start.localeCompare(rangeA.start);
    });
    setHistory(sorted);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const existing = history.find((r) => r.month_year === selectedMonth.label);
    if (existing) {
      const breakdown = Array.isArray(existing.breakdown) ? existing.breakdown : [];
      setLineItems(
        breakdown.length > 0
          ? breakdown.map((item) => ({
              id: crypto.randomUUID(),
              category: item.category || "",
              amount: item.amount != null ? String(item.amount) : "0",
            }))
          : defaultLineItems()
      );
      setNotes(existing.notes || "");
    } else {
      setLineItems(defaultLineItems());
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonthIndex, history]);

  const total = useMemo(
    () => lineItems.reduce((s, item) => s + (Number(item.amount) || 0), 0),
    [lineItems]
  );

  function updateLineItem(id, field, value) {
    setLineItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { id: crypto.randomUUID(), category: "", amount: "" }]);
  }

  function removeLineItem(id) {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleSelectFromHistory(monthYear) {
    const idx = months.findIndex((m) => m.label === monthYear);
    if (idx !== -1) setSelectedMonthIndex(idx);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const breakdown = lineItems.map((item) => ({
        category: item.category.trim(),
        amount: Number(item.amount) || 0,
      }));
      const totalAmount = breakdown.reduce((s, item) => s + item.amount, 0);
      const record = {
        month_year: selectedMonth.label,
        total_amount: Math.round(totalAmount * 100) / 100,
        breakdown,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from(EXPENSES_TABLE).upsert(record, { onConflict: "month_year" });
      if (error) throw new Error(error.message);
      toast.success(`Expenses saved for ${selectedMonth.label}`);
      await loadHistory();
    } catch (err) {
      toast.error("Could not save expenses. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={topRef} className="card">
      <h3 className="text-h3 text-text-primary mb-1">Monthly Operating Expenses</h3>
      <p className="text-small text-text-secondary mb-5">
        Track your monthly trading-related costs. These are paid from personal income and never
        reduce your trading capital.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-small text-text-secondary mb-1.5">Month</label>
          <MonthSelector
            months={months}
            selectedIndex={selectedMonthIndex}
            onChange={setSelectedMonthIndex}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          {lineItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="text"
                value={item.category}
                onChange={(e) => updateLineItem(item.id, "category", e.target.value)}
                placeholder="Category name"
                className="input-field h-11 flex-1"
                disabled={saving}
              />
              <div className="relative w-28 sm:w-36 shrink-0">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body text-text-secondary pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) => updateLineItem(item.id, "amount", e.target.value)}
                  className="input-field h-11 pl-7 font-mono"
                  disabled={saving}
                />
              </div>
              <button
                onClick={() => removeLineItem(item.id)}
                disabled={saving}
                className="w-11 h-11 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-loss hover:border-loss/40 transition-colors shrink-0"
                aria-label="Delete expense item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button
            onClick={addLineItem}
            disabled={saving}
            className="btn-outline-accent h-11 w-full"
          >
            <Plus size={16} />
            Add Expense Item
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-body font-medium text-text-secondary">Total Operating Expenses</span>
          <span className="font-mono text-h3 font-semibold text-text-primary">
            {formatCurrency(total)}
          </span>
        </div>

        <div>
          <label className="block text-small text-text-secondary mb-1.5">
            Any notes for this month?
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Started new mentorship program, upgraded scanner plan"
            className="input-field min-h-[90px] resize-y leading-relaxed"
            disabled={saving}
          />
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary h-11 w-full">
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            "Save Expenses"
          )}
        </button>
      </div>

      <div className="border-t border-border mt-6 pt-5">
        <h4 className="text-body font-medium text-text-primary mb-4">Expense History</h4>
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No expenses entered yet. Select a month above to add your first entry."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-small text-text-secondary">
                  <th className="py-2 pr-3 font-medium">Month</th>
                  <th className="py-2 px-3 font-medium text-right">Total Expenses</th>
                  <th className="py-2 pl-3 font-medium text-right">Items</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleSelectFromHistory(row.month_year)}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-overlay/[0.03] transition-colors"
                  >
                    <td className="py-3 pr-3 text-body text-text-primary font-medium whitespace-nowrap">
                      {row.month_year}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-body text-text-primary">
                      {formatCurrency(row.total_amount)}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono text-body text-text-secondary">
                      {Array.isArray(row.breakdown) ? row.breakdown.length : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
