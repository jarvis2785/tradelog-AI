"use client";

import { useEffect, useRef } from "react";
import { calculateRiskReward } from "@/lib/utils";

const FIELD_LABEL = "block text-small text-text-secondary mb-1.5";

export default function TradeCard({ index, trade, onChange }) {
  const autoCalcRef = useRef(true);

  function update(field, value) {
    onChange({ ...trade, [field]: value });
  }

  // auto-calculate gross P&L when qty/buy/sell change, unless user edited it directly
  useEffect(() => {
    if (!autoCalcRef.current) return;
    const qty = Number(trade.quantity);
    const buy = Number(trade.buy_avg_price);
    const sell = Number(trade.sell_avg_price);
    if (qty && buy && sell) {
      const computed = Math.round((sell - buy) * qty * 100) / 100;
      if (String(computed) !== String(trade.gross_pnl)) {
        onChange({ ...trade, gross_pnl: computed });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade.quantity, trade.buy_avg_price, trade.sell_avg_price]);

  function handleGrossPnlChange(value) {
    autoCalcRef.current = false;
    update("gross_pnl", value);
  }

  const rr = calculateRiskReward(trade.buy_avg_price, trade.target_price, trade.stop_loss_price);

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-4">Trade {index + 1}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={FIELD_LABEL}>Date</label>
          <input
            type="date"
            value={trade.date}
            onChange={(e) => update("date", e.target.value)}
            className="input-field h-11"
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Stock Name</label>
          <input
            type="text"
            value={trade.stock_name}
            onChange={(e) => update("stock_name", e.target.value)}
            placeholder="e.g. NALCO"
            className="input-field h-11"
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Exchange</label>
          <select
            value={trade.exchange}
            onChange={(e) => update("exchange", e.target.value)}
            className="input-field h-11"
          >
            <option value="NSE">NSE</option>
            <option value="BSE">BSE</option>
          </select>
        </div>

        <div>
          <label className={FIELD_LABEL}>Quantity</label>
          <input
            type="number"
            value={trade.quantity}
            onChange={(e) => update("quantity", e.target.value)}
            placeholder="0"
            className="input-field h-11 font-mono"
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Buy Avg Price ₹</label>
          <input
            type="number"
            step="0.01"
            value={trade.buy_avg_price}
            onChange={(e) => update("buy_avg_price", e.target.value)}
            placeholder="0.00"
            className="input-field h-11 font-mono"
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Sell Avg Price ₹</label>
          <input
            type="number"
            step="0.01"
            value={trade.sell_avg_price}
            onChange={(e) => update("sell_avg_price", e.target.value)}
            placeholder="0.00"
            className="input-field h-11 font-mono"
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Gross P&L ₹</label>
          <input
            type="number"
            step="0.01"
            value={trade.gross_pnl}
            onChange={(e) => handleGrossPnlChange(e.target.value)}
            placeholder="0.00"
            className={`input-field h-11 font-mono ${
              Number(trade.gross_pnl) < 0 ? "text-loss" : Number(trade.gross_pnl) > 0 ? "text-profit" : ""
            }`}
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>LTP ₹</label>
          <input
            type="number"
            step="0.01"
            value={trade.ltp}
            onChange={(e) => update("ltp", e.target.value)}
            placeholder="0.00"
            className="input-field h-11 font-mono"
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Target Price ₹ (optional)</label>
          <input
            type="number"
            step="0.01"
            value={trade.target_price}
            onChange={(e) => update("target_price", e.target.value)}
            placeholder="0.00"
            className="input-field h-11 font-mono"
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Stop Loss Price ₹ (optional)</label>
          <input
            type="number"
            step="0.01"
            value={trade.stop_loss_price}
            onChange={(e) => update("stop_loss_price", e.target.value)}
            placeholder="0.00"
            className="input-field h-11 font-mono"
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>R:R Ratio</label>
          <input
            type="text"
            readOnly
            value={rr !== null ? `${rr}` : "—"}
            className="input-field h-11 font-mono text-text-secondary cursor-not-allowed"
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Entry Time (optional)</label>
          <input
            type="text"
            value={trade.entry_time}
            onChange={(e) => update("entry_time", e.target.value)}
            placeholder="HH:MM"
            className="input-field h-11 font-mono"
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Exit Time (optional)</label>
          <input
            type="text"
            value={trade.exit_time}
            onChange={(e) => update("exit_time", e.target.value)}
            placeholder="HH:MM"
            className="input-field h-11 font-mono"
          />
        </div>
      </div>
    </div>
  );
}
