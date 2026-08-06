import { classNames } from "@/lib/utils";

export function PnlBadge({ value }) {
  const num = Number(value) || 0;
  const positive = num >= 0;
  return (
    <span className={positive ? "badge-profit" : "badge-loss"}>
      {positive ? "+" : ""}
      {num.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
    </span>
  );
}

export function MistakePill({ label }) {
  return <span className="badge-neutral">{label}</span>;
}

export function RuleBrokenBadge({ broken }) {
  if (!broken) return <span className="badge-profit">Clean</span>;
  return <span className="badge-rule-broken">Rule Broken</span>;
}

export function Pill({ children, className }) {
  return (
    <span className={classNames("badge-neutral", className)}>{children}</span>
  );
}
