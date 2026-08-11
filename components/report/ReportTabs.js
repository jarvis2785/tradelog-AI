"use client";

import { classNames } from "@/lib/utils";

const TABS = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "overall", label: "Overall" },
];

export default function ReportTabs({ active, onChange }) {
  return (
    <div className="flex w-full sm:w-auto sm:inline-flex items-center gap-1 bg-surface border border-border rounded-control p-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={classNames(
            "flex-1 sm:flex-initial px-4 h-9 rounded-[6px] text-small font-medium transition-colors duration-150",
            active === tab.value
              ? "bg-accent text-white"
              : "bg-transparent text-text-secondary border border-transparent hover:text-text-primary hover:border-border-hover"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
