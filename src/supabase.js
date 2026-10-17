import { createClient } from '@supabase/supabase-js';

// Configura estas variables en Vercel cuando hayas creado el proyecto Supabase.
// En local puedes crear un archivo .env.local con ambas variables.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;