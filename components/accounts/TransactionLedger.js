"use client";

import { useMemo } from "react";
import { Pencil, Trash2, Lock, Wallet } from "lucide-react";
import { formatCurrency, toDDMMYYYY, classNames } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";

const TYPE_LABELS = {
  initial_capital: "Initial Capital",
  capital_added: "Capital Added",
  withdrawal_ipo: "Withdrawal — IPO",
  withdrawal_personal: "Withdrawal — Personal",
  withdrawal_other: "Withdrawal — Other",
  adjustment: "Adjustment",
  trading_pnl: "Trading P&L",
};

function getAmountDisplay(item) {
  const amt = Number(item.amount) || 0;
  if (item.type === "trading_pnl") {
    return { text: formatCurrency(amt), tone: amt >= 0 ? "profit" : "loss" };
  }
  if (item.type === "initial_capital" || item.type === "capital_added") {
    return { text: `+${formatCurrency(Math.abs(amt))}`, tone: "profit" };
  }
  if (item.type && item.type.startsWith("withdrawal_")) {
    return { text: `-${formatCurrency(Math.abs(amt))}`, tone: "loss" };
  }
  if (item.type === "adjustment") {
    return {
      text: `${amt >= 0 ? "+" : "-"}${formatCurrency(Math.abs(amt))}`,
      tone: amt >= 0 ? "profit" : "loss",
    };
  }
  return { text: formatCurrency(amt), tone: "neutral" };
}

function toneClass(tone) {
  return tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-text-primary";
}

function buildLedgerItems(transactions, netPnlByDate) {
  const manual = transactions.map((t) => ({ ...t, _kind: "manual" }));
  const auto = Object.entries(netPnlByDate).map(([date, value]) => ({
    id: `auto-${date}`,
    date,
    type: "trading_pnl",
    amount: value,
    description: null,
    _kind: "auto",
  }));
  const combined = [...manual, ...auto];
  combined.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    if (a._kind !== b._kind) return a._kind === "manual" ? -1 : 1;
    if (a._kind === "manual") return (b.created_at || "").localeCompare(a.created_at || "");
    return 0;
  });
  return combined;
}

export default function TransactionLedger({ transactions, netPnlByDate, onEdit, onDelete }) {
  const items = useMemo(
    () => buildLedgerItems(transactions, netPnlByDate),
    [transactions, netPnlByDate]
  );

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-4">Transaction Ledger</h3>

      {items.length === 0 ? (
        <EmptyState icon={Wallet} title="No transactions yet." />
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-small text-text-secondary">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium text-right">Amount</th>
                  <th className="py-2 px-3 font-medium">Description</th>
                  <th className="py-2 pl-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isAuto = item._kind === "auto";
                  const isInitial = item.type === "initial_capital";
                  const display = getAmountDisplay(item);
                  return (
                    <tr
                      key={item.id}
                      className={classNames(
                        "border-b border-border last:border-0",
                        isAuto && "opacity-70"
                      )}
                    >
                      <td className="py-3 pr-3 font-mono text-body text-text-primary whitespace-nowrap">
                        {toDDMMYYYY(item.date)}
                      </td>
                      <td className="py-3 px-3 text-body text-text-primary whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {TYPE_LABELS[item.type] || item.type}
                          {isAuto && (
                            <span className="badge-neutral text-[10px] px-1.5 py-0.5 leading-none">
                              Auto
                            </span>
                          )}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-semibold ${toneClass(
                          display.tone
                        )}`}
                      >
                        {display.text}
                      </td>
                      <td className="py-3 px-3 text-body text-text-secondary">
                        {item.description || "—"}
                      </td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center justify-end gap-2">
                          {isAuto ? null : isInitial ? (
                            <span
                              className="w-8 h-8 flex items-center justify-center text-text-muted"
                              aria-label="Initial capital cannot be edited"
                            >
                              <Lock size={14} />
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => onEdit(item)}
                                className="w-8 h-8 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
                                aria-label="Edit transaction"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => onDelete(item)}
                                className="w-8 h-8 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-loss hover:border-loss/40 transition-colors"
                                aria-label="Delete transaction"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {items.map((item) => {
              const isAuto = item._kind === "auto";
              const isInitial = item.type === "initial_capital";
              const display = getAmountDisplay(item);
              return (
                <div
                  key={item.id}
                  className={classNames(
                    "border border-border rounded-control p-3.5",
                    isAuto && "opacity-70"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="text-small text-text-muted font-mono whitespace-nowrap">
                        {toDDMMYYYY(item.date)}
                      </span>
                      <span className="text-body text-text-primary font-medium">
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                      {isAuto && (
                        <span className="badge-neutral text-[10px] px-1.5 py-0.5 leading-none">
                          Auto
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-mono text-body font-semibold shrink-0 ${toneClass(
                        display.tone
                      )}`}
                    >
                      {display.text}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-small text-text-secondary mt-1.5">{item.description}</p>
                  )}
                  {!isAuto && (
                    <div className="flex items-center justify-end gap-2 mt-2.5">
                      {isInitial ? (
                        <span
                          className="w-9 h-9 flex items-center justify-center text-text-muted"
                          aria-label="Initial capital cannot be edited"
                        >
                          <Lock size={15} />
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => onEdit(item)}
                            className="w-9 h-9 flex items-center justify-center rounded-control border border-border text-text-secondary active:text-text-primary transition-colors"
                            aria-label="Edit transaction"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => onDelete(item)}
                            className="w-9 h-9 flex items-center justify-center rounded-control border border-border text-text-secondary active:text-loss transition-colors"
                            aria-label="Delete transaction"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
