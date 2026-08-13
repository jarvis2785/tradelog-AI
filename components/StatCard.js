"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import CountUp from "./CountUp";
import { classNames } from "@/lib/utils";

const BORDER_COLORS = {
  accent: "rgb(var(--accent))",
  profit: "rgb(var(--profit))",
  loss: "rgb(var(--loss))",
  neutral: "rgb(var(--border-hover))",
};

export default function StatCard({
  label,
  value,
  formatter = (v) => Math.round(v).toLocaleString("en-IN"),
  trend,
  trendLabel,
  tone = "accent",
  raw,
  subLabel,
}) {
  const borderColor = BORDER_COLORS[tone] || BORDER_COLORS.accent;
  const trendPositive = typeof trend === "number" && trend > 0;
  const trendNegative = typeof trend === "number" && trend < 0;

  return (
    <div className="stat-card" style={{ "--tw-shadow": "none" }}>
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: borderColor }}
      />
      <p className="text-small text-text-secondary mb-2 truncate">{label}</p>
      <p className="font-mono text-[22px] md:text-[26px] font-semibold text-text-primary tabular leading-tight whitespace-normal break-words">
        {raw !== undefined ? (
          raw
        ) : (
          <CountUp value={value} formatter={formatter} />
        )}
      </p>
      {subLabel && (
        <p className="text-small text-text-muted mt-1 whitespace-normal break-words">{subLabel}</p>
      )}
      {(trend !== undefined && trend !== null) && (
        <div
          className={classNames(
            "flex items-center gap-1 mt-2 text-small font-medium",
            trendPositive && "text-profit",
            trendNegative && "text-loss",
            !trendPositive && !trendNegative && "text-text-muted"
          )}
        >
          {trendPositive && <ArrowUpRight size={14} />}
          {trendNegative && <ArrowDownRight size={14} />}
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
