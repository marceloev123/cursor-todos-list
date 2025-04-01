import { createClient } from "@supabase/supabase-js";
import type { Database } from "database.types";
import { env } from "~/env";

export const supabaseClient = createClient<Database>(
  env.DATABASE_URL,
  env.API_KEY,
);
