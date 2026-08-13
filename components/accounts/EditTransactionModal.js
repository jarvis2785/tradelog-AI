"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { TX_TYPE_OPTIONS } from "./TransactionForm";

const FIELD_LABEL = "block text-small text-text-secondary mb-1.5";

export default function EditTransactionModal({ transaction, onClose, onSave }) {
  const isInitial = transaction.type === "initial_capital";
  const [date, setDate] = useState(transaction.date);
  const [type, setType] = useState(transaction.type);
  const [amount, setAmount] = useState(String(transaction.amount ?? ""));
  const [description, setDescription] = useState(transaction.description || "");
  const [saving, setSaving] = useState(false);

  const valid = date && type && amount !== "" && !Number.isNaN(Number(amount));

  async function handleSave() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({
        id: transaction.id,
        date,
        type,
        amount: Number(amount),
        description: description.trim() || null,
      });
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
          className="bg-surface border border-border-hover rounded-t-card sm:rounded-card w-full sm:max-w-md max-h-[92dvh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-surface border-b border-border flex items-center justify-between px-5 py-4 z-10">
            <h3 className="text-h3 text-text-primary">Edit Transaction</h3>
            <button
              onClick={onClose}
              disabled={saving}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className={FIELD_LABEL}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field h-11"
                disabled={saving}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Transaction Type</label>
              {isInitial ? (
                <div className="input-field h-11 flex items-center text-text-muted">
                  Initial Capital
                </div>
              ) : (
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
              )}
            </div>
            <div>
              <label className={FIELD_LABEL}>Amount ₹</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field h-11 font-mono"
                disabled={saving}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field h-11"
                disabled={saving}
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-surface border-t border-border p-4 flex gap-3">
            <button onClick={onClose} disabled={saving} className="btn-secondary flex-1 h-11">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!valid || saving}
              className="btn-primary flex-1 h-11"
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
