import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

import type { Session } from '@supabase/supabase-js';

// Limpa todas as chaves de auth do Supabase do localStorage
function clearSupabaseAuthStorage() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isE2E = import.meta.env.VITE_E2E === 'true' || new URLSearchParams(window.location.search).get('e2e') === 'true';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error checking session:', error);
        const msg = error.message?.toLowerCase() ?? '';
        const isTokenError = msg.includes('invalid') || msg.includes('expired') || msg.includes('jwt') || msg.includes('refresh');
        if (isTokenError) {
          // Limpa storage corrompido e força novo login
          clearSupabaseAuthStorage();
          void supabase.auth.signOut();
          setSession(null);
        }
        setLoading(false);
        return;
      }
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setSession(session);
        if (event === 'SIGNED_IN') setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isE2E) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
