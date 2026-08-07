"use client";

import { useMemo, useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import { useTrades } from "@/lib/useTrades";
import { useToast } from "@/components/Toast";
import { Pill } from "@/components/Badge";
import { TableRowSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import FilterBar from "@/components/history/FilterBar";
import TradesList from "@/components/history/TradesList";
import TradeDetailModal from "@/components/history/TradeDetailModal";
import EditTradeModal from "@/components/history/EditTradeModal";
import DeleteConfirmDialog from "@/components/history/DeleteConfirmDialog";

const DEFAULT_FILTERS = { from: "", to: "", mistakeTypes: [], pnl: "all" };

export default function HistoryPage() {
  const { trades, loading, refetch } = useTrades();
  const toast = useToast();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);
  const [deletingTrade, setDeletingTrade] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (filters.from && t.date < filters.from) return false;
      if (filters.to && t.date > filters.to) return false;
      if (filters.pnl === "profit" && !(Number(t.overall_pnl) > 0)) return false;
      if (filters.pnl === "loss" && !(Number(t.overall_pnl) < 0)) return false;
      if (filters.mistakeTypes.length > 0) {
        const tradeMistakes = t.mistake_types || [];
        const hasMatch = filters.mistakeTypes.some((m) => tradeMistakes.includes(m));
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [trades, filters]);

  async function handleSaveEdit(payload) {
    try {
      const res = await fetch("/api/update-trade", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      toast.success("Trade updated successfully");
      setEditingTrade(null);
      refetch();
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    }
  }

  async function handleConfirmDelete() {
    if (!deletingTrade) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/delete-trade", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deletingTrade.id,
          screenshot_url: deletingTrade.screenshot_url,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      toast.success("Trade deleted successfully");
      setDeletingTrade(null);
      refetch();
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h1 className="text-h1 text-text-primary">Trade History</h1>
        <Pill>{trades.length} total</Pill>
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_FILTERS)}
      />

      {loading ? (
        <div className="card">
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      ) : trades.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={HistoryIcon}
            title="Your trade history will appear here."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={HistoryIcon}
            title="No trades match your filters."
            subtitle="Try adjusting or clearing the filters."
          />
        </div>
      ) : (
        <TradesList
          trades={filtered}
          onRowClick={setSelectedTrade}
          onEdit={setEditingTrade}
          onDelete={setDeletingTrade}
        />
      )}

      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
        />
      )}

      {editingTrade && (
        <EditTradeModal
          trade={editingTrade}
          onClose={() => setEditingTrade(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingTrade && (
        <DeleteConfirmDialog
          trade={deletingTrade}
          deleting={deleting}
          onCancel={() => setDeletingTrade(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
