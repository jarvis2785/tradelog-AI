"use client";

import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { toDDMMYYYY, formatCurrency, classNames } from "@/lib/utils";
import { MistakePill, RuleBrokenBadge } from "@/components/Badge";

const PAGE_SIZE = 20;

export default function TradesList({ trades, onRowClick, onEdit, onDelete }) {
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const copy = [...trades];
    copy.sort((a, b) => {
      let av, bv;
      if (sortField === "date") {
        av = a.date;
        bv = b.date;
      } else {
        av = Number(a.overall_pnl) || 0;
        bv = Number(b.overall_pnl) || 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [trades, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  function SortHeader({ field, children }) {
    const active = sortField === field;
    return (
      <button
        onClick={() => toggleSort(field)}
        className={classNames(
          "flex items-center gap-1 font-medium hover:text-text-primary transition-colors",
          active ? "text-text-primary" : "text-text-muted"
        )}
      >
        {children}
        {active &&
          (sortDir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
      </button>
    );
  }

  return (
    <div className="card">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-small border-b border-border">
              <th className="py-2.5 pr-4">
                <SortHeader field="date">Date</SortHeader>
              </th>
              <th className="py-2.5 pr-4 font-medium text-text-muted">Stock</th>
              <th className="py-2.5 pr-4 font-medium text-text-muted">Qty</th>
              <th className="py-2.5 pr-4 font-medium text-text-muted">Buy Price</th>
              <th className="py-2.5 pr-4 font-medium text-text-muted">Sell Price</th>
              <th className="py-2.5 pr-4">
                <SortHeader field="pnl">Overall P&L</SortHeader>
              </th>
              <th className="py-2.5 pr-4 font-medium text-text-muted">Mistakes</th>
              <th className="py-2.5 pr-4 font-medium text-text-muted">Rule Broken</th>
              <th className="py-2.5 font-medium text-text-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((t) => (
              <tr
                key={t.id}
                onClick={() => onRowClick(t)}
                className="group border-b border-border last:border-0 hover:bg-overlay/[0.03] cursor-pointer transition-colors"
              >
                <td className="py-3 pr-4 text-body text-text-secondary whitespace-nowrap">
                  {toDDMMYYYY(t.date)}
                </td>
                <td className="py-3 pr-4 text-body text-text-primary font-medium whitespace-nowrap">
                  {t.stock_name}
                </td>
                <td className="py-3 pr-4 font-mono text-body text-text-secondary">
                  {t.quantity}
                </td>
                <td className="py-3 pr-4 font-mono text-body text-text-secondary">
                  {formatCurrency(t.buy_avg_price)}
                </td>
                <td className="py-3 pr-4 font-mono text-body text-text-secondary">
                  {formatCurrency(t.sell_avg_price)}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`font-mono text-body font-semibold ${
                      Number(t.overall_pnl) >= 0 ? "text-profit" : "text-loss"
                    }`}
                  >
                    {formatCurrency(t.overall_pnl)}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1.5">
                    {(t.mistake_types || [])
                      .filter((m) => m && m.toLowerCase() !== "clean trade")
                      .slice(0, 2)
                      .map((m) => (
                        <MistakePill key={m} label={m} />
                      ))}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <RuleBrokenBadge broken={t.rule_broken} />
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(t);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
                      aria-label="Edit trade"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(t);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-loss hover:border-loss/40 transition-colors"
                      aria-label="Delete trade"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {pageItems.map((t) => (
          <div
            key={t.id}
            onClick={() => onRowClick(t)}
            className="border border-border rounded-control p-3.5 active:bg-overlay/[0.03] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body font-medium text-text-primary">
                  {t.stock_name}
                </p>
                <p className="text-small text-text-muted mt-0.5">
                  {toDDMMYYYY(t.date)}
                </p>
              </div>
              <span
                className={`font-mono text-body font-semibold ${
                  Number(t.overall_pnl) >= 0 ? "text-profit" : "text-loss"
                }`}
              >
                {formatCurrency(t.overall_pnl)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {(t.mistake_types || [])
                  .filter((m) => m && m.toLowerCase() !== "clean trade")
                  .map((m) => (
                    <MistakePill key={m} label={m} />
                  ))}
                {t.rule_broken && <RuleBrokenBadge broken />}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(t);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-control border border-border text-text-secondary active:text-text-primary transition-colors"
                  aria-label="Edit trade"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-control border border-border text-text-secondary active:text-loss transition-colors"
                  aria-label="Delete trade"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
          <p className="text-small text-text-muted">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-text-primary hover:border-border-hover disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-text-primary hover:border-border-hover disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
