"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, CAPITAL_TABLE, TRADES_TABLE, CHARGES_TABLE } from "./supabase";
import { computeNetPnlByDate, computeCapitalMetrics } from "./capitalStats";

export function useCapitalData() {
  const [transactions, setTransactions] = useState([]);
  const [netPnlByDate, setNetPnlByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [txRes, tradesRes, chargesRes] = await Promise.all([
      supabase.from(CAPITAL_TABLE).select("*").order("date", { ascending: true }),
      supabase.from(TRADES_TABLE).select("date, overall_pnl"),
      supabase.from(CHARGES_TABLE).select("*"),
    ]);
    const err = txRes.error || tradesRes.error || chargesRes.error;
    if (err) setError(err.message);
    setTransactions(txRes.data || []);
    setNetPnlByDate(computeNetPnlByDate(tradesRes.data || [], chargesRes.data || []));
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const metrics = useMemo(
    () => computeCapitalMetrics(transactions, netPnlByDate),
    [transactions, netPnlByDate]
  );

  return { ...metrics, transactions, netPnlByDate, loading, error, refetch };
}
