const getSupabaseKeys = () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
    }
    return {
        publicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        publicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };
};
