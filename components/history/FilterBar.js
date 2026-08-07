"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { MISTAKE_TYPES } from "@/lib/constants";
import { classNames } from "@/lib/utils";

const PNL_OPTIONS = [
  { value: "all", label: "All" },
  { value: "profit", label: "Profit" },
  { value: "loss", label: "Loss" },
];

export default function FilterBar({ filters, onChange, onClear }) {
  const [mistakeOpen, setMistakeOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setMistakeOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggleMistake(m) {
    const current = filters.mistakeTypes || [];
    const next = current.includes(m)
      ? current.filter((x) => x !== m)
      : [...current, m];
    onChange({ ...filters, mistakeTypes: next });
  }

  const hasActiveFilters =
    filters.from || filters.to || (filters.mistakeTypes || []).length > 0 || filters.pnl !== "all";

  return (
    <div className="card flex flex-col md:flex-row md:items-end gap-3 md:gap-4 flex-wrap">
      <div className="flex-1 min-w-[140px]">
        <label className="block text-small text-text-secondary mb-1.5">From</label>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
          className="input-field h-11"
        />
      </div>

      <div className="flex-1 min-w-[140px]">
        <label className="block text-small text-text-secondary mb-1.5">To</label>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => onChange({ ...filters, to: e.target.value })}
          className="input-field h-11"
        />
      </div>

      <div className="flex-1 min-w-[180px] relative" ref={ref}>
        <label className="block text-small text-text-secondary mb-1.5">Mistake Type</label>
        <button
          onClick={() => setMistakeOpen((o) => !o)}
          className="input-field h-11 flex items-center justify-between text-left"
        >
          <span className="truncate text-body">
            {(filters.mistakeTypes || []).length > 0
              ? `${filters.mistakeTypes.length} selected`
              : "All mistakes"}
          </span>
          <ChevronDown size={16} className="text-text-muted shrink-0" />
        </button>
        {mistakeOpen && (
          <div className="absolute z-20 top-[calc(100%+6px)] left-0 right-0 bg-surface border border-border-hover rounded-control shadow-card p-2 max-h-64 overflow-y-auto">
            {MISTAKE_TYPES.map((m) => (
              <label
                key={m}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-control hover:bg-overlay/[0.04] cursor-pointer text-body text-text-primary"
              >
                <input
                  type="checkbox"
                  checked={(filters.mistakeTypes || []).includes(m)}
                  onChange={() => toggleMistake(m)}
                  className="accent-accent w-4 h-4"
                />
                {m}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-[180px]">
        <label className="block text-small text-text-secondary mb-1.5">Result</label>
        <div className="flex items-center gap-1 bg-surface border border-border rounded-control p-1 h-11">
          {PNL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, pnl: opt.value })}
              className={classNames(
                "flex-1 h-full rounded-[6px] text-small font-medium transition-colors",
                filters.pnl === opt.value
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="btn-secondary h-11 flex items-center gap-1.5 shrink-0"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
