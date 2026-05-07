import { createClient } from "@supabase/supabase-js";
import { resolvedSupabaseAnonKey, resolvedSupabaseUrl } from "../../lib/env";

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey);
