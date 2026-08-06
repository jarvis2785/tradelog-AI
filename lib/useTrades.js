"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, TRADES_TABLE } from "./supabase";

export function useTrades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from(TRADES_TABLE)
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setTrades([]);
    } else {
      setTrades(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { trades, loading, error, refetch };
}
