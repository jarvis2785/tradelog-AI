"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCompactCurrency } from "@/lib/utils";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0].value;
  const positive = value >= 0;
  return (
    <div className="bg-surface border border-border-hover rounded-control px-3 py-2 shadow-card">
      <p className="text-small text-text-secondary mb-0.5">{label}</p>
      <p
        className={`font-mono text-body font-semibold ${
          positive ? "text-profit" : "text-loss"
        }`}
      >
        {formatCompactCurrency(value)}
      </p>
    </div>
  );
}

export default function PnlChart({ data }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#1f1f1f"
            strokeDasharray="0"
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#555555", fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#555555", fontSize: 11 }}
            tickFormatter={(v) => formatCompactCurrency(v)}
            width={64}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#2f2f2f" }} />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#pnlFill)"
            dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#22c55e", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
