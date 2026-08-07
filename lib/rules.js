import { supabase, RULES_TABLE } from "./supabase";

export async function fetchAllRules() {
  const { data, error } = await supabase
    .from(RULES_TABLE)
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchActiveRules() {
  const { data, error } = await supabase
    .from(RULES_TABLE)
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}
