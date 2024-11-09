import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    const { publicSupabaseUrl, publicSupabaseAnonKey } = getSupabaseKeys();
    return createBrowserClient(
        publicSupabaseUrl,
        publicSupabaseAnonKey,
    );
}
