"use client";

import TradeCard from "./TradeCard";
import RulesChecklist from "./RulesChecklist";

export default function ReviewStep({ trades, onChangeTrade, onRulesChange, onNext }) {
  const valid = trades.every(
    (t) => t.stock_name && t.quantity && t.buy_avg_price && t.sell_avg_price && t.date
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-h2 text-text-primary mb-1">Review Extracted Data</h2>
        <p className="text-body text-text-secondary">
          AI has extracted your trade data. Review and edit if needed.
        </p>
      </div>

      {trades.map((trade, i) => (
        <TradeCard
          key={i}
          index={i}
          trade={trade}
          onChange={(updated) => onChangeTrade(i, updated)}
        />
      ))}

      <RulesChecklist onChange={onRulesChange} />

      <button
        onClick={onNext}
        disabled={!valid}
        className="btn-primary w-full h-12"
      >
        Next
      </button>
    </div>
  );
}
