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
import { formatCompactCurrency, toDDMMYYYY } from "@/lib/utils";

function shortDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-surface border border-border-hover rounded-control px-3 py-2 shadow-card">
      <p className="text-small text-text-secondary mb-0.5">{toDDMMYYYY(point.date)}</p>
      <p className="font-mono text-body font-semibold text-profit">
        {formatCompactCurrency(point.value)}
      </p>
    </div>
  );
}

export default function EquityCurveChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-[240px] w-full flex items-center justify-center">
        <p className="text-body text-text-muted text-center px-6">
          Add more transactions to see your equity curve
        </p>
      </div>
    );
  }

  const chartData = data.map((p) => ({ ...p, label: shortDate(p.date) }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--profit))" stopOpacity={0.28} />
              <stop offset="100%" stopColor="rgb(var(--profit))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgb(var(--border-color))" strokeDasharray="0" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgb(var(--text-muted))", fontSize: 11 }}
            dy={8}
            minTickGap={24}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgb(var(--text-muted))", fontSize: 11 }}
            tickFormatter={(v) => formatCompactCurrency(v)}
            width={64}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgb(var(--border-hover))" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="rgb(var(--profit))"
            strokeWidth={2}
            fill="url(#equityFill)"
            dot={false}
            activeDot={{ r: 5, fill: "rgb(var(--profit))", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
