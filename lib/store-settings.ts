import { createClient } from "@/lib/supabase/server";

export async function getStoreSetting(key: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value ?? "";
}

export async function getStoreSettings(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.from("store_settings").select("key, value");
  const settings: Record<string, string> = {};
  data?.forEach((row) => {
    settings[row.key] = row.value;
  });
  return settings;
}
