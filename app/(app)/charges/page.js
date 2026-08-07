"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Loader2, Receipt } from "lucide-react";
import { supabase, TRADES_TABLE, CHARGES_TABLE } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { formatCurrency, toDDMMYYYY, toISODate } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import DeleteChargesConfirm from "@/components/charges/DeleteChargesConfirm";

export default function ChargesPage() {
  const toast = useToast();
  const topRef = useRef(null);

  const [date, setDate] = useState(() => toISODate(new Date()));
  const [govtCharges, setGovtCharges] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [saving, setSaving] = useState(false);

  const [chargesHistory, setChargesHistory] = useState([]);
  const [allTrades, setAllTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deletingRow, setDeletingRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [chargesRes, tradesRes] = await Promise.all([
      supabase.from(CHARGES_TABLE).select("*").order("date", { ascending: false }),
      supabase.from(TRADES_TABLE).select("date, overall_pnl"),
    ]);
    setChargesHistory(chargesRes.data || []);
    setAllTrades(tradesRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const overallPnlByDate = useMemo(() => {
    const map = {};
    allTrades.forEach((t) => {
      if (t.date == null) return;
      map[t.date] = (map[t.date] || 0) + (Number(t.overall_pnl) || 0);
    });
    return map;
  }, [allTrades]);

  const chargesByDate = useMemo(() => {
    const map = {};
    chargesHistory.forEach((c) => {
      map[c.date] = c;
    });
    return map;
  }, [chargesHistory]);

  const existingForDate = chargesByDate[date] || null;

  useEffect(() => {
    setGovtCharges(existingForDate?.govt_charges != null ? String(existingForDate.govt_charges) : "");
    setBrokerage(existingForDate?.brokerage != null ? String(existingForDate.brokerage) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, chargesHistory]);

  const hasTradesForDate = Object.prototype.hasOwnProperty.call(overallPnlByDate, date);
  const overallPnlForDate = overallPnlByDate[date] || 0;
  const netPnl = overallPnlForDate - (Number(govtCharges) || 0) - (Number(brokerage) || 0);

  function handleEdit(row) {
    setDate(row.date);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const record = {
        date,
        govt_charges: govtCharges === "" ? 0 : Number(govtCharges),
        brokerage: brokerage === "" ? 0 : Number(brokerage),
        net_pnl: Math.round(netPnl * 100) / 100,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from(CHARGES_TABLE).upsert(record, { onConflict: "date" });
      if (error) throw new Error(error.message);
      toast.success(`Charges saved for ${toDDMMYYYY(date)}`);
      await loadAll();
    } catch (err) {
      toast.error("Could not save charges. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingRow) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from(CHARGES_TABLE).delete().eq("id", deletingRow.id);
      if (error) throw new Error(error.message);
      setDeletingRow(null);
      await loadAll();
      toast.success("Charges deleted");
    } catch (err) {
      toast.error("Could not delete charges. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div ref={topRef} className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-text-primary">Daily Charges</h1>
        <p className="text-body text-text-secondary mt-1">
          Record your daily Groww charges. Net P&L is calculated automatically across the entire app.
        </p>
      </div>

      <div className="card">
        <h3 className="text-h3 text-text-primary mb-4">Enter Charges</h3>
        <div className="flex flex-col gap-4">
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
            <p className="text-small text-text-muted mt-1.5">{toDDMMYYYY(date)}</p>
          </div>

          <div className="rounded-control border border-border px-3.5 py-3">
            {loading ? (
              <div className="skeleton h-4 w-40" />
            ) : hasTradesForDate ? (
              <p className="text-small text-text-secondary">
                Overall P&L for {toDDMMYYYY(date)}:{" "}
                <span
                  className={`font-mono font-semibold ${
                    overallPnlForDate >= 0 ? "text-profit" : "text-loss"
                  }`}
                >
                  {formatCurrency(overallPnlForDate)}
                </span>
              </p>
            ) : (
              <p className="text-small text-text-muted">No trades found for this date</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-small text-text-secondary mb-1.5">Govt Charges ₹</label>
              <input
                type="number"
                step="0.01"
                value={govtCharges}
                onChange={(e) => setGovtCharges(e.target.value)}
                placeholder="e.g. 15.20"
                className="input-field h-11 font-mono"
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-small text-text-secondary mb-1.5">Brokerage ₹</label>
              <input
                type="number"
                step="0.01"
                value={brokerage}
                onChange={(e) => setBrokerage(e.target.value)}
                placeholder="e.g. 20.35"
                className="input-field h-11 font-mono"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-body font-medium text-text-secondary">Net P&L</span>
            <span
              className={`font-mono text-h3 font-semibold ${
                netPnl >= 0 ? "text-profit" : "text-loss"
              }`}
            >
              {formatCurrency(netPnl)}
            </span>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary h-11 w-full">
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {existingForDate ? "Updating..." : "Saving..."}
              </>
            ) : existingForDate ? (
              "Update"
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-h3 text-text-primary mb-4">Charges History</h3>
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : chargesHistory.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No charges entered yet. Select a date above to add your first entry."
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-body">
                <thead>
                  <tr className="border-b border-border text-small text-text-secondary">
                    <th className="text-left font-medium py-2 pr-3">Date</th>
                    <th className="text-right font-medium py-2 px-3">Overall P&L</th>
                    <th className="text-right font-medium py-2 px-3">Govt Charges</th>
                    <th className="text-right font-medium py-2 px-3">Brokerage</th>
                    <th className="text-right font-medium py-2 px-3">Net P&L</th>
                    <th className="text-right font-medium py-2 pl-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {chargesHistory.map((row) => {
                    const overall = overallPnlByDate[row.date] || 0;
                    return (
                      <tr key={row.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-3 text-text-primary font-mono">
                          {toDDMMYYYY(row.date)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono ${
                            overall >= 0 ? "text-profit" : "text-loss"
                          }`}
                        >
                          {formatCurrency(overall)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-text-secondary">
                          {formatCurrency(row.govt_charges)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-text-secondary">
                          {formatCurrency(row.brokerage)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono font-semibold ${
                            Number(row.net_pnl) >= 0 ? "text-profit" : "text-loss"
                          }`}
                        >
                          {formatCurrency(row.net_pnl)}
                        </td>
                        <td className="py-3 pl-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(row)}
                              className="w-8 h-8 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
                              aria-label="Edit charges"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingRow(row)}
                              className="w-8 h-8 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-loss hover:border-loss/40 transition-colors"
                              aria-label="Delete charges"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden flex flex-col gap-3">
              {chargesHistory.map((row) => {
                const overall = overallPnlByDate[row.date] || 0;
                return (
                  <div key={row.id} className="border border-border rounded-control p-3.5">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-mono text-body text-text-primary">
                        {toDDMMYYYY(row.date)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(row)}
                          className="w-8 h-8 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
                          aria-label="Edit charges"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingRow(row)}
                          className="w-8 h-8 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-loss hover:border-loss/40 transition-colors"
                          aria-label="Delete charges"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 text-small">
                      <div>
                        <p className="text-text-muted mb-0.5">Overall P&L</p>
                        <p className={`font-mono ${overall >= 0 ? "text-profit" : "text-loss"}`}>
                          {formatCurrency(overall)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted mb-0.5">Net P&L</p>
                        <p
                          className={`font-mono font-semibold ${
                            Number(row.net_pnl) >= 0 ? "text-profit" : "text-loss"
                          }`}
                        >
                          {formatCurrency(row.net_pnl)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted mb-0.5">Govt Charges</p>
                        <p className="font-mono text-text-secondary">
                          {formatCurrency(row.govt_charges)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted mb-0.5">Brokerage</p>
                        <p className="font-mono text-text-secondary">{formatCurrency(row.brokerage)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {deletingRow && (
        <DeleteChargesConfirm
          row={deletingRow}
          deleting={deleting}
          onCancel={() => setDeletingRow(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
