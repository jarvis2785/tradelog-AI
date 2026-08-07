import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const TRADES_TABLE = "umesh_trades";
export const REPORTS_TABLE = "umesh_weekly_reports";
export const SCREENSHOTS_BUCKET = "trade-screenshots";
export const RULES_TABLE = "umesh_rules";
export const CHARGES_TABLE = "umesh_daily_charges";
