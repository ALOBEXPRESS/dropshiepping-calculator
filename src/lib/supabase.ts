
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found in environment variables. ' +
    'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (error instanceof TypeError) {
      await wait(500);
      try {
        return await fetch(input, init);
      } catch {
        throw new Error('Falha de conexão com o Supabase. Verifique internet, URL e chave.');
      }
    }
    throw error;
  }
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  { global: { fetch: fetchWithRetry } }
);
