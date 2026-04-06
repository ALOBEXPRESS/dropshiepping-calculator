
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
  const doFetch = () => fetch(input, init);
  try {
    const res = await doFetch();
    // Retry on 429 with backoff (up to 3 attempts)
    if (res.status === 429) {
      await wait(2000);
      const res2 = await doFetch();
      if (res2.status === 429) {
        await wait(4000);
        return doFetch();
      }
      return res2;
    }
    return res;
  } catch (error) {
    if (error instanceof TypeError) {
      await wait(500);
      try {
        return await doFetch();
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
