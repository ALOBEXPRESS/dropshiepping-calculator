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

// Rastreia 429s consecutivos para detectar loop
let consecutive429 = 0;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 10000; // 10s mínimo entre refreshes

const fetchWithRetry: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input as Request).url;
  const body = typeof init?.body === 'string' ? init.body : '';
  const isRefreshToken = url.includes('/auth/v1/token') && body.includes('refresh_token');

  // Throttle de refresh token para evitar loop
  if (isRefreshToken) {
    const now = Date.now();
    const elapsed = now - lastRefreshTime;
    if (elapsed < REFRESH_COOLDOWN && lastRefreshTime > 0) {
      await wait(REFRESH_COOLDOWN - elapsed);
    }
    lastRefreshTime = Date.now();
  }

  try {
    const res = await fetch(input, init);

    if (res.status === 429 && isRefreshToken) {
      consecutive429++;
      console.warn(`[Supabase] 429 on refresh token (${consecutive429} consecutive)`);

      if (consecutive429 >= 3) {
        // Loop detectado — notifica UI e limpa storage corrompido
        console.error('[Supabase] Refresh token loop detected, clearing auth storage');
        window.dispatchEvent(new CustomEvent('supabase:session-expired'));
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            localStorage.removeItem(key);
          }
        }
        consecutive429 = 0;
        // Retorna 401 para forçar novo login limpo
        return new Response(JSON.stringify({ error: 'session_expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Aguarda antes de retornar o 429 para o SDK
      await wait(5000 * consecutive429);
      return res;
    }

    if (res.status !== 429) consecutive429 = 0;
    return res;

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
  {
    global: { fetch: fetchWithRetry },
    auth: {
      // Storage key único por hostname — evita conflito entre localhost e produção
      storageKey: `sb-auth-${typeof window !== 'undefined' ? window.location.hostname.replace(/\./g, '-') : 'default'}`,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    }
  }
);
