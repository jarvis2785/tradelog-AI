"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, SETTINGS_TABLE } from "./supabase";

export function useRiskPerTrade() {
  const [settingsId, setSettingsId] = useState(null);
  const [riskPerTrade, setRiskPerTrade] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from(SETTINGS_TABLE).select("*").limit(1).maybeSingle();
    setSettingsId(data?.id ?? null);
    setRiskPerTrade(data?.risk_per_trade != null ? Number(data.risk_per_trade) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { riskPerTrade, settingsId, loading, refetch };
}
